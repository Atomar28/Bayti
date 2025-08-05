#!/usr/bin/env python3
"""Minimal reliable server for Bayti AI Backend"""

import asyncio
import signal
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def handle_shutdown(signum, frame):
    print("Shutting down gracefully...")
    sys.exit(0)

async def main():
    # Set up signal handlers
    signal.signal(signal.SIGINT, handle_shutdown)
    signal.signal(signal.SIGTERM, handle_shutdown)
    
    try:
        import uvicorn
        from main import app
        
        print("Starting Bayti AI Backend on port 8000...")
        
        # Create uvicorn config
        config = uvicorn.Config(
            app=app,
            host="0.0.0.0",
            port=8000,
            log_level="info",
            access_log=True,
            loop="asyncio"
        )
        
        # Create and run server
        server = uvicorn.Server(config)
        await server.serve()
        
    except KeyboardInterrupt:
        print("Server interrupted")
    except Exception as e:
        print(f"Server error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        print("Server stopped")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Shutting down...")
    except Exception as e:
        print(f"Fatal error: {e}")
        sys.exit(1)