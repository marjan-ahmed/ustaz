import http.server
import socketserver
import threading
import time
from playwright.sync_api import sync_playwright

# Start a simple HTTP server in a thread
class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        self.wfile.write(b'<html><body><h1>Test Page</h1></body></html>')
    
    def log_message(self, format, *args):
        pass  # Suppress logs

PORT = 3002
httpd = socketserver.TCPServer(("", PORT), Handler)
thread = threading.Thread(target=httpd.serve_forever)
thread.daemon = True
thread.start()
print(f"Simple server started on port {PORT}")
time.sleep(1)

# Test with Playwright
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    print("Navigating to simple server...")
    page.goto(f"http://127.0.0.1:{PORT}", timeout=10000)
    print("Connected to simple server!")
    page.screenshot(path="E:/nextjs-projects/ustaz/test-simple.png")
    browser.close()

httpd.shutdown()
print("Simple server test passed!")
