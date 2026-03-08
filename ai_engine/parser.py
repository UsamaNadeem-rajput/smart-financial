import spacy
from spacy.matcher import PhraseMatcher
import metadata
from metadata import DB_KNOWLEDGE

class FinanceParser:
    def __init__(self):
        # Medium model load karna (Is mein Vectors hotay hain)
        self.nlp = spacy.load("en_core_web_md") 
        self.matcher = PhraseMatcher(self.nlp.vocab)
        
        # Rule-based matching setup (Phase 1)
        for table_key, info in DB_KNOWLEDGE.items():
            patterns = [self.nlp.make_doc(text.lower()) for text in info['synonyms']]
            self.matcher.add(table_key.upper(), patterns)

    def get_semantic_match(self, word):
        # Word ko Doc object banayein taake hum uske tokens tak rasayi hasil karein
        temp_doc = self.nlp(word.lower())
        
        # Agar word khali hai ya us mein tokens nahi hain
        if len(temp_doc) == 0:
            return None
            
        # Pehla token uthayein
        token = temp_doc[0]
        
        # Check if the token actually has a vector and is NOT a stop word
        if not token.has_vector or token.is_stop:
            return None

        best_match = None
        highest_score = 0.7 

        for table_key, info in DB_KNOWLEDGE.items():
            for synonym in info['synonyms']:
                syn_doc = self.nlp(synonym.lower())
                if len(syn_doc) > 0 and syn_doc.has_vector:
                    similarity = token.similarity(syn_doc)
                    if similarity > highest_score:
                        highest_score = similarity
                        best_match = table_key.upper()
        
        return best_match

    def parse_query(self, query):
        doc = self.nlp(query.lower())
        
        # 1. Rule-based match (Fastest)
        matches = self.matcher(doc)
        tables = list(set([self.nlp.vocab.strings[m[0]] for m in matches]))
        
        # 2. Semantic Match (If rule-based fails)
        if not tables:
            for token in doc:
                if not token.is_stop: # Ignore words like 'the', 'is'
                    match = self.get_semantic_match(token.text)
                    if match:
                        tables.append(match)
        
        # 3. Entity Extraction (Dates/Amounts) - Same as before
        dates = []
        amounts = []
        for ent in doc.ents:
            if ent.label_ in ["DATE", "TIME"]:
                if ent.text.isdigit() and len(ent.text) > 2:
                    amounts.append(ent.text)
                else:
                    dates.append(ent.text)
            elif ent.label_ in ["MONEY", "CARDINAL"]:
                amounts.append(ent.text)
                
        return {
            "intent_tables": list(set(tables)),
            "filters": {"dates": dates, "amounts": amounts}
        }