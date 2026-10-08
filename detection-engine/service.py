import json
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from pipeline import DetectionPipeline

pipeline = DetectionPipeline()

class DetectionRequestHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(204)

    def do_GET(self):
        if self.path in ('/', '/health'):
            self._set_headers(200)
            self.wfile.write(json.dumps({
                "status": "HEALTHY",
                "service": "Shadow AI Python Detection Engine",
                "version": "1.0.0"
            }).encode('utf-8'))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Not Found"}).encode('utf-8'))

    def do_POST(self):
        if self.path in ('/detect', '/api/v1/detect'):
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "Empty body"}).encode('utf-8'))
                return

            body = self.rfile.read(content_length)
            try:
                data = json.loads(body.decode('utf-8'))
                prompt_text = data.get('text', data.get('prompt_text', ''))
            except Exception as e:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": f"Invalid JSON: {str(e)}"}).encode('utf-8'))
                return

            # Execute detection pipeline
            results = pipeline.scan(prompt_text)
            self._set_headers(200)
            self.wfile.write(json.dumps(results).encode('utf-8'))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Not Found"}).encode('utf-8'))

    def log_message(self, format, *args):
        # Override to keep logs clean and concise
        sys.stderr.write(f"[Detection Service] {self.address_string()} - {format % args}\n")


def run(port=8000):
    server_address = ('127.0.0.1', port)
    httpd = HTTPServer(server_address, DetectionRequestHandler)
    print(f"[+] Python Detection Engine Microservice running on http://127.0.0.1:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[*] Stopping Detection Service...")
        httpd.server_close()

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    run(port)
