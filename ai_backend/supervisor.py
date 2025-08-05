#!/usr/bin/env python3
"""
Supervisor for Bayti AI Backend - ensures server stays running
Automatically restarts on crashes with intelligent retry logic
"""

import subprocess
import time
import signal
import sys
import os
import threading
import requests
from pathlib import Path

class AIBackendSupervisor:
    def __init__(self):
        self.process = None
        self.should_run = True
        self.restart_count = 0
        self.max_restarts = 10
        self.base_delay = 2
        self.max_delay = 30
        self.health_check_url = "http://localhost:8000/health"
        
    def signal_handler(self, sig, frame):
        print("Shutdown signal received")
        self.should_run = False
        if self.process:
            self.process.terminate()
            self.process.wait()
        sys.exit(0)
        
    def health_check(self):
        """Check if the server is responding"""
        try:
            response = requests.get(self.health_check_url, timeout=5)
            return response.status_code == 200
        except:
            return False
            
    def start_server_process(self):
        """Start the FastAPI server process"""
        try:
            cmd = [
                sys.executable, "-c",
                """
import uvicorn
import sys
sys.path.append('.')
from main import app
uvicorn.run(app, host='0.0.0.0', port=8000, log_level='info')
"""
            ]
            
            print(f"Starting server process (attempt {self.restart_count + 1})")
            self.process = subprocess.Popen(
                cmd,
                cwd=Path(__file__).parent,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True
            )
            
            return True
            
        except Exception as e:
            print(f"Failed to start server: {e}")
            return False
    
    def monitor_server(self):
        """Monitor server health and restart if needed"""
        while self.should_run:
            if not self.process or self.process.poll() is not None:
                print("Server process not running, restarting...")
                self.restart_server()
            else:
                # Check health every 30 seconds
                time.sleep(30)
                if not self.health_check():
                    print("Health check failed, restarting server...")
                    if self.process:
                        self.process.terminate()
                        self.process.wait()
                    self.restart_server()
                    
    def restart_server(self):
        """Restart the server with exponential backoff"""
        if self.restart_count >= self.max_restarts:
            print(f"Max restarts ({self.max_restarts}) reached. Stopping.")
            self.should_run = False
            return
            
        delay = min(self.base_delay * (2 ** self.restart_count), self.max_delay)
        print(f"Waiting {delay} seconds before restart...")
        time.sleep(delay)
        
        if self.start_server_process():
            # Wait for server to start
            time.sleep(5)
            if self.health_check():
                print("Server restarted successfully")
                self.restart_count = 0  # Reset on success
            else:
                print("Server restart failed health check")
                self.restart_count += 1
        else:
            self.restart_count += 1
            
    def run(self):
        """Main supervisor loop"""
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
        
        print("=== Bayti AI Backend Supervisor Started ===")
        print("Server will be monitored and auto-restarted")
        print("Press Ctrl+C to stop")
        
        # Start initial server
        if not self.start_server_process():
            print("Failed to start initial server")
            return
            
        # Wait for initial startup
        time.sleep(5)
        
        # Start monitoring in background
        monitor_thread = threading.Thread(target=self.monitor_server)
        monitor_thread.daemon = True
        monitor_thread.start()
        
        try:
            # Stream server output
            if self.process and self.process.stdout:
                for line in iter(self.process.stdout.readline, ''):
                    if line.strip() and self.should_run:
                        print(f"[SERVER] {line.strip()}")
        except KeyboardInterrupt:
            pass
        finally:
            self.should_run = False
            if self.process:
                self.process.terminate()

if __name__ == "__main__":
    supervisor = AIBackendSupervisor()
    supervisor.run()