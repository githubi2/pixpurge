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

    def handle(self):
        # 客户端浏览器/刷新时经常主动断开连接（WinError 10054），
        # ThreadingHTTPServer 会打印整段 Traceback 噪音；
        # 这里静默吞掉，服务本身不受影响。
        try:
            super().handle()
        except ConnectionResetError:
            pass

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    ThreadingHTTPServer.allow_reuse_address = True
    with ThreadingHTTPServer(('0.0.0.0', 8080), NoCacheHandler) as httpd:
        print('Serving on http://localhost:8080 (no-cache, threaded)')
        httpd.serve_forever()
