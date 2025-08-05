#!/usr/bin/env python3
"""
Start script for Bayti AI Backend
Runs FastAPI server on port 8000
"""

import uvicorn
import os

if __name__ == "__main__":
    port = int(os.getenv("AI_PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )