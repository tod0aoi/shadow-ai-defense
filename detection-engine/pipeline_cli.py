import json
import sys
from pipeline import DetectionPipeline

def main():
    pipeline = DetectionPipeline()
    if len(sys.argv) > 1:
        input_text = sys.argv[1]
    else:
        input_text = sys.stdin.read()

    results = pipeline.scan(input_text)
    print(json.dumps(results))

if __name__ == '__main__':
    main()
