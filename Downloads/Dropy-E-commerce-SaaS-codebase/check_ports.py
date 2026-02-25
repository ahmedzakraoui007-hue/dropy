import socket
import os

def check_port(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

print(f"Port 3000 in use: {check_port(3000)}")
print(f"Port 3001 in use: {check_port(3001)}")
print(f"Port 3002 in use: {check_port(3002)}")
