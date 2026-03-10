import requests
from playwright.async_api import async_playwright

async def fetch_page_content(url: str) -> str:
    """Try to fetch the content of a page using requests first, fall back to Playwright."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Referer": "https://www.google.com/",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
    }
    try:
        response = requests.get(url, timeout=15, headers=headers)
        response.raise_for_status()
        return response.text
    except Exception:
        return await fetch_with_playwright(url)

async def fetch_with_playwright(url: str) -> str:
    """Fetch content using Playwright for JS-rendered pages."""
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto(url, wait_until="networkidle")
        content = await page.content()
        await browser.close()
        return content
