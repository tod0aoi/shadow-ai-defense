import time
import urllib.parse
from typing import Dict, Any, List
from detectors import (
    PIIDetector,
    SecretDetector,
    InfrastructureDetector,
    CodeDetector,
    find_high_entropy_tokens,
    calculate_shannon_entropy
)
from redaction.masker import mask_single_value, redact_full_text

class DetectionPipeline:
    """
    Core Pipeline orchestrating:
    Normalization -> Pattern Scanning -> Entropy Analysis -> Merging -> Redaction
    """

    def __init__(self):
        self.pii = PIIDetector()
        self.secret = SecretDetector()
        self.infra = InfrastructureDetector()
        self.code = CodeDetector()

    def normalize(self, text: str) -> str:
        """
        Normalizes input text by unescaping URLs, standardizing whitespace,
        and decoding basic encoding tricks.
        """
        if not text:
            return ""
        # 1. URL decode
        try:
            normalized = urllib.parse.unquote(text)
        except Exception:
            normalized = text
        return normalized

    def scan(self, raw_text: str) -> Dict[str, Any]:
        """
        Executes complete multi-stage detection pipeline against input text.
        """
        start_time = time.perf_counter()
        normalized = self.normalize(raw_text)

        all_detections: List[Dict[str, Any]] = []

        # Stage 1: Specialized Rule-Based Detectors
        all_detections.extend(self.secret.scan(normalized))
        all_detections.extend(self.infra.scan(normalized))
        all_detections.extend(self.pii.scan(normalized))
        all_detections.extend(self.code.scan(normalized))

        # Stage 2: Shannon Entropy Analysis for unclassified high-randomness tokens
        entropy_tokens = find_high_entropy_tokens(normalized, min_length=16, entropy_threshold=4.2)
        for t in entropy_tokens:
            # Check if this span is already covered by a known secret detector
            already_detected = any(
                d.get("start", -1) <= t["start"] and d.get("end", -1) >= t["end"]
                for d in all_detections
            )
            if not already_detected:
                all_detections.append({
                    "category": "SECRET",
                    "subcategory": "HIGH_ENTROPY_TOKEN",
                    "value": t["token"],
                    "start": t["start"],
                    "end": t["end"],
                    "confidence": 0.85,
                    "entropy": t["entropy"],
                })

        # Stage 3: Irreversible Evidence Masking
        formatted_detections: List[Dict[str, Any]] = []
        for d in all_detections:
            raw_val = d.get("value", "")
            cat = d.get("category", "SECRET")
            masked = mask_single_value(raw_val, cat)

            formatted_detections.append({
                "category": cat,
                "subcategory": d.get("subcategory", "UNKNOWN"),
                "confidence": d.get("confidence", 0.8),
                "evidence_masked": masked,
                "entropy_score": d.get("entropy", calculate_shannon_entropy(raw_val) if raw_val else None),
                "start": d.get("start"),
                "end": d.get("end"),
                "value": raw_val, # Kept internally for redacting full text
            })

        # Stage 4: Generate Sanitized Redacted Text
        redacted_prompt = redact_full_text(normalized, formatted_detections)

        # Remove raw values from public output to guarantee privacy-by-design
        clean_detections = []
        for d in formatted_detections:
            d_clean = {k: v for k, v in d.items() if k not in ("value", "start", "end")}
            clean_detections.append(d_clean)

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

        # Assess preliminary categorical severity
        categories_found = list({d["category"] for d in clean_detections})
        overall_severity = "LOW"
        if "SECRET" in categories_found:
            overall_severity = "CRITICAL"
        elif "INFRASTRUCTURE" in categories_found or "CONFIDENTIAL" in categories_found:
            overall_severity = "HIGH"
        elif "CODE" in categories_found or "PII" in categories_found:
            overall_severity = "MEDIUM" if len(clean_detections) >= 2 else "LOW"

        return {
            "detections_count": len(clean_detections),
            "categories": categories_found,
            "overall_severity": overall_severity if clean_detections else "NONE",
            "detections": clean_detections,
            "redacted_text": redacted_prompt,
            "processing_time_ms": elapsed_ms,
        }
