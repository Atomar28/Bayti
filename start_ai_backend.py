#!/usr/bin/env python3
"""
Bayti AI Backend Startup Script
Runs the FastAPI server for AI calling functionality
"""

import os
import sys
import uvicorn

def main():
    # Change to ai_backend directory
    ai_backend_dir = os.path.join(os.path.dirname(__file__), 'ai_backend')
    os.chdir(ai_backend_dir)
    
    # Add to Python path
    sys.path.insert(0, ai_backend_dir)
    
    try:
        # Import the FastAPI app
        from main import app
        
        print("🏠 Starting Bayti AI Backend Server...")
        print("📞 AI Calling System Ready")
        print("🌐 Server running on http://0.0.0.0:8000")
        
        # Run the server
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=8000,
            log_level="info",
            access_log=True
        )
        
    except Exception as e:
        print(f"❌ Failed to start AI backend: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()