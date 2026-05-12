import re
import spacy
from spacy.matcher import PhraseMatcher
import metadata
from metadata import DB_KNOWLEDGE, SUMMARY_PHRASES, FAQ_KNOWLEDGE
from date_resolver import resolve

# ── ADD_TRANSACTION_PHRASES ───────────────────────────────────────
# Expanded — sab missing phrases add kiye gaye
ADD_TRANSACTION_PHRASES = [
    # Direct transaction commands — "a" ke saath bhi
    "add transaction",        "post transaction",
    "add a transaction",      "post a transaction",     # ← FIX: "a" wale
    "record transaction",     "record a transaction",
    "add entry",              "post entry",
    "new transaction",        "create transaction",

    # Expense related
    "add expense",            "record expense",
    "post expense",           "post an expense",
    "add an expense",         "record an expense",

    # Income related
    "add income",             "record income",          "post income",

    # Payment language
    "pay office",             "pay rent",               "pay salary",
    "pay expense",            "pay for",                "paying",
    "paid for",               "payment of",
    "make payment",           "make a payment",
    "i paid",                 "i have paid",            # ← FIX: "i paid"
    "we paid",                "we have paid",

    # Purchase language
    "purchase",               "bought",                 "buy",

    # From/using — credit indicator
    "paid from",              "payment from",           "purchase from",
    "paid using",             "paid via",               "paid with",
    "paid in cash",           "pay using",              "pay from",
    "pay via",                "pay with",

    # Received/deposited — debit indicator
    # ← FIX: "received" alone bhi — "received 30000 from customer"
    "received from",          "received in",            "deposited in",
    "deposit in",             "deposit to",
    "received pkr",           "received rs",
    "cash received",          "amount received",        # ← FIX: "cash received"

    # Structured debit/credit format
    # ← FIX: "debit cash and credit sales" pattern
    "debit cash",             "debit bank",             "debit rent",
    "debit salary",           "debit purchases",        "debit accounts",
    "credit cash",            "credit bank",            "credit sales",
    "credit capital",         "credit revenue",         "credit accounts",
    "is debited",             "is credited",            # ← FIX: "cash is debited"
    "are debited",            "are credited",
    "debit the",              "credit the",

    # Sell/sales
    "sell goods",             "sold goods",             "sell products",
    "sold on credit",         "sell on credit",

    # Bill/utility payments — ← FIX: "electricity bill"
    "electricity bill",       "utility bill",           "phone bill",
    "internet bill",          "water bill",             "gas bill",
    "bill payment",           "paid bill",

    # Urdu/Roman Urdu
    "kharch kiya",            "ada kiya",               "mila",
    "jama kiya",              "kharch karo",            "ada karo",
    "raseed",
]


