// ===== CONFIG =====
const API_BASE = 'http://localhost:8000';

// Cache of patients fetched from backend, keyed by health_id
let patientsCache = {};

// ===== ELEMENT REFERENCES =====
const loginScreen = document.getElementById('loginScreen');
const roleOptions = document.getElementById('roleOptions');
const patientLoginForm = document.getElementById('patientLoginForm');
const doctorLoginForm = document.getElementById('doctorLoginForm');
const doctorApp = document.getElementById('doctorApp');
const patientDashboard = document.getElementById('patientDashboard');

const patientModal = document.getElementById('patientModal');
const passportModal = document.getElementById('passportModal');
const patientViewer = document.getElementById('patientViewer');
const patientForm = document.getElementById('patientForm');
const patientTableBody = document.getElementById('patientTableBody');

// ===== LOGIN SCREEN LOGIC =====

document.querySelectorAll('.role-option').forEach(btn => {
  btn.addEventListener('click', () => {
    const role = btn.dataset.role;
    roleOptions.hidden = true;
    if (role === 'patient') patientLoginForm.hidden = false;
    else if (role === 'doctor') doctorLoginForm.hidden = false;
  });
});

document.querySelectorAll('[data-back-login]').forEach(btn => {
  btn.addEventListener('click', () => {
    patientLoginForm.hidden = true;
    doctorLoginForm.hidden = true;
    roleOptions.hidden = false;
  });
});

// Patient login — calls real backend
patientLoginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const health_id = document.getElementById('patientLoginId').value.trim();
  const password = document.getElementById('patientLoginPassword').value.trim();
  const errorEl = document.getElementById('patientLoginError');

  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/patient/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ health_id, password })
    });
    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.detail || 'Login failed.';
      return;
    }

    errorEl.textContent = '';
    loginScreen.hidden = true;
    patientDashboard.hidden = false;
  } catch (err) {
    errorEl.textContent = 'Could not reach the server.';
    console.error(err);
  }
});

// Doctor login — calls real backend
doctorLoginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('doctorLoginId').value.trim();
  const password = document.getElementById('doctorLoginPassword').value.trim();
  const errorEl = document.getElementById('doctorLoginError');

  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/doctor/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.detail || 'Login failed.';
      return;
    }

    errorEl.textContent = '';
    loginScreen.hidden = true;
    doctorApp.hidden = false;
    loadPatients();
    loadStats();
    loadReferrals();
  } catch (err) {
    errorEl.textContent = 'Could not reach the server.';
    console.error(err);
  }
});

document.querySelectorAll('[data-logout]').forEach(btn => {
  btn.addEventListener('click', () => {
    doctorApp.hidden = true;
    patientDashboard.hidden = true;
    patientLoginForm.hidden = true;
    doctorLoginForm.hidden = true;
    patientLoginForm.reset();
    doctorLoginForm.reset();
    roleOptions.hidden = false;
    loginScreen.hidden = false;
  });
});

// ===== DOCTOR DASHBOARD NAVIGATION =====

const viewPanels = {
  dashboard: [document.getElementById('dashboardStats'), document.getElementById('patientsPanel')],
  patients: [document.getElementById('patientsPanel')],
  referrals: [document.getElementById('referralsPanel')],
  followups: [document.getElementById('followupsPanel')],
};

document.querySelectorAll('nav a[data-view]').forEach(link => {
  link.addEventListener('click', () => {
    const view = link.dataset.view;

    if (view === 'register') {
      openPatientModal();
      return;
    }

    document.getElementById('dashboardStats').hidden = true;
    document.getElementById('patientsPanel').hidden = true;
    document.getElementById('referralsPanel').hidden = true;
    document.getElementById('followupsPanel').hidden = true;

    (viewPanels[view] || []).forEach(panel => { if (panel) panel.hidden = false; });

    document.querySelectorAll('nav a[data-view]').forEach(a => a.classList.remove('active'));
    link.classList.add('active');
  });
});

document.querySelector('.register-btn').addEventListener('click', openPatientModal);

