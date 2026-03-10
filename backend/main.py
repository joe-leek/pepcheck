"""
PepCheck API - Peptide Vendor Trust Score Analyzer
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Optional, List, Dict
import os
from dotenv import load_dotenv

from fetcher import fetch_page
from analyser import analyze_page
from scorer import calculate_trust_score

# Load environment variables
load_dotenv()

app = FastAPI(
    title="PepCheck API",
    description="Analyze peptide vendor product pages and return Trust Scores",
    version="1.0.0",
)

# CORS - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health disclaimer
DISCLAIMER = "PepCheck is an information tool only. It does not constitute medical advice and should not be used to make decisions about human consumption of any substance."


class AnalyseRequest(BaseModel):
    url: HttpUrl


class Signal(BaseModel):
    signal: str
    points: int


class SignalBreakdown(BaseModel):
    positive: List[Signal]
    negative: List[Signal]


class AnalyseResponse(BaseModel):
    url: str
    trust_score: int
    tier: str
    tier_description: str
    signals: SignalBreakdown
    page_title: Optional[str]
    coa_links_found: int
    disclaimer: str


class ErrorResponse(BaseModel):
    error: str
    url: str
    disclaimer: str


@app.get("/")
async def root():
    return {
        "service": "PepCheck API",
        "version": "1.0.0",
        "endpoint": "POST /analyse",
        "description": "Paste a peptide vendor product URL to get a Trust Score",
        "disclaimer": DISCLAIMER,
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/analyse", response_model=AnalyseResponse)
async def analyse_vendor(request: AnalyseRequest):
    """
    Analyze a peptide vendor's product page and return a Trust Score.
    
    The Trust Score (0-100) is based on documentation quality signals
    extracted from the page using GPT-4.1 analysis.
    """
    url = str(request.url)
    
    # Step 1: Fetch the page
    page_data = fetch_page(url)
    
    if not page_data["success"]:
        raise HTTPException(
            status_code=400,
            detail={
                "error": f"Failed to fetch page: {page_data['error']}",
                "url": url,
                "disclaimer": DISCLAIMER,
            }
        )
    
    # Step 2: Analyze with GPT-4.1
    analysis = analyze_page(page_data)
    
    if not analysis["success"]:
        raise HTTPException(
            status_code=500,
            detail={
                "error": f"Analysis failed: {analysis['error']}",
                "url": url,
                "disclaimer": DISCLAIMER,
            }
        )
    
    # Step 3: Calculate Trust Score
    score_result = calculate_trust_score(analysis["findings"])
    
    return AnalyseResponse(
        url=url,
        trust_score=score_result["trust_score"],
        tier=score_result["tier"],
        tier_description=score_result["tier_description"],
        signals=SignalBreakdown(
            positive=[Signal(**s) for s in score_result["signals"]["positive"]],
            negative=[Signal(**s) for s in score_result["signals"]["negative"]],
        ),
        page_title=page_data.get("title"),
        coa_links_found=len(page_data.get("coa_links", [])),
        disclaimer=DISCLAIMER,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
