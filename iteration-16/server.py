"""
Combined static file server + Claude API proxy.
Serves the iteration-16 directory on PORT (default 3016).
POST /api/claude  →  forwards to api.anthropic.com with the API key injected.
"""

import json
import os
import urllib.error
import urllib.request
from http.server import HTTPServer, SimpleHTTPRequestHandler

CLAUDE_API_KEY = os.environ.get('CLAUDE_API_KEY', '')
CLAUDE_URL     = 'https://api.anthropic.com/v1/messages'
PORT           = int(os.environ.get('PORT', 3016))

CORS_HEADERS = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}


class Handler(SimpleHTTPRequestHandler):

    def do_OPTIONS(self):
        if self.path == '/api/claude':
            self.send_response(200)
            for k, v in CORS_HEADERS.items():
                self.send_header(k, v)
            self.end_headers()
        else:
            super().do_OPTIONS()

    def do_POST(self):
        if self.path != '/api/claude':
            self.send_response(404)
            self.end_headers()
            return

        length = int(self.headers.get('Content-Length', 0))
        body   = self.rfile.read(length)

        req = urllib.request.Request(
            CLAUDE_URL,
            data=body,
            headers={
                'x-api-key':         CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type':      'application/json',
            },
            method='POST',
        )
        try:
            with urllib.request.urlopen(req) as resp:
                status   = resp.status
                response = resp.read()
        except urllib.error.HTTPError as exc:
            status   = exc.code
            response = exc.read()

        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        for k, v in CORS_HEADERS.items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(response)

    def log_message(self, fmt, *args):
        pass  # silence request logs


if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    print(f'Serving iteration-16 on http://localhost:{PORT}')
    HTTPServer(('', PORT), Handler).serve_forever()
