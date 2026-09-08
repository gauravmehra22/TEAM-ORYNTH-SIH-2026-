import csv
from main import predict_patient

with open("ai_phc/dataset.csv", newline="") as file:
    reader = csv.DictReader(file)

    for row in reader:
        result = predict_patient(row)

        print(row["patient_id"], "=>", result)