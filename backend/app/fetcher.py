import requests
import os


async def fetch_page_content(url: str) -> str:
    """
    Fetch page content using a direct request first, then fall back to ScrapingBee if blocked.
    """
    # --- Step 1: Try direct request first ---
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-GB,en;q=0.5",
        "Accept-Encoding": "identity",  # Request uncompressed response
        "Connection": "keep-alive",
    }

    try:
        print(f"[DEBUG] Attempting direct fetch for {url}")
        response = requests.get(url, headers=headers, timeout=15, allow_redirects=True)
        response.raise_for_status()

        # If we got redirected away from the original path, we were likely blocked
        from urllib.parse import urlparse
        original_path = urlparse(url).path
        final_path = urlparse(response.url).path
        
        # Blocked if: content too short, OR domain mismatch, OR significant path change (product page -> homepage)
        is_likely_blocked = (
            len(response.text) < 10000 or 
            url.split('/')[2] not in response.url or
            (len(original_path) > 5 and (final_path == "/" or final_path == ""))
        )

        if not is_likely_blocked:
            print(f"[DEBUG] Direct fetch successful, content length: {len(response.text)}")
            return response.text
        else:
            print(f"[DEBUG] Direct fetch likely blocked. Final URL: {response.url}. Falling back to ScrapingBee.")

    except requests.exceptions.RequestException as e:
        print(f"[DEBUG] Direct fetch failed: {e}. Falling back to ScrapingBee.")

    # --- Step 2: Fallback to ScrapingBee ---
    scrapingbee_api_key = os.environ.get("SCRAPINGBEE_API_KEY")
    if not scrapingbee_api_key:
        raise Exception("ScrapingBee API key not found. Please set SCRAPINGBEE_API_KEY environment variable.")

    print(f"[DEBUG] Using ScrapingBee for {url}")

    try:
        params = {
            "api_key": scrapingbee_api_key,
            "url": url,
            "render_js": "true",
            "premium_proxy": "true",
            "country_code": "us",
        }
        response = requests.get(
            "https://app.scrapingbee.com/api/v1/",
            params=params,
            timeout=60
        )
        response.raise_for_status()
        print(f"[DEBUG] ScrapingBee fetch successful, content length: {len(response.text)}")
        return response.text

    except requests.exceptions.RequestException as e:
        raise Exception(f"Failed to fetch {url} with ScrapingBee: {str(e)}")
