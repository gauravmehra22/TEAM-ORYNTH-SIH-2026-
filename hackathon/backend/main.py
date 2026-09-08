from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from database import patients_collection, inventory_collection, referrals_collection
import random

app = FastAPI(
    title="SEHATRA Core API Engine",
    description="Backend services for SEHATRA Rural Healthcare Platform",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# =======================================================
# DEMO PATIENT DATA
# =======================================================

patients_collection.delete_many({})

patients_collection.insert_many([
    {
        "health_id": "SH-2026-00124",
        "name": "Sunita Devi",
        "age": 46,
        "gender": "Female",
        "village": "Bhimtal",
        "phone_number": "9876543210",
        "password": "patient123",
        "medical_conditions": ["Hypertension"],
        "current_medicines": ["Amlodipine 5mg"],
        "allergies": ["None reported"]
    },
    {
        "health_id": "SH-2026-00125",
        "name": "Ramesh Kumar",
        "age": 52,
        "gender": "Male",
        "village": "Bhowali",
        "phone_number": "9123456789",
        "password": "patient123",
        "medical_conditions": ["Type 2 Diabetes"],
        "current_medicines": ["Metformin 500mg"],
        "allergies": ["Penicillin"]
    },
    {
        "health_id": "SH-2026-00126",
        "name": "Anita Rawat",
        "age": 29,
        "gender": "Female",
        "village": "Naukuchiatal",
        "phone_number": "9988776655",
        "password": "patient123",
        "medical_conditions": [],
        "current_medicines": [],
        "allergies": []
    }
])


# =======================================================
# DEMO DOCTOR ACCOUNTS
# =======================================================

DOCTOR_REGISTRY = {
    "doctor": "doctor123",
    "dr_deshmukh": "securedoc789",
    "dr_patil": "sih2026"
}


# =======================================================
# DATA MODELS
# =======================================================

class PatientLoginSchema(BaseModel):
    health_id: str
    password: str


class DoctorLoginSchema(BaseModel):
    username: str
    password: str


class PatientSchema(BaseModel):
    health_id: Optional[str] = None
    name: str
    age: int
    gender: str
    village: str
    phone_number: str
    password: str = "patient123"
    medical_conditions: List[str] = []
    current_medicines: List[str] = []
    allergies: List[str] = []


class ReferralSchema(BaseModel):
    patient_health_id: Optional[str] = None
    patient_phone: Optional[str] = None
    referred_from: str
    referred_to: str
    triage_priority: str
    symptoms: str


class InventoryItem(BaseModel):
    item_name: str
    qty: str
    status: str
    tier: str


# =======================================================
# REMOVE PASSWORD BEFORE SENDING PATIENT DATA
# =======================================================

def public_patient(patient):

    if not patient:
        return None

    safe_patient = dict(patient)

    safe_patient.pop("password", None)
    safe_patient.pop("_id", None)

    return safe_patient


# =======================================================
# HEALTH CHECK
# =======================================================

@app.get("/")
def home():

    return {
        "status": "Active",
        "system": "SEHATRA Engine",
        "version": "2.0.0",
        "message": "SEHATRA backend is running successfully."
    }


# =======================================================
# PATIENT LOGIN
# =======================================================

@app.post("/api/v1/auth/patient/login")
def login_as_patient(credentials: PatientLoginSchema):

    patient = patients_collection.find_one({
        "health_id": credentials.health_id
    })

    if not patient:

        raise HTTPException(
            status_code=401,
            detail="Invalid Health ID or Password."
        )

    if patient.get("password") != credentials.password:

        raise HTTPException(
            status_code=401,
            detail="Invalid Health ID or Password."
        )

    return {
        "role": "patient",
        "message": f"Welcome back, {patient.get('name', 'Patient')}",
        "profile": public_patient(patient)
    }


# =======================================================
# DOCTOR LOGIN
# =======================================================

@app.post("/api/v1/auth/doctor/login")
def login_as_doctor(credentials: DoctorLoginSchema):

    saved_password = DOCTOR_REGISTRY.get(credentials.username)

    if not saved_password:

        raise HTTPException(
            status_code=401,
            detail="Invalid Doctor Username or Practitioner Key."
        )

    if saved_password != credentials.password:

        raise HTTPException(
            status_code=401,
            detail="Invalid Doctor Username or Practitioner Key."
        )

    return {
        "role": "doctor",
        "message": "Medical workspace access unlocked.",
        "doctor": credentials.username
    }


# =======================================================
# REGISTER PATIENT
# =======================================================

@app.post("/api/v1/patients/register")
def register_patient(patient: PatientSchema):

    health_id = patient.health_id

    if not health_id:

        health_id = (
            "SH-2026-" +
            str(random.randint(10000, 99999))
        )

    existing_health_id = patients_collection.find_one({
        "health_id": health_id
    })

    if existing_health_id:

        raise HTTPException(
            status_code=400,
            detail="Health ID already exists."
        )

    existing_phone = patients_collection.find_one({
        "phone_number": patient.phone_number
    })

    if existing_phone:

        raise HTTPException(
            status_code=400,
            detail="Patient profile already linked with this phone number."
        )

    new_patient = {
        "health_id": health_id,
        "name": patient.name,
        "age": patient.age,
        "gender": patient.gender,
        "village": patient.village,
        "phone_number": patient.phone_number,
        "password": patient.password,
        "medical_conditions": patient.medical_conditions,
        "current_medicines": patient.current_medicines,
        "allergies": patient.allergies
    }

    patients_collection.insert_one(new_patient)

    return {
        "message": "Patient registered successfully.",
        "patient": public_patient(new_patient)
    }
# =======================================================
# LIST ALL PATIENTS
# =======================================================

@app.get("/api/v1/patients/all")
def get_all_patients():
    patients = patients_collection.find({})
    return [public_patient(p) for p in patients]


# =======================================================
# DASHBOARD STATS
# =======================================================

@app.get("/api/v1/stats")
def get_stats():
    return {
        "total_patients": len(patients_collection.data),
        "high_risk": 0,          # no risk field in your data yet — placeholder
        "pending_referrals": len(referrals_collection.data),
        "followups_due": 0       # no follow-up tracking yet — placeholder
    }

# =======================================================
# QR / HEALTH PASSPORT LOOKUP
# =======================================================

@app.get("/api/v1/patients/scan/{tracking_key}")
def fetch_patient_by_qr(tracking_key: str):

    patient = patients_collection.find_one({
        "health_id": tracking_key
    })

    if not patient:

        patient = patients_collection.find_one({
            "phone_number": tracking_key
        })

    if not patient:

        raise HTTPException(
            status_code=404,
            detail="No patient found matching this Health ID."
        )

    return public_patient(patient)


# =======================================================
# CREATE REFERRAL
# =======================================================

@app.post("/api/v1/referrals/create")
def create_referral(referral: ReferralSchema):

    new_referral = {
        "patient_health_id": referral.patient_health_id,
        "patient_phone": referral.patient_phone,
        "referred_from": referral.referred_from,
        "referred_to": referral.referred_to,
        "triage_priority": referral.triage_priority,
        "symptoms": referral.symptoms
    }

    referrals_collection.insert_one(new_referral)

    return {
        "message": "Patient referral logged. Sent up to Specialist Dashboard queue."
    }


# =======================================================
# INVENTORY STATUS
# =======================================================

@app.get(
    "/api/v1/inventory/status",
    response_model=List[InventoryItem]
)
def get_inventory_ledger():

    return [
        {
            "item_name": "Paracetamol 500mg",
            "qty": "450 units",
            "status": "In Stock",
            "tier": "PHC Clinic"
        },
        {
            "item_name": "O+ Blood Units",
            "qty": "8 bags",
            "status": "Available",
            "tier": "Regional Hub"
        },
        {
            "item_name": "On-Duty Pediatrician",
            "qty": "Dr. Deshmukh",
            "status": "Active Now",
            "tier": "Civil Specialist Hub"
        }
    ]