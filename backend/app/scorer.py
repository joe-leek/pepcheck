"""
PepCheck Scorer v2.0

Converts the structured signal output from analyser_v2.py into a final
Trust Score, tier, and human-readable signal list.
"""

from typing import TypedDict

# --- Point values for each signal ---

POSITIVE_POINTS = {
    "coa_batch_specific": 20,
    "coa_hplc": 10,
    "coa_ms": 10,
    "coa_third_party_accredited": 10,
    "purity_99_verified": 5,
    "cas_number": 5,
    "molecular_info": 5,
    "storage_instructions": 5,
    "physical_address": 5,
    "returns_policy": 5,
}

NEGATIVE_POINTS = {
    "claims_therapeutic": -30,
    "sells_accessories": -20,
    "no_ruo_disclaimer": -15,
    "no_coa_or_generic": -25,
    "coa_in_house": -10,
    "purity_unverified": -10,
    "no_contact_address": -10,
    "price_unrealistic": -5,
}

# --- Human-readable labels for the mobile app UI ---

POSITIVE_LABELS = {
    "coa_batch_specific": "Batch-specific Certificate of Analysis",
    "coa_hplc": "HPLC chromatogram data in COA",
    "coa_ms": "Mass Spectrometry identity confirmation",
    "coa_third_party_accredited": "Independent third-party lab testing",
    "purity_99_verified": "Verified purity ≥99% (HPLC confirmed)",
    "cas_number": "CAS number provided",
    "molecular_info": "Molecular weight and formula stated",
    "storage_instructions": "Storage and handling instructions",
    "physical_address": "Verifiable physical business address",
    "returns_policy": "Returns or refund policy stated",
}

NEGATIVE_LABELS = {
    "claims_therapeutic": "Makes therapeutic or dosing claims",
    "sells_accessories": "Sells clinical administration accessories (BAC water, syringes)",
    "no_ruo_disclaimer": "No 'Research Use Only' disclaimer",
    "no_coa_or_generic": "No batch-specific COA available",
    "coa_in_house": "COA from unnamed or in-house lab only",
    "purity_unverified": "Purity claimed without HPLC verification",
    "no_contact_address": "No physical address or contact information",
    "price_unrealistic": "Price is unrealistically low for research-grade material",
}

# --- Tier definitions ---

TIERS = [
    {"min": 80, "label": "Excellent", "colour": "#27AE60", "description": "Exceptional transparency and rigorous testing. Likely a top-tier research supplier."},
    {"min": 60, "label": "Good", "colour": "#F2C94C", "description": "Meets most key criteria. Minor gaps in documentation or transparency."},
    {"min": 40, "label": "Caution", "colour": "#E67E22", "description": "Several red flags or missing key trust signals. Proceed with significant caution."},
    {"min": 0, "label": "High Risk", "colour": "#C0392B", "description": "Major red flags present. Not recommended for research purposes."},
]


def calculate_score(analysis_result: dict) -> dict:
    """
    Takes the structured output from the analyser and returns a complete
    Trust Score result ready for the mobile app.
    """
    positive_signals = analysis_result.get("positive_signals", {})
    negative_signals = analysis_result.get("negative_signals", {})
    evidence = analysis_result.get("evidence", {})

    # --- Calculate totals ---
    positive_total = 0
    negative_total = 0
    signal_list_positive = []
    signal_list_negative = []

    for key, max_points in POSITIVE_POINTS.items():
        awarded = positive_signals.get(key, 0)
        # Clamp to valid range (0 to max)
        awarded = max(0, min(awarded, max_points))
        if awarded > 0:
            positive_total += awarded
            signal_list_positive.append({
                "label": POSITIVE_LABELS[key],
                "points": awarded,
                "evidence": evidence.get(key, "")
            })

    for key, max_deduction in NEGATIVE_POINTS.items():
        deducted = negative_signals.get(key, 0)
        # Ensure it's negative or zero
        if deducted > 0:
            deducted = -deducted  # Normalise if GPT returned a positive number
        # Clamp to valid range (max_deduction to 0)
        deducted = max(max_deduction, min(deducted, 0))
        if deducted < 0:
            negative_total += deducted
            signal_list_negative.append({
                "label": NEGATIVE_LABELS[key],
                "points": deducted,
                "evidence": evidence.get(key, "")
            })

    final_score = max(0, min(100, positive_total + negative_total))

    # --- Determine tier ---
    tier = TIERS[-1]  # Default to lowest tier
    for t in TIERS:
        if final_score >= t["min"]:
            tier = t
            break

    return {
        "trust_score": final_score,
        "tier": tier["label"],
        "tier_colour": tier["colour"],
        "tier_description": tier["description"],
        "signals": {
            "positive": signal_list_positive,
            "negative": signal_list_negative,
        },
        "raw_score_breakdown": {
            "positive_total": positive_total,
            "negative_total": negative_total,
            "final_score": final_score,
        },
        "disclaimer": (
            "Pep Check is an information tool only. It does not constitute medical advice "
            "and should not be used to make decisions about human consumption of any substance. "
            "Scores are based on publicly available information at the time of analysis."
        ),
    }