// ===== PATIENT REGISTRATION MODAL =====

function openPatientModal() {
  patientModal.classList.add('open');
}
function closePatientModal() {
  patientModal.classList.remove('open');
  patientForm.reset();
}

document.getElementById('closeModal').addEventListener('click', closePatientModal);
document.getElementById('cancelBtn').addEventListener('click', closePatientModal);

// Helper: turn a comma-separated text field into a clean list, matching backend's List[str] fields
function toList(value) {
  return value
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

patientForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    name: document.getElementById('patientName').value,
    age: Number(document.getElementById('patientAge').value),
    gender: document.getElementById('patientGender').value,
    village: document.getElementById('patientVillage').value,
    phone_number: document.getElementById('patientPhone').value,
    medical_conditions: toList(document.getElementById('patientCondition').value),
    current_medicines: toList(document.getElementById('patientMedicine').value),
    allergies: toList(document.getElementById('patientAllergy').value),
  };

  try {
    const res = await fetch(`${API_BASE}/api/v1/patients/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.detail || 'Could not register patient.');
      return;
    }

    const newPatient = data.patient;

    showPassport({
      health_id: newPatient.health_id,
      name: newPatient.name,
      age: newPatient.age,
      gender: newPatient.gender,
      village: newPatient.village,
      condition: (newPatient.medical_conditions || []).join(', '),
      medicine: (newPatient.current_medicines || []).join(', '),
      allergy: (newPatient.allergies || []).join(', '),
    });

    closePatientModal();
    passportModal.classList.add('open');
    loadPatients();
    loadStats();
  } catch (err) {
    console.error('Failed to register patient:', err);
    alert('Could not save patient. Check that the backend server is running.');
  }
});

// ===== HEALTH PASSPORT MODAL (registration result) =====

function showPassport(p) {
  document.getElementById('displayHealthId').textContent = p.health_id || 'SH-2026-00000';
  document.getElementById('displayName').textContent = p.name || '-';
  document.getElementById('displayAge').textContent = p.age || '-';
  document.getElementById('displayGender').textContent = p.gender || '-';
  document.getElementById('displayVillage').textContent = p.village || '-';
  document.getElementById('displayCondition').textContent = p.condition || 'None reported';
  document.getElementById('displayMedicine').textContent = p.medicine || 'None reported';
  document.getElementById('displayAllergy').textContent = p.allergy || 'None reported';

  renderQrCode('qrcode', p.health_id || '');
}

document.getElementById('closePassport').addEventListener('click', () => {
  passportModal.classList.remove('open');
});

// Patient-side "View Health Passport" button
function openPatientDashboardPassport() {
  showPassport({
    health_id: 'SH-2026-00124',
    name: 'Sunita Devi',
    age: 46,
    gender: 'Female',
    village: 'Bhimtal',
    condition: 'Hypertension',
    medicine: 'Amlodipine 5mg',
    allergy: 'None reported',
  });
  passportModal.classList.add('open');
}

// ===== PATIENT DETAILS VIEWER (doctor clicking a table row) =====

function openPatient(healthId) {
  const p = patientsCache[healthId];
  if (!p) return;

  document.getElementById('viewerHealthId').textContent = p.health_id;
  document.getElementById('viewerName').textContent = p.name;
  document.getElementById('viewerAge').textContent = p.age;
  document.getElementById('viewerGender').textContent = p.gender || '-';
  document.getElementById('viewerVillage').textContent = p.village || '-';
  document.getElementById('viewerRisk').textContent = p.risk_level || 'Not assessed';
  document.getElementById('viewerCondition').textContent = (p.medical_conditions || []).join(', ') || 'None reported';
  document.getElementById('viewerMedicine').textContent = (p.current_medicines || []).join(', ') || 'None reported';
  document.getElementById('viewerAllergy').textContent = (p.allergies || []).join(', ') || 'None reported';

  renderQrCode('viewerQr', p.health_id);

  patientViewer.classList.add('open');
}

document.getElementById('closePatientViewer').addEventListener('click', () => {
  patientViewer.classList.remove('open');
});

// ===== QR CODE HELPER =====
function renderQrCode(elementId, text) {
  const el = document.getElementById(elementId);
  el.innerHTML = '';
  if (text) {
    new QRCode(el, { text, width: 120, height: 120 });
  }
}

// ===== PATIENT SEARCH =====
document.getElementById('patientSearch').addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase();
  document.querySelectorAll('#patientTableBody tr').forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(term) ? '' : 'none';
  });
});

// ===== BACKEND CALLS =====

async function loadPatients() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/patients/all`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const patients = await res.json();

    patientsCache = {};
    patientTableBody.innerHTML = '';

    patients.forEach(p => {
      patientsCache[p.health_id] = p;

      const row = document.createElement('tr');
      row.dataset.village = p.village;
      row.addEventListener('click', () => openPatient(p.health_id));
      row.innerHTML = `
        <td>${p.name}</td>
        <td>${p.health_id}</td>
        <td>${p.age}</td>
        <td><span class="risk low">${p.risk_level || 'Not assessed'}</span></td>
        <td>${p.last_visit || '-'}</td>
      `;
      patientTableBody.appendChild(row);
    });
  } catch (err) {
    console.error('Failed to load patients:', err);
  }
}

