from dataclasses import dataclass
from typing import Dict


@dataclass
class ScoringSignal:
    label: str
    points: int
    found: bool


def calculate_trust_score(signals: Dict[str, bool], price_ratio: float = 1.0) -> dict:
    scoring_rules = [
        ScoringSignal("Batch-specific Certificate of Analysis (COA)", +15, signals.get("coa_batch_specific", False)),
        ScoringSignal("COA from named third-party lab", +15, signals.get("coa_third_party_lab", False)),
        ScoringSignal("HPLC chromatogram present in COA", +10, signals.get("coa_hplc_chromatogram", False)),
        ScoringSignal("Mass spectrometry (MS) data present", +8, signals.get("coa_ms_data", False)),
        ScoringSignal("Lab is ISO or CLIA accredited", +7, signals.get("lab_accredited", False)),
        ScoringSignal("cGMP or GMP manufacturer certification", +5, signals.get("cgmp_certified", False)),
        ScoringSignal("CAS number provided", +4, signals.get("cas_number_present", False)),
        ScoringSignal("Molecular weight and formula stated", +3, signals.get("molecular_info_present", False)),
        ScoringSignal("Storage and handling instructions present", +3, signals.get("storage_instructions", False)),
        ScoringSignal("Scientific references or citations", +3, signals.get("scientific_references", False)),
        ScoringSignal("Clear contact information and address", +3, signals.get("contact_info_transparent", False)),
        ScoringSignal("Return or refund policy stated", +2, signals.get("return_policy_present", False)),
        ScoringSignal("Multiple payment methods accepted", +2, signals.get("multiple_payment_methods", False)),
        ScoringSignal("No COA available at all", -20, signals.get("no_coa", False)),
        ScoringSignal("Generic or non-lot-matched COA", -10, signals.get("coa_generic", False)),
        ScoringSignal("Makes medical or therapeutic claims", -20, signals.get("medical_claims", False)),
        ScoringSignal("Provides dosing or injection instructions for humans", -15, signals.get("human_dosing_instructions", False)),
        ScoringSignal("Crypto-only payment (no card/bank option)", -8, signals.get("crypto_only_payment", False)),
        ScoringSignal("'Lab tested' claim with no method or lab named", -5, signals.get("vague_lab_tested_claim", False)),
        ScoringSignal("No contact information or anonymous seller", -8, signals.get("no_contact_info", False)),
        ScoringSignal("No return or refund policy", -3, signals.get("no_return_policy", False)),
    ]

    if price_ratio < 0.6:
        scoring_rules.append(ScoringSignal("Price more than 40% below market median", -10, True))
    elif price_ratio > 2.0:
        scoring_rules.append(ScoringSignal("Price more than 100% above market median", +2, True))

    positive = [s for s in scoring_rules if s.points > 0 and s.found]
    negative = [s for s in scoring_rules if s.points < 0 and s.found]

    positive_total = sum(s.points for s in positive)
    negative_total = sum(s.points for s in negative)
    final_score = max(0, min(100, positive_total + negative_total))

    if final_score >= 80:
        tier, tier_colour = "Verified", "#27AE60"
    elif final_score >= 60:
        tier, tier_colour = "Credible", "#2980B9"
    elif final_score >= 40:
        tier, tier_colour = "Caution", "#F39C12"
    elif final_score >= 20:
        tier, tier_colour = "Unverified", "#E67E22"
    else:
        tier, tier_colour = "High Risk", "#C0392B"

    return {
        "trust_score": final_score,
        "tier": tier,
        "tier_colour": tier_colour,
        "signals": {
            "positive": [{"label": s.label, "points": s.points} for s in positive],
            "negative": [{"label": s.label, "points": s.points} for s in negative],
        },
        "raw_score_breakdown": {
            "positive_total": positive_total,
            "negative_total": negative_total,
            "final_score": final_score,
        },
        "disclaimer": "Pep Check is an information tool only. It does not constitute medical advice and should not be used to make decisions about human consumption of any substance."
    }
