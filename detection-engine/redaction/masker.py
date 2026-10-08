import re
from typing import List, Dict, Any

def mask_single_value(val: str, category: str = "SECRET") -> str:
    """
    Irreversibly masks a sensitive value based on its category.
    Ensures zero raw plaintext secrets are displayed in triage logs.
    """
    if not val:
        return "***"
    
    clean = val.strip()

    # PII Email Masking
    if category == "PII" and "@" in clean:
        parts = clean.split("@")
        local, domain = parts[0], parts[1]
        if len(local) <= 2:
            masked_local = local[0] + "*"
        else:
            masked_local = local[0] + "*" * (len(local) - 2) + local[-1]
        return f"{masked_local}@{domain}"

    # Infrastructure IPv4 Masking
    if category == "INFRASTRUCTURE" and clean.count(".") == 3:
        octets = clean.split(".")
        return f"{octets[0]}.{octets[1]}.*.*"

    # Private Key Masking
    if "PRIVATE KEY" in clean:
        return "-----BEGIN PRIVATE KEY-----\n[REDACTED KEY DATA]\n-----END PRIVATE KEY-----"

    # Default Alphanumeric Secret Masking
    if len(clean) <= 6:
        return "******"

    prefix_len = min(4, max(2, len(clean) // 5))
    suffix_len = min(3, max(2, len(clean) // 6))
    masked_count = max(6, len(clean) - prefix_len - suffix_len)
    
    return f"{clean[:prefix_len]}{'*' * masked_count}{clean[-suffix_len:]}"


def redact_full_text(text: str, detections: List[Dict[str, Any]]) -> str:
    """
    Produces a safe, sanitized version of the prompt by replacing all
    detected sensitive entity spans with their masked equivalents.
    Processes spans in reverse index order to avoid offset corruption.
    """
    if not detections or not text:
        return text

    # Filter detections that have valid, non-overlapping character indices
    valid_spans = [
        d for d in detections 
        if "start" in d and "end" in d and d["start"] < d["end"] and d["category"] != "CODE"
    ]

    # Sort descending by start index
    valid_spans.sort(key=lambda x: x["start"], reverse=True)

    redacted = text
    last_start = len(text) + 1

    for d in valid_spans:
        start = d["start"]
        end = d["end"]

        # Prevent overlapping replacement collision
        if end > last_start:
            continue

        raw_val = d.get("value", text[start:end])
        masked_val = mask_single_value(raw_val, d.get("category", "SECRET"))
        replacement = f"[REDACTED_{d.get('subcategory', d.get('category', 'SENSITIVE'))}: {masked_val}]"

        redacted = redacted[:start] + replacement + redacted[end:]
        last_start = start

    return redacted
