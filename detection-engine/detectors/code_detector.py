import re
from typing import List, Dict, Any

# Confidentiality Indicators
CONFIDENTIAL_MARKER_REGEX = re.compile(
    r'\b(CONFIDENTIAL|STRICTLY CONFIDENTIAL|INTERNAL ONLY|PROPRIETARY|RESTRICTED|DO NOT DISTRIBUTE|TOP SECRET)\b',
    re.IGNORECASE
)

# Common Programming Syntax Tokens
CODE_KEYWORDS = [
    r'\bdef\s+[a-zA-Z_]\w*\s*\(',              # python function
    r'\bclass\s+[a-zA-Z_]\w*[:\s{]',           # class definition
    r'\bfunction\s+[a-zA-Z_]\w*\s*\(',         # js/ts function
    r'\bconst\s+[a-zA-Z_]\w*\s*=',             # js const assignment
    r'\blet\s+[a-zA-Z_]\w*\s*=',               # js let assignment
    r'\bimport\s+.*?\s+from\s+["\']',          # es6 import
    r'\bfrom\s+[a-zA-Z_]\w*\s+import\b',       # python import
    r'\bpublic\s+(?:static\s+)?(?:void|class)',# java / c# signature
    r'#include\s*<[a-zA-Z0-9_.]+>',            # c/c++ include
    r'=>\s*\{',                                # arrow function
    r'\bSELECT\s+.*?\s+FROM\s+[a-zA-Z_]',      # sql query
]

COMPILED_CODE_PATTERNS = [re.compile(p, re.IGNORECASE) for p in CODE_KEYWORDS]

class CodeDetector:
    """
    Detects source code snippets, proprietary logic, and organizational
    confidentiality markers.
    """

    def scan(self, text: str) -> List[Dict[str, Any]]:
        detections: List[Dict[str, Any]] = []

        # 1. Confidentiality Indicators
        for m in CONFIDENTIAL_MARKER_REGEX.finditer(text):
            detections.append({
                "category": "CONFIDENTIAL",
                "subcategory": "CONFIDENTIALITY_MARKER",
                "value": m.group(0),
                "start": m.start(),
                "end": m.end(),
                "confidence": 0.95,
            })

        # 2. Source Code Detection (Heuristic aggregation)
        matched_patterns = []
        for pat in COMPILED_CODE_PATTERNS:
            match = pat.search(text)
            if match:
                matched_patterns.append(match.group(0))

        # Check for code structural density (semicolons, braces, indentations)
        brace_count = text.count('{') + text.count('}')
        semicolon_count = text.count(';')
        has_structural_density = (brace_count >= 2 and semicolon_count >= 1)

        if len(matched_patterns) >= 1 or has_structural_density:
            confidence = min(0.99, 0.60 + (len(matched_patterns) * 0.15))
            detections.append({
                "category": "CODE",
                "subcategory": "PROPRIETARY_SOURCE_CODE",
                "value": text[:min(100, len(text))], # Sample snippet
                "start": 0,
                "end": len(text),
                "confidence": round(confidence, 2),
                "metadata": {
                    "matched_syntaxes": matched_patterns[:3],
                    "brace_count": brace_count,
                    "semicolon_count": semicolon_count
                }
            })

        return detections
