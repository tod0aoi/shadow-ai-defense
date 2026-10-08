# Final-Year Engineering Viva Defense Guide

## Project Title
**AI-Powered Shadow AI Data Leakage Detection and Risk Assessment Platform**

**Degree**: B.E. / B.Tech in Cybersecurity / Computer Science and Engineering  
**Role Scope**: Lead Software Engineer, Cybersecurity Architect, DevSecOps Engineer, and QA Lead.

---

## 1. Executive Summary & Problem Formulation

### What is the core problem this project solves?
Modern enterprises are witnessing massive unmonitored employee adoption of consumer Generative AI tools (ChatGPT, Google Gemini, Claude, Microsoft Copilot) — a phenomenon known as **Shadow AI**. 

Unlike conventional web browsing, Generative AI interaction entails users actively transmitting unstructured business logic, source code, database connection strings, credentials, and customer PII into third-party cloud environments. This data can be logged, cached, exposed in breach incidents, or ingested into public model training datasets.

### What is the goal of this project?
The goal is **not** to build a commercial endpoint DLP replacement, but to design and validate an **academic engineering prototype** of an end-to-end Shadow AI security pipeline:
$$\text{AI Telemetry} \rightarrow \text{Sensitive Data Detection} \rightarrow \text{Policy Violation} \rightarrow \text{Deterministic Risk Assessment} \rightarrow \text{Incident Management} \rightarrow \text{AI Security Advisory}$$

---

## 2. Architecture & Design Rationale

### Why did you use this hybrid technology stack?
1. **Node.js (API Gateway & Core Orchestrator)**:
   * Asynchronous, non-blocking I/O ideal for handling concurrent telemetry ingestion from distributed enterprise endpoints.
   * Native JSON handling, robust ecosystem for cryptographic hashing, JWT security, and relational database abstraction.
2. **Python (Detection & Analysis Engine)**:
   * First-class support for mathematical entropy computation, advanced regular expressions (`re`), statistical heuristics, and AI integration.
3. **Relational Database (PostgreSQL / SQLite Dual Engine)**:
   * Essential for **strict referential integrity** across 11 relational entities (`users`, `devices`, `ai_services`, `events`, `detections`, `policies`, `policy_violations`, `risk_assessments`, `incidents`, `timeline`, `audit_logs`).
   * Financial and cybersecurity audits require atomic transactions (ACID) and non-repudiation audit trails that NoSQL document stores cannot guarantee.
4. **React + TypeScript (SOC Dashboard)**:
   * Component-based architecture providing reactive state management for live SOC alerts, dynamic charts, incident triage drawers, and interactive sandbox simulations.

---

## 3. Deep Dive: Detection Mechanics & Defense

### Why didn't you use an LLM for the initial detection phase?
* **Latency**: Calling an LLM takes $800\text{ ms} - 3000\text{ ms}$. Our multimodal Python engine runs in **$0.43\text{ ms}$** — over $2000\times$ faster.
* **Cost & Scalability**: Evaluating millions of enterprise prompt keystrokes via LLM APIs is economically non-viable.
* **Determinism**: Regex, Shannon entropy, and heuristic parsers provide $100\%$ explainability and auditability. An LLM may exhibit stochastic hallucinations and non-reproducible detections.
* **Confidentiality / Privacy**: Sending sensitive data to a cloud LLM to detect whether it contains sensitive data violates the very premise of data loss prevention!

### How does your Shannon Entropy detector work?
The Shannon Entropy $H(X)$ measures the average information density and randomness of a string:
$$H(X) = -\sum_{i=1}^{n} P(x_i) \log_2 P(x_i)$$
Natural English prose typically exhibits an entropy score between $2.5$ and $3.8$. Cryptographic tokens, high-entropy API secrets, and base64 strings exhibit $H(X) \ge 4.2$. Our engine identifies high-randomness character sequences even when they do not match a known prefix (e.g., custom API keys).

---

## 4. Deep Dive: Mathematical Risk Model

### How is the risk score calculated?
Risk is calculated deterministically via an additive, bounded mathematical formula:

$$\text{Composite Risk Score} = \min\left(100, \sum (W_{\text{cat}} \times C) + M_{\text{service}} + M_{\text{volume}} + M_{\text{history}}\right)$$

Where:
* $W_{\text{cat}}$: Configurable base sensitivity weight for each detected category (`SECRET` = 50, `CREDENTIAL` = 40, `INFRASTRUCTURE` = 25, `CONFIDENTIAL` = 20, `PII` = 15, `CODE` = 10).
* $C$: Quantity of distinct detections within that category.
* $M_{\text{service}}$: Unsanctioned external service penalty ($+20$).
* $M_{\text{volume}}$: High-volume prompt modifier ($+10$ if length $> 1000$ characters).
* $M_{\text{history}}$: Repeat offender penalty ($+15$ if the user has past open incidents).

### Severity Classification Thresholds:
* **$0$**: `LOW` (Benign event, logged for analytics).
* **$1 - 39$**: `LOW` (Minor technical context).
* **$40 - 59$**: `MEDIUM` (PII or internal hostnames).
* **$60 - 79$**: `HIGH` (Exfiltration of credentials or sensitive code $\rightarrow$ **Auto-creates SOC Incident**).
* **$80 - 100$**: `CRITICAL` (Cloud access keys, private keys, database connection strings $\rightarrow$ **Immediate High-Priority Incident**).

---

## 5. Privacy-by-Design Implementation

### How does your platform ensure privacy compliance?
1. **Irreversible Masking at Ingestion**: Secrets are sanitized immediately upon detection (e.g., `AKIAIOSFODNN7EXAMPLE` becomes `AKIA*************PLE`). Plaintext secrets are never committed to disk or database tables.
2. **Cryptographic SHA-256 Hashing**: Prompts are stored only as 64-character SHA-256 hashes (`38b8c9fad324...`). This enables SOC analysts to mathematically prove whether a specific prompt was submitted without storing the prompt's plaintext.
3. **Data Protection Alignment**: Complies with GDPR Art. 5(1)(c) (Data Minimization) and India DPDP Act 2023 principles.

---

## 6. Role-Based Defense Perspectives

### 1. Lead Software Engineer Perspective
* "I architected the platform with strict separation of concerns across a Node.js API Gateway, a low-latency Python detection subsystem, and a decoupled React frontend. Microservice and subprocess bridges guarantee that detection latency remains sub-millisecond without blocking Node's event loop."

### 2. Cybersecurity Architect Perspective
* "I designed the defense model to reflect defense-in-depth: endpoint event telemetry is ingested without relying on intrusive SSL MITM termination. Security policies correlate multi-category violations, and the deterministic risk engine drives automated incident escalation into a formal NIST-aligned SOC lifecycle."

### 3. DevSecOps Engineer Perspective
* "I implemented zero-trust RBAC with strict separation between `ADMIN` and `SECURITY_ANALYST` roles. All state modifications, policy updates, and triage notes generate non-repudiation audit log entries. The build produces standalone production artifacts with automated schema migrations."

### 4. QA & Reliability Engineer Perspective
* "I constructed a comprehensive 15-scenario synthetic attack benchmark suite (`tests/test_detection_engine.py`) validating $100\%$ precision and recall. I also developed an end-to-end system test suite (`tests/run_e2e_full_verification.js`) testing all 15 operational steps with $100\%$ pass rate."

---

## 7. 25 Expected Viva Questions & Model Answers

### Architecture & System Design

#### Q1: Why didn't you intercept HTTPS traffic at the network gateway using SSL Man-in-the-Middle (MITM)?
**Answer**: "In enterprise zero-trust architectures, modern browser clients enforce HTTP Strict Transport Security (HSTS) and SSL Certificate Pinning. Intercepting encrypted traffic at the gateway requires deploying custom root CAs across all devices, breaks end-to-end encryption guarantees, and creates legal liability under privacy regulations. Our architecture utilizes an endpoint-level `AIServiceEvent` abstraction, which monitors data at the point of origin (browser extension or endpoint agent) prior to TLS encryption, ensuring clean visibility without breaking cryptographic chains."

#### Q2: What is the benefit of hosting the React build from the Express backend?
**Answer**: "It eliminates Cross-Origin Resource Sharing (CORS) preflight round-trips in production, ensures the frontend and backend share identical domain security headers (`helmet`, Content Security Policy), and packages the entire platform into a single deployable server on port `5000`."

