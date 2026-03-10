"""
Page fetching for PepCheck.
Uses requests by default, falls back to Playwright for JS-rendered pages.
"""

import requests
from bs4 import BeautifulSoup
from typing import Dict
import asyncio


def fetch_page(url: str, timeout: int = 15) -> Dict:
    """
    Fetch a vendor product page and extract text content.
    Tries requests first, falls back to Playwright if content is empty.
    
    Args:
        url: The vendor product page URL
        timeout: Request timeout in seconds
        
    Returns:
        Dict with success status, text content, and metadata
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=timeout)
        response.raise_for_status()
        
        result = _parse_html(response.text, url)
        
        # If content is too short, try Playwright (JS-rendered page)
        if result["text_length"] < 500:
            playwright_result = _fetch_with_playwright(url)
            if playwright_result["success"] and playwright_result["text_length"] > result["text_length"]:
                return playwright_result
        
        return result
        
    except requests.exceptions.RequestException as e:
        # Try Playwright as fallback
        playwright_result = _fetch_with_playwright(url)
        if playwright_result["success"]:
            return playwright_result
        
        return {
            "success": False,
            "url": url,
            "title": None,
            "text": None,
            "text_length": 0,
            "coa_links": [],
            "price": None,
            "error": str(e),
        }


def _parse_html(html: str, url: str) -> Dict:
    """Parse HTML and extract text content."""
    soup = BeautifulSoup(html, "html.parser")
    
    # Remove script and style elements
    for element in soup(["script", "style", "nav", "footer", "header", "noscript"]):
        element.decompose()
    
    # Extract text
    text = soup.get_text(separator="\n", strip=True)
    
    # Clean up excessive whitespace
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    clean_text = "\n".join(lines)
    
    # Extract title
    title = soup.title.string if soup.title else None
    
    # Look for COA links (common patterns)
    coa_links = []
    for link in soup.find_all("a", href=True):
        href = link.get("href", "").lower()
        text_content = link.get_text().lower()
        if any(term in href or term in text_content for term in ["coa", "certificate", "analysis", "hplc", "report", "test"]):
            coa_links.append({
                "text": link.get_text().strip(),
                "href": link.get("href"),
            })
    
    # Look for price
    price = None
    price_patterns = soup.find_all(class_=lambda x: x and "price" in x.lower() if x else False)
    if price_patterns:
        price = price_patterns[0].get_text().strip()
    
    return {
        "success": True,
        "url": url,
        "title": title,
        "text": clean_text[:15000],
        "text_length": len(clean_text),
        "coa_links": coa_links[:5],
        "price": price,
        "error": None,
    }


def _fetch_with_playwright(url: str) -> Dict:
    """Fetch page with Playwright (for JS-rendered content)."""
    try:
        from playwright.sync_api import sync_playwright
        
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(url, wait_until="networkidle", timeout=30000)
            
            # Wait a bit more for dynamic content
            page.wait_for_timeout(2000)
            
            html = page.content()
            browser.close()
            
            return _parse_html(html, url)
            
    except Exception as e:
        return {
            "success": False,
            "url": url,
            "title": None,
            "text": None,
            "text_length": 0,
            "coa_links": [],
            "price": None,
            "error": f"Playwright error: {str(e)}",
        }
