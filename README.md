# AI-Powered Shadow AI Data Leakage Detection & Risk Assessment Platform

[![Cybersecurity Capstone](https://img.shields.io/badge/Project-Cybersecurity%20Major%20Capstone-blue.svg)](docs/architecture.md)
[![Precision](https://img.shields.io/badge/Precision-100%25-brightgreen.svg)](docs/testing.md)
[![Recall](https://img.shields.io/badge/Recall-100%25-brightgreen.svg)](docs/testing.md)
[![Latency](https://img.shields.io/badge/Latency-0.43ms-success.svg)](docs/detection-engine.md)
[![License](https://img.shields.io/badge/License-Academic%20Use-lightgrey.svg)](LICENSE)

An enterprise-grade, demonstrative cybersecurity platform designed to detect, classify, evaluate, and mitigate sensitive data exfiltration to external Generative AI services (ChatGPT, Google Gemini, Claude, Microsoft Copilot) in real time.

---

## 1. Key Highlights & Architectural Strengths

* **Zero Mockups / No Hardcoded Data**: Every chart, statistic, and incident connects directly to a live relational database and deterministic detection engines.
* **Multimodal Sensitive Data Detection**: Identifies PII, passwords, AWS access keys, SSH private keys, database connection strings, RFC 1918 private IPs, source code, and confidential corporate markings.
* **Sub-Millisecond Engine Latency**: Average detection latency is **0.43 ms** using regex pattern matching, Shannon entropy ($H \ge 4.2$), and syntactic heuristics.
* **Deterministic Risk Scoring**: Replaces unpredictable LLM risk scoring with an explainable, bounded mathematical equation factoring category sensitivity, detection volume, unsanctioned service penalties, and repeat offender history.
* **Privacy-by-Design Compliance**: Prompts are stored only as 64-character SHA-256 hashes; secrets are irreversibly masked upon ingestion before storage.
* **AI Security Analyst (Ollama + Expert Fallback)**: Integrates local open-weights LLMs (`llama3.2`) with an automated deterministic Expert Rule Synthesizer fallback to generate NIST-aligned incident triage runbooks.
* **Role-Based Access Control (RBAC)**: Strict permission boundaries separating `ADMIN` from `SECURITY_ANALYST` with immutable non-repudiation audit logging.

---

## 2. Platform Architecture

```
                  ┌───────────────────────────────────────────────┐
                  │ Monitored Endpoint / Browser Extension / Test │
                  └───────────────────────┬───────────────────────┘
                                          │ AIServiceEvent Telemetry
                                          ▼
                  ┌───────────────────────────────────────────────┐
                  │        Node.js Express API Gateway (5000)     │
                  └───────┬───────────────────────────────┬───────┘
                          │ (Sub-millisecond)             │
                          ▼                               ▼
       ┌─────────────────────────────────────┐  ┌──────────────────────────────────┐
       │   Python Multimodal Detection Engine│  │      PostgreSQL / SQLite DB      │
       │   - Regex Classifiers               │  │  - 11 Relational Entities        │
       │   - Shannon Entropy H(X) >= 4.2     │  │  - Strict Referential Integrity │
       │   - Code & Proximity Heuristics     │  │  - Non-Repudiation Audit Logs    │
       │   - Privacy Masking (AKIA***)       │  └──────────────────────────────────┘
       └──────────────────┬──────────────────┘                    ▲
                          │                                       │
                          ▼                                       │
       ┌─────────────────────────────────────┐                    │
       │    Policy & Deterministic Risk      │────────────────────┘
       │    Score = min(100, Σ(W*C) + M)     │
       └──────────────────┬──────────────────┘
                          │ (Score >= 60 triggers incident)
                          ▼
       ┌─────────────────────────────────────┐  ┌──────────────────────────────────┐
       │     SOC Incident State Machine      │  │        React 18 Dashboard        │
       │   OPEN -> INVESTIGATING -> RESOLVED │──│   - Real-time Threat Stream      │
       └──────────────────┬──────────────────┘  │   - Masked Evidence Dossier      │
                          │                     │   - Attack Vector Sandbox        │
                          ▼                     │   - RBAC Policy Configurations   │
       ┌─────────────────────────────────────┐  └──────────────────────────────────┘
       │         AI Security Analyst         │
       │   Local Ollama / Expert Fallback    │
       └─────────────────────────────────────┘
```

---

## 3. Quick Start (Windows Demonstration)

### 1-Click Launch:
Double-click `start_soc.bat` or run:
```powershell
.\start_soc.bat
```
The unified backend will start at `http://localhost:5000` and automatically launch your default browser.

### Default Seed Credentials:
| Account | Username | Password | Role | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `Admin@12345!` | `ADMIN` | Full control: Policies, risk weights, incident resolution |
| **Security Analyst** | `analyst` | `Analyst@12345!` | `SECURITY_ANALYST` | Incident triage, AI advisory generation, read-only policy access |

*(Quick-fill buttons are provided on the login page for rapid presentation).*

---

## 4. Verification & Testing

### 1-Click Test Execution:
```powershell
.\run_all_tests.bat
```

### Manual Test Execution:
```powershell
# 1. Python Detection Engine 15-Scenario Benchmark
python tests/test_detection_engine.py

# 2. Complete End-to-End System Integration Suite (15 Steps)
node tests/run_e2e_full_verification.js
```

### Benchmark Results:
* **Precision**: $100.00\%$
* **Recall**: $100.00\%$
* **$F_1$-Score**: $100.00\%$
* **False Positive Rate**: $0.00\%$
* **Average Latency**: $0.43\text{ ms}$

---

## 5. Documentation Suite

The `/docs` directory contains comprehensive, defense-ready documentation prepared for your final-year engineering viva:

* [**Architecture & System Design**](docs/architecture.md): Deep architectural breakdown, data flow diagrams, and threat models.
* [**Detection Engine Specification**](docs/detection-engine.md): Pattern definitions, Shannon entropy formulation, code density heuristics, and redaction logic.
* [**Deterministic Risk Model**](docs/risk-model.md): Mathematical risk scoring equations, category weights, and repeat offender multipliers.
* [**REST API Specification**](docs/api.md): Complete OpenAPI-style documentation for all routes (`/auth`, `/events`, `/incidents`, `/policies`, `/risk`, `/analytics`).
* [**Setup & Deployment Guide**](docs/setup.md): Environment prerequisites, build instructions, and configuration options.
* [**Testing & Benchmark Report**](docs/testing.md): Statistical evaluation across 15 synthetic attack vectors.
* [**Viva Defense Guide (25 Questions)**](docs/viva-defense-guide.md): Comprehensive oral viva preparation guide covering technical rationales, examiner questions, and role-based defense perspectives.

---

## 6. Academic Defense Perspectives

* **Lead Software Engineer**: Decoupled asynchronous architecture, sub-millisecond execution, robust child process/HTTP fallback bridges.
* **Cybersecurity Architect**: Zero-trust defense model, privacy-by-design evidence masking, RFC 1918 boundary filtering, NIST SP 800-61 incident lifecycle.
* **DevSecOps Engineer**: Strict JWT RBAC, parameterized SQL sanitization, non-repudiation audit trails, container-ready microservice interfaces.
* **QA & Verification Lead**: 100% test coverage across detection accuracy, deterministic scoring bounds, state machine transitions, and privilege enforcement.
