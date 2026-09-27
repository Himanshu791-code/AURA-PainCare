"""
AURA-PainCare: AI Silent-Pain & Distress Monitor
Local Server Launcher & Medical HUD Host with Dynamic Mobile QR Dispatch
"""

import os
import sys
import socket
import webbrowser
import socketserver
import http.server
from pathlib import Path

# Fix Windows cp1252 terminal encoding issue
if sys.platform == 'win32' and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

PORT = int(os.enviorn.get("PORT",8080))
HOST = "0.0.0.0"  # Bind to all network interfaces so mobile phones can connect via Wi-Fi/Hotspot

# Set root directory to aura_paincare folder
BASE_DIR = Path(__file__).resolve().parent.parent
os.chdir(BASE_DIR)

def get_local_ip():
    """Detects primary local LAN / Wi-Fi IP address."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS and disable caching for live evaluation
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def log_message(self, format, *args):
        # Clean logging
        try:
            sys.stdout.write(f"[AURA-PainCare Server] {self.address_string()} - {args[0]} {args[1]}\n")
            sys.stdout.flush()
        except Exception:
            pass

def start_server():
    local_ip = get_local_ip()
    local_url = f"http://127.0.0.1:{PORT}/index.html"
    network_url = f"http://{local_ip}:{PORT}/index.html"

    # Automatically generate QR Code assets
    try:
        from generate_qr import generate_qr_assets
        generate_qr_assets(local_ip, PORT)
    except Exception as e:
        print(f"[!] Notice: Could not regenerate QR assets: {e}")

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer((HOST, PORT), CustomHTTPRequestHandler) as httpd:
        print("\n" + "=" * 72)
        print("   🩺 AURA-PainCare: AI Silent-Pain & Distress Monitoring System")
        print("   Vigyan Mela Clinical Innovation Prototype • Pure Software")
        print("=" * 72)
        print(f"[*] Local PC Monitor:    {local_url}")
        print(f"[*] Mobile / Tablet URL: {network_url}")
        print(f"[*] Standalone QR Card:  http://127.0.0.1:{PORT}/qr_card.html")
        print("=" * 72)

        # Print terminal scannable QR code if qrcode is available
        try:
            import qrcode
            qr = qrcode.QRCode(box_size=1, border=1)
            qr.add_data(network_url)
            qr.make(fit=True)
            print("[*] 📱 SCAN WITH PHONE CAMERA TO OPEN ON MOBILE / BEDSIDE TABLET:\n")
            qr.print_ascii(invert=True)
            print("\n" + "=" * 72)
        except Exception:
            pass

        print("[*] Opening your browser automatically...")
        print("[*] Press Ctrl + C to stop server.")
        print("=" * 72 + "\n")

        # Automatically open default browser on local PC
        webbrowser.open(local_url)

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[!] Server shutting down safely. Clinical session ended.")
            httpd.shutdown()

if __name__ == "__main__":
    start_server()
