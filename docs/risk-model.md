# Deterministic Risk Scoring Model: Technical Specification
## Explainable Quantitative Assessment, Multipliers & Severity Classification

---

## 1. Quantitative Risk Formula

To eliminate black-box AI hallucinations and maintain compliance with cybersecurity audit standards (ISO 27001 / SOC 2), the platform implements an explainable, deterministic risk model:

$$\text{Risk Score} = \min\left(100, \max\left(0, \sum_{i} \left(W_{\text{cat}_i} \times C_i\right) + M_{\text{service}} + M_{\text{volume}} + M_{\text{history}}\right)\right)$$

Where:
* $W_{\text{cat}_i}$: Base weight assigned to detection category $i$.
* $C_i$: Detection engine confidence for finding $i$ ($0.0 \le C_i \le 1.0$).
* $M_{\text{service}}$: Additional weight based on destination service trust level.
* $M_{\text{volume}}$: Multi-detection volume density penalty.
* $M_{\text{history}}$: Behavioral repeat-offender modifier.

---

## 2. Base Category Weights ($W$)

| Detection Category | Base Weight | Rationale |
| :--- | :---: | :--- |
| **SECRET** | **50** | Direct threat of cloud or API account takeover; critical blast radius. |
| **CREDENTIAL** | **45** | Direct threat of identity compromise or unauthorized authentication. |
| **INFRASTRUCTURE** | **30** | Leaks internal network topography, RFC 1918 subnets, or database endpoints. |
| **CONFIDENTIAL** | **25** | Clear violation of organizational data classification guidelines. |
| **CODE** | **25** | Intellectual property loss and exposure of proprietary business logic. |
| **PII** | **20** | Regulatory liability under GDPR, HIPAA, and DPDP privacy frameworks. |

---

## 3. Dynamic Modifiers ($M$)

### A. Destination Trust Modifier ($M_{\text{service}}$)
* **Unsanctioned Public AI Service** (ChatGPT, Gemini, Claude personal): **$+15$**
* **Sanctioned Enterprise AI Tenant** (Microsoft Copilot Enterprise): **$+0$**

### B. Volume Exposure Modifier ($M_{\text{volume}}$)
* $\ge 5$ distinct sensitive entity findings: **$+20$**
* $2 - 4$ distinct sensitive entity findings: **$+10$**
* $1$ sensitive entity finding: **$+0$**

### C. Behavioral Repeat Offender Modifier ($M_{\text{history}}$)
* If the user or device has $\ge 1$ previous recorded policy violations in the audit database: **$+15$**
* First-time violation: **$+0$**

---

## 4. Qualitative Severity Classification

| Risk Score Range | Severity Level | Operational SOC SLA & Action |
| :---: | :---: | :--- |
| **$80 - 100$** | **CRITICAL** | Immediate incident generated. Urgent SOC alert dispatched; cloud keys scheduled for instant revocation. |
| **$60 - 79$** | **HIGH** | Incident generated with status `OPEN`. Analyst assigned for triage within 4 hours. |
| **$30 - 59$** | **MEDIUM** | Logged as policy violation alert. Monitored for repeat occurrences. |
| **$0 - 29$** | **LOW** | Informational telemetry log. Normal benign usage. |

---

## 5. Audit Factor Breakdown Schema

Every assessment record stored in `risk_assessments.breakdown_factors` contains a structured JSON array of individual scoring contributions:

```json
[
  {
    "category": "SECRET",
    "score_contribution": 50,
    "reason": "Detected AWS_ACCESS_KEY with 99% confidence (evidence: AKIA************PLE)"
  },
  {
    "category": "AI_DESTINATION",
    "score_contribution": 15,
    "reason": "Exfiltration destination \"ChatGPT (OpenAI)\" is an unsanctioned public AI service"
  },
  {
    "category": "HISTORICAL_RISK",
    "score_contribution": 15,
    "reason": "Repeat offender alert: User has 1 prior security violation(s) in the audit history"
  }
]
```
This guarantees complete transparency and non-repudiation during post-incident investigations.