class FinanceParser:
    def __init__(self):
        self.nlp = spacy.load("en_core_web_md")
        self.matcher = PhraseMatcher(self.nlp.vocab)

        for table_key, info in DB_KNOWLEDGE.items():
            patterns = [self.nlp.make_doc(text.lower())
                        for text in info['synonyms']]
            self.matcher.add(table_key.upper(), patterns)

    def get_semantic_match(self, word):
        temp_doc = self.nlp(word.lower())
        if len(temp_doc) == 0:
            return None
        token = temp_doc[0]
        if not token.has_vector or token.is_stop:
            return None
        best_match    = None
        highest_score = 0.7
        for table_key, info in DB_KNOWLEDGE.items():
            for synonym in info['synonyms']:
                syn_doc = self.nlp(synonym.lower())
                if len(syn_doc) > 0 and syn_doc.has_vector:
                    similarity = token.similarity(syn_doc)
                    if similarity > highest_score:
                        highest_score = similarity
                        best_match    = table_key.upper()
        return best_match

    def parse_query(self, query):
        doc  = self.nlp(query.lower())
        text = query.lower()

        # ── STEP 1: Financial Summary ─────────────────────────────
        summary_date_phrases = [
            "this month",  "last month",  "this year",   "last year",
            "this week",   "today",       "yesterday",
            "january",     "february",    "march",       "april",
            "may",         "june",        "july",        "august",
            "september",   "october",     "november",    "december"
        ]
        for phrase in SUMMARY_PHRASES:
            if phrase in text:
                resolved_dates = []
                for rp in summary_date_phrases:
                    if rp in text:
                        hit = resolve(rp)
                        if hit:
                            resolved_dates.append(hit)
                        break
                return {
                    "intent":        "financial_summary",
                    "intent_tables": [],
                    "filters": {
                        "dates":        resolved_dates,
                        "amounts":      [],
                        "account_name": None
                    }
                }

        # ── STEP 2: FAQ ───────────────────────────────────────────
        for keyword in list(FAQ_KNOWLEDGE.keys()):
            if keyword in text:
                return {
                    "intent":        "faq",
                    "faq_key":       keyword,
                    "intent_tables": [],
                    "filters": {
                        "dates":        [],
                        "amounts":      [],
                        "account_name": None
                    }
                }

        # ── STEP 3: Add Transaction ───────────────────────────────
        for phrase in ADD_TRANSACTION_PHRASES:
            if phrase in text:
                return self._parse_add_transaction(text, doc)

        # Single-word triggers — sirf tab jab amount bhi ho
        ADD_SINGLE_WORD_TRIGGERS = [
            "pay", "purchase", "bought", "sell", "sold", "received"
        ]
        has_amount = any(token.like_num for token in doc)
        if has_amount:
            for word in ADD_SINGLE_WORD_TRIGGERS:
                if re.search(r'\b' + word + r'\b', text):
                    return self._parse_add_transaction(text, doc)

        # ── STEP 4: Normal data query ─────────────────────────────
        matches = self.matcher(doc)
        tables  = list(set([
            self.nlp.vocab.strings[m[0]] for m in matches
        ]))
        if not tables:
            for token in doc:
                if not token.is_stop:
                    match = self.get_semantic_match(token.text)
                    if match:
                        tables.append(match)

        # Date extraction
        resolved_dates   = []
        relative_phrases = [
            "last 7 days",    "past 7 days",    "last seven days",
            "last 30 days",   "past 30 days",
            "last 15 days",   "past 15 days",
            "last week",      "past week",       "previous week",
            "this week",      "current week",
            "recent",         "recently",        "latest",
            "this month",     "last month",      "current month",
            "previous month",
            "this year",      "last year",       "current year",
            "today",          "yesterday",
            "january",        "february",        "march",       "april",
            "may",            "june",            "july",        "august",
            "september",      "october",         "november",    "december"
        ]
        hit = None
        for phrase in relative_phrases:
            if phrase in text:
                hit = resolve(phrase)
                break
        if hit:
            resolved_dates.append(hit)
        else:
            for ent in doc.ents:
                if ent.label_ in ["DATE", "TIME"]:
                    if ent.text.strip().isdigit():
                        continue
                    resolved = resolve(ent.text)
                    if resolved:
                        resolved_dates.append(resolved)

        # Amount extraction
        amounts = []
        for ent in doc.ents:
            if ent.label_ in ["MONEY", "CARDINAL"]:
                raw = (ent.text
                       .replace(",", "")
                       .replace("pkr", "")
                       .replace("rs.", "")
                       .replace("rs", "")
                       .strip())
                if raw.replace(".", "").isdigit():
                    value = float(raw)
                    if any(w in text for w in
                           ["above", "more than", "greater than",
                            "over", "exceeding"]):
                        op = ">"
                    elif any(w in text for w in
                             ["below", "less than", "under", "within"]):
                        op = "<"
                    else:
                        op = ">="
                    amounts.append({"value": value, "operator": op})
        if not amounts:
            for token in doc:
                if token.like_num:
                    try:
                        value = float(token.text.replace(",", ""))
                        if any(w in text for w in
                               ["above", "more than", "greater than", "over"]):
                            op = ">"
                        elif any(w in text for w in
                                 ["below", "less than", "under"]):
                            op = "<"
                        else:
                            op = ">="
                        amounts.append({"value": value, "operator": op})
                        break
                    except ValueError:
                        continue

        # Account name filter
        from metadata import ACCOUNT_SYNONYMS
        account_filter = None
        for keyword, account_name in ACCOUNT_SYNONYMS.items():
            if keyword in text:
                account_filter = account_name
                break

        return {
            "intent":        "data_query",
            "intent_tables": list(set(tables)),
            "filters": {
                "dates":        resolved_dates,
                "amounts":      amounts,
                "account_name": account_filter
            }
        }

    def _parse_add_transaction(self, text, doc):
        from metadata import ACCOUNT_SYNONYMS
        from date_resolver import resolve as resolve_date

        # ── Amount ────────────────────────────────────────────────
        amount = None
        for ent in doc.ents:
            if ent.label_ in ["MONEY", "CARDINAL"]:
                raw = (ent.text
                       .replace(",", "")
                       .replace("pkr", "")
                       .replace("rs.", "")
                       .replace("rs", "")
                       .strip())
                if raw.replace(".", "").isdigit():
                    val = float(raw)
                    if val > 0:
                        amount = val
                        break
        if not amount:
            for token in doc:
                if token.like_num:
                    try:
                        val = float(token.text.replace(",", ""))
                        if val > 0:
                            amount = val
                            break
                    except ValueError:
                        continue

        # ── Date ──────────────────────────────────────────────────
        transaction_date = None
        date_phrases = [
            "yesterday", "today", "last week", "this week",
            "january", "february", "march", "april", "may", "june",
            "july", "august", "september", "october", "november", "december"
        ]
        for phrase in date_phrases:
            if phrase in text:
                resolved = resolve_date(phrase)
                if resolved and resolved["type"] == "exact":
                    transaction_date = resolved["value"]
                elif resolved and resolved["type"] == "month":
                    transaction_date = resolved["value"] + "-01"
                break
        if not transaction_date:
            for ent in doc.ents:
                if ent.label_ == "DATE" and not ent.text.strip().isdigit():
                    resolved = resolve_date(ent.text)
                    if resolved and resolved["type"] == "exact":
                        transaction_date = resolved["value"]
                    break

        # ── Structured Format Parser ──────────────────────────────
        # FIX: "Debit X amount and Credit Y amount" pattern
        # Yeh pattern explicitly debit aur credit account naam deta hai
        # Kyun alag handle? Kyun ke credit_triggers ("from/using")
        # is format mein exist nahi karte — isliye credit_hint null hota tha
        debit_hint  = None
        credit_hint = None

        # Pattern: "debit [account] ... credit [account]"
        # OR:      "credit [account] ... debit [account]"
        # OR:      "[account] is debited ... [account] is credited"
        structured_debit  = re.search(
            r'\bdebit\s+([a-z\s]+?)(?:\s+\d|and|,|$)', text
        )
        structured_credit = re.search(
            r'\bcredit\s+([a-z\s]+?)(?:\s+\d|and|,|$)', text
        )

        if structured_debit or structured_credit:
            # Structured format detected — match against ACCOUNT_SYNONYMS
            if structured_debit:
                debit_raw = structured_debit.group(1).strip()
                for synonym, account_name in ACCOUNT_SYNONYMS.items():
                    if synonym in debit_raw:
                        debit_hint = account_name
                        break
                # Agar exact match nahi toh partial word match
                if not debit_hint:
                    for synonym, account_name in ACCOUNT_SYNONYMS.items():
                        if any(w in debit_raw for w in synonym.split()):
                            debit_hint = account_name
                            break

            if structured_credit:
                credit_raw = structured_credit.group(1).strip()
                for synonym, account_name in ACCOUNT_SYNONYMS.items():
                    if synonym in credit_raw:
                        credit_hint = account_name
                        break
                if not credit_hint:
                    for synonym, account_name in ACCOUNT_SYNONYMS.items():
                        if any(w in credit_raw for w in synonym.split()):
                            credit_hint = account_name
                            break

            # Agar structured pattern se kuch mila toh yahan se return karo
            # Normal credit_triggers skip karo — woh is format ke liye nahi
            if debit_hint or credit_hint:
                # Description
                skip_words = (
                    list(ACCOUNT_SYNONYMS.keys()) +
                    ["add", "post", "record", "transaction", "entry",
                     "debit", "credit", "debited", "credited",
                     "paid", "from", "received", "the", "a", "an",
                     "and", "for", "pkr", "rs"]
                )
                desc_tokens = [
                    t.text for t in doc
                    if not t.like_num
                    and t.text.lower() not in skip_words
                    and len(t.text) > 2
                    and not t.is_punct
                ]
                description = " ".join(desc_tokens[:5]).strip() or "Transaction"

                return {
                    "intent":           "add_transaction",
                    "intent_tables":    [],
                    "amount":           amount,
                    "debit_hint":       debit_hint,
                    "credit_hint":      credit_hint,
                    "description":      description,
                    "transaction_date": transaction_date,
                    "filters": {
                        "dates":        [],
                        "amounts":      [],
                        "account_name": None
                    }
                }

        # ── Normal Credit extraction — "from/using/via" ───────────
        # Yeh tab chalta hai jab structured format nahi mila
        credit_triggers = [
            "paid from",    "payment from",  "pay from",
            "paid using",   "pay using",     "using",
            "via",          "paid via",      "pay via",
            "through",      "paid in cash",  "from",
            "paid by",      "paid with",     "pay with",
            "out of",       "payment out of","with"
        ]
        for trigger in credit_triggers:
            if trigger in text:
                after = text.split(trigger)[-1].strip()
                for synonym, account_name in ACCOUNT_SYNONYMS.items():
                    if synonym in after[:50]:
                        credit_hint = account_name
                        break
                if credit_hint:
                    break

        # ── Debit account — remaining text ───────────────────────
        if "on credit" in text or "credit to" in text:
            debit_hint = "Accounts Receivable"
            if not credit_hint:
                for synonym, account_name in ACCOUNT_SYNONYMS.items():
                    if (synonym in text
                            and account_name != "Accounts Receivable"):
                        credit_hint = account_name
                        break
            if not credit_hint:
                credit_hint = "Sales Revenue"
        else:
            for synonym, account_name in ACCOUNT_SYNONYMS.items():
                if synonym in text and account_name != credit_hint:
                    debit_hint = account_name
                    break

        # ── Description ───────────────────────────────────────────
        skip_words = (
            list(ACCOUNT_SYNONYMS.keys()) +
            ["add", "post", "record", "transaction", "entry",
             "paid", "from", "received", "in", "the", "a", "an",
             "using", "via", "through", "purchase", "bought",
             "sell", "sold", "pay", "payment", "spent", "spend",
             "worth", "of", "for", "by", "with", "to", "on",
             "today", "yesterday", "cash", "bank", "and", "new",
             "debit", "credit", "debited", "credited", "pkr", "rs"]
        )
        desc_tokens = [
            t.text for t in doc
            if not t.like_num
            and t.text.lower() not in skip_words
            and len(t.text) > 2
            and not t.is_punct
        ]
        description = " ".join(desc_tokens[:5]).strip() or "Transaction"

        return {
            "intent":           "add_transaction",
            "intent_tables":    [],
            "amount":           amount,
            "debit_hint":       debit_hint,
            "credit_hint":      credit_hint,
            "description":      description,
            "transaction_date": transaction_date,
            "filters": {
                "dates":        [],
                "amounts":      [],
                "account_name": None
            }
        }