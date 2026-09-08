import csv
from risk_scoring import calculate_risk
from recommendation import get_recommendation
from phc_prediction import find_best_phc


def predict_patient(patient):
    score, risk = calculate_risk(patient)

    recommendation = get_recommendation(score, risk)

    phc, phc_score = find_best_phc(patient)

    return {
        "risk_score": score,
        "risk_level": risk,
        "recommended_phc": phc["phc_name"],
        "phc_score": round(phc_score, 2),
        "recommendation": recommendation
    }
