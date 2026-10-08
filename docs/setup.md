# System Setup & Deployment Guide

## Overview

The **AI-Powered Shadow AI Data Leakage Detection & Risk Assessment Platform** is built to run on standard modern operating systems (Windows 10/11, macOS, Linux) with zero external cloud dependencies. It operates with a unified backend hosting both the API and the pre-compiled React SOC Dashboard on a single port (`5000`).

---

## 1. Prerequisites

Ensure the following tools are installed:
* **Node.js**: v18.0.0 or later (v20+ or v22+ recommended)
* **Python**: 3.10, 3.11, 3.12, 3.13, or 3.14
* **Git**: Any modern version
* **(Optional) Ollama**: If you wish to run a local LLM (`ollama run llama3.2`). The platform features an automated expert rule fallback if Ollama is not active.
* **(Optional) PostgreSQL**: If testing against enterprise PostgreSQL. The platform automatically falls back to native high-performance SQLite on secondary and development machines.

---

## 2. Directory Structure

```
shadow-ai-defense/
├── ai-engine/               # AI Security Analyst (Ollama integration + Expert Fallback)
│   ├── analyst.py
│   └── prompts/
├── backend/                 # Node.js + Express API Gateway, Ingestion, Policy & Risk Engine
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── database/                # Relational SQL Schemas & Seed Data
│   ├── schema.sql
│   └── seed_data.sql
├── detection-engine/        # High-Speed Python Multimodal Sensitive Data Detector
│   ├── detectors/
│   ├── redaction/
│   └── engine.py
├── docs/                    # Technical & Academic Viva Documentation Suite
│   ├── architecture.md
│   ├── api.md
│   ├── detection-engine.md
│   ├── risk-model.md
│   ├── setup.md
│   ├── testing.md
│   └── viva-defense-guide.md
├── frontend/                # React 18 + TypeScript SOC Dashboard
│   ├── src/
│   ├── build/ (or dist/)
│   └── vite.config.ts
├── tests/                   # Verification Test Suites
│   ├── test_detection_engine.py
│   ├── run_phase1_tests.js
│   ├── run_phase3_tests.js
│   └── run_e2e_full_verification.js
├── README.md
├── run_all_tests.bat        # 1-Click Verification Suite
└── start_soc.bat            # 1-Click SOC Platform Launcher
```

---

## 3. Fast-Track Startup (Examiner Demo)

To launch the platform immediately with a single command:

### Option A: Using Windows Batch Script (Recommended for Demo)
Simply double-click or run in PowerShell:
```powershell
.\start_soc.bat
```
This script builds the frontend (if needed), transpiles the backend, checks the database, and launches the SOC server at `http://localhost:5000`.

### Option B: Manual Step-by-Step Command Line

#### Step 1: Install Backend Dependencies & Build
```powershell
cd e:\shadow-ai-defense\backend
npm install
npm run build
```

#### Step 2: Build Frontend SOC Dashboard
```powershell
cd e:\shadow-ai-defense\frontend
npm install
npm run build
```

#### Step 3: Launch the Unified Server
```powershell
cd e:\shadow-ai-defense\backend
npm start
```

Open your browser to:
```
http://localhost:5000
```

---

## 4. Default Seed Credentials

The system initializes with two default role-based SOC accounts:

| Username | Password | Role | Permissions |
| :--- | :--- | :--- | :--- |
| `admin` | `Admin@12345!` | `ADMIN` | Full administrative control: View dashboard, manage incidents, modify security policies, adjust risk weights, inspect audit trails. |
| `analyst` | `Analyst@12345!` | `SECURITY_ANALYST` | SOC Analyst: View dashboard, inspect incidents, triage status transitions, generate AI incident advisories. Restricted from modifying organizational risk weights and policies. |

*(The login page provides 1-click preset buttons to quickly populate either credential).*

---

## 5. Verification & Test Execution

Run any of the automated test suites to demonstrate operational readiness:

### Detection Engine 15-Scenario Synthetic Benchmark
```powershell
cd e:\shadow-ai-defense
python tests/test_detection_engine.py
```
*Evaluates Precision, Recall, F1, False Positive Rate, and Latency (<0.5ms).*

### Complete End-to-End System Verification
```powershell
cd e:\shadow-ai-defense
node tests/run_e2e_full_verification.js
```
*Validates 15 steps across Health, JWT Auth, Sandbox Scanning, Ingestion Pipeline, Privacy Masking, Policy Violations, Deterministic Risk Scoring, Incident Generation, AI Analyst Advisory, Incident Lifecycle, and RBAC isolation.*

### 1-Click Test Launcher
```powershell
.\run_all_tests.bat
```

---

## 6. Optional: Running Local Ollama LLM

If you wish to demonstrate the platform utilizing a local open-weights LLM:
1. Download Ollama from [ollama.com](https://ollama.com).
2. Pull the lightweight `llama3.2` model:
   ```powershell
   ollama pull llama3.2
   ```
3. Ensure the Ollama daemon is running at `http://localhost:11434`.
4. Triggering "Generate AI Advisory" in the SOC Incident Drawer will automatically use `llama3.2`. If Ollama is not running, the platform seamlessly engages the built-in NIST-aligned Expert Rule Synthesizer without failing.
