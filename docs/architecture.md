# AI-Powered Shadow AI Data Leakage Detection & Risk Assessment Platform
## Technical Architecture & Security Model

---

## 1. Executive Summary & Problem Definition

The unchecked adoption of external Generative AI tools (ChatGPT, Google Gemini, Anthropic Claude, Microsoft Copilot) has created a significant visibility gap in enterprise security perimeters, commonly referred to as **Shadow AI**. 

Employees routinely submit sensitive corporate assets—including cloud credentials, customer PII, internal IP topographies, proprietary algorithms, and confidential business plans—into external cloud models. Traditional perimeter firewalls and web proxies are often blind to this traffic or lack semantic awareness of what constitutes sensitive organizational data.

This platform bridges this visibility and enforcement gap through a modular, deterministic, privacy-preserving cybersecurity prototype.

---

## 2. Threat Modeling & MITRE ATT&CK Mapping

| Threat Vector / Weakness | Standard ID | Technical Description | Platform Defense Mechanism |
| :--- | :--- | :--- | :--- |
| **Exfiltration Over Web Service** | **MITRE ATT&CK T1567** | Exfiltration of sensitive organization assets to public third-party web services / LLMs. | Real-time `AIServiceEvent` ingestion, domain registry matching, and policy violation enforcement. |
| **Exposure of Sensitive Info** | **CWE-200** | Exposure of secrets, keys, or PII to unauthorized third parties. | Deterministic pattern matching, Shannon Entropy analysis, and irreversible masking. |
| **Sensitive Info Disclosure** | **OWASP LLM06** | Disclosure of proprietary training data, keys, or secrets via prompts. | Pre-flight redaction, privacy-by-design previews, and automated SOC incident generation. |
| **Cleartext Transmission** | **CWE-319** | Sending credentials in cleartext over unvetted web applications. | Detection of raw API keys, passwords, and connection strings; instant rotation runbooks. |

---

## 3. High-Level System Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │          Monitored Client Endpoint           │
                    │   (Browser Extension / Agent / Simulator)    │
                    └──────────────────────┬───────────────────────┘
                                           │  JSON Event Payload (AIServiceEvent)
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │            Backend Ingestion Gateway         │
                    │           (Node.js / Express / REST)         │
                    │                                              │
                    │  • Payload Length Safeguard (ReDoS Defense)  │
                    │  • Non-Repudiation Audit Logger              │
                    │  • JWT Auth & Role-Based Access Control      │
                    └──────────────────────┬───────────────────────┘
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │           Detection Microservice             │
                    │     (Python 3.14: Regex, Entropy, AST)       │
                    │                                              │
                    │  1. Normalization & Decoding                 │
                    │  2. Deterministic Regex Scanning             │
                    │  3. Shannon Entropy Analysis (H >= 4.2)      │
                    │  4. Source Code & Confidentiality Heuristics │
                    │  5. Privacy Masking & Redaction Engine       │
                    └──────────────────────┬───────────────────────┘
                                           │  Detections + Redacted Text
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │        Policy & Deterministic Risk Engine    │
                    │               (Node.js Core)                 │
                    │                                              │
                    │  • Active Policy Evaluator (POL-01..POL-05)  │
                    │  • Explainable Risk Scorer (0 - 100)         │
                    │  • Multipliers (Service, Volume, Repeat)     │
                    └──────────┬────────────────────────┬──────────┘
                               │                        │
       Persist Everything      │                        │ Score >= 60 (High/Critical)
                               ▼                        ▼
                    ┌─────────────────────┐  ┌─────────────────────┐
                    │ PostgreSQL Database │  │ AI Security Analyst │
                    │ (Relational Schema) │  │ (Local Ollama / LLM)│
                    └──────────┬──────────┘  └──────────┬──────────┘
                               │                        │ Triage Advisory &
                               │                        │ Mitigation Runbook
                               ▼                        ▼
                    ┌──────────────────────────────────────────────┐
                    │             Security Operations UI           │
                    │            (React + TypeScript + Vite)       │
                    │                                              │
                    │  • SOC Executive Dashboard & Charts          │
                    │  • Real-time Incident Investigation Feed     │
                    │  • Interactive Attack Sandbox & Simulator    │
                    │  • Policy & Weight Configuration Admin       │
                    └──────────────────────────────────────────────┘
```

---

## 4. Architectural Principles & Defensive Controls

### A. Deterministic Authority vs. Probabilistic AI
Security detections and risk scores are **never** delegated to an LLM. Language models hallucinate and provide non-deterministic outputs. The platform uses deterministic regular grammars, Shannon entropy math, and an explainable scoring matrix to establish ground truth.

### B. Privacy by Design (Irreversible Masking)
The monitoring platform itself must not become a high-value attack target. When secrets or credentials are identified, the system:
1. Calculates a SHA-256 fingerprint for duplicate tracking.
2. Irreversibly masks the evidence (e.g., `AKIA************PLE`).
3. Stores only the masked evidence and sanitized prompt in the database.
4. Sends only sanitized context to the AI analyst.

### C. Defense-in-Depth Payload Safeguards
The Ingestion Gateway enforces strict payload limits (64 KB ceiling) before passing text to regex evaluators, preventing Regular Expression Denial of Service (ReDoS) attacks.
