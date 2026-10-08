# Sensitive Data Detection Engine: Technical Specification
## Multi-Stage Pipeline, Regular Expressions, Entropy Math & Privacy Redaction

---

## 1. Detection Pipeline Overview

The Python Detection Engine (`detection-engine/`) processes unstructured text across five sequential stages:

```
Raw Prompt Text
      ↓
[Stage 1: Normalization & Decoding]
  • URL unescaping (urllib.parse.unquote)
  • Whitespace standardization
      ↓
[Stage 2: Deterministic Rule Scanners]
  • PII Detector (Email, Phone, SSN, Aadhaar)
  • Secret Detector (AWS Keys, JWTs, Private Keys, Credential Assignments)
  • Infrastructure Detector (RFC 1918 IPs, Database URIs, FQDNs)
  • Code Detector (Syntactic patterns, Confidentiality tags)
      ↓
[Stage 3: Shannon Entropy Analysis]
  • Alphanumeric token extraction (len >= 16)
  • Shannon Entropy calculation: H(X) >= 4.2
      ↓
[Stage 4: Privacy Masking & Reverse-Span Redaction]
  • Span collision resolution
  • Irreversible masking per category
  • Reverse-index prompt replacement
      ↓
Structured Detection Report (JSON)
```

---

## 2. Regular Expressions & Structural Patterns

### A. AWS Access Key IDs
```regex
(?<![A-Z0-9])(AKIA[0-9A-Z]{16})(?![A-Z0-9])
```
* **Lookaround Anchors**: `(?<![A-Z0-9])` and `(?![A-Z0-9])` ensure the token is an exact 20-character string beginning with `AKIA`, preventing false matches inside longer hashes.

### B. JSON Web Tokens (JWT)
```regex
\b(eyJ[A-Za-z0-9-_=]{10,}\.[A-Za-z0-9-_=]{10,}\.?[A-Za-z0-9-_.+/=]*)\b
```
* **Validation**: Matches base64url-encoded header (`eyJ`), payload, and signature separated by periods (`.`). Validates that at least two periods exist.

### C. RSA / OpenSSH Private Keys
```regex
-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----[\s\S]+?-----END (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----
```
* **Multi-line Span**: Extracts entire cryptographic PEM key blocks.

### D. RFC 1918 Private IPv4 Addresses
```regex
\b(?:10\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)|
172\.(?:1[6-9]|2[0-9]|3[01])\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)|
192\.168\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))\b
```
* **Octet Validation**: Restricts octet values to the strict $0–255$ range, correctly distinguishing valid private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) from arbitrary dot-separated numbers.

### E. Database Connection URIs
```regex
(?i)\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|mssql|oracle):\/\/(?:[^:@\s]+(?::[^@\s]+)?@)?[^\s"']+
```
* Extracts database URLs containing sensitive embedded passwords and internal hostnames.

---

## 3. Shannon Entropy Mathematical Derivation

To detect unlabelled cryptographic keys, high-entropy passwords, and custom API tokens without relying solely on keyword matching, the engine implements Shannon Entropy:

$$H(X) = -\sum_{i=1}^{k} P(x_i) \log_2 P(x_i)$$

Where:
* $k$: Number of unique characters in the token.
* $P(x_i)$: Probability of character $x_i$ appearing ($\frac{\text{count}(x_i)}{N}$).
* $\log_2$: Logarithm base 2 (measuring information in bits per character).

### Entropy Threshold Guidelines
* **Natural English Text**: $H(X) \approx 2.5 - 3.8\text{ bits/char}$.
* **Alphanumeric Passwords / Hashes**: $H(X) \ge 4.2\text{ bits/char}$.
* Tokens with length $\ge 16$ and $H(X) \ge 4.2$ are automatically classified as `HIGH_ENTROPY_TOKEN` under the `SECRET` category.

---

## 4. Privacy-by-Design Masking Algorithms

| Category | Raw Sensitive String | Irreversible Masked Output |
| :--- | :--- | :--- |
| **AWS Key** | `AKIAIOSFODNN7EXAMPLE` | `AKIA************PLE` |
| **Email** | `alice.cooper@corp.internal` | `a*****************r@corp.internal` |
| **Private IP** | `192.168.10.45` | `192.168.*.*` |
| **Private Key** | `-----BEGIN RSA PRIVATE KEY-----...` | `-----BEGIN PRIVATE KEY-----\n[REDACTED]\n-----END PRIVATE KEY-----` |
| **Generic Secret** | `xK991823Jk1234#Pass!` | `xK99************ss!` |

### Reverse-Span Prompt Replacement
When producing the sanitized prompt preview, replacements are applied in **descending order of starting character offset** (`reverse=True`). This prevents character displacement from invalidating subsequent replacement offsets.
