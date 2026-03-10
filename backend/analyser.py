"""
OpenAI GPT-4.1 integration for analyzing vendor pages.
"""

import json
import os
from typing import Dict, Optional
from openai import OpenAI


ANALYSIS_PROMPT = """You are analyzing a peptide vendor's product page to assess their documentation quality and trustworthiness.

Analyze the following page content and extract these specific signals. Return a JSON object with boolean values for each signal.

PAGE CONTENT:
{page_content}

ADDITIONAL CONTEXT:
- Page title: {title}
- COA links found: {coa_links}
- Price found: {price}

Analyze and return JSON with these exact keys (all boolean true/false):

POSITIVE SIGNALS (look for evidence of these):
- batch_specific_coa: Is there a batch-specific or lot-specific Certificate of Analysis? (not generic)
- third_party_lab: Is the COA from a named third-party laboratory? (e.g., Janoshik, Colmaric, etc.)
- hplc_chromatogram: Does the COA or page mention HPLC chromatogram/purity testing?
- ms_data: Does the COA or page mention Mass Spectrometry (MS) data?
- lab_accredited: Is the testing lab ISO 17025 or UKAS accredited?
- manufacturer_certified: Is the manufacturer cGMP or ISO 9001 certified?
- cas_number: Is a CAS registry number provided for the peptide?
- molecular_info: Is the molecular formula and/or molecular weight provided?
- storage_instructions: Are detailed storage and reconstitution instructions provided?
- scientific_references: Are peer-reviewed scientific references or citations provided?

NEGATIVE SIGNALS (look for evidence of these red flags):
- no_coa: Is there NO Certificate of Analysis available or mentioned at all?
- generic_coa: Is the COA generic/non-lot-matched (same COA for all batches)?
- medical_claims: Does the page make medical, therapeutic, or treatment claims?
- dosing_instructions: Does the page provide human dosing or injection instructions?
- price_below_market: Does the price seem suspiciously low (more than 40% below typical)?
- lab_tested_no_method: Does it claim "lab tested" without stating the testing method?

Return ONLY valid JSON, no other text. Example:
{{"batch_specific_coa": true, "third_party_lab": true, "hplc_chromatogram": true, "ms_data": false, "lab_accredited": false, "manufacturer_certified": false, "cas_number": true, "molecular_info": true, "storage_instructions": true, "scientific_references": false, "no_coa": false, "generic_coa": false, "medical_claims": false, "dosing_instructions": false, "price_below_market": false, "lab_tested_no_method": false}}
"""


def analyze_page(page_data: Dict) -> Dict:
    """
    Analyze a fetched page using GPT-4.1.
    
    Args:
        page_data: Dict from fetcher.fetch_page()
        
    Returns:
        Dict with findings (boolean values for each signal)
    """
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    # Prepare context
    coa_links_text = "\n".join([f"- {link['text']}: {link['href']}" for link in page_data.get("coa_links", [])]) or "None found"
    
    prompt = ANALYSIS_PROMPT.format(
        page_content=page_data.get("text", "")[:12000],  # Limit content
        title=page_data.get("title", "Unknown"),
        coa_links=coa_links_text,
        price=page_data.get("price", "Not found"),
    )
    
    try:
        response = client.chat.completions.create(
            model="gpt-4.1",
            messages=[
                {
                    "role": "system",
                    "content": "You are a peptide quality analyst. Analyze vendor pages and return structured JSON findings. Be accurate and conservative - only mark signals as true if there is clear evidence."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.1,  # Low temperature for consistent analysis
            max_tokens=500,
        )
        
        # Parse response
        content = response.choices[0].message.content
        findings = json.loads(content)
        
        return {
            "success": True,
            "findings": findings,
            "model": "gpt-4.1",
            "error": None,
        }
        
    except json.JSONDecodeError as e:
        return {
            "success": False,
            "findings": {},
            "model": "gpt-4.1",
            "error": f"Failed to parse GPT response: {e}",
        }
    except Exception as e:
        return {
            "success": False,
            "findings": {},
            "model": "gpt-4.1",
            "error": str(e),
        }
