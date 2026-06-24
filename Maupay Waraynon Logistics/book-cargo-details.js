// Import the necessary Firebase SDK functions matching your dashboard environment
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, doc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// =========================================================
// FIREBASE CONFIGURATION & INITIALIZATION
// =========================================================
const firebaseConfig = {
    apiKey: "AIzaSyBVUVvHJfsZGvaZmOq2Sz23kI8dnml4dI0",
    authDomain: "mpc-bacoor.firebaseapp.com",
    databaseURL: "https://mpc-bacoor-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "mpc-bacoor",
    storageBucket: "mpc-bacoor.firebasestorage.app",
    messagingSenderId: "105917197007",
    appId: "1:105917197007:web:ec34d45a969be00a30e5ba",
    measurementId: "G-GSF6CFML1Y"
};

// Initialize Core Engines
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
    const cargoDetailsForm = document.getElementById("cargoDetailsForm");
    const btnBackToSelection = document.getElementById("btnBackToSelection");
    const profileAvatar = document.getElementById("profileAvatar");
    const avatarTooltip = document.getElementById("avatarTooltip");

    //Capture tracking context securely
    let currentAuthenticatedUID = "oZ55xPFsSYWyVTD5R8G1kYmx43";
    
    //PROFILE AVATAR DISPLAY INITIALIZER
    const savedAccountRaw = localStorage.getItem('dummyTestingAccount');
    if (savedAccountRaw && profileAvatar) {
        const userAccount = JSON.parse(savedAccountRaw);
        if (userAccount.firstName) {
            profileAvatar.innerText = userAccount.firstName.charAt(0).toUpperCase();
        }
    }

    // =========================================================
    // Section 1 LIVE FIRESTORE CUSTOMER SYNC ENGINE
    // =========================================================
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentAuthenticatedUID = user.uid; 
            console.log("Firebase Auth detected active UID:", currentAuthenticatedUID);

            if (profileAvatar) {
                const userDocRef = doc(db, "Customer", user.uid);
                
                getDoc(userDocRef).then((docSnapshot) => {
                    if (docSnapshot.exists()) {
                        const userData = docSnapshot.data();
                        console.log("Profile data retrieved successfully:", userData);
                        
                        // Update main text circle letter initial
                        if (userData && userData.firstName) {
                            profileAvatar.innerText = userData.firstName.charAt(0).toUpperCase();
                        }

                        // 🔒 SAFETY GUARD: Populate Tooltip fields ONLY if it exists in HTML
                        if (avatarTooltip) {
                            const nameEl = avatarTooltip.querySelector(".tooltip-name");
                            const emailEl = avatarTooltip.querySelector(".tooltip-email");

                            const fName = userData.firstName || "";
                            const lName = userData.lastName || "";
                            const email = userData.emailAddress || user.email || "";

                            if (nameEl) nameEl.innerText = `${fName} ${lName}`.trim();
                            if (emailEl) emailEl.innerText = email;
                        }
                    } else if (user.displayName) {
                        // Auth display name backup fallback channel
                        profileAvatar.innerText = user.displayName.charAt(0).toUpperCase();
                        
                        // 🔒 SAFETY GUARD: Backup channel check
                        if (avatarTooltip) {
                            const nameEl = avatarTooltip.querySelector(".tooltip-name");
                            const emailEl = avatarTooltip.querySelector(".tooltip-email");
                            if (nameEl) nameEl.innerText = user.displayName;
                            if (emailEl) emailEl.innerText = user.email || "";
                        }
                    }
                }).catch((error) => {
                    console.error("Error reading profile document from Cloud Firestore:", error);
                });
            }
        } else {
            console.warn("No active auth state detected on page load.");
        }
    });


    if (btnBackToSelection) {
        btnBackToSelection.addEventListener("click", () => {
            window.location.href = "book-shipment.html";
        });
    }

    //INLINE LOGICAL FIELD VALIDATION ERROR GENERATION
    function showInlineError(inputElement, message) {
        removeInlineError(inputElement);
        const errorSpan = document.createElement("span");
        errorSpan.className = "error-note";
        errorSpan.textContent = message;
        inputElement.parentElement.appendChild(errorSpan);
        inputElement.style.borderColor = "#dc2626";
    }

    function removeInlineError(inputElement) {
        const existingNote = inputElement.parentElement.querySelector(".error-note");
        if (existingNote) existingNote.remove();
        inputElement.style.borderColor = "";
    }

    // Alphabetic input safety gate regex mapping (Contact Persons)
    const textOnlyFields = [
        document.getElementById("companyContact"),
        document.getElementById("pickupContact"),
        document.getElementById("deliveryContact")
    ];
    textOnlyFields.forEach(field => {
        if (!field) return;
        field.addEventListener("input", (e) => {
            const sanitizedValue = e.target.value.replace(/[^a-zA-Z.\s]/g, "");
            if (e.target.value !== sanitizedValue) e.target.value = sanitizedValue;
            if (sanitizedValue.trim().length > 0) removeInlineError(field);
        });
    });

    // Numeric mobile safety gate routing mapping (Mobile Numbers starting with 09)
    const mobileFields = [
        document.getElementById("companyMobile"),
        document.getElementById("pickupMobile"),
        document.getElementById("deliveryMobile")
    ];
    mobileFields.forEach(field => {
        if (!field) return;
        field.addEventListener("input", (e) => {
            let sanitizedValue = e.target.value.replace(/[^0-9]/g, "");
            if (sanitizedValue.length > 11) sanitizedValue = sanitizedValue.slice(0, 11);
            e.target.value = sanitizedValue;

            // Real-time checks while typing
            if (sanitizedValue.length >= 2 && !sanitizedValue.startsWith("09")) {
                showInlineError(field, "⚠️ Invalid Phone Number");
            } else if (sanitizedValue.length === 11 && sanitizedValue.startsWith("09")) {
                removeInlineError(field);
            }
        });

        field.addEventListener("blur", (e) => {
            const val = e.target.value;
            if (val.length === 0) {
                showInlineError(field, "⚠️ This field is required.");
            } else if (!val.startsWith("09") || val.length !== 11) {
                showInlineError(field, "⚠️ Invalid Phone Number");
            } else {
                removeInlineError(field);
            }
        });
    });

    // Clear empty errors in real-time when user inputs data into standard text fields
    const standardFields = [
        document.getElementById("companyName"),
        document.getElementById("companyTin"),
        document.getElementById("companyAddress"),
        document.getElementById("pickupStreet"),
        document.getElementById("deliveryStreet")
    ];
    standardFields.forEach(field => {
        if (!field) return;
        field.addEventListener("input", () => {
            if (field.value.trim().length > 0) removeInlineError(field);
        });
    });


    //NATIONWIDE PSGC 
    const API_BASE_URL = "https://psgc.gitlab.io/api";

    async function initNationwidePSGC(prefix) {
        const regSelect = document.getElementById(`${prefix}Region`);
        const provSelect = document.getElementById(`${prefix}Province`);
        const citySelect = document.getElementById(`${prefix}City`);
        const bgySelect = document.getElementById(`${prefix}Barangay`);

        // Clear inline errors when a dropdown choice is changed
        [regSelect, provSelect, citySelect, bgySelect].forEach(select => {
            if (select) {
                select.addEventListener("change", () => {
                    if (select.value) removeInlineError(select);
                });
            }
        });

        try {
            const response = await fetch(`${API_BASE_URL}/regions/`);
            const regions = await response.json();
            
            regSelect.innerHTML = '<option value="">Select region</option>';
            regions.sort((a, b) => a.name.localeCompare(b.name)).forEach(reg => {
                regSelect.innerHTML += `<option value="${reg.code}" data-name="${reg.name}">${reg.name}</option>`;
            });
        } catch (err) {
            console.error("Critical failure tracking down regional data metrics.", err);
            regSelect.innerHTML = '<option value="">Error loading geographic database</option>';
        }

        regSelect.addEventListener("change", async () => {
            const regCode = regSelect.value;
            
            provSelect.innerHTML = '<option value="">Select province</option>';
            citySelect.innerHTML = '<option value="">Select city/municipality</option>';
            bgySelect.innerHTML = '<option value="">Select barangay</option>';
            provSelect.disabled = true; 
            citySelect.disabled = true; 
            bgySelect.disabled = true;
            
            if (!regCode) return;

            if (regCode === "130000000") {
                provSelect.innerHTML = '<option value="NCR" data-name="Metro Manila">Metro Manila (NCR)</option>';
                provSelect.disabled = false;
                provSelect.value = "NCR";
                removeInlineError(provSelect);

                try {
                    const cityRes = await fetch(`${API_BASE_URL}/regions/${regCode}/cities/`);
                    const cities = await cityRes.json();
                    citySelect.innerHTML = '<option value="">Select city/municipality</option>';
                    cities.sort((a, b) => a.name.localeCompare(b.name)).forEach(c => {
                        citySelect.innerHTML += `<option value="${c.code}" data-name="${c.name}">${c.name}</option>`;
                    });
                    citySelect.disabled = false;
                } catch (err) {
                    console.error("Error loading NCR cities via region route:", err);
                }
                return;
            }

            try {
                const res = await fetch(`${API_BASE_URL}/regions/${regCode}/provinces/`);
                const provinces = await res.json();

                provSelect.innerHTML = '<option value="">Select province</option>';
                provinces.sort((a, b) => a.name.localeCompare(b.name)).forEach(p => {
                    provSelect.innerHTML += `<option value="${p.code}" data-name="${p.name}">${p.name}</option>`;
                });
                provSelect.disabled = false;
            } catch (err) { 
                console.error("Error loading regional provinces:", err); 
            }
        });

        provSelect.addEventListener("change", async () => {
            const provCode = provSelect.value;
            if (provCode === "NCR") return;

            citySelect.innerHTML = '<option value="">Select city/municipality</option>';
            bgySelect.innerHTML = '<option value="">Select barangay</option>';
            citySelect.disabled = true; 
            bgySelect.disabled = true;
            
            if (!provCode) return;

            try {
                const res = await fetch(`${API_BASE_URL}/provinces/${provCode}/cities-municipalities/`);
                const cities = await res.json();
                cities.sort((a, b) => a.name.localeCompare(b.name)).forEach(c => {
                    citySelect.innerHTML += `<option value="${c.code}" data-name="${c.name}">${c.name}</option>`;
                });
                citySelect.disabled = false;
            } catch (err) { 
                console.error("Error loading city records:", err); 
            }
        });

        citySelect.addEventListener("change", async () => {
            const cityCode = citySelect.value;
            bgySelect.innerHTML = '<option value="">Select barangay</option>';
            bgySelect.disabled = true;
            
            if (!cityCode) return;

            try {
                const res = await fetch(`${API_BASE_URL}/cities-municipalities/${cityCode}/barangays/`);
                const barangays = await res.json();
                barangays.sort((a, b) => a.name.localeCompare(b.name)).forEach(b => {
                    bgySelect.innerHTML += `<option value="${b.code}" data-name="${b.name}">${b.name}</option>`;
                });
                bgySelect.disabled = false;
            } catch (err) { 
                console.error("Error loading barangay records:", err); 
            }
        });
    }

    initNationwidePSGC("pickup");
    initNationwidePSGC("delivery");


    //PERSISTENT STORAGE PROFILE ADDRESS BOOK SHORTCUT MANAGING
    function setupProfileShortcuts(prefix) {
        const dropdown = document.getElementById(`${prefix}SavedShortcut`);
        const savedAddresses = JSON.parse(localStorage.getItem(`savedCargoAddresses_${prefix}`) || "[]");
        
        savedAddresses.forEach((addr, i) => {
            dropdown.innerHTML += `<option value="${i}">${addr.alias}</option>`;
        });

        dropdown.addEventListener("change", () => {
            const index = dropdown.value;
            if (index === "") return;
            
            const selected = savedAddresses[index];
            document.getElementById(`${prefix}Contact`).value = selected.contact;
            document.getElementById(`${prefix}Mobile`).value = selected.mobile;
            document.getElementById(`${prefix}Street`).value = selected.street;
            
            // Clean up any remaining validation error states when dynamic shortcuts load data
            removeInlineError(document.getElementById(`${prefix}Contact`));
            removeInlineError(document.getElementById(`${prefix}Mobile`));
            removeInlineError(document.getElementById(`${prefix}Street`));

            alert(`Loaded address configuration map: "${selected.alias}"`);
        });
    }

    setupProfileShortcuts("pickup");
    setupProfileShortcuts("delivery");


    //FORM TRANSACTION CONTROL & DATA PAYLOAD COMPILING
    if (cargoDetailsForm) {
        cargoDetailsForm.addEventListener("submit", (e) => {
            e.preventDefault();

            let hasErrors = false;

            // 1. Core Verification: Check all basic text, textarea, and input elements for empty states
            const allInputTextElements = [
                document.getElementById("companyName"),
                document.getElementById("companyContact"),
                document.getElementById("companyMobile"),
                document.getElementById("companyTin"),
                document.getElementById("companyAddress"),
                document.getElementById("pickupContact"),
                document.getElementById("pickupMobile"),
                document.getElementById("pickupStreet"),
                document.getElementById("deliveryContact"),
                document.getElementById("deliveryMobile"),
                document.getElementById("deliveryStreet")
            ];

            allInputTextElements.forEach(field => {
                if (field && field.value.trim() === "") {
                    showInlineError(field, "⚠️ This field cannot be left blank.");
                    hasErrors = true;
                }
            });

            // 2. Mobile validation override constraints: Length verification & prefix matching
            mobileFields.forEach(field => {
                if (field && field.value.trim() !== "") {
                    if (!field.value.startsWith("09") || field.value.length !== 11) {
                        showInlineError(field, "⚠️  Invalid Phone Number");
                        hasErrors = true;
                    }
                }
            });

            // 3. Dropdown constraint tracking logic
            const requiredDropdowns = [
                "pickupRegion", "pickupProvince", "pickupCity", "pickupBarangay", 
                "deliveryRegion", "deliveryProvince", "deliveryCity", "deliveryBarangay"
            ];
            requiredDropdowns.forEach(id => {
                const selectElement = document.getElementById(id);
                if (selectElement && !selectElement.value) {
                    showInlineError(selectElement, "⚠️ This field cannot be left blank");
                    hasErrors = true;
                }
            });

            if (hasErrors) {
                const firstError = document.querySelector(".error-note");
                if (firstError) firstError.parentElement.querySelector("input, select, textarea").focus();
                return; 
            }

            const getSelectedText = (id) => {
                const el = document.getElementById(id);
                return el.selectedIndex > 0 ? el.options[el.selectedIndex].getAttribute('data-name') : "";
            };

            const pickupDataset = {
                contactPerson: document.getElementById("pickupContact").value.trim(),
                mobile: document.getElementById("pickupMobile").value.trim(),
                region: getSelectedText("pickupRegion"),
                province: getSelectedText("pickupProvince"),
                city: getSelectedText("pickupCity"),
                barangay: getSelectedText("pickupBarangay"),
                street: document.getElementById("pickupStreet").value.trim()
            };

            const deliveryDataset = {
                contactPerson: document.getElementById("deliveryContact").value.trim(),
                mobile: document.getElementById("deliveryMobile").value.trim(),
                region: getSelectedText("deliveryRegion"),
                province: getSelectedText("deliveryProvince"),
                city: getSelectedText("deliveryCity"),
                barangay: getSelectedText("deliveryBarangay"),
                street: document.getElementById("deliveryStreet").value.trim()
            };

            if (document.getElementById("savePickupAddress").checked) {
                const history = JSON.parse(localStorage.getItem("savedCargoAddresses_pickup") || "[]");
                history.push({ 
                    alias: `Shortcut - ${pickupDataset.city} (${pickupDataset.contactPerson})`, 
                    contact: pickupDataset.contactPerson, 
                    mobile: pickupDataset.mobile, 
                    street: pickupDataset.street 
                });
                localStorage.setItem("savedCargoAddresses_pickup", JSON.stringify(history));
            }

            if (document.getElementById("saveDeliveryAddress").checked) {
                const history = JSON.parse(localStorage.getItem("savedCargoAddresses_delivery") || "[]");
                history.push({ 
                    alias: `Shortcut - ${deliveryDataset.city} (${deliveryDataset.contactPerson})`, 
                    contact: deliveryDataset.contactPerson, 
                    mobile: deliveryDataset.mobile, 
                    street: deliveryDataset.street 
                });
                localStorage.setItem("savedCargoAddresses_delivery", JSON.stringify(history));
            }

            let consolidatedManifest = JSON.parse(localStorage.getItem('consolidatedBookingManifest') || "{}");
            consolidatedManifest.serviceType = "Commercial Cargo";
            consolidatedManifest.cargoStep1Details = {
                company: {
                    name: document.getElementById("companyName").value.trim(),
                    contactPerson: document.getElementById("companyContact").value.trim(),
                    mobile: document.getElementById("companyMobile").value.trim(),
                    tin: document.getElementById("companyTin").value.trim(),
                    address: document.getElementById("companyAddress").value.trim()
                },
                pickup: pickupDataset,
                delivery: deliveryDataset
            };

            localStorage.setItem('consolidatedBookingManifest', JSON.stringify(consolidatedManifest));
            window.location.href = "book-cargo-package.html";
        });
    }
});