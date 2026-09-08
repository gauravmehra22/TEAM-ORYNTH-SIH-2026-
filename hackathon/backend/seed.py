import pymongo

# Connect to your local running MongoDB instance
client = pymongo.MongoClient("mongodb://localhost:27017")
db = client["sehatra_db"]
patients_collection = db["patients"]

# Clear existing entries so we don't duplicate records on re-runs
patients_collection.delete_many({})

# 3 Mock Rural Patients with your exact 8 fields
mock_patients = [
    {
        "name": "Anandi Bai Patil (आनंदीबाई पाटील)",
        "age": 67,
        "gender": "Female",
        "village": "Shirsufal (शिरसुफळ)",
        "phone_number": "9876543210",
        "medical_conditions": ["Hypertension (उच्च रक्तदाब)", "Osteoarthritis"],
        "current_medicines": ["Amlodipine 5mg", "Calcium Supplements"],
        "allergies": ["Penicillin"]
    },
    {
        "name": "Tukaram Ramdas Shinde (तुकाराम शिंदे)",
        "age": 72,
        "gender": "Male",
        "village": "Morgaon (मोरगाव)",
        "phone_number": "9123456789",
        "medical_conditions": ["Type 2 Diabetes (मधुमेह)"],
        "current_medicines": ["Metformin 500mg"],
        "allergies": ["Sulfa Drugs", "Aspirin"]
    },
    {
        "name": "Sunita Vitthal Kale (सुनिता काळे)",
        "age": 58,
        "gender": "Female",
        "village": "Jalochi (जळोची)",
        "phone_number": "9988776655",
        "medical_conditions": ["Asthma (दमा)", "Anemia"],
        "current_medicines": ["Salbutamol Inhaler", "Iron Tablets"],
        "allergies": ["None"]
    }
]

# Insert records into MongoDB
result = patients_collection.insert_many(mock_patients)
print(f"🎉 Success! Successfully injected {len(result.inserted_ids)} rural patient profiles into sehatra_db.")
