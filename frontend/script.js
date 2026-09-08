const registerButton = document.querySelector(".register-btn");

const modal = document.getElementById("patientModal");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");

const patientForm = document.getElementById("patientForm");

const passportModal = document.getElementById("passportModal");
const closePassport = document.getElementById("closePassport");
const navigationLinks = document.querySelectorAll("nav a[data-view]");
const dashboardStats = document.getElementById("dashboardStats");
const patientsPanel = document.getElementById("patientsPanel");
const referralsPanel = document.getElementById("referralsPanel");
const followupsPanel = document.getElementById("followupsPanel");
const pageTitle = document.querySelector("header h1");
const pageDescription = document.querySelector("header p");
const loginScreen = document.getElementById("loginScreen");
const doctorApp = document.getElementById("doctorApp");
const patientDashboard = document.getElementById("patientDashboard");
const roleOptions = document.getElementById("roleOptions");
const patientLoginForm = document.getElementById("patientLoginForm");
const doctorLoginForm = document.getElementById("doctorLoginForm");
const logoutButtons = document.querySelectorAll("[data-logout]");
const patientLoginError = document.getElementById("patientLoginError");
const doctorLoginError = document.getElementById("doctorLoginError");
const patientSearch = document.getElementById("patientSearch");

const demoCredentials = {
    patient: { id: "SH-2026-00124", password: "patient123" },
    doctor: { id: "doctor", password: "doctor123" }
};

function showLogin() {
    loginScreen.hidden = false;
    doctorApp.hidden = true;
    patientDashboard.hidden = true;
    modal.style.display = "none";
    passportModal.style.display = "none";
    roleOptions.hidden = false;
    patientLoginForm.hidden = true;
    doctorLoginForm.hidden = true;
    patientLoginError.textContent = "";
    doctorLoginError.textContent = "";
}

function showRoleLogin(role) {
    roleOptions.hidden = true;
    patientLoginForm.hidden = role !== "patient";
    doctorLoginForm.hidden = role !== "doctor";
}

function showAuthenticatedApp(role) {
    loginScreen.hidden = true;
    doctorApp.hidden = role !== "doctor";
    patientDashboard.hidden = role !== "patient";
    sessionStorage.setItem("sehatrarole", role);
}

function authenticate(role, id, password) {
    const credentials = demoCredentials[role];
    return id.trim().toLowerCase() === credentials.id.toLowerCase() && password === credentials.password;
}

roleOptions.querySelectorAll("[data-role]").forEach(function (option) {
    option.addEventListener("click", function () {
        showRoleLogin(option.dataset.role);
    });
});

document.querySelectorAll("[data-back-login]").forEach(function (button) {
    button.addEventListener("click", showLogin);
});

patientLoginForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const valid = authenticate("patient", document.getElementById("patientLoginId").value, document.getElementById("patientLoginPassword").value);

    if (!valid) {
        patientLoginError.textContent = "Use the demo Health ID and password shown above.";
        return;
    }

    showAuthenticatedApp("patient");
});

doctorLoginForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const valid = authenticate("doctor", document.getElementById("doctorLoginId").value, document.getElementById("doctorLoginPassword").value);

    if (!valid) {
        doctorLoginError.textContent = "Use the demo username and password shown above.";
        return;
    }

    showAuthenticatedApp("doctor");
});

logoutButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        sessionStorage.removeItem("sehatrarole");
        showLogin();
    });
});

const viewDetails = {
    dashboard: {
        title: "Dashboard Overview",
        description: "Track patients, referrals, and follow-ups from one place."
    },
    patients: {
        title: "Patients",
        description: "View patient records and open a digital health passport."
    },
    referrals: {
        title: "Referrals",
        description: "Monitor referrals and coordinate the next step in care."
    },
    followups: {
        title: "Follow-ups",
        description: "Stay on top of upcoming visits and care actions."
    }
};

function showView(viewName) {
    const details = viewDetails[viewName];

    if (!details) {
        return;
    }

    navigationLinks.forEach(function (link) {
        link.classList.toggle("active", link.dataset.view === viewName);
    });

    pageTitle.textContent = details.title;
    pageDescription.textContent = details.description;
    dashboardStats.style.display = viewName === "dashboard" ? "grid" : "none";
    patientsPanel.hidden = !["dashboard", "patients"].includes(viewName);
    referralsPanel.hidden = viewName !== "referrals";
    followupsPanel.hidden = viewName !== "followups";
}

navigationLinks.forEach(function (link) {
    link.addEventListener("click", function () {
        const viewName = link.dataset.view;

        if (viewName === "register") {
            navigationLinks.forEach(function (navLink) {
                navLink.classList.toggle("active", navLink === link);
            });
            modal.style.display = "flex";
            return;
        }

        showView(viewName);
    });
});


/* Open Registration Form */

registerButton.addEventListener("click", function () {
    if (sessionStorage.getItem("sehatrarole") !== "doctor") {
        return;
    }

    modal.style.display = "flex";
});


/* Close Registration Form */

closeModal.addEventListener("click", function () {
    modal.style.display = "none";
});

cancelBtn.addEventListener("click", function () {
    modal.style.display = "none";
});


/* Register Patient */

patientForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const name = document.getElementById("patientName").value;
    const age = document.getElementById("patientAge").value;
    const gender = document.getElementById("patientGender").value;
    const village = document.getElementById("patientVillage").value;
    const condition = document.getElementById("patientCondition").value;
    const medicine = document.getElementById("patientMedicine").value;
    const allergy = document.getElementById("patientAllergy").value;

    const healthId =
        "SH-2026-" +
        Math.floor(10000 + Math.random() * 90000);


    /* Put patient information into passport */

    document.getElementById("displayName").textContent = name;
    document.getElementById("displayAge").textContent = age;
    document.getElementById("displayGender").textContent = gender;
    document.getElementById("displayVillage").textContent = village;

    document.getElementById("displayCondition").textContent =
        condition || "None reported";

    document.getElementById("displayMedicine").textContent =
        medicine || "None reported";

    document.getElementById("displayAllergy").textContent =
        allergy || "None reported";

    document.getElementById("displayHealthId").textContent = healthId;


    /* Generate QR Code */

    const qrContainer = document.getElementById("qrcode");

    qrContainer.innerHTML = "";

    const patientData = {
    id: healthId,
    name: name,
    age: age,
    gender: gender,
    village: village,
    condition: condition || "None reported",
    medicine: medicine || "None reported",
    allergy: allergy || "None reported"
};

const patientLink =
    window.location.origin +
    window.location.pathname +
    "#patient=" +
    encodeURIComponent(JSON.stringify(patientData));

new QRCode(qrContainer, {
    text: patientLink,
    width: 100,
    height: 100
});


    /* Close registration form */

    modal.style.display = "none";

    patientForm.reset();


    /* Open Health Passport */

    passportModal.style.display = "flex";
});


/* Close Health Passport */

closePassport.addEventListener("click", function () {
    passportModal.style.display = "none";
});/* ============================= */
/* PATIENT LIST → HEALTH PASSPORT */
/* ============================= */

const patientViewer = document.getElementById("patientViewer");
const closePatientViewer =
    document.getElementById("closePatientViewer");


/* Dummy patient database */

const patients = {

    "Sunita Devi": {
        id: "SH-2026-00124",
        age: "46",
        gender: "Female",
        village: "Bhimtal",
        risk: "High",
        condition: "Hypertension",
        medicine: "Amlodipine 5mg",
        allergy: "None reported"
    },

    "Ramesh Kumar": {
        id: "SH-2026-00125",
        age: "52",
        gender: "Male",
        village: "Bhowali",
        risk: "Medium",
        condition: "Type 2 Diabetes",
        medicine: "Metformin 500mg",
        allergy: "Penicillin"
    },

    "Anita Rawat": {
        id: "SH-2026-00126",
        age: "29",
        gender: "Female",
        village: "Naukuchiatal",
        risk: "Low",
        condition: "None reported",
        medicine: "None",
        allergy: "None reported"
    }

};


/* Find patient table */

const patientRows = document.querySelectorAll("tbody tr");

patientSearch.addEventListener("input", function () {
    const searchTerm = patientSearch.value.trim().toLowerCase();

    patientRows.forEach(function (row) {
        const rowText = [
            row.querySelector("td").textContent,
            row.querySelectorAll("td")[1].textContent,
            row.dataset.village
        ].join(" ").toLowerCase();

        row.hidden = searchTerm !== "" && !rowText.includes(searchTerm);
    });
});


/* Make every patient row clickable */

patientRows.forEach(function(row) {

    row.style.cursor = "pointer";

    row.addEventListener("click", function() {

        const patientName =
            row.querySelector("td").textContent.trim();

        const patient = patients[patientName];

        if (!patient) {
            alert("Patient record not available.");
            return;
        }


        /* Fill Health Passport */

        document.getElementById("viewerHealthId").textContent =
            patient.id;

        document.getElementById("viewerName").textContent =
            patientName;

        document.getElementById("viewerAge").textContent =
            patient.age;

        document.getElementById("viewerGender").textContent =
            patient.gender;

        document.getElementById("viewerVillage").textContent =
            patient.village;

        document.getElementById("viewerRisk").textContent =
            patient.risk;

        document.getElementById("viewerCondition").textContent =
            patient.condition;

        document.getElementById("viewerMedicine").textContent =
            patient.medicine;

        document.getElementById("viewerAllergy").textContent =
            patient.allergy;


        /* Generate QR */

        const qr = document.getElementById("viewerQr");

        qr.innerHTML = "";

        new QRCode(qr, {
            text: patient.id,
            width: 100,
            height: 100
        });


        /* Open passport */

        patientViewer.style.display = "flex";

    });

});


/* Close passport */

closePatientViewer.addEventListener("click", function() {

    patientViewer.style.display = "none";

});

function openPatient(name, healthId, age) {

    if (sessionStorage.getItem("sehatrarole") !== "doctor") {
        return;
    }

    document.getElementById("displayName").textContent = name;
    document.getElementById("displayHealthId").textContent = healthId;
    document.getElementById("displayAge").textContent = age;

    document.getElementById("passportModal").style.display = "flex";
}

function openPatientDashboardPassport() {
    if (sessionStorage.getItem("sehatrarole") !== "patient") {
        return;
    }

    const patient = patients["Sunita Devi"];
    document.getElementById("displayName").textContent = "Sunita Devi";
    document.getElementById("displayHealthId").textContent = patient.id;
    document.getElementById("displayAge").textContent = patient.age;
    document.getElementById("displayGender").textContent = patient.gender;
    document.getElementById("displayVillage").textContent = patient.village;
    document.getElementById("displayCondition").textContent = patient.condition;
    document.getElementById("displayMedicine").textContent = patient.medicine;
    document.getElementById("displayAllergy").textContent = patient.allergy;

    const qrContainer = document.getElementById("qrcode");
    qrContainer.innerHTML = "";
    new QRCode(qrContainer, {
        text: patient.id,
        width: 100,
        height: 100
    });

    passportModal.style.display = "flex";
}

const savedRole = sessionStorage.getItem("sehatrarole");
if (savedRole === "doctor" || savedRole === "patient") {
    showAuthenticatedApp(savedRole);
} else {
    showLogin();
}