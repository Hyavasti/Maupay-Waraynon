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
    // Shortcuts dropdowns
    const pickupShortcut = document.getElementById("dropdownPickupShortcut");
    const dropoffShortcut = document.getElementById("dropdownDropoffShortcut");
    
    // Pickup Target Elements (FROM)
    const pickupContact = document.getElementById("pickupContact");
    const pickupMobile = document.getElementById("pickupMobile");
    const pickupProvince = document.getElementById("pickupProvince");
    const pickupCity = document.getElementById("pickupCity");
    const pickupBarangay = document.getElementById("pickupBarangay");
    const pickupStreet = document.getElementById("pickupStreetAddress");
    const chkSavePickup = document.getElementById("chkSavePickupAddress");

    // Dropoff Target Elements (TO)
    const dropoffContact = document.getElementById("dropoffContact");
    const dropoffMobile = document.getElementById("dropoffMobile");
    const dropoffProvince = document.getElementById("dropoffProvince");
    const dropoffCity = document.getElementById("dropoffCity");
    const dropoffBarangay = document.getElementById("dropoffBarangay");
    const dropoffStreet = document.getElementById("dropoffStreetAddress");
    const chkSaveDropoff = document.getElementById("chkSaveDropoffAddress");

    const btnBack = document.getElementById("btnBackToServices");
    const formWizard = document.getElementById("lipatBahayDetailsForm");
    const profileAvatar = document.getElementById("profileAvatar");
    const avatarTooltip = document.getElementById("avatarTooltip");

    //Capture tracking context securely
    let currentAuthenticatedUID = "oZ55xPFsSYWyVTD5R8G1kYmx43";

    // Global data placeholder for session data 
    let userAccountData = null;

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

    // =========================================================
    // Section 2 LIVE INPUT RESTRICTIONS & REGEX FILTERS
    // =========================================================
    function restrictToLettersOnly(element) {
        if (!element) return;
        element.addEventListener("input", (e) => {
            e.target.value = e.target.value.replace(/[^a-zA-Z\s\-]/g, "");
            if (e.target.value.trim() !== "") {
                clearInlineFieldError(element);
            }
        });
    }

function restrictToMobileNumbersOnly(element) {
        if (!element) return;
        element.addEventListener("input", (e) => {
            let clearedValue = e.target.value.replace(/\D/g, ""); 
            if (clearedValue.length > 11) {
                clearedValue = clearedValue.slice(0, 11);
            }
            e.target.value = clearedValue;

            
            if (clearedValue.length > 0) {
    
                if (clearedValue === "0") {
                    clearInlineFieldError(element);
                }
                //2nd digit isn't 9 Error!
                else if (clearedValue.startsWith("0") && clearedValue.length >= 2 && clearedValue[1] !== "9") {
                    showInlineFieldError(element, "Invalid Phone Number.");
                }
                //1st digit doesn't start with 0 Error!
                else if (!clearedValue.startsWith("0")) {
                    showInlineFieldError(element, "Invalid Phone Number.");
                }
                //If starts with 09 but hasn't reached 11 digits yet Error!
                else if (clearedValue.length < 11) {
                    showInlineFieldError(element, "Invalid Phone Number.");
                }
                //Exactly 11 digits and starts with 09
                else if (clearedValue.length === 11 && clearedValue.startsWith("09")) {
                    clearInlineFieldError(element);
                }
            } else {
                // If they clear the input box completely, reset the error banner
                clearInlineFieldError(element);
            }
        });

        element.addEventListener("blur", (e) => {
            const value = e.target.value.trim();
            if (value.length < 11 || !value.startsWith("09")) {
                showInlineFieldError(element, "Invalid Phone Number.");
            } else {
                clearInlineFieldError(element);
            }
        });
    }

    restrictToLettersOnly(pickupContact);
    restrictToLettersOnly(dropoffContact);
    restrictToMobileNumbersOnly(pickupMobile);
    restrictToMobileNumbersOnly(dropoffMobile);

    // Setup real-time clearing for dropdowns and street inputs on interaction
    [pickupProvince, pickupCity, pickupBarangay, pickupStreet, dropoffProvince, dropoffCity, dropoffBarangay, dropoffStreet].forEach(el => {
        if(el) {
            el.addEventListener("change", () => clearInlineFieldError(el));
            el.addEventListener("input", () => clearInlineFieldError(el));
        }
    });

    function showInlineFieldError(element, textMessage) {
        clearInlineFieldError(element);
        
        const parentCell = element.closest(".form-input-cell") || element.parentNode;
        element.style.borderColor = "#dc2626";
        
        const noteContainer = document.createElement("div");
        noteContainer.className = "live-field-error-note";
        
        //styling layout
        noteContainer.style.color = "#b91c1c"; 
        noteContainer.style.fontSize = "0.82rem";
        noteContainer.style.marginTop = "5px";
        noteContainer.style.display = "flex";
        noteContainer.style.alignItems = "center";
        noteContainer.style.gap = "4px";
        noteContainer.innerHTML = `<span>⚠️</span> <span>${textMessage}</span>`;
        
        parentCell.appendChild(noteContainer);
    }

    function clearInlineFieldError(element) {
        if (!element) return;
        element.style.borderColor = "";
        const parentCell = element.closest(".form-input-cell") || element.parentNode;
        const pastNote = parentCell.querySelector(".live-field-error-note");
        if (pastNote) pastNote.remove();
    }

    // =========================================================
    // Section 3 REGION-FIRST CARGO-STYLE PSGC ENGINE
    // =========================================================
    fetch('https://psgc.gitlab.io/api/regions.json')
        .then(res => res.json())
        .then(regions => {
            regions.sort((a, b) => a.name.localeCompare(b.name));
            
            pickupProvince.innerHTML = '<option value="" disabled selected>Select region</option>';
            dropoffProvince.innerHTML = '<option value="" disabled selected>Select region</option>';
            
            regions.forEach(reg => {
                pickupProvince.appendChild(new Option(reg.name, reg.code));
                dropoffProvince.appendChild(new Option(reg.name, reg.code));
            });
            
            const navigationHistoryEntry = performance.getEntriesByType("navigation")[0];
            if (navigationHistoryEntry && navigationHistoryEntry.type === "reload") {
                localStorage.removeItem('activeBookingFormStep2');
                formWizard.reset();
            } else {
                restoreCachedFormData();
            }
        })
        .catch(err => console.error("Location API failed to connect:", err));

    function wireRegionalCargoDropdowns(regionSelect, citySelect, barangaySelect) {
        regionSelect.addEventListener("change", () => {
            const regionCode = regionSelect.value;
            if (!regionCode) return;
            
            citySelect.innerHTML = '<option value="" disabled selected>Loading cities...</option>';
            barangaySelect.innerHTML = '<option value="" disabled selected>Select barangay</option>';
            citySelect.disabled = false;
            barangaySelect.disabled = true;

            fetch(`https://psgc.gitlab.io/api/regions/${regionCode}/cities-municipalities.json`)
                .then(res => res.json())
                .then(cities => {
                    cities.sort((a, b) => a.name.localeCompare(b.name));
                    citySelect.innerHTML = '<option value="" disabled selected>Select city/municipality</option>';
                    cities.forEach(city => {
                        citySelect.appendChild(new Option(city.name, city.code));
                    });
                });
        });

        citySelect.addEventListener("change", () => {
            const cityCode = citySelect.value;
            if (!cityCode) return;
            
            barangaySelect.innerHTML = '<option value="" disabled selected>Loading barangays...</option>';
            barangaySelect.disabled = false;

            fetch(`https://psgc.gitlab.io/api/cities-municipalities/${cityCode}/barangays.json`)
                .then(res => res.json())
                .then(barangays => {
                    barangays.sort((a, b) => a.name.localeCompare(b.name));
                    barangaySelect.innerHTML = '<option value="" disabled selected>Select barangay</option>';
                    barangays.forEach(brgy => {
                        barangaySelect.appendChild(new Option(brgy.name, brgy.name));
                    });
                })
                .catch(() => {
                    barangaySelect.innerHTML = '<option value="" disabled selected>Select barangay</option>';
                });
        });
    }

    wireRegionalCargoDropdowns(pickupProvince, pickupCity, pickupBarangay);
    wireRegionalCargoDropdowns(dropoffProvince, dropoffCity, dropoffBarangay);

    // =========================================================
    // Section 4 SHORTCUT AUTO-FILL DATA UTILITIES
    // =========================================================
    pickupShortcut.addEventListener("change", () => {
        if (pickupShortcut.value === "profile") {
            if (userAccountData) {
                pickupContact.value = (userAccountData.firstName && userAccountData.lastName) 
                    ? `${userAccountData.firstName} ${userAccountData.lastName}`.trim()
                    : (userAccountData.fullName || userAccountData.firstName || "Juan Dela Cruz");
                
                pickupMobile.value = userAccountData.fullContactPhone || userAccountData.phoneNumber || userAccountData.mobile || "";
            } else {
                pickupContact.value = "Juan Dela Cruz";
                pickupMobile.value = "09123456789";
            }
            clearInlineFieldError(pickupMobile);
        } else if (pickupShortcut.value === "clear") {
            pickupContact.value = "";
            pickupMobile.value = "";
            pickupStreet.value = "";
            chkSavePickup.checked = false;
            pickupProvince.selectedIndex = 0;
            resetSelector(pickupCity, "city/municipality");
            resetSelector(pickupBarangay, "barangay");
            clearInlineFieldError(pickupMobile);
        }
    });

    dropoffShortcut.addEventListener("change", () => {
        if (dropoffShortcut.value === "clear") {
            dropoffContact.value = "";
            dropoffMobile.value = "";
            dropoffStreet.value = "";
            chkSaveDropoff.checked = false;
            dropoffProvince.selectedIndex = 0;
            resetSelector(dropoffCity, "city/municipality");
            resetSelector(dropoffBarangay, "barangay");
            clearInlineFieldError(dropoffMobile);
        }
    });

    function resetSelector(element, typeName) {
        element.innerHTML = `<option value="" disabled selected>Select ${typeName}</option>`;
        element.disabled = true;
    }

    // =========================================================
    // Section 5 STATE PERSISTENCE ENGINE (RESTORE ON BACK NAVIGATION)
    // =========================================================
    function restoreCachedFormData() {
        const activeDetailsCache = localStorage.getItem('activeBookingFormStep2');
        if (!activeDetailsCache) return;

        try {
            const cachedData = JSON.parse(activeDetailsCache);

            if (cachedData.origin) {
                pickupContact.value = cachedData.origin.name || "";
                pickupMobile.value = cachedData.origin.phone || "";
                pickupStreet.value = cachedData.origin.street || "";
                chkSavePickup.checked = cachedData.origin.shouldSaveToAddressBook || false;

                if (cachedData.origin.provinceCode) {
                    pickupProvince.value = cachedData.origin.provinceCode;
                    const pCode = pickupProvince.value;
                    
                    fetch(`https://psgc.gitlab.io/api/regions/${pCode}/cities-municipalities.json`)
                        .then(r => r.json()).then(cities => {
                            pickupCity.innerHTML = '<option value="" disabled selected>Select city/municipality</option>';
                            cities.sort((a, b) => a.name.localeCompare(b.name));
                            cities.forEach(c => { pickupCity.add(new Option(c.name, c.code)); });
                            
                            if (cachedData.origin.cityCode) {
                                pickupCity.value = cachedData.origin.cityCode;
                                pickupCity.disabled = false;
                                
                                fetch(`https://psgc.gitlab.io/api/cities-municipalities/${cachedData.origin.cityCode}/barangays.json`)
                                    .then(r => r.json()).then(brgys => {
                                        pickupBarangay.innerHTML = '<option value="" disabled selected>Select barangay</option>';
                                        brgys.sort((a, b) => a.name.localeCompare(b.name));
                                        brgys.forEach(b => { pickupBarangay.add(new Option(b.name, b.name)); });
                                        if (cachedData.origin.barangay) {
                                            pickupBarangay.value = cachedData.origin.barangay;
                                            pickupBarangay.disabled = false;
                                        }
                                    });
                            }
                        });
                }
            }

            if (cachedData.destination) {
                dropoffContact.value = cachedData.destination.name || "";
                dropoffMobile.value = cachedData.destination.phone || "";
                dropoffStreet.value = cachedData.destination.street || "";
                chkSaveDropoff.checked = cachedData.destination.shouldSaveToAddressBook || false;

                if (cachedData.destination.provinceCode) {
                    dropoffProvince.value = cachedData.destination.provinceCode;
                    const pCode = dropoffProvince.value;
                    
                    fetch(`https://psgc.gitlab.io/api/regions/${pCode}/cities-municipalities.json`)
                        .then(r => r.json()).then(cities => {
                            dropoffCity.innerHTML = '<option value="" disabled selected>Select city/municipality</option>';
                            cities.sort((a, b) => a.name.localeCompare(b.name));
                            cities.forEach(c => { dropoffCity.add(new Option(c.name, c.code)); });
                            
                            if (cachedData.destination.cityCode) {
                                dropoffCity.value = cachedData.destination.cityCode;
                                dropoffCity.disabled = false;
                                
                                fetch(`https://psgc.gitlab.io/api/cities-municipalities/${cachedData.destination.cityCode}/barangays.json`)
                                    .then(r => r.json()).then(brgys => {
                                        dropoffBarangay.innerHTML = '<option value="" disabled selected>Select barangay</option>';
                                        brgys.sort((a, b) => a.name.localeCompare(b.name));
                                        brgys.forEach(b => { dropoffBarangay.add(new Option(b.name, b.name)); });
                                        if (cachedData.destination.barangay) {
                                            dropoffBarangay.value = cachedData.destination.barangay;
                                            dropoffBarangay.disabled = false;
                                        }
                                    });
                            }
                        });
                }
            }
        } catch (err) {
            console.error("Error reading persistence data models:", err);
        }
    }

    // =========================================================
    // Section 6 ACTION CONTROL NAVIGATION & TIMELINE ENGINE
    // =========================================================
    btnBack.addEventListener("click", () => {
        window.location.href = "book-shipment.html";
    });

    formWizard.addEventListener("submit", (e) => {
        e.preventDefault();

        let blockFormRoute = false;

        // Structured array validation matching target layout schema
        const requiredInputs = [
            { el: pickupContact, msg: "This field cannot be left blank." },
            { el: pickupMobile, msg: "This field cannot be left blank.", isMobile: true },
            { el: pickupProvince, msg: "This field cannot be left blank." },
            { el: pickupCity, msg: "This field cannot be left blank." },
            { el: pickupBarangay, msg: "This field cannot be left blank." },
            { el: pickupStreet, msg: "This field cannot be left blank." },
            { el: dropoffContact, msg: "This field cannot be left blank." },
            { el: dropoffMobile, msg: "This field cannot be left blank.", isMobile: true },
            { el: dropoffProvince, msg: "This field cannot be left blank." },
            { el: dropoffCity, msg: "This field cannot be left blank." },
            { el: dropoffBarangay, msg: "This field cannot be left blank." },
            { el: dropoffStreet, msg: "This field cannot be left blank." }
        ];

        // Validate Blanks & Geographics first
        requiredInputs.forEach(item => {
            if (item.el) {
                if (!item.el.value || item.el.value.trim() === "") {
                    showInlineFieldError(item.el, item.msg);
                    blockFormRoute = true;
                } else if (item.isMobile) {
                    if (item.el.value.length < 11 || !item.el.value.startsWith("09")) {
                        showInlineFieldError(item.el, "Invalid Phone Number");
                        blockFormRoute = true;
                    }
                }
            }
        });

        if (blockFormRoute) {
            const targetedNote = document.querySelector(".live-field-error-note");
            if (targetedNote) targetedNote.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        const selectedOrigProv = pickupProvince.options[pickupProvince.selectedIndex].text;
        const selectedOrigCity = pickupCity.options[pickupCity.selectedIndex].text;
        const selectedDestProv = dropoffProvince.options[dropoffProvince.selectedIndex].text;
        const selectedDestCity = dropoffCity.options[dropoffCity.selectedIndex].text;

        const completeNationalPayload = {
            serviceType: "Lipat Bahay Nationwide",
            origin: {
                name: pickupContact.value,
                phone: pickupMobile.value,
                province: selectedOrigProv,
                provinceCode: pickupProvince.value,
                city: selectedOrigCity,
                cityCode: pickupCity.value,
                barangay: pickupBarangay.value,
                street: pickupStreet.value,
                shouldSaveToAddressBook: chkSavePickup.checked
            },
            destination: {
                name: dropoffContact.value,
                phone: dropoffMobile.value,
                province: selectedDestProv,
                provinceCode: dropoffProvince.value,
                city: selectedDestCity,
                cityCode: dropoffCity.value,
                barangay: dropoffBarangay.value,
                street: dropoffStreet.value,
                shouldSaveToAddressBook: chkSaveDropoff.checked
            }
        };

        localStorage.setItem('activeBookingFormStep2', JSON.stringify(completeNationalPayload));
        window.location.href = "book-lipatbahay-info.html";
    });
});