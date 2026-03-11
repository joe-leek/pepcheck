#!/bin/bash
cd /Users/clawdbot/Projects/PepCheck/backend
source venv/bin/activate
source ~/.openclaw/secrets/services.env
export OPENAI_API_KEY
export SCRAPINGBEE_API_KEY
exec python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
