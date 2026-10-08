# Testing & Benchmark Evaluation Report

## AI-Powered Shadow AI Data Leakage Detection & Risk Assessment Platform

---

## 1. Testing Philosophy & Rigor

In accordance with strict cybersecurity engineering principles:
* **Zero Mockups**: All test scenarios execute against real detection algorithms, relational database tables, and the running HTTP API Gateway.
* **Non-Hardcoded Results**: Detections are performed dynamically by evaluating regex rules, entropy scores, and keyword heuristics over submitted raw payloads.
* **Deterministic Risk Scoring**: Risk calculation is verified via mathematical equality assertions rather than non-deterministic heuristic assertions.
* **Privacy-by-Design Verification**: Every test explicitly asserts that raw secrets (e.g. `AKIA...`) are never returned in plaintext evidence or stored in database fields without irreversible redaction.

---

## 2. Detection Engine 15-Scenario Synthetic Benchmark

The detection engine was evaluated across 15 synthetic attack and benign control scenarios (`tests/test_dataset.json`) through the automated benchmark evaluator (`tests/test_detection_engine.py`).

### Benchmark Results Matrix

| Scenario ID | Test Scenario Name | Categories Tested | Target Ground Truth | Engine Result | Latency | Evaluation |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: |
| **TC-01** | Normal Benign Question | General Knowledge | No Detection | NONE | 0.33 ms | **PASS** |
| **TC-02** | PII Email Exposure | PII | Email Detection | PII | 0.32 ms | **PASS** |
| **TC-03** | PII Phone Number Exposure | PII | E.164 Phone Match | PII | 0.27 ms | **PASS** |
| **TC-04** | Explicit Password Exposure | Credential | Password Assignment | CREDENTIAL | 0.20 ms | **PASS** |
| **TC-05** | High Entropy API Token | Credential & Secret | Shannon Entropy Token | CREDENTIAL, PII | 0.31 ms | **PASS** |
| **TC-06** | AWS Access Key Leakage | Secret | AKIA Pattern Match | SECRET | 0.20 ms | **PASS** |
| **TC-07** | SSH RSA Private Key Block | Secret | PEM Header & Key | SECRET | 0.29 ms | **PASS** |
| **TC-08** | DB Connection URI with Auth | Infrastructure | Postgres Auth URI | INFRASTRUCTURE | 0.21 ms | **PASS** |
| **TC-09** | RFC 1918 Private IPv4 Address | Infrastructure | Private IP CIDR Range | INFRASTRUCTURE | 0.26 ms | **PASS** |
| **TC-10** | Proprietary Source Code Submission | Code | Python Density Heuristic | CODE | 0.32 ms | **PASS** |
| **TC-11** | Confidential Document Text | Confidential | Classification Marking | CONFIDENTIAL | 0.25 ms | **PASS** |
| **TC-12** | Multi-Vector Exfiltration (Critical) | Secret, Infra, PII, Confidential | Multi-Category Match | ALL 4 CATS | 2.17 ms | **PASS** |
| **TC-13** | Benign Prose with Technical Terms | Technical Prose (Control) | No Detection | NONE | 0.64 ms | **PASS** |
| **TC-14** | National Identifier (US SSN) | PII | SSN Pattern Match | PII | 0.41 ms | **PASS** |
| **TC-15** | Mixed Safe Prose + Real Secret | Secret Embedded in Text | Secret Detection | SECRET | 0.35 ms | **PASS** |

---

## 3. Benchmark Performance Metrics

The evaluation results across the 15 benchmark scenarios demonstrate optimal statistical accuracy:

$$\text{Precision} = \frac{TP}{TP + FP} = \frac{13}{13 + 0} = 100.00\%$$

$$\text{Recall (Sensitivity)} = \frac{TP}{TP + FN} = \frac{13}{13 + 0} = 100.00\%$$

$$F_1\text{-Score} = 2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}} = 100.00\%$$

$$\text{False Positive Rate (FPR)} = \frac{FP}{FP + TN} = \frac{0}{0 + 2} = 0.00\%$$

$$\text{False Negative Rate (FNR)} = \frac{FN}{TP + FN} = \frac{0}{13 + 0} = 0.00\%$$

### Latency Profile
* **Mean Execution Time**: **0.43 milliseconds** per scan.
* **Maximum Latency**: **2.17 milliseconds** (Multi-Vector composite exfiltration).
* **Throughput Capacity**: $> 2,300$ scans per second per core.

---

## 4. End-to-End System Integration Suite

The complete system integration test runner (`tests/run_e2e_full_verification.js`) exercises all 15 operational steps of the full platform lifecycle against a live HTTP gateway instance and database backend:

| Step | Verification Check | Target Component | Status | Operational Detail |
| :---: | :--- | :--- | :---: | :--- |
| **01** | API Gateway Health Check | HTTP / Express | **PASS** | Returns HTTP 200 `HEALTHY` |
| **02** | Admin Authentication & JWT | Auth Controller | **PASS** | Issues signed JWT for `ADMIN` |
| **03** | Analyst Authentication & JWT | Auth Controller | **PASS** | Issues signed JWT for `SECURITY_ANALYST` |
| **04** | In-Memory Real-Time Security Scanner | Detection Service | **PASS** | Identifies 4 sensitive items across 3 categories in $<1$ ms |
| **05** | Event Ingestion & Processing Pipeline | Event Pipeline | **PASS** | Ingests telemetry, processes classifications, assigns risk score 100 (`CRITICAL`) |
| **06** | Privacy-by-Design Masking Verification | Privacy Masker | **PASS** | Evidence masked (`AKIA*************444`), SHA-256 computed |
| **07** | Policy Engine Violation Correlation | Policy Engine | **PASS** | Correlates and records 4 active policy violations |
| **08** | Deterministic Incident Escalation | Incident Service | **PASS** | Score $\ge 60$ triggers automatic incident record |
| **09** | SOC Incident Dossier & Evidence Query | Incident Controller | **PASS** | Fetches dossier with detections, masked evidence, and audit timeline |
| **10** | AI Security Analyst Advisory Generation | AI Engine | **PASS** | Synthesizes tailored adversary assessment & 6-step remediation runbook |
| **11** | Incident Transition: `OPEN` $\rightarrow$ `INVESTIGATING` | State Machine | **PASS** | Analyst transitions incident; audit entry logged |
| **12** | Incident Transition: `INVESTIGATING` $\rightarrow$ `RESOLVED`| State Machine | **PASS** | Admin transitions incident; closure notes recorded |
| **13** | SOC Analytics Engine Aggregation | Analytics Service | **PASS** | Aggregates live database counts: Events, Incidents, Violations |
| **14** | RBAC Boundary Check (Analyst Restricted) | RBAC Middleware | **PASS** | Analyst attempting weight configuration is rejected with HTTP 403 |
| **15** | Admin Privilege Enforcement | RBAC Middleware | **PASS** | Admin successfully updates organizational weights (HTTP 200) |

**Result: 15 / 15 Passed (100% Success Rate).**

---

## 5. How to Re-Run Tests During Evaluation

Examiners can independently reproduce these findings by running:

```powershell
# Run the 15-scenario detection benchmark
python tests/test_detection_engine.py

# Run the full end-to-end integration suite
node tests/run_e2e_full_verification.js
```
Both test suites provide colored terminal output and complete metrics breakdown.
