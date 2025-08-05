#!/usr/bin/env python3
"""Simple, reliable startup script for Bayti AI Backend"""

import os
import sys

if __name__ == "__main__":
    # Ensure we're in the right directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Import and run the server
    try:
        import uvicorn
        from main import app
        
        print("Starting Bayti AI Backend on port 8000...")
        uvicorn.run(
            app, 
            host="0.0.0.0", 
            port=8000, 
            log_level="info",
            access_log=True
        )
    except Exception as e:
        print(f"Failed to start server: {e}")
        sys.exit(1)