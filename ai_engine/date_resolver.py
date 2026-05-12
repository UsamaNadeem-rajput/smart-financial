from datetime import datetime, timedelta

def resolve(raw_text):
    """
    Converts any date-like string into a structured dict.
    Returns None if unrecognized.

    Return types:
      {"type": "month",  "value": "2026-01"}
      {"type": "year",   "value": "2026"}
      {"type": "exact",  "value": "2026-01-14"}
      {"type": "range",  "start": "2026-01-01", "end": "2026-01-31"}
    """
    text = raw_text.lower().strip()
    now  = datetime.now()

    # ── Relative ranges — checked FIRST before single words ──────
    # "last 7 days" must be checked before "last" alone
    # otherwise "last" matches a month pattern

    if text in ["last 7 days", "past 7 days", "last seven days"]:
        start = now - timedelta(days=7)
        return {
            "type":  "range",
            "start": start.strftime('%Y-%m-%d'),
            "end":   now.strftime('%Y-%m-%d')
        }

    if text in ["last 30 days", "past 30 days", "last thirty days"]:
        start = now - timedelta(days=30)
        return {
            "type":  "range",
            "start": start.strftime('%Y-%m-%d'),
            "end":   now.strftime('%Y-%m-%d')
        }

    if text in ["last 15 days", "past 15 days"]:
        start = now - timedelta(days=15)
        return {
            "type":  "range",
            "start": start.strftime('%Y-%m-%d'),
            "end":   now.strftime('%Y-%m-%d')
        }

    # "recent" / "recently" → last 30 days
    # Kyun 30 days? "Recent" is subjective — 30 days is a safe
    # default for financial context without being too narrow or wide
    if text in ["recent", "recently", "recent transactions", "latest"]:
        start = now - timedelta(days=30)
        return {
            "type":  "range",
            "start": start.strftime('%Y-%m-%d'),
            "end":   now.strftime('%Y-%m-%d')
        }

    # ── Single relative terms ─────────────────────────────────────
    if text in ["this month", "current month"]:
        return {"type": "month", "value": now.strftime('%Y-%m')}

    if text in ["last month", "previous month"]:
        first = now.replace(day=1) - timedelta(days=1)
        return {"type": "month", "value": first.strftime('%Y-%m')}

    if text in ["this year", "current year"]:
        return {"type": "year", "value": str(now.year)}

    if text in ["last year", "previous year"]:
        return {"type": "year", "value": str(now.year - 1)}

    if text == "today":
        return {"type": "exact", "value": now.strftime('%Y-%m-%d')}

    if text == "yesterday":
        return {
            "type":  "exact",
            "value": (now - timedelta(days=1)).strftime('%Y-%m-%d')
        }

    if text in ["this week", "current week"]:
        start = now - timedelta(days=now.weekday())
        end   = start + timedelta(days=6)
        return {
            "type":  "range",
            "start": start.strftime('%Y-%m-%d'),
            "end":   end.strftime('%Y-%m-%d')
        }

    if text in ["last week", "previous week", "past week"]:
        # Last 7 days (rolling) — more useful than calendar week
        start = now - timedelta(days=7)
        return {
            "type":  "range",
            "start": start.strftime('%Y-%m-%d'),
            "end":   now.strftime('%Y-%m-%d')
        }

    # ── Named months ──────────────────────────────────────────────
    month_map = {
        "january": "01", "february": "02", "march":     "03",
        "april":   "04", "may":      "05", "june":      "06",
        "july":    "07", "august":   "08", "september": "09",
        "october": "10", "november": "11", "december":  "12"
    }
    for name, num in month_map.items():
        if name in text:
            year = now.year
            for word in text.split():
                if word.isdigit() and len(word) == 4:
                    year = int(word)
            return {"type": "month", "value": f"{year}-{num}"}

    # ── Direct date formats ───────────────────────────────────────
    for fmt in ["%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%B %d %Y", "%b %d %Y"]:
        try:
            return {
                "type":  "exact",
                "value": datetime.strptime(text.strip(), fmt).strftime('%Y-%m-%d')
            }
        except ValueError:
            continue

    return None  # Unrecognized — caller handles this


def _try_parse_date(text):
    """Try common date formats. Returns YYYY-MM-DD string or None."""
    formats = [
        "%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y",
        "%B %d %Y", "%b %d %Y", "%d %B %Y"
    ]
    for fmt in formats:
        try:
            return datetime.strptime(text.strip(), fmt).strftime('%Y-%m-%d')
        except ValueError:
            continue
    return None