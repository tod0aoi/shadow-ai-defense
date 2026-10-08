import re
from typing import List, Dict, Any

# Strict RFC 1918 Private IPv4 Address Regex
RFC1918_IP_REGEX = re.compile(
    r'\b(?:10\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)|'
    r'172\.(?:1[6-9]|2[0-9]|3[01])\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)|'
    r'192\.168\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))\b'
)

# Database Connection URI with credentials or endpoints
DB_CONNECTION_URI_REGEX = re.compile(
    r'(?i)\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|mssql|oracle):\/\/(?:[^:@\s]+(?::[^@\s]+)?@)?[^\s"\']+'
)

# Internal corporate FQDN / Domain suffixes
INTERNAL_FQDN_REGEX = re.compile(
    r'\b[a-zA-Z0-9][-a-zA-Z0-9]*\.(?:corp|internal|local|lan|priv|intranet)\b'
)

class InfrastructureDetector:
    """
    Detects internal infrastructure leakage including RFC 1918 private IPs,
    database connection strings, and internal corporate hostnames.
    """

    def scan(self, text: str) -> List[Dict[str, Any]]:
        detections: List[Dict[str, Any]] = []

        # 1. Database Connection Strings
        for m in DB_CONNECTION_URI_REGEX.finditer(text):
            detections.append({
                "category": "INFRASTRUCTURE",
                "subcategory": "DATABASE_CONNECTION_URI",
                "value": m.group(0),
                "start": m.start(),
                "end": m.end(),
                "confidence": 0.95,
            })

        # 2. RFC 1918 Private IPv4
        for m in RFC1918_IP_REGEX.finditer(text):
            ip_val = m.group(0)
            detections.append({
                "category": "INFRASTRUCTURE",
                "subcategory": "RFC1918_PRIVATE_IP",
                "value": ip_val,
                "start": m.start(),
                "end": m.end(),
                "confidence": 0.90,
            })

        # 3. Internal Hostnames
        for m in INTERNAL_FQDN_REGEX.finditer(text):
            detections.append({
                "category": "INFRASTRUCTURE",
                "subcategory": "INTERNAL_DOMAIN_FQDN",
                "value": m.group(0),
                "start": m.start(),
                "end": m.end(),
                "confidence": 0.85,
            })

        return detections
