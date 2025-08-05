#!/usr/bin/env python3
"""
Persistent server runner for Bayti AI Backend
Automatically restarts on crashes
"""

import subprocess
import time
import signal
import sys
import os

def signal_handler(sig, frame):
    print('Server stopping...')
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

def run_server():
    """Run the FastAPI server with auto-restart"""
    while True:
        try:
            print("Starting Bayti AI Backend...")
            process = subprocess.Popen([
                'python3', '-m', 'uvicorn', 'main:app', 
                '--host', '0.0.0.0', 
                '--port', '8000',
                '--reload'
            ])
            
            process.wait()
            print("Server process ended, restarting in 3 seconds...")
            time.sleep(3)
            
        except KeyboardInterrupt:
            print("Shutting down server...")
            process.terminate()
            break
        except Exception as e:
            print(f"Server error: {e}")
            print("Restarting in 5 seconds...")
            time.sleep(5)

if __name__ == "__main__":
    run_server()