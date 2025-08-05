#!/usr/bin/env python3
"""
Keep-alive wrapper for Bayti AI Backend
Ensures the server stays running and automatically restarts on crashes
"""

import subprocess
import time
import signal
import sys
import os
import threading
from pathlib import Path

class ServerKeepAlive:
    def __init__(self):
        self.process = None
        self.should_restart = True
        self.restart_delay = 3
        
    def signal_handler(self, sig, frame):
        print('Shutting down server...')
        self.should_restart = False
        if self.process:
            self.process.terminate()
        sys.exit(0)
        
    def start_server(self):
        """Start the FastAPI server"""
        try:
            cmd = [
                'python3', '-m', 'uvicorn', 'main:app',
                '--host', '0.0.0.0',
                '--port', '8000',
                '--access-log'
            ]
            
            print(f"Starting server with command: {' '.join(cmd)}")
            self.process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True,
                bufsize=1
            )
            
            # Stream output in real-time
            def stream_output():
                if self.process and self.process.stdout:
                    for line in iter(self.process.stdout.readline, ''):
                        if line.strip():
                            print(f"[SERVER] {line.strip()}")
            
            output_thread = threading.Thread(target=stream_output)
            output_thread.daemon = True
            output_thread.start()
            
            return self.process
            
        except Exception as e:
            print(f"Failed to start server: {e}")
            return None
    
    def run(self):
        """Main keep-alive loop"""
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
        
        print("=== Bayti AI Backend Keep-Alive ===")
        print("Server will automatically restart on crashes")
        print("Press Ctrl+C to stop")
        
        while self.should_restart:
            print(f"\n[{time.strftime('%Y-%m-%d %H:%M:%S')}] Starting server...")
            
            self.process = self.start_server()
            
            if not self.process:
                print(f"Failed to start server, retrying in {self.restart_delay} seconds...")
                time.sleep(self.restart_delay)
                continue
            
            # Wait for process to complete or crash
            try:
                exit_code = self.process.wait()
                print(f"\n[{time.strftime('%Y-%m-%d %H:%M:%S')}] Server exited with code {exit_code}")
                
                if self.should_restart:
                    print(f"Restarting in {self.restart_delay} seconds...")
                    time.sleep(self.restart_delay)
                    
            except KeyboardInterrupt:
                print("\nReceived interrupt signal")
                self.should_restart = False
                if self.process:
                    self.process.terminate()
                break
            except Exception as e:
                print(f"Error monitoring server: {e}")
                if self.should_restart:
                    print(f"Restarting in {self.restart_delay} seconds...")
                    time.sleep(self.restart_delay)

if __name__ == "__main__":
    # Change to ai_backend directory
    os.chdir(Path(__file__).parent)
    
    keeper = ServerKeepAlive()
    keeper.run()