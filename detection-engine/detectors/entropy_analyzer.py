import math
import re
from typing import List, Dict, Any

def calculate_shannon_entropy(data: str) -> float:
    """
    Computes Shannon Entropy H(X) in bits per character.
    H(X) = - sum( P(x) * log2(P(x)) )
    Plain English prose typically has entropy between 2.5 and 3.8.
    Cryptographic secrets, API keys, and hashes typically exceed 4.2.
    """
    if not data:
        return 0.0

    length = len(data)
    freq: Dict[str, int] = {}
    for char in data:
        freq[char] = freq.get(char, 0) + 1

    entropy = 0.0
    for count in freq.values():
        p = count / length
        entropy -= p * math.log2(p)

    return round(entropy, 2)


def find_high_entropy_tokens(
    text: str, min_length: int = 16, entropy_threshold: float = 4.2
) -> List[Dict[str, Any]]:
    """
    Scans text for individual high-entropy alphanumeric tokens that
    strongly resemble cryptographic secrets, random keys, or passwords.
    """
    findings: List[Dict[str, Any]] = []

    # Extract alphanumeric and base64-like contiguous tokens
    token_pattern = re.compile(r'\b[A-Za-z0-9+/=_\-~.]{' + str(min_length) + r',}\b')

    for match in token_pattern.finditer(text):
        token = match.group(0)
        
        # Skip pure repeating characters (e.g. AAAAAAAA...)
        if len(set(token)) <= 3:
            continue

        entropy = calculate_shannon_entropy(token)
        if entropy >= entropy_threshold:
            findings.append({
                "token": token,
                "start": match.start(),
                "end": match.end(),
                "entropy": entropy,
                "length": len(token),
            })

    return findings
