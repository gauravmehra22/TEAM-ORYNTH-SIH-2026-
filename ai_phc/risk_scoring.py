import csv
from recommendation import get_recommendation
def calculate_risk(patient):
    

    patient["bp_systolic"] = float(patient["bp_systolic"])
    patient["bp_diastolic"] = float(patient["bp_diastolic"])
    patient["hemoglobin"] = float(patient["hemoglobin"])
    patient["blood_sugar"] = float(patient["blood_sugar"])
    patient["temperature"] = float(patient["temperature"])
    patient["previous_complication"] = int(patient["previous_complication"])

    
    score = 0

    if patient["bp_systolic"] >= 140:
        score += 25

    if patient["bp_diastolic"] >= 90:
        score += 15

    if patient["hemoglobin"] < 10:
        score += 20

    if patient["blood_sugar"] >= 140:
        score += 15

    if patient["temperature"] >= 100.4:
        score += 10

    if patient["previous_complication"] == 1:
        score += 15

    if score >= 60:
        risk = "High"
    elif score >= 30:
        risk = "Medium"
    else:
        risk = "Low"

    return score, risk
