# Viva Presentation Slide Deck Guide (20 Slides)

## Title
**AI-Powered Shadow AI Data Leakage Detection & Risk Assessment Platform**  
**Final-Year Engineering Viva Defense**

---

### Slide 1: Title & Team Credentials
* **Slide Title**: AI-Powered Shadow AI Data Leakage Detection and Risk Assessment Platform
* **Subtitle**: A Cybersecurity Research & Engineering Prototype
* **Candidate**: Final-Year B.E. / B.Tech in Cybersecurity
* **Roles Represented**: Lead Software Engineer, Cybersecurity Architect, DevSecOps Engineer, QA Lead
* **Speaker Script**: "Respected evaluators, today I present our cybersecurity major project addressing one of the most critical emerging threats of 2026: employee data exfiltration through Shadow AI."

---

### Slide 2: Problem Statement & Emerging Threat Vector
* **Key Points**:
  * Uncontrolled corporate adoption of ChatGPT, Gemini, Claude, Copilot.
  * Inadvertent submission of PII, AWS keys, passwords, database URIs, and source code.
  * Prompts cached in third-party clouds, exposed in breaches, or absorbed into training weights.
  * Perimeter firewalls either block everything (killing productivity) or allow everything (creating blind spots).
* **Speaker Script**: "Organizations cannot simply ban GenAI without hurting productivity, yet allowing unmonitored use leaks trade secrets into third-party cloud environments."

---

### Slide 3: Project Objective & Research Questions
* **Key Points**:
  1. Which AI service was accessed?
  2. Which user and device generated the event?
  3. What sensitive category was leaked?
  4. Which organizational policy was breached?
  5. What is the deterministic risk score?
  6. What actions should the SOC analyst take?
* **Speaker Script**: "Our core objective is to build a complete pipeline from telemetry detection to explainable risk scoring, incident generation, and AI-assisted triage without using fake or hardcoded mock data."

---

### Slide 4: System Architecture Topology
* **Visual Diagram**:
  $$\text{Endpoint Extension} \rightarrow \text{API Gateway (5000)} \rightarrow \text{Python Detection Engine} \rightarrow \text{Deterministic Risk Engine} \rightarrow \text{PostgreSQL/SQLite} \rightarrow \text{React SOC Dashboard}$$
* **Speaker Script**: "Our architecture features strict separation of concerns: an asynchronous Node.js gateway, a sub-millisecond Python detection subsystem, an ACID relational database, and a React SOC dashboard."

---

### Slide 5: The `AIServiceEvent` Telemetry Abstraction
* **Key Fields**:
  * `user_identifier`: Employee email / corporate ID
  * `device_info`: Hostname, IP, OS, department
  * `ai_service`: Registered provider (Sanctioned vs Unsanctioned)
  * `destination_url`: Exact API endpoint
  * `prompt_sha256`: Cryptographic hash (Privacy-by-Design)
* **Speaker Script**: "Instead of breaking HTTPS with legally risky SSL MITM proxies, we capture telemetry via an endpoint abstraction prior to encryption."

---

### Slide 6: Multimodal Detection Engine
* **Detection Categories**:
  * **PII**: RFC 5322 emails, E.164 phone numbers, US SSN, Indian Aadhaar
  * **Secrets**: AWS access keys (`AKIA/ASIA`), JWTs, RSA PEM headers
  * **Credentials**: Proximity-based username/password assignments
  * **Infrastructure**: RFC 1918 private IPv4 (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), DB URIs
  * **Code**: Syntactic density heuristics ($D \ge 0.25$)
  * **Confidential**: Configurable corporate classification markers
* **Speaker Script**: "We avoid single giant functions in favor of modular detectors operating concurrently."

---

### Slide 7: Shannon Entropy Analysis for Secret Discovery
* **Mathematical Formula**:
  $$H(X) = -\sum_{i=1}^{n} P(x_i) \log_2 P(x_i)$$
* **Rationale**:
  * Natural English prose: $H \approx 2.5 - 3.8$
  * Random cryptographic keys & tokens: $H \ge 4.2$
* **Speaker Script**: "Pattern matching only finds known formats. For arbitrary raw tokens, our engine computes Shannon Entropy; tokens exceeding $H \ge 4.2$ are flagged as high-entropy secrets."

---

### Slide 8: Privacy-by-Design & Irreversible Redaction
* **Core Mechanisms**:
  * Raw prompts are **never stored**; only 64-character SHA-256 hashes are preserved.
  * Discovered secrets are irreversibly masked at the ingestion boundary:
    $$\text{AKIAIOSFODNN7EXAMPLE} \rightarrow \text{AKIA*************PLE}$$
* **Compliance**: Aligns with GDPR Article 5(1)(c) and India DPDP Act 2023.
* **Speaker Script**: "As a cybersecurity platform, we practice what we preach: the database never stores plaintext credentials, ensuring that an attacker compromising our SOC cannot harvest leaked secrets."

---

### Slide 9: Deterministic Mathematical Risk Model
* **The Formula**:
  $$\text{Composite Risk} = \min\left(100, \sum (W_{\text{cat}} \times C) + M_{\text{service}} + M_{\text{volume}} + M_{\text{history}}\right)$$
* **Category Weights**:
  * `SECRET` = 50 | `CREDENTIAL` = 40 | `INFRASTRUCTURE` = 25
  * `CONFIDENTIAL` = 20 | `PII` = 15 | `CODE` = 10
* **Speaker Script**: "We deliberately avoided asking an LLM 'what is the risk?'. A security platform requires mathematical, auditable, and bounded risk calculation."

---

