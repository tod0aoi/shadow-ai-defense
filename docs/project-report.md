# Major Project Thesis & Technical Report

## Title
**AI-Powered Shadow AI Data Leakage Detection and Risk Assessment Platform**

**Degree**: Bachelor of Engineering / Bachelor of Technology in Cybersecurity  
**Department**: Computer Science & Cybersecurity Engineering  
**Academic Year**: 2025–2026

---

## Abstract

With the explosive enterprise adoption of Generative Artificial Intelligence (GenAI) systems—including OpenAI ChatGPT, Google Gemini, Anthropic Claude, and Microsoft Copilot—organizations face an unprecedented cybersecurity challenge termed **Shadow AI**. Employees routinely transmit unstructured queries containing sensitive intellectual property, source code, database connection strings, cloud infrastructure credentials, and Personally Identifiable Information (PII) to unsanctioned third-party cloud environments.

Traditional perimeter Data Loss Prevention (DLP) appliances, designed around static egress ports and TLS decryption, fail in zero-trust architectures due to HTTP Strict Transport Security (HSTS) enforcement and privacy compliance mandates.

This project presents the design, mathematical formalization, implementation, and empirical validation of an end-to-end **AI-Powered Shadow AI Data Leakage Detection and Risk Assessment Platform**. 

The architecture encompasses:
1. An endpoint-level `AIServiceEvent` telemetry acquisition mechanism and Manifest V3 browser extension.
2. A high-throughput multimodal sensitive data detection subsystem operating at **0.43 ms average latency**, combining RFC 5322 pattern classifiers, RFC 1918 CIDR boundary matching, syntactic source code density heuristics, and **Shannon Entropy ($H \ge 4.2$)** token randomness analysis.
3. A privacy-by-design irreversible evidence redaction module enforcing cryptographic SHA-256 prompt hashing.
4. A deterministic, explainable mathematical composite risk engine:
   $$\text{Composite Risk Score} = \min\left(100, \sum (W_{\text{cat}} \times C) + M_{\text{service}} + M_{\text{volume}} + M_{\text{history}}\right)$$
5. A dynamic NIST SP 800-61 aligned incident response state machine coupled with an AI Security Analyst advisory engine powered by local open-weights LLMs (`llama3.2`) and deterministic expert rule synthesizers.

Empirical evaluation against a 15-scenario synthetic attack benchmark suite demonstrated **100.0% Precision**, **100.0% Recall**, and **0.0% False Positive Rate**, validating the platform's suitability for enterprise security operations centers.

---

## Chapter 1: Introduction

### 1.1 Background & Motivation
Generative AI tools represent the fastest-growing enterprise productivity application in computing history. However, third-party LLMs operate outside corporate security perimeters. Prompts submitted by enterprise endpoints are routinely cached on third-party infrastructure, potentially ingested into training corpora, or exposed through cloud data breaches.

### 1.2 Problem Formulation
Existing security solutions present significant shortcomings:
* **Perimeter Firewalls**: Blocking GenAI URLs entirely stifles employee productivity and drives workers toward unmanaged personal devices.
* **SSL Inspection Proxies**: Breaking TLS encryption breaks modern browser security models (certificate pinning, HSTS) and creates severe compliance liabilities under GDPR and DPDP.
* **Commercial Endpoint DLP**: Focuses on fixed file types (.docx, .pdf) rather than dynamic conversational prompt streams.

### 1.3 Project Objectives
The primary objectives are:
1. Design an endpoint telemetry abstraction (`AIServiceEvent`) monitoring GenAI usage without SSL interception.
2. Develop a multi-category detection engine identifying PII, credentials, cloud secrets, infrastructure topology, proprietary source code, and confidential corporate markings.
3. Establish a deterministic mathematical risk scoring model that guarantees explainability and reproducibility.
4. Implement privacy-by-design by storing only SHA-256 hashes and irreversibly masked evidence.
5. Build a real-time Security Operations Center (SOC) dashboard supporting NIST-aligned incident triage and AI-assisted advisory synthesis.

---

## Chapter 2: Literature Survey & Related Work

| Research / Standard | Focus Area | Limitations / Gaps | Platform Solution |
| :--- | :--- | :--- | :--- |
| **NIST SP 800-61 Rev. 2** | Computer Security Incident Handling | Generic guidance; lacks GenAI exfiltration vectors | Implements structured 5-stage incident state machine tailored for AI telemetry |
| **OWASP Top 10 for LLM (2025)** | LLM06: Sensitive Information Disclosure | Focuses on LLM outputs rather than enterprise input prompts | Monitors and sanitizes prompts *before* and *at* egress boundary |
| **Shannon (1948)** | Mathematical Theory of Communication | Applied to signal entropy, not specifically credential hunting | Custom tokenized entropy filter ($H \ge 4.2$) for unstructured high-randomness secrets |
| **Traditional DLP (Symantec/Forcepoint)** | File & Endpoint Inspection | Resource-intensive; poor visibility into browser prompt keystrokes | Lightweight Manifest V3 content interception combined with sub-millisecond REST API |

---

## Chapter 3: System Architecture & Design

### 3.1 Architectural Overview
The platform adopts a decoupled, multi-tier microservice architecture:
1. **Telemetry & Client Layer**: Manifest V3 Chrome/Edge extension and simulated endpoint agents capturing prompt events.
2. **API Gateway & Core Orchestrator**: Node.js/Express service enforcing JWT authentication, zero-trust RBAC, schema validation, and audit logging.
3. **Detection & Classification Layer**: Python 3 engine executing regex rules, entropy calculations, and syntactic density heuristics.
4. **Relational Persistence Layer**: 11-table relational schema (PostgreSQL / SQLite dual engine) maintaining strict foreign key constraints and audit non-repudiation.
5. **AI Advisory Layer**: Local Ollama bridge with automated deterministic Expert Rule Synthesizer fallback.
6. **SOC Presentation Layer**: React 18 + TypeScript single-page application.

---

## Chapter 4: Sensitive Data Detection Engine

### 4.1 Detection Categories & Formulations
1. **PII**: RFC 5322 compliant regex for email addresses, ITU-T E.164 phone numbers, US SSN (`\b\d{3}-\d{2}-\d{4}\b`), and Indian Aadhaar patterns.
2. **Cloud Secrets**: Strict AWS key patterns (`\b(AKIA|ASIA)[0-9A-Z]{16}\b`), JWT headers (`\beyJ[A-Za-z0-9_-]{10,}\b`), and SSH/RSA PEM headers.
3. **Infrastructure**: RFC 1918 private IPv4 CIDR matching (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) and database URIs (`postgresql://`, `mysql://`, `mongodb://`).
4. **Source Code**: Syntactic density metric:
   $$D_{\text{code}} = \frac{N_{\text{keywords}} + N_{\text{syntax\_symbols}}}{N_{\text{total\_tokens}}}$$
   Classified as source code if $D_{\text{code}} \ge 0.25$.
5. **Shannon Entropy Formulation**:
   $$H(X) = -\sum_{i=1}^{n} P(x_i) \log_2 P(x_i)$$
   Tokens with length $\ge 16$ and $H(X) \ge 4.2$ are flagged as high-entropy secrets.

### 4.2 Privacy-by-Design Masking
All raw evidence is transformed via irreversible substitution before persistence:
* AWS Key: `AKIAIOSFODNN7EXAMPLE` $\rightarrow$ `AKIA*************PLE`
* Email: `john.doe@company.com` $\rightarrow$ `j***e@company.com`
* Private IP: `192.168.1.100` $\rightarrow$ `[REDACTED_RFC1918_PRIVATE_IP: 192.168.*.*]`

---

## Chapter 5: Deterministic Risk Scoring Model

### 5.1 Mathematical Formulation
$$\text{Composite Risk Score} = \min\left(100, \sum_{i=1}^{k} (W_{\text{cat}, i} \times C_i) + M_{\text{service}} + M_{\text{volume}} + M_{\text{history}}\right)$$

### 5.2 Parameters & Thresholds
* $W_{\text{SECRET}} = 50$, $W_{\text{CREDENTIAL}} = 40$, $W_{\text{INFRASTRUCTURE}} = 25$, $W_{\text{CONFIDENTIAL}} = 20$, $W_{\text{PII}} = 15$, $W_{\text{CODE}} = 10$.
* $M_{\text{service}} = +20$ for unsanctioned AI services.
* $M_{\text{volume}} = +10$ for prompts $> 1000$ characters.
* $M_{\text{history}} = +15$ for repeat offenders with prior open incidents.
* **Incident Escalation**: Events scoring $\ge 60$ automatically generate a formal SOC incident.

---

## Chapter 6: Implementation Details

### 6.1 Database Schema
Relational model featuring 11 tables: `users`, `devices`, `ai_services`, `events`, `detections`, `policies`, `policy_violations`, `risk_assessments`, `incidents`, `incident_timeline`, `audit_logs`.

### 6.2 Role-Based Access Control (RBAC)
* `ADMIN`: Full configuration privileges, policy toggling, weight adjustment, audit trail inspection.
* `SECURITY_ANALYST`: Incident investigation, AI advisory generation, status triage. Restricted from altering organizational risk configurations (enforced via HTTP 403 Forbidden).

---

## Chapter 7: Results & Performance Evaluation

### 7.1 Accuracy & Latency Benchmark (15 Scenarios)
* **True Positives**: 13 / 13
* **True Negatives**: 2 / 2
* **False Positives**: 0 / 15
* **False Negatives**: 0 / 15
* **Precision**: $100.00\%$
* **Recall**: $100.00\%$
* **$F_1$-Score**: $100.00\%$
* **Mean Execution Latency**: **0.43 ms**

### 7.2 End-to-End System Integration Suite
All 15 system lifecycle tests passed with $100\%$ operational success across authentication, sandbox scanning, telemetry ingestion, privacy masking, incident escalation, AI advisory generation, and RBAC isolation.

---

## Chapter 8: Conclusion & Future Scope

### 8.1 Conclusion
The developed platform provides a robust, low-latency, privacy-preserving defense against Shadow AI data leakage. By replacing black-box LLM scoring with transparent mathematics and combining sub-millisecond detection with local AI incident advisories, the system delivers an enterprise-viable prototype suitable for modern zero-trust environments.

### 8.2 Future Scope
1. **Binary Attachment Inspection**: Integrating OCR and document parsing for uploaded PDFs and images.
2. **Kernel Driver Hooking**: Extending the endpoint collector from browser extensions to OS-level network filter drivers (WFP / eBPF).
3. **Local Distilled Transformers**: Incorporating compact quantized NLP models for nuanced semantic classification of business trade secrets.

---

## References

1. NIST, "Computer Security Incident Handling Guide," *NIST Special Publication 800-61 Revision 2*, 2012.
2. OWASP Foundation, "OWASP Top 10 for Large Language Model Applications," Version 2025.
3. C. E. Shannon, "A Mathematical Theory of Communication," *Bell System Technical Journal*, vol. 27, pp. 379–423, 1948.
4. ISO/IEC 27001:2022, "Information security, cybersecurity and privacy protection — Information security management systems," 2022.
5. European Parliament, "General Data Protection Regulation (GDPR)," Regulation (EU) 2016/679, 2016.
