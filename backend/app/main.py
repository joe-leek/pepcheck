"""
PepCheck API v3.0 — main.py

FastAPI application with Trust Score v3.0:
- trust_score: sum of positive signals only
- risk_level: "Low" | "Moderate" | "High" based on negative count
- brand_name and peptide_name extraction
- Detailed rationales for each signal
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
import traceback

# Import v2 modules
from app.fetcher import fetch_page_content
from app.analyser import analyse_content
from app.scorer import calculate_score

app = FastAPI(
    title="PepCheck API",
    description="Peptide vendor trust scoring API — v3.0",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyseRequest(BaseModel):
    url: HttpUrl


@app.get("/")
async def root():
    return {"status": "ok", "version": "3.0.0", "service": "PepCheck API"}


@app.post("/analyse")
async def analyse_vendor(request: AnalyseRequest):
    url = str(request.url)

    try:
        # Step 1: Fetch the page content
        page_content = await fetch_page_content(url)

        if not page_content or len(page_content.strip()) < 200:
            raise HTTPException(
                status_code=422,
                detail="Could not retrieve sufficient content from this URL. The vendor's site may be blocking automated access. Try pasting the vendor's homepage URL instead."
            )

        # Step 2: Analyse content with GPT-4 using v2 prompt
        analysis_result = await analyse_content(page_content, url)

        # Step 3: Calculate the Trust Score
        score_result = calculate_score(analysis_result)

        # Add the URL to the response
        score_result["url"] = url

        return score_result

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error analysing {url}: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "3.0.0"}