#### Q3: Why did you implement dual database support (PostgreSQL and SQLite)?
**Answer**: "PostgreSQL provides enterprise-grade ACID transactions, connection pooling, and multi-tenant scaling for server deployments. High-performance native SQLite provides zero-configuration portability for academic demonstrations and local testing, allowing the entire platform to boot without requiring a local database server daemon."

#### Q4: How does your backend handle concurrent ingestion requests without race conditions?
**Answer**: "Event processing operates on stateless request flows where each ingestion computes its own UUID, processes detections, and commits independent rows to `events`, `detections`, and `risk_assessments`. Incident creation uses database transactions and unique foreign key constraints to prevent duplicate incident creation for the same event."

#### Q5: What happens if the Python detection engine crashes or is unreachable?
**Answer**: "The Node.js detection service implements graceful degradation: it first attempts an HTTP microservice call; if that fails or times out, it seamlessly spawns a Python child process to execute the detection scan locally. If both fail, the event is flagged with a system warning and queued for re-analysis."

---

### Detection Engine

#### Q6: How do you detect proprietary source code in natural language prompts?
**Answer**: "We employ syntactic density heuristics. We scan for programming language token structures: keyword density (`def `, `function`, `class `, `import `, `return `), structural symbols (`{`, `}`, `=>`, `::`), and indentation structure. If the density of syntactic tokens exceeds our tuned threshold ($0.25$), the payload is classified as source code."

#### Q7: What regular expression did you design for AWS Access Keys, and how do you prevent false positives?
**Answer**: "AWS Access Key IDs follow a strict format: 20 characters starting with `AKIA` or `ASIA` followed by 16 uppercase alphanumeric characters: `\b(AKIA|ASIA)[0-9A-Z]{16}\b`. Because this pattern requires exact prefix matching and fixed length, false positive rates on this detector are statistically $0.00\%$."

#### Q8: How do you detect private IP addresses versus public internet addresses?
**Answer**: "We validate IPv4 addresses against RFC 1918 private CIDR blocks: `10.0.0.0/8`, `172.16.0.0/12`, and `192.168.0.0/16`. Public IP addresses (like `8.8.8.8`) are not flagged as internal infrastructure leakage, preventing benign web addresses from generating alerts."

#### Q9: What is the limitation of regex-based detection, and how does your engine compensate?
**Answer**: "Regex is pattern-bound: it excels at known structures (emails, credit cards, AWS keys, JWTs) but cannot detect arbitrary random tokens. We compensate by pairing regex with Shannon Entropy analysis ($H \ge 4.2$) for unstructured secrets, keyword proximity heuristics for password assignments, and syntactic heuristics for source code."

#### Q10: How fast is your detection engine?
**Answer**: "Across our 15 benchmark scenarios, the average execution latency is **0.43 milliseconds** per scan. This makes it fast enough to run synchronously within an enterprise web gateway or browser extension without noticeable user latency."

---

### Risk Assessment & Policies

#### Q11: Why is the risk calculation additive rather than multiplicative?
**Answer**: "Multiplicative risk formulas can artificially explode or collapse scores if an individual variable is zero or high. An additive weighted model:
$$\text{Score} = \min(100, \sum (W_{\text{cat}} \times C) + \text{Modifiers})$$
ensures predictable scaling, strict bounding between $0$ and $100$, and complete transparency where the security team can inspect the exact point contribution of every detected item."

#### Q12: Why shouldn't an LLM calculate the risk score directly?
**Answer**: "LLMs are probabilistic token predictors; their outputs fluctuate with prompt phrasing and temperature. A security system requiring regulatory compliance (e.g., ISO 27001, SOC 2) cannot rely on a non-deterministic score that might rate an AWS key leakage 95 today and 65 tomorrow. The calculation must be mathematical, reproducible, and explainable."

#### Q13: What is the Repeat Offender modifier, and why is it important?
**Answer**: "If an employee submits sensitive data once, it may be an honest mistake. If the same user generates multiple incidents within a sliding window, the threat profile escalates to intentional data exfiltration or negligence. Our engine checks past open incidents for the user and applies an additive modifier of $+15$ points, immediately elevating repeat infractions to higher severity."

#### Q14: Can security analysts change policy weights?
**Answer**: "No. Under our Role-Based Access Control (RBAC) model, only users with the `ADMIN` role can alter policy thresholds and risk weights. If a `SECURITY_ANALYST` attempts to call `PUT /api/v1/risk/weights`, the request is rejected with HTTP 403 Forbidden. This prevents operational analysts from lowering thresholds to clear backlog."

