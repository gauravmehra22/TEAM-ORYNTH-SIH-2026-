import csv

def find_best_phc(patient):
    best_phc = None
    best_score = -1

    with open("ai_phc/phc_data.csv", newline="") as file:
        reader = csv.DictReader(file)

        for row in reader:
            phc_id = row["phc_id"]

            if phc_id == "PHC01":
                distance = float(patient["distance_phc01_km"])
            elif phc_id == "PHC02":
                distance = float(patient["distance_phc02_km"])
            elif phc_id == "PHC03":
                distance = float(patient["distance_phc03_km"])

            load = float(row["current_load"])
            doctors = int(row["available_doctors"])

            score = (100 - load) * 0.4 + (doctors * 10) * 0.3 - distance * 5

            

            if score > best_score:
                best_score = score
                best_phc = row

    return best_phc, best_score