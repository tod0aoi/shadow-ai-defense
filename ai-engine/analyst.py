import json
import sys
import urllib.request
import urllib.error
from prompts.analyst_prompt import SYSTEM_PROMPT, build_analyst_user_prompt

OLLAMA_API_URL = "http://localhost:11434/api/generate"
DEFAULT_MODEL = "llama3.2"

def analyze_with_ollama(context: dict, model: str = DEFAULT_MODEL) -> dict:
    """
    Attempts to query local Ollama instance running llama3.2, mistral, etc.
    """
    user_prompt = build_analyst_user_prompt(context)
    payload = {
        "model": model,
        "prompt": f"{SYSTEM_PROMPT}\n\n{user_prompt}",
        "format": "json",
        "stream": False,
        "options": {
            "temperature": 0.2, # Low temperature for deterministic security guidance
        }
    }

    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        OLLAMA_API_URL,
        data=data,
        headers={"Content-Type": "application/json"}
    )

    with urllib.request.urlopen(req, timeout=8) as response:
        if response.status == 200:
            res_body = json.loads(response.read().decode('utf-8'))
            response_text = res_body.get("response", "{}")
            return json.loads(response_text)

    raise RuntimeError("Ollama returned non-200 status")


def generate_expert_rule_analysis(context: dict) -> dict:
    """
    High-fidelity expert fallback generator used when local Ollama is offline.
    Synthesizes tailored, deterministic NIST-aligned incident runbooks based
    on the exact categories, policies, and findings in the incident context.
    """
    categories = context.get("categories", [])
    service = context.get("service_name", "External AI Service")
    risk_score = context.get("risk_score", 0)
    severity = context.get("severity", "HIGH")
    masked_evidence = context.get("masked_evidence", [])

    summary = (
        f"Automated detection of {', '.join(categories) if categories else 'sensitive data'} "
        f"exfiltration to unsanctioned external service '{service}'. "
        f"Calculated composite risk score of {risk_score}/100 classifies this incident as {severity}."
    )

    threat_perspective = []
    potential_impact = []
    investigation_steps = [
        f"Correlate event timestamp with endpoint network logs for monitored employee.",
        f"Inspect transmitted prompt context to determine whether submission was inadvertent or automated.",
        f"Verify whether '{service}' enterprise settings enable prompt ingestion into public LLM training datasets."
    ]
    remediation_runbook = [
        f"Conduct mandatory 1-on-1 policy awareness briefing with the employee regarding AI data protection standards."
    ]

    if "SECRET" in categories:
        threat_perspective.append(
            "Exposed cryptographic tokens or cloud access keys can be harvested if external sessions are cached, "
            "allowing external threat actors to bypass perimeter controls and assume privileged organizational roles."
        )
        potential_impact.append(
            "Critical cloud compromise, unauthorized access to S3/blob storage, potential full tenant takeover."
        )
        investigation_steps.insert(0, "Identify AWS/cloud account identity linked to the masked key prefix.")
        investigation_steps.append("Search AWS CloudTrail for unusual API calls originating from non-corporate IPs.")
        remediation_runbook.insert(0, "IMMEDIATE ERADICATION: Revoke and rotate the exposed access key in the AWS IAM Console.")
        remediation_runbook.insert(1, "Audit all active session tokens and invalidate long-lived credentials.")

    if "INFRASTRUCTURE" in categories:
        threat_perspective.append(
            "Internal RFC 1918 addresses and database connection URIs leak corporate network topography, "
            "aiding adversaries in crafting targeted spear-phishing or lateral movement pivots."
        )
        potential_impact.append(
            "Internal network mapping, direct database authentication attempts if network perimeters are bridged."
        )
        investigation_steps.append("Confirm whether exposed database port is firewalled from public internet access.")
        remediation_runbook.insert(0, "Verify firewall ingress rules to ensure database endpoints reject non-VPC traffic.")

    if "PII" in categories:
        threat_perspective.append(
            "Customer or employee Personally Identifiable Information transmitted to third-party models "
            "violates global data processing regulations and privacy policies."
        )
        potential_impact.append(
            "Regulatory non-compliance penalties under GDPR/HIPAA/DPDP, breach notification obligations."
        )
        investigation_steps.append("Determine the scope and number of unique data subjects exposed in the prompt.")
        remediation_runbook.append("File formal privacy assessment ticket with Data Protection Officer (DPO).")

    if "CODE" in categories or "CONFIDENTIAL" in categories:
        threat_perspective.append(
            "Proprietary source code and confidential business memos represent core intellectual property "
            "that could be ingested into public model weights or disclosed via prompt extraction."
        )
        potential_impact.append(
            "Loss of intellectual property, premature public disclosure of strategic business plans."
        )
        remediation_runbook.append("Verify code repository permissions and ensure secrets scanning is enforced in CI/CD.")

    if not threat_perspective:
        threat_perspective.append(
            "Unsanctioned transmission of organizational data to external services circumvents central DLP controls."
        )
        potential_impact.append("Policy violation and audit compliance discrepancy.")

    return {
        "incident_summary": summary,
        "threat_actor_perspective": " ".join(threat_perspective),
        "potential_impact": " ".join(potential_impact),
        "investigation_steps": investigation_steps,
        "remediation_runbook": remediation_runbook,
        "engine": "EXPERT_RULE_SYNTHESIZER (Local Fallback)"
    }


def analyze_incident(context: dict) -> dict:
    """
    Main entry point: Attempts local Ollama first, smoothly falls back to Expert Rule Synthesizer.
    """
    try:
        result = analyze_with_ollama(context)
        result["engine"] = f"LOCAL_LLM (Ollama {DEFAULT_MODEL})"
        return result
    except Exception as e:
        # Fall back to high-grade deterministic rule synthesizer
        result = generate_expert_rule_analysis(context)
        return result


def main():
    if len(sys.argv) > 1:
        raw_input = sys.argv[1]
    else:
        raw_input = sys.stdin.read()

    try:
        context = json.loads(raw_input)
    except Exception as e:
        sys.stderr.write(f"Invalid JSON context: {e}\n")
        sys.exit(1)

    analysis = analyze_incident(context)
    print(json.dumps(analysis, indent=2))

if __name__ == '__main__':
    main()