#### Q15: How does policy evaluation link detections to incidents?
**Answer**: "The Policy Engine queries active policies stored in the database (e.g., `POL-01: Zero-Tolerance Secrets`, `POL-03: PII Exposure`). When incoming detections match policy trigger criteria, a `policy_violations` record is created linking the event, policy ID, and violation severity. If composite risk $\ge 60$, an incident is created automatically."

---

### Incident Response & AI Analyst

#### Q16: What is the role of the AI Security Analyst if detection is already done?
**Answer**: "The AI Security Analyst is **not** a detector — it is a **Tier-2 SOC Advisor**. Once an incident is escalated, the AI Analyst ingests the sanitized incident dossier (masked evidence, triggered policies, service identity) and synthesizes:
1. Threat actor exploitation perspective.
2. Potential blast-radius impact analysis.
3. Specific forensic investigation queries (e.g., CloudTrail queries).
4. NIST-aligned containment and remediation runbooks."

#### Q17: What happens if the local LLM (Ollama) is not running during the presentation?
**Answer**: "We built an automated **Expert Rule Synthesizer fallback**. The system intercepts connection timeouts and uses a deterministic expert knowledge engine to generate identical NIST-aligned remediation runbooks and threat summaries. The platform never crashes or displays blank errors."

#### Q18: What is the incident lifecycle state machine?
**Answer**: "Incidents progress through five formal states:
$$\text{OPEN} \rightarrow \text{INVESTIGATING} \rightarrow \text{CONTAINED} \rightarrow \text{RESOLVED} \rightarrow \text{CLOSED}$$
Every state change requires analyst credentials and optional triage notes, and automatically appends an immutable entry to `incident_timeline` for chain-of-custody auditability."

---

### DevSecOps, Database & Audit

#### Q19: How do you prevent SQL injection throughout the platform?
**Answer**: "All database queries use parameterized SQL statements (`$1, $2, ...` in PostgreSQL and `?` in SQLite). Raw user input is never concatenated into SQL strings."

#### Q20: How are passwords stored and authenticated?
**Answer**: "User passwords are encrypted using `bcrypt` with a salt work factor of 10 (`bcryptjs`). Plaintext passwords are never logged or stored in configuration files."

#### Q21: What is non-repudiation in your audit logging system?
**Answer**: "Whenever an administrative action occurs (policy update, status change, weight adjustment), the `audit_logs` table records the actor user ID, client IP address, action type, target entity, and timestamp. This creates an immutable non-repudiation log ensuring staff actions can be independently audited."

---

### Future Scope & Academic Maturity

#### Q22: What are the primary limitations of this prototype?
**Answer**: "1. The prototype currently monitors text prompts; inspecting binary file uploads (PDFs, images) requires OCR and file carving pipelines.
2. The endpoint event collector is simulated via direct API ingestion rather than a deployed kernel driver or browser extension.
3. Natural language semantic context (detecting nuanced trade secrets disguised as colloquial prose) would benefit from local distilled transformer classifiers."

#### Q23: How would this scale to an enterprise with 50,000 employees?
**Answer**: "1. Deploy the API Gateway behind a load balancer (HAProxy or NGINX).
2. Decouple ingestion and analysis using an Apache Kafka or RabbitMQ event queue.
3. Scale Python detection workers horizontally as stateless Kubernetes pods.
4. Shard PostgreSQL database storage by tenant or department."

#### Q24: What relevant cybersecurity compliance frameworks does this align with?
**Answer**: "It directly maps to:
* **NIST SP 800-61 Rev. 2**: Computer Security Incident Handling Guide.
* **ISO/IEC 27001:2022 Control A.8.12**: Data Leakage Prevention.
* **OWASP Top 10 for LLM Applications (2025)**: Specifically LLM06 (Sensitive Information Disclosure)."

#### Q25: Why is this project significant for your engineering degree?
**Answer**: "Rather than presenting a mock frontend or a trivial script, this project integrates multiple core computer science disciplines: **cybersecurity architecture**, **discrete mathematics (entropy)**, **relational database systems**, **compiler/lexer concepts (heuristics & regex)**, **DevSecOps principles**, and **modern web engineering**. It addresses a critical real-world 2026 vulnerability with a working, demonstrable solution."
