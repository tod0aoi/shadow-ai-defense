import re
from typing import List, Dict, Any

# Pre-compiled high-performance regular expressions
EMAIL_REGEX = re.compile(
    r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b'
)

PHONE_REGEX = re.compile(
    r'(?<![a-zA-Z0-9])(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}(?![a-zA-Z0-9])'
)

US_SSN_REGEX = re.compile(
    r'\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b'
)

AADHAAR_REGEX = re.compile(
    r'\b[2-9]\d{3}\s\d{4}\s\d{4}\b'
)

class PIIDetector:
    """
    Detects Personally Identifiable Information (PII) including email addresses,
    telephone numbers, and national identification formats.
    """

    def scan(self, text: str) -> List[Dict[str, Any]]:
        detections: List[Dict[str, Any]] = []

        # 1. Emails
        for m in EMAIL_REGEX.finditer(text):
            detections.append({
                "category": "PII",
                "subcategory": "EMAIL_ADDRESS",
                "value": m.group(0),
                "start": m.start(),
                "end": m.end(),
                "confidence": 0.95,
            })

        # 2. Phone Numbers
        for m in PHONE_REGEX.finditer(text):
            phone = m.group(0)
            # Filter out short digit sequences that look like dates or numbers
            digits = re.sub(r'\D', '', phone)
            if len(digits) >= 10:
                detections.append({
                    "category": "PII",
                    "subcategory": "PHONE_NUMBER",
                    "value": phone,
                    "start": m.start(),
                    "end": m.end(),
                    "confidence": 0.85,
                })

        # 3. National IDs (SSN)
        for m in US_SSN_REGEX.finditer(text):
            detections.append({
                "category": "PII",
                "subcategory": "NATIONAL_ID_SSN",
                "value": m.group(0),
                "start": m.start(),
                "end": m.end(),
                "confidence": 0.90,
            })

        # 4. National IDs (Aadhaar format: 12 digits formatted XXXX XXXX XXXX)
        for m in AADHAAR_REGEX.finditer(text):
            detections.append({
                "category": "PII",
                "subcategory": "NATIONAL_ID_AADHAAR",
                "value": m.group(0),
                "start": m.start(),
                "end": m.end(),
                "confidence": 0.85,
            })

        return detections
