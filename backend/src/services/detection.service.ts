import path from 'path';
import { spawn } from 'child_process';
import http from 'http';
import { config } from '../config/env';

export interface DetectionResult {
  detections_count: number;
  categories: string[];
  overall_severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'NONE';
  detections: Array<{
    category: string;
    subcategory: string;
    confidence: number;
    evidence_masked: string;
    entropy_score?: number;
  }>;
  redacted_text: string;
  processing_time_ms: number;
}

/**
 * Attempts to call Python microservice via HTTP; falls back to direct child_process if service is offline.
 */
export async function executeDetectionScan(promptText: string): Promise<DetectionResult> {
  try {
    return await scanViaHttp(promptText);
  } catch (httpErr) {
    // Fall back to direct Python subprocess execution
    return await scanViaSubprocess(promptText);
  }
}

function scanViaHttp(promptText: string): Promise<DetectionResult> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${config.detectionServiceUrl}/detect`);
    const payload = JSON.stringify({ prompt_text: promptText });

    const req = http.request(
      url,
      {
        method: 'POST',
        timeout: 2000,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              resolve(JSON.parse(raw));
            } catch (err) {
              reject(err);
            }
          } else {
            reject(new Error(`Detection service responded with HTTP ${res.statusCode}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('HTTP detection service timeout'));
    });

    req.write(payload);
    req.end();
  });
}

function scanViaSubprocess(promptText: string): Promise<DetectionResult> {
  return new Promise((resolve, reject) => {
    const cliScript = path.resolve(__dirname, '../../../detection-engine/pipeline_cli.py');
    const pythonExe = process.platform === 'win32' ? 'python' : 'python3';

    const child = spawn(pythonExe, [cliScript], {
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => (stdout += data));
    child.stderr.on('data', (data) => (stderr += data));

    child.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(stdout));
        } catch (err) {
          reject(new Error(`Failed to parse detection output: ${stdout}`));
        }
      } else {
        reject(new Error(`Python detection failed with code ${code}: ${stderr}`));
      }
    });

    child.on('error', reject);

    // Pass promptText via stdin to avoid command line length limits
    child.stdin.write(promptText);
    child.stdin.end();
  });
}
