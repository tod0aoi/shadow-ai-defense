import re
from typing import List, Dict, Any
from .entropy_analyzer import calculate_shannon_entropy

AWS_ACCESS_KEY_REGEX = re.compile(r'(?<![A-Z0-9])(AKIA[0-9A-Z]{16})(?![A-Z0-9])')

JWT_REGEX = re.compile(
    r'\b(eyJ[A-Za-z0-9-_=]{10,}\.[A-Za-z0-9-_=]{10,}\.?[A-Za-z0-9-_.+/=]*)\b'
)

PRIVATE_KEY_REGEX = re.compile(
    r'-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----[\s\S]+?-----END (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----'
)

GENERIC_ASSIGNMENT_SECRET = re.compile(
    r'(?i)\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|secret[_-]?key|client[_-]?secret|password|passwd|pwd)\s*[:=]\s*["\']?([A-Za-z0-9+/=_\-~.]{8,})["\']?'
)

class SecretDetector:
    """
    Detects high-risk cryptographic secrets, cloud credentials,
    authentication tokens, and private keys.
    """

    def scan(self, text: str) -> List[Dict[str, Any]]:
        detections: List[Dict[str, Any]] = []

        # 1. AWS Access Keys
        for m in AWS_ACCESS_KEY_REGEX.finditer(text):
            detections.append({
                "category": "SECRET",
                "subcategory": "AWS_ACCESS_KEY",
                "value": m.group(1),
                "start": m.start(1),
                "end": m.end(1),
                "confidence": 0.99,
                "entropy": calculate_shannon_entropy(m.group(1)),
            })

        # 2. JWT Tokens
        for m in JWT_REGEX.finditer(text):
            token = m.group(1)
            # Ensure it has standard JWT structure (at least 2 dots for 3 parts)
            if token.count('.') >= 2:
                detections.append({
                    "category": "SECRET",
                    "subcategory": "JSON_WEB_TOKEN",
                    "value": token,
                    "start": m.start(1),
                    "end": m.end(1),
                    "confidence": 0.95,
                    "entropy": calculate_shannon_entropy(token),
                })

        # 3. Private Keys (RSA / SSH / EC)
        for m in PRIVATE_KEY_REGEX.finditer(text):
            key_block = m.group(0)
            detections.append({
                "category": "SECRET",
                "subcategory": "PRIVATE_KEY_BLOCK",
                "value": key_block,
                "start": m.start(),
                "end": m.end(),
                "confidence": 1.0,
                "entropy": calculate_shannon_entropy(key_block),
            })

        # 4. Contextual Credential / Secret Assignments
        for m in GENERIC_ASSIGNMENT_SECRET.finditer(text):
            secret_val = m.group(1)
            # Check entropy of the secret value to avoid flagging placeholders like "password=test"
            entropy = calculate_shannon_entropy(secret_val)
            if len(secret_val) >= 12 or entropy >= 3.6:
                detections.append({
                    "category": "CREDENTIAL",
                    "subcategory": "EXPLICIT_CREDENTIAL_ASSIGNMENT",
                    "value": secret_val,
                    "start": m.start(1),
                    "end": m.end(1),
                    "confidence": 0.90,
                    "entropy": entropy,
                })

        return detections
