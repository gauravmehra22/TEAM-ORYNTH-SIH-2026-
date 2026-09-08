from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
from database import patients_collection, inventory_collection, referrals_collection

app = FastAPI(
    title="SEHATRA Core API Engine", 
    description="Backend microservices supporting SEHATRA Login & Data Ecosystem (SIH 2026 - PS 26133)",
    version="1.1.0"
)

# --- ALLOW YOUR FRIEND'S FRONTEND TO CONNECT ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

# --- AUTOMATIC DATA SEED FOR PRESENTATION BOOT ---
patients_collection.delete_many({})
patients_collection.insert_many([
    {
        "name": "Anandi Bai Patil (आनंदीबाई पाटील)",
        "age": 67,
        "gender": "Female",
        "village": "Shirsufal (शिरसुफळ)",
        "phone_number": "9876543210", # Acting as Health ID / Phone ID
        "password": "password123",     # Patient access password
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
        "password": "password123",
        "medical_conditions": ["Type 2 Diabetes (मधुमेह)"],
        "current_medicines": ["Metformin 500mg"],
        "allergies": ["Sulfa Drugs", "Aspirin"]
    }
])

# Mock storage table mapping valid authorized Medical Practitioner logins
DOCTOR_REGISTRY = {
    "dr_deshmukh": "securedoc789",
    "dr_patil": "sih2026"
}

# --- DATA MODELS (SCHEMAS) ---
class PatientLoginSchema(BaseModel):
    health_id: str = Field(..., example="9876543210")
    password: str = Field(..., example="password123")

class DoctorLoginSchema(BaseModel):
    username: str = Field(..., example="dr_deshmukh")
    password: str = Field(..., example="securedoc789")

class PatientSchema(BaseModel):
    name: str
    age: int
    gender: str
    village: str
    phone_number: str
    password: str = "password123"
    medical_conditions: List[str]
    current_medicines: List[str]
    allergies: List[str]

class ReferralSchema(BaseModel):
    patient_phone: str  
    referred_from: str
    referred_to: str
    triage_priority: str  
    symptoms: str

class InventoryItem(BaseModel):
    item_name: str
    qty: str
    status: str
    tier: str

# --- NEW API AUTH ENDPOINTS ---

# 1. Patient Portal Portal Gateway Link
@app.post("/api/v1/auth/patient/login")
def login_as_patient(credentials: PatientLoginSchema):
    patient = patients_collection.find_one({
        "phone_number": credentials.health_id, 
        "password": credentials.password
    }, {"_id": 0, "password": 0})
    
    if not patient:
        raise HTTPException(status_code=401, detail="Invalid Health ID or Password configuration parameters.")
    return {"role": "patient", "message": f"Welcome back, {patient['name']}", "profile": patient}

# 2. Doctor/Health Worker Gateway Link
@app.post("/api/v1/auth/doctor/login")
def login_as_doctor(credentials: DoctorLoginSchema):
    saved_password = DOCTOR_REGISTRY.get(credentials.username)
    if not saved_password or saved_password != credentials.password:
        raise HTTPException(status_code=401, detail="Invalid Doctor Username or Practitioner Key.")
    return {"role": "doctor", "message": f"Medical workspace access unlocked for account: {credentials.username}"}

# --- CORE LOGIC ENDPOINTS ---

@app.get("/")
def home():
    return {"status": "Active", "system": "SEHATRA Engine"}

@app.post("/api/v1/patients/register", response_model=PatientSchema)
def register_patient(patient: PatientSchema):
    existing = patients_collection.find_one({"phone_number": patient.phone_number})
    if existing:
        raise HTTPException(status_code=400, detail="Patient profile already linked with this phone number")
    patients_collection.insert_one(patient.dict())
    return patient

@app.get("/api/v1/patients/scan/{phone_number}")
def fetch_patient_by_qr(phone_number: str):
    patient = patients_collection.find_one({"phone_number": phone_number}, {"_id": 0, "password": 0})
    if not patient:
        raise HTTPException(status_code=404, detail="No patient found matching this tracking key")
    return patient

@app.post("/api/v1/referrals/create")
def create_referral(referral: ReferralSchema):
    new_referral = referral.dict()
    referrals_collection.insert_one(new_referral)
    return {"message": "Patient referral logged. Sent up to Specialist Dashboard queue."}

@app.get("/api/v1/inventory/status", response_model=List[InventoryItem])
def get_inventory_ledger():
    return [
        {"item_name": "Paracetamol 500mg", "qty": "450 units", "status": "In Stock", "tier": "PHC Clinic"},
        {"item_name": "O+ Blood Units", "qty": "8 bags", "status": "Available", "tier": "Regional Hub"},
        {"item_name": "On-Duty Pediatrician", "qty": "Dr. Deshmukh", "status": "Active Now", "tier": "Civil Specialist Hub"}
    ]
