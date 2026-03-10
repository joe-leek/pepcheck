import os
import json
from openai import OpenAI
from bs4 import BeautifulSoup

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))


def extract_text(html: str) -> str:
    """Extract visible text from HTML, removing scripts, styles, and navigation."""
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    return soup.get_text(separator=" ", strip=True)[:8000]


async def analyse_with_gpt(page_content: str) -> dict:
    """Analyse the vendor page content using GPT-4 and extract signals for scoring."""
    
    clean_text = extract_text(page_content)
    
    prompt = f"""Analyse this peptide/research chemical vendor page and extract quality signals.

PAGE CONTENT:
{clean_text}

Return a JSON object with these exact boolean keys (true if the signal is present/found):

{{
    "coa_batch_specific": false,       // COA linked to specific batch/lot number
    "coa_third_party_lab": false,      // COA mentions a named third-party lab
    "coa_hplc_chromatogram": false,    // HPLC chromatogram image or data present
    "coa_ms_data": false,              // Mass spectrometry data present
    "lab_accredited": false,           // Lab has ISO, CLIA, or similar accreditation
    "cgmp_certified": false,           // Manufacturer has cGMP/GMP certification
    "cas_number_present": false,       // CAS registry number provided
    "molecular_info_present": false,   // Molecular weight/formula stated
    "storage_instructions": false,     // Storage/handling instructions present
    "scientific_references": false,    // Scientific papers or citations
    "contact_info_transparent": false, // Clear address and contact info
    "return_policy_present": false,    // Return/refund policy stated
    "multiple_payment_methods": false, // Accepts card AND other methods
    "no_coa": false,                   // No COA available at all
    "coa_generic": false,              // COA is generic, not lot-matched
    "medical_claims": false,           // Makes therapeutic/medical claims
    "human_dosing_instructions": false,// Provides human dosing/injection instructions
    "crypto_only_payment": false,      // Only accepts cryptocurrency
    "vague_lab_tested_claim": false,   // Says "lab tested" with no details
    "no_contact_info": false,          // No contact info or anonymous
    "no_return_policy": false          // No return policy stated
}}

Return ONLY valid JSON, no explanation."""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )
    
    return json.loads(response.choices[0].message.content)
