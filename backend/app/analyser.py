"""
PepCheck Analyser v2.0

Sends fetched page content to GPT-4 for structured signal extraction
using the Trust Score v2.0 framework.
"""

import json
import os
from openai import AsyncOpenAI

client = AsyncOpenAI()

SYSTEM_PROMPT = """You are a peptide vendor quality assurance analyst with deep expertise in research chemical supply chains, COA documentation standards, and regulatory compliance for Research Use Only (RUO) products.

Your task is to analyse the text content from a peptide vendor's product page and extract specific trust signals. You must be precise, evidence-based, and conservative — only award points when there is clear, explicit evidence in the text. Do not infer or assume.

Return ONLY a valid JSON object. No explanation, no markdown, no preamble."""

ANALYSIS_PROMPT = """Analyse the following vendor page content and extract trust signals according to the Trust Score v2.0 framework.

**POSITIVE SIGNALS — Award points ONLY when there is clear, explicit evidence:**

- `coa_batch_specific` (+20): A Certificate of Analysis (COA) is available AND it is explicitly linked to a specific batch number, lot number, or order. The COA must be for this exact product, not a generic sample document.

- `coa_hplc` (+10): The COA or product page contains an HPLC chromatogram, HPLC data, or a purity percentage explicitly stated as measured by HPLC (e.g., "Purity: 99.2% by RP-HPLC").

- `coa_ms` (+10): The COA or product page contains Mass Spectrometry (MS) data confirming the peptide's molecular identity (observed vs. expected mass).

- `coa_third_party_accredited` (+10): The testing was performed by a named, independent third-party laboratory. Known reputable labs include: Janoshik, MZ Biolabs, Vanguard Scientific, Chromate, or any lab explicitly described as ISO 17025 accredited or UKAS accredited.

- `purity_99_verified` (+5): Purity is stated as 99% or higher AND this is supported by HPLC data (not just a text claim).

- `cas_number` (+5): The CAS registry number for the specific peptide is stated on the page.

- `molecular_info` (+5): The molecular weight (in Daltons or g/mol) and/or molecular formula is stated.

- `storage_instructions` (+5): Specific storage and handling instructions are provided (e.g., "Store at -20°C", "Keep away from light", "Use within X days of reconstitution").

- `physical_address` (+5): A verifiable physical street address for the business is provided (not a P.O. Box).

- `returns_policy` (+5): A clear returns, refund, or money-back guarantee policy is stated.

**NEGATIVE SIGNALS — Deduct points when these are present:**

- `claims_therapeutic` (-30): The page makes DIRECT claims about human health benefits, dosing instructions for humans, cycle lengths, or explicitly implies the product is for human consumption. Scientific descriptions of a peptide's known biochemical mechanisms (e.g., "involved in collagen synthesis", "studied for its role in cellular signalling") are NOT therapeutic claims — they are research context and should NOT trigger this penalty. Only flag this if the page contains language like: "helps you recover faster", "recommended dose", "inject X mg", "cycle for X weeks", "anti-aging benefits for users", "customers report", or similar consumer-facing health language.

- `sells_accessories` (-20): The vendor sells or prominently promotes clinical administration accessories such as bacteriostatic water (BAC water), syringes, needles, or reconstitution kits alongside the peptide. This indicates targeting the human-use market.

- `no_ruo_disclaimer` (-15): The page does NOT contain a clear "Research Use Only", "Not for human consumption", "Not for human use", or equivalent disclaimer. If the disclaimer IS present, set this to 0.

- `no_coa_or_generic` (-25): No COA is available for this product, OR the only COA shown is a generic sample/template document not tied to a specific batch. If a proper batch-specific COA IS present, set this to 0.

- `coa_in_house` (-10): The COA is from an unnamed lab or is explicitly described as an in-house test with no third-party verification. Only apply if a COA exists but the lab is unnamed or internal.

- `purity_unverified` (-10): A purity percentage is claimed (e.g., "99% pure") but there is NO HPLC data or chromatogram to support it — it is a text-only claim. If purity is properly verified by HPLC, set this to 0.

- `no_contact_address` (-10): No physical address AND no contact email or phone number can be found on the page or site.

- `price_unrealistic` (-5): ONLY apply if the price per mg is dramatically below the typical research-grade peptide market range. Research peptides typically cost £0.20-£2.00/mg depending on the compound. Only flag this if the price appears to be less than £0.10/mg or equivalent — a level impossible to achieve with legitimate synthesis and third-party testing. Do not apply for any normally priced product. Do NOT apply this penalty to bundle products (products sold with multiple items together), as the per-mg calculation from a bundle price is unreliable.

**VENDOR PAGE CONTENT:**

{page_content}

**Return this exact JSON structure with the point values filled in (use 0 if a signal is not present):**

{{
  "positive_signals": {{
    "coa_batch_specific": 0,
    "coa_hplc": 0,
    "coa_ms": 0,
    "coa_third_party_accredited": 0,
    "purity_99_verified": 0,
    "cas_number": 0,
    "molecular_info": 0,
    "storage_instructions": 0,
    "physical_address": 0,
    "returns_policy": 0
  }},
  "negative_signals": {{
    "claims_therapeutic": 0,
    "sells_accessories": 0,
    "no_ruo_disclaimer": 0,
    "no_coa_or_generic": 0,
    "coa_in_house": 0,
    "purity_unverified": 0,
    "no_contact_address": 0,
    "price_unrealistic": 0
  }},
  "evidence": {{
    "coa_batch_specific": "Brief quote or observation from the text that supports this score",
    "coa_hplc": "Brief quote or observation",
    "coa_ms": "Brief quote or observation",
    "coa_third_party_accredited": "Brief quote or observation",
    "claims_therapeutic": "Brief quote or observation",
    "sells_accessories": "Brief quote or observation",
    "no_coa_or_generic": "Brief quote or observation"
  }}
}}"""


async def analyse_content(page_content: str, url: str) -> dict:
    """
    Sends page content to GPT-4 for structured signal extraction.
    Returns a dict with positive_signals, negative_signals, and evidence.
    """
    from bs4 import BeautifulSoup

    # Strip HTML tags and extract clean text only
    soup = BeautifulSoup(page_content, "html.parser")

    # Remove script, style, nav, footer, and header tags — they add noise
    for tag in soup(["script", "style", "nav", "footer", "header", "noscript", "meta", "link"]):
        tag.decompose()

    # Extract clean text with whitespace normalisation
    clean_text = soup.get_text(separator="\n", strip=True)

    # Remove excessive blank lines
    lines = [line for line in clean_text.splitlines() if line.strip()]
    clean_text = "\n".join(lines)

    # Now truncate the clean text — 15,000 chars of clean text is plenty
    truncated_content = clean_text[:15000]
    print(f"[DEBUG] Clean text length: {len(clean_text)}, truncated to: {len(truncated_content)}")
    prompt = ANALYSIS_PROMPT.format(page_content=truncated_content)

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,  # Low temperature for consistent, factual analysis
            response_format={"type": "json_object"},
            max_tokens=2000
        )

        raw = response.choices[0].message.content
        result = json.loads(raw)
        return result

    except json.JSONDecodeError as e:
        raise Exception(f"GPT returned invalid JSON: {e}")
    except Exception as e:
        raise Exception(f"Analysis failed: {e}")
