"""
Trust Score calculation for PepCheck.
"""

from typing import Dict, List, Tuple

# Positive signals (add points)
POSITIVE_SIGNALS = {
    "batch_specific_coa": ("Batch-specific COA available", 15),
    "third_party_lab": ("COA from named third-party lab", 15),
    "hplc_chromatogram": ("COA contains HPLC chromatogram", 15),
    "ms_data": ("COA contains Mass Spectrometry data", 15),
    "lab_accredited": ("Lab is accredited (ISO 17025/UKAS)", 10),
    "manufacturer_certified": ("Manufacturer is cGMP or ISO 9001 certified", 8),
    "cas_number": ("CAS number provided", 4),
    "molecular_info": ("Molecular formula and weight provided", 4),
    "storage_instructions": ("Detailed storage and reconstitution instructions", 4),
    "scientific_references": ("Scientific references provided", 5),
}

# Negative signals (deduct points)
NEGATIVE_SIGNALS = {
    "no_coa": ("No COA available", -20),
    "generic_coa": ("Generic or non-lot-matched COA", -10),
    "medical_claims": ("Makes medical or therapeutic claims", -20),
    "dosing_instructions": ("Provides human dosing instructions", -15),
    "price_below_market": ("Price more than 40% below market median", -10),
    "lab_tested_no_method": ("'Lab tested' claim with no method stated", -5),
}

# Score tiers
TIERS = [
    (80, 100, "Verified", "This vendor demonstrates excellent documentation and transparency."),
    (60, 79, "Credible", "This vendor shows good documentation practices."),
    (40, 59, "Caution", "This vendor has some documentation gaps. Verify independently."),
    (20, 39, "Unverified", "This vendor lacks adequate documentation. Exercise caution."),
    (0, 19, "High Risk", "This vendor shows significant red flags. Not recommended."),
]


def calculate_trust_score(findings: Dict[str, bool]) -> Dict:
    """
    Calculate Trust Score from GPT-4.1 findings.
    
    Args:
        findings: Dict of signal keys to boolean values
        
    Returns:
        Dict with trust_score, tier, tier_description, and signal breakdowns
    """
    base_score = 50
    positive_found = []
    negative_found = []
    
    # Process positive signals
    for key, (description, points) in POSITIVE_SIGNALS.items():
        if findings.get(key, False):
            positive_found.append({"signal": description, "points": points})
            base_score += points
    
    # Process negative signals
    for key, (description, points) in NEGATIVE_SIGNALS.items():
        if findings.get(key, False):
            negative_found.append({"signal": description, "points": points})
            base_score += points  # points are already negative
    
    # Clamp score to 0-100
    trust_score = max(0, min(100, base_score))
    
    # Determine tier
    tier = "Unknown"
    tier_description = ""
    for min_score, max_score, tier_name, description in TIERS:
        if min_score <= trust_score <= max_score:
            tier = tier_name
            tier_description = description
            break
    
    return {
        "trust_score": trust_score,
        "tier": tier,
        "tier_description": tier_description,
        "signals": {
            "positive": positive_found,
            "negative": negative_found,
        },
        "base_score": 50,
        "points_added": sum(s["points"] for s in positive_found),
        "points_deducted": sum(s["points"] for s in negative_found),
    }
