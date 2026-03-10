from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, HttpUrl
from .fetcher import fetch_page_content
from .analyser import analyse_with_gpt
from .scorer import calculate_trust_score

app = FastAPI(title="PepCheck API", version="1.0.0")


class AnalyseRequest(BaseModel):
    url: HttpUrl


@app.post("/analyse")
async def analyse_vendor(request: AnalyseRequest):
    """Analyse a vendor URL and return a trust score."""
    try:
        content = await fetch_page_content(str(request.url))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch page: {str(e)}")
    
    if not content:
        raise HTTPException(status_code=500, detail="Failed to fetch the page content.")
    
    try:
        signals = await analyse_with_gpt(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyse page: {str(e)}")
    
    result = calculate_trust_score(signals)
    result["url"] = str(request.url)
    
    return result
