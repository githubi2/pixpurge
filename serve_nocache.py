# 本地开发静态服务器：禁用缓存 + 多线程（避免单线程服务被挂起连接阻塞）
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os
import sys

class NoCacheHandler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    ThreadingHTTPServer.allow_reuse_address = True
    with ThreadingHTTPServer(('0.0.0.0', 8080), NoCacheHandler) as httpd:
        print('Serving on http://localhost:8080 (no-cache, threaded)')
        httpd.serve_forever()
