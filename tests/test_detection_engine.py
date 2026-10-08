import json
import os
import sys
import time

# Add detection-engine to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../detection-engine')))

from pipeline import DetectionPipeline

def run_benchmark():
    dataset_path = os.path.join(os.path.dirname(__file__), 'test_dataset.json')
    with open(dataset_path, 'r', encoding='utf-8') as f:
        test_cases = json.load(f)

    pipeline = DetectionPipeline()

    print("\n=======================================================================")
    print("      SHADOW AI DETECTION ENGINE: 15-SCENARIO BENCHMARK EVALUATOR     ")
    print("=======================================================================\n")

    tp = 0  # Sensitive correctly detected
    tn = 0  # Benign correctly passed
    fp = 0  # Benign falsely flagged
    fn = 0  # Sensitive missed

    total_latency_ms = 0.0

    print(f"{'ID':<6} | {'Status':<6} | {'Latency':<8} | {'Scenario Name':<40} | {'Categories'}")
    print("-" * 85)

    for tc in test_cases:
        t0 = time.perf_counter()
        result = pipeline.scan(tc["prompt"])
        dt_ms = (time.perf_counter() - t0) * 1000
        total_latency_ms += dt_ms

        detected_sensitive = result["detections_count"] > 0
        expected_sensitive = tc["expected_sensitive"]
        detected_categories = result["categories"]

        # Classification validation
        if expected_sensitive and detected_sensitive:
            tp += 1
            verdict = "PASS"
        elif not expected_sensitive and not detected_sensitive:
            tn += 1
            verdict = "PASS"
        elif not expected_sensitive and detected_sensitive:
            fp += 1
            verdict = "FP"
        else:
            fn += 1
            verdict = "FN"

        cat_str = ", ".join(detected_categories) if detected_categories else "NONE"
        print(f"{tc['id']:<6} | {verdict:<6} | {dt_ms:>6.2f}ms | {tc['name'][:38]:<40} | {cat_str}")

    total_samples = len(test_cases)
    precision = (tp / (tp + fp)) if (tp + fp) > 0 else 0.0
    recall = (tp / (tp + fn)) if (tp + fn) > 0 else 0.0
    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0
    fpr = (fp / (fp + tn)) if (fp + tn) > 0 else 0.0
    fnr = (fn / (fn + tp)) if (fn + tp) > 0 else 0.0
    avg_latency = total_latency_ms / total_samples

    print("-" * 85)
    print("\n--- BENCHMARK PERFORMANCE METRICS ---")
    print(f"Total Test Cases Evaluated : {total_samples}")
    print(f"True Positives  (TP)       : {tp}")
    print(f"True Negatives  (TN)       : {tn}")
    print(f"False Positives (FP)       : {fp}")
    print(f"False Negatives (FN)       : {fn}")
    print(f"------------------------------------")
    print(f"Precision                  : {precision * 100:.2f}%")
    print(f"Recall (Sensitivity)       : {recall * 100:.2f}%")
    print(f"F1-Score                   : {f1 * 100:.2f}%")
    print(f"False Positive Rate (FPR)  : {fpr * 100:.2f}%")
    print(f"False Negative Rate (FNR)  : {fnr * 100:.2f}%")
    print(f"Average Execution Latency  : {avg_latency:.2f} ms / request")
    print("------------------------------------\n")

    if fp == 0 and fn == 0:
        print("[+] 100% ACCURACY ACHIEVED ON SYNTHETIC BENCHMARK SUITE.\n")
        return 0
    else:
        print("[-] SOME CASES DEVIATED FROM GROUND TRUTH.\n")
        return 1

if __name__ == '__main__':
    sys.exit(run_benchmark())