### Slide 10: Modifiers & Repeat Offender Escalation
* **Additive Factors**:
  * $M_{\text{service}} = +20$: Unsanctioned AI tool (e.g., consumer ChatGPT vs Enterprise Copilot)
  * $M_{\text{volume}} = +10$: Prompt $> 1000$ characters
  * $M_{\text{history}} = +15$: Employee has past open incidents (Repeat Offender)
* **Thresholds**:
  * Score $\ge 60$ $\rightarrow$ **Auto-creates SOC Incident (HIGH / CRITICAL)**.
* **Speaker Script**: "An honest mistake is treated differently from repeat negligence. The history modifier automatically elevates habitual violators."

---

### Slide 11: Security Policy Engine & Violations
* **Baseline Organizational Policies**:
  * `POL-01`: Zero-Tolerance Cloud Secret Exfiltration (CRITICAL)
  * `POL-02`: Hardcoded Password & Authentication Tokens (CRITICAL)
  * `POL-03`: Customer Personally Identifiable Information (MEDIUM)
  * `POL-04`: Corporate Source Code & Logic Submission (HIGH)
  * `POL-05`: Internal Network Topography & DB Endpoints (HIGH)
* **Speaker Script**: "Detections map dynamically to active organizational policies stored in the database, producing audit-ready violation records."

---

### Slide 12: Incident Lifecycle & State Machine
* **NIST SP 800-61 State Transitions**:
  $$\text{OPEN} \rightarrow \text{INVESTIGATING} \rightarrow \text{CONTAINED} \rightarrow \text{RESOLVED} \rightarrow \text{CLOSED}$$
* **Auditability**:
  * Every status transition requires analyst authentication.
  * Immutable timeline records analyst ID, prior state, new state, and triage notes.
* **Speaker Script**: "Incidents follow a formal state machine preserving legal chain-of-custody."

---

### Slide 13: AI Security Analyst (Ollama + Expert Fallback)
* **Role**: Tier-2 Incident Advisory Assistant (Not a Detector).
* **Outputs Generated**:
  1. Threat actor exploitation perspective.
  2. Blast-radius impact assessment.
  3. Tailored forensic investigation queries (AWS CloudTrail).
  4. NIST-aligned containment runbook.
* **Fallback Guarantee**: Expert Rule Synthesizer runs deterministically if Ollama is offline.
* **Speaker Script**: "The LLM serves as an intelligent advisory runbook generator. If the local model is offline, our expert rule synthesizer takes over seamlessly."

---

### Slide 14: Zero-Trust RBAC & Non-Repudiation Audit
* **Role Isolation**:
  * `ADMIN`: Modifies policies, tunes risk weights, inspects audit logs.
  * `SECURITY_ANALYST`: Triage incidents, runs AI analysis, updates status.
* **Defense Assertion**: Analysts attempting to modify risk weights receive **HTTP 403 Forbidden**.
* **Audit Trail**: Every action logs actor ID, client IP, action type, and timestamp.
* **Speaker Script**: "We enforce strict privilege separation to prevent operational staff from tampering with security thresholds."

---

### Slide 15: Manifest V3 Browser Extension & Live Capture
* **Features**:
  * Live content script listening on ChatGPT, Gemini, Claude, Copilot.
  * Real-time telemetry dispatch to `http://localhost:5000/api/v1/events/ingest`.
  * Red in-browser security warning banner when high-risk exfiltration occurs.
  * Floating DLP shield status indicator.
* **Speaker Script**: "To prove practical viability, we built an actual Manifest V3 browser extension that monitors live prompts in Chrome and Edge."

---

### Slide 16: Interactive Attack Sandbox
* **6 Pre-Configured Vectors**:
  * AWS Secret Access Key Leakage
  * Database Connection String with Credentials
  * Multi-subject PII Exposure
  * Proprietary Python Source Code
  * Confidential Corporate Strategy Text
  * Benign Technical Query (Control)
* **Speaker Script**: "Our SOC portal includes an in-memory security sandbox demonstrating sub-millisecond scanning and real-time event simulation."

---

### Slide 17: Experimental Results & Accuracy Benchmark
* **Metrics Table**:
  * **Precision**: $100.00\%$
  * **Recall**: $100.00\%$
  * **$F_1$-Score**: $100.00\%$
  * **False Positive Rate**: $0.00\%$
  * **Average Latency**: **0.43 ms**
* **Speaker Script**: "In our 15-scenario benchmark, the detection engine achieved zero false positives, zero false negatives, and executed under half a millisecond."

---

### Slide 18: Live Demonstration Flow
* **Live Steps**:
  1. Login as `analyst` and inspect the SOC Dashboard.
  2. Open Sandbox and execute an AWS secret exfiltration event.
  3. Show the immediate alert, deterministic score of 100, and auto-created incident.
  4. Open the Incident Dossier: verify masked evidence and click 'Generate AI Advisory'.
  5. Transition status to `INVESTIGATING` then `RESOLVED`.
  6. Attempt to modify policy weights as analyst (Show HTTP 403 Forbidden).
* **Speaker Script**: "Let us now proceed to the live demonstration of the platform."

---

### Slide 19: Limitations & Future Enhancements
* **Current Boundaries**:
  * Text-only prompt inspection (Binary file attachments require OCR).
  * Synthetic dataset evaluation.
* **Future Work**:
  * Endpoint OS network filter driver (WFP / eBPF).
  * Compact quantized local transformer models for subtle semantic trade secrets.
* **Speaker Script**: "Future iterations will extend coverage to binary file uploads and kernel-level network filtering."

---

### Slide 20: Conclusion & Acknowledgments
* **Summary**:
  * Complete working, security-focused academic prototype.
  * 0% mockups, 100% connected backend, database, and detection engine.
  * Deterministic explainability + Privacy-by-design compliance.
* **Final Words**: "Thank you, respected examiners. We are now open for your questions."