async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/stats`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const stats = await res.json();

    const cards = document.querySelectorAll('#dashboardStats .card strong');
    cards[0].textContent = stats.total_patients ?? 0;
    cards[1].textContent = stats.high_risk ?? 0;
    cards[2].textContent = stats.pending_referrals ?? 0;
    cards[3].textContent = stats.followups_due ?? 0;
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

// ===== REFERRALS =====

const referralModal = document.getElementById('referralModal');
const referralForm = document.getElementById('referralForm');

document.getElementById('newReferralBtn').addEventListener('click', () => {
  referralModal.classList.add('open');
});

function closeReferralModal() {
  referralModal.classList.remove('open');
  referralForm.reset();
}

document.getElementById('closeReferralModal').addEventListener('click', closeReferralModal);
document.getElementById('cancelReferralBtn').addEventListener('click', closeReferralModal);

referralForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    patient_health_id: document.getElementById('referralHealthId').value,
    referred_from: document.getElementById('referralFrom').value,
    referred_to: document.getElementById('referralTo').value,
    triage_priority: document.getElementById('referralPriority').value,
    symptoms: document.getElementById('referralSymptoms').value,
  };

  try {
    const res = await fetch(`${API_BASE}/api/v1/referrals/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.detail || 'Could not create referral.');
      return;
    }

    closeReferralModal();
    loadReferrals();
  } catch (err) {
    console.error('Failed to create referral:', err);
    alert('Could not save referral. Check that the backend server is running.');
  }
});

async function loadReferrals() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/referrals/all`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const referrals = await res.json();

    const list = document.getElementById('referralsList');
    list.innerHTML = '';

    referrals.forEach(r => {
      const patient = patientsCache[r.patient_health_id];
      const name = patient ? patient.name : (r.patient_health_id || 'Unknown patient');
      const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

      const priorityClass = (r.triage_priority || '').toLowerCase() === 'high' ? 'high-bg'
        : (r.triage_priority || '').toLowerCase() === 'medium' ? 'medium-bg' : 'low-bg';

      const row = document.createElement('article');
      row.className = 'detail-row';
      row.innerHTML = `
        <div class="detail-avatar ${priorityClass}">${initials}</div>
        <div class="detail-main">
          <strong>${name}</strong>
          <span>${r.referred_to} · ${r.symptoms}</span>
        </div>
        <span class="status-badge pending">${r.triage_priority || 'Pending'}</span>
        <span class="detail-date">${r.referred_from || '-'}</span>
      `;
      list.appendChild(row);
    });

    document.getElementById('referralCount').textContent = `${referrals.length} pending`;
  } catch (err) {
    console.error('Failed to load referrals:', err);
  }
}