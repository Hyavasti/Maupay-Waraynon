// 1. Modern Modular Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
// Changed from firebase-database to firebase-firestore
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js"; 

// 2. Web App's Firebase Configuration
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

// Initialize Firebase Services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Initializing Firestore instead of Realtime DB

document.addEventListener("DOMContentLoaded", () => {
    const detailsForm = document.getElementById("standardParcelDetailsForm");
    const btnBackToShipmentMenu = document.getElementById("btnBackToShipmentMenu");
    const deliveryCards = document.querySelectorAll('.delivery-option-card');
    
    // Disable native browser validation tooltips so our custom messages can display
    if (detailsForm) {
        detailsForm.setAttribute("novalidate", "true");
    }

    // Form Dropdown Element References (Region -> Province -> City -> Barangay)
    const senderRegion = document.getElementById("senderRegion");
    const senderProvince = document.getElementById("senderProvince");
    const senderCity = document.getElementById("senderCity");
    const senderBarangay = document.getElementById("senderBarangay");
    const senderStreet = document.getElementById("senderStreet");

    const receiverRegion = document.getElementById("receiverRegion");
    const receiverProvince = document.getElementById("receiverProvince");
    const receiverCity = document.getElementById("receiverCity");
    const receiverBarangay = document.getElementById("receiverBarangay");
    const receiverStreet = document.getElementById("receiverStreet");
    const receiverOutlet = document.getElementById("receiverOutlet");

    // Dynamic Display Segment Containers
    const receiverDoorToDoorFields = document.getElementById("receiverDoorToDoorFields");
    const receiverPickupOutletFields = document.getElementById("receiverPickupOutletFields");

    // Text Input Element References
    const senderName = document.getElementById("senderName");
    const receiverName = document.getElementById("receiverName");
    const senderMobile = document.getElementById("senderMobile");
    const receiverMobile = document.getElementById("receiverMobile");

    // Save Address Checkboxes References
    const saveSenderAddress = document.getElementById("saveSenderAddress");
    const saveReceiverAddress = document.getElementById("saveReceiverAddress");

    // Global Memory Cache Filtering
    let cachedRegionsList = [];
    let cachedProvincesList = [];
    let cachedCitiesMunicipalitiesList = [];

    // Initialize initial fields as required by default
    if (senderRegion) senderRegion.required = true;
    if (senderProvince) senderProvince.required = true;
    if (senderCity) senderCity.required = true;
    if (senderBarangay) senderBarangay.required = true;
    if (senderStreet) senderStreet.required = true;

    if (receiverRegion) receiverRegion.required = true;
    if (receiverProvince) receiverProvince.required = true;
    if (receiverCity) receiverCity.required = true;
    if (receiverBarangay) receiverBarangay.required = true;
    if (receiverStreet) receiverStreet.required = true;

    // ==========================================================================
    // DYNAMIC MODULAR FIREBASE REAL-TIME ACCOUNT AVATAR SYNC
    // ==========================================================================
    const profileAvatar = document.getElementById("profileAvatar");
    const avatarTooltip = document.getElementById("avatarTooltip");

    // 🌟 Capture tracking context securely from event lifecycle streams
    let currentAuthenticatedUID = "oZ55xPFsSYWyVTD5R8G1kYmx43";

    // STEP 1: Fast Immediate Offline Fallback (while connection loads)
    const savedAccountRaw = localStorage.getItem('dummyTestingAccount');
    if (savedAccountRaw && profileAvatar) {
        try {
            const userAccount = JSON.parse(savedAccountRaw);
            if (userAccount && userAccount.firstName) {
                profileAvatar.innerText = userAccount.firstName.charAt(0).toUpperCase();
            }
        } catch (e) { console.error("Error setting avatar initial:", e); }
    }

    // STEP 2: Modern Cloud Firestore Sync Lookups with Native Hover Title
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

    // ==========================================================================
    // DYNAMIC EMPTY FIELD VALIDATION ENGINE (Matches layout design)
    // ==========================================================================
    function toggleFieldError(inputElement, show, message) {
        if (!inputElement) return;
        
        let errorNote = inputElement.parentNode.querySelector(".blank-error-note");
        
        if (show) {
            inputElement.style.borderColor = "#dc3545";
            if (!errorNote) {
                errorNote = document.createElement("div");
                errorNote.className = "blank-error-note";
                errorNote.style.color = "#dc3545";
                errorNote.style.fontSize = "12px";
                errorNote.style.marginTop = "4px";
                inputElement.parentNode.appendChild(errorNote);
            }
            errorNote.innerText = `⚠️ ${message}`;
            errorNote.style.display = "block";
        } else {
            inputElement.style.borderColor = "";
            if (errorNote) {
                errorNote.style.display = "none";
            }
        }
    }

    // CONTACT PERSON STRICT NAME VALIDATION
    function sanitizeContactNameInput(inputElement) {
        if (!inputElement) return;
        inputElement.addEventListener("input", (e) => {
            let sanitizedValue = e.target.value.replace(/[0-9]/g, "");
            e.target.value = sanitizedValue;
            
            if (sanitizedValue.trim() !== "") {
                toggleFieldError(inputElement, false);
            }
        });
    }

    sanitizeContactNameInput(senderName);
    sanitizeContactNameInput(receiverName);

    // DYNAMIC ERROR NOTE ENGINE FOR PHONE NUMBERS
    function createErrorNoteElement(inputElement) {
        const errorNote = document.createElement("div");
        errorNote.className = "phone-error-note";
        errorNote.style.color = "#dc3545";
        errorNote.style.fontSize = "12px";
        errorNote.style.marginTop = "4px";
        errorNote.style.display = "none";
        errorNote.innerText = "Invalid Phone Number";
        inputElement.parentNode.appendChild(errorNote);
        return errorNote;
    }

    const senderMobileError = senderMobile ? createErrorNoteElement(senderMobile) : null;
    const receiverMobileError = receiverMobile ? createErrorNoteElement(receiverMobile) : null;

    function validatePhilippineMobile(value) {
        return value.startsWith("09") && value.length === 11;
    }

    // INSTANT LIVE PHONE NUMBER VALIDATION & SANITIZATION
    function setupLivePhoneNumberValidation(inputElement, errorElement) {
        if (!inputElement) return;
        inputElement.addEventListener("input", (e) => {
            let sanitizedValue = e.target.value.replace(/\D/g, "");
            if (sanitizedValue.length > 11) {
                sanitizedValue = sanitizedValue.slice(0, 11);
            }
            e.target.value = sanitizedValue;

            if (sanitizedValue.length === 0) {
                if (errorElement) errorElement.style.display = "none";
                inputElement.style.borderColor = "";
            } else if (!validatePhilippineMobile(sanitizedValue)) {
                if (errorElement) errorElement.style.display = "block";
                inputElement.style.borderColor = "#dc3545";
            } else {
                if (errorElement) errorElement.style.display = "none";
                inputElement.style.borderColor = "";
                toggleFieldError(inputElement, false);
            }
        });
    }

    setupLivePhoneNumberValidation(senderMobile, senderMobileError);
    setupLivePhoneNumberValidation(receiverMobile, receiverMobileError);

    // PSGC ENGINE
    const PSGC_BASE_URL = "https://psgc.gitlab.io/api";

    async function prefetchNationalGeographicRegistry() {
        try {
            const [regionsRes, provincesRes, citiesRes] = await Promise.all([
                fetch(`${PSGC_BASE_URL}/regions.json`),
                fetch(`${PSGC_BASE_URL}/provinces.json`),
                fetch(`${PSGC_BASE_URL}/cities-municipalities.json`)
            ]);

            cachedRegionsList = await regionsRes.json();
            cachedProvincesList = await provincesRes.json();
            cachedCitiesMunicipalitiesList = await citiesRes.json();

            cachedRegionsList.sort((a, b) => a.name.localeCompare(b.name));
            populateRegionDropdowns();
        } catch (error) {
            console.error("Critical error building regional cache:", error);
        }
    }

    function populateRegionDropdowns() {
        const fallbackOption = '<option value="" disabled selected>Select region</option>';
        if (senderRegion) senderRegion.innerHTML = fallbackOption;
        if (receiverRegion) receiverRegion.innerHTML = fallbackOption;

        cachedRegionsList.forEach(region => {
            const opt = document.createElement("option");
            opt.value = region.code;
            opt.textContent = region.name;
            opt.setAttribute("data-name", region.name);

            if (senderRegion) senderRegion.appendChild(opt.cloneNode(true));
            if (receiverRegion) receiverRegion.appendChild(opt.cloneNode(true));
        });
    }

    function handleRegionSelectionChange(regionSelect, provinceSelect, citySelect, barangaySelect = null) {
        toggleFieldError(regionSelect, false);
        const selectedRegionCode = regionSelect.value;
        provinceSelect.innerHTML = '<option value="" disabled selected>Select province</option>';
        citySelect.innerHTML = '<option value="" disabled selected>Select city/municipality</option>';
        if (barangaySelect) barangaySelect.innerHTML = '<option value="" disabled selected>Select barangay</option>';

        if (!selectedRegionCode) return;

        if (selectedRegionCode === "130000000") {
            const optNCR = document.createElement("option");
            optNCR.value = "130000000";
            optNCR.textContent = "METRO MANILA (NCR)";
            optNCR.setAttribute("data-name", "METRO MANILA (NCR)");
            provinceSelect.appendChild(optNCR);
            
            provinceSelect.value = "130000000";
            handleProvinceSelectionChange(provinceSelect, citySelect, barangaySelect);
            return;
        }

        const filteredProvinces = cachedProvincesList.filter(p => p.regionCode === selectedRegionCode);
        filteredProvinces.sort((a, b) => a.name.localeCompare(b.name));

        filteredProvinces.forEach(prov => {
            const opt = document.createElement("option");
            opt.value = prov.code;
            opt.textContent = prov.name;
            opt.setAttribute("data-name", prov.name);
            provinceSelect.appendChild(opt);
        });
    }

    function handleProvinceSelectionChange(provinceSelect, citySelect, barangaySelect = null) {
        toggleFieldError(provinceSelect, false);
        const selectedProvCode = provinceSelect.value;
        citySelect.innerHTML = '<option value="" disabled selected>Select city/municipality</option>';
        if (barangaySelect) barangaySelect.innerHTML = '<option value="" disabled selected>Select barangay</option>';

        if (!selectedProvCode) return;

        let isolatedCities = [];
        if (selectedProvCode === "130000000") {
            isolatedCities = cachedCitiesMunicipalitiesList.filter(c => c.regionCode === "130000000");
        } else {
            isolatedCities = cachedCitiesMunicipalitiesList.filter(c => c.provinceCode === selectedProvCode);
        }

        isolatedCities.sort((a, b) => a.name.localeCompare(b.name));

        isolatedCities.forEach(city => {
            const opt = document.createElement("option");
            opt.value = city.code;
            opt.textContent = city.name;
            opt.setAttribute("data-name", city.name);
            citySelect.appendChild(opt);
        });
    }

    async function handleCitySelectionChange(citySelect, barangaySelect) {
        toggleFieldError(citySelect, false);
        if (!barangaySelect) return;
        const selectedCityCode = citySelect.value;
        barangaySelect.innerHTML = '<option value="" disabled selected>Select barangay</option>';

        if (!selectedCityCode) return;

        try {
            const response = await fetch(`${PSGC_BASE_URL}/cities-municipalities/${selectedCityCode}/barangays.json`);
            const barangays = await response.json();
            barangays.sort((a, b) => a.name.localeCompare(b.name));

            barangays.forEach(brgy => {
                const opt = document.createElement("option");
                opt.value = brgy.code;
                opt.textContent = brgy.name;
                opt.setAttribute("data-name", brgy.name);
                barangaySelect.appendChild(opt);
            });
        } catch (error) {
            console.error("Error retrieving dynamic barangay list:", error);
        }
    }

    if (senderRegion) senderRegion.addEventListener("change", () => handleRegionSelectionChange(senderRegion, senderProvince, senderCity, senderBarangay));
    if (senderProvince) senderProvince.addEventListener("change", () => handleProvinceSelectionChange(senderProvince, senderCity, senderBarangay));
    if (senderCity) senderCity.addEventListener("change", () => { handleCitySelectionChange(senderCity, senderBarangay); });
    if (senderBarangay) senderBarangay.addEventListener("change", () => toggleFieldError(senderBarangay, false));
    if (senderStreet) senderStreet.addEventListener("input", () => toggleFieldError(senderStreet, false));

    if (receiverRegion) receiverRegion.addEventListener("change", () => handleRegionSelectionChange(receiverRegion, receiverProvince, receiverCity, receiverBarangay));
    if (receiverProvince) receiverProvince.addEventListener("change", () => handleProvinceSelectionChange(receiverProvince, receiverCity, receiverBarangay));
    if (receiverCity) receiverCity.addEventListener("change", () => { handleCitySelectionChange(receiverCity, receiverBarangay); });
    if (receiverBarangay) receiverBarangay.addEventListener("change", () => toggleFieldError(receiverBarangay, false));
    if (receiverStreet) receiverStreet.addEventListener("input", () => toggleFieldError(receiverStreet, false));
    if (receiverOutlet) receiverOutlet.addEventListener("change", () => toggleFieldError(receiverOutlet, false));

    prefetchNationalGeographicRegistry();

    deliveryCards.forEach(card => {
        card.addEventListener("click", (e) => {
            const radio = card.querySelector('.native-delivery-radio');
            if (e.target !== radio && radio) {
                radio.checked = true;
            }
            deliveryCards.forEach(c => c.classList.remove('active-card'));
            card.classList.add('active-card');

            const currentOption = radio.value;
            toggleReceiverFormLayout(currentOption);
        });
    });

    function toggleReceiverFormLayout(option) {
        [receiverRegion, receiverProvince, receiverCity, receiverBarangay, receiverStreet, receiverOutlet].forEach(el => toggleFieldError(el, false));

        if (option === "PickupOutlet") {
            if (receiverDoorToDoorFields) receiverDoorToDoorFields.classList.add("hidden-field-block");
            if (receiverPickupOutletFields) receiverPickupOutletFields.classList.remove("hidden-field-block");

            if (receiverRegion) receiverRegion.required = false;
            if (receiverProvince) receiverProvince.required = false;
            if (receiverCity) receiverCity.required = false;
            if (receiverBarangay) receiverBarangay.required = false;
            if (receiverStreet) receiverStreet.required = false;
            if (receiverOutlet) receiverOutlet.required = true;
        } else {
            if (receiverDoorToDoorFields) receiverDoorToDoorFields.classList.remove("hidden-field-block");
            if (receiverPickupOutletFields) receiverPickupOutletFields.classList.add("hidden-field-block");

            if (receiverRegion) receiverRegion.required = true;
            if (receiverProvince) receiverProvince.required = true;
            if (receiverCity) receiverCity.required = true;
            if (receiverBarangay) receiverBarangay.required = true;
            if (receiverStreet) receiverStreet.required = true;
            if (receiverOutlet) receiverOutlet.required = false;
        }
    }

    if (btnBackToShipmentMenu) {
        btnBackToShipmentMenu.addEventListener("click", () => {
            window.location.href = "book-shipment.html";
        });
    }

    // ==========================================================================
    // FORM SUBMIT HANDLER: FIELD VALIDATIONS WITH CUSTOM LABELS
    // ==========================================================================
    if (detailsForm) {
        detailsForm.addEventListener("submit", (e) => {
            e.preventDefault();
            let formsAreValid = true;
            let firstInvalidElement = null;

            function checkField(element, isDropdown = false) {
                if (!element) return true;
                if (!element.value || element.value.trim() === "") {
                    const dynamicMsg = isDropdown ? "This field cannot be left blank" : "This field cannot be left blank.";
                    toggleFieldError(element, true, dynamicMsg);
                    if (!firstInvalidElement) firstInvalidElement = element;
                    return false;
                } else {
                    toggleFieldError(element, false);
                    return true;
                }
            }

            if (!checkField(senderName)) formsAreValid = false;
            if (!checkField(senderMobile)) formsAreValid = false;
            if (!checkField(receiverName)) formsAreValid = false;
            if (!checkField(receiverMobile)) formsAreValid = false;

            if (senderMobile && senderMobile.value && !validatePhilippineMobile(senderMobile.value)) {
                if (senderMobileError) senderMobileError.style.display = "block";
                senderMobile.style.borderColor = "#dc3545";
                if (!firstInvalidElement) firstInvalidElement = senderMobile;
                formsAreValid = false;
            } else if (senderMobileError) {
                senderMobileError.style.display = "none";
            }

            if (receiverMobile && receiverMobile.value && !validatePhilippineMobile(receiverMobile.value)) {
                if (receiverMobileError) receiverMobileError.style.display = "block";
                receiverMobile.style.borderColor = "#dc3545";
                if (!firstInvalidElement) firstInvalidElement = receiverMobile;
                formsAreValid = false;
            } else if (receiverMobileError) {
                receiverMobileError.style.display = "none";
            }

            if (!checkField(senderRegion, true)) formsAreValid = false;
            if (!checkField(senderProvince, true)) formsAreValid = false;
            if (!checkField(senderCity, true)) formsAreValid = false;
            if (!checkField(senderBarangay, true)) formsAreValid = false;
            if (!checkField(senderStreet)) formsAreValid = false;

            const activeRadio = document.querySelector('input[name="deliveryOption"]:checked');
            const selectedOption = activeRadio ? activeRadio.value : "DoorToDoor";

            if (selectedOption === "DoorToDoor") {
                if (!checkField(receiverRegion, true)) formsAreValid = false;
                if (!checkField(receiverProvince, true)) formsAreValid = false;
                if (!checkField(receiverCity, true)) formsAreValid = false;
                if (!checkField(receiverBarangay, true)) formsAreValid = false;
                if (!checkField(receiverStreet)) formsAreValid = false;
            } else if (selectedOption === "PickupOutlet") {
                if (!checkField(receiverOutlet)) formsAreValid = false;
            }

            if (!formsAreValid) {
                if (firstInvalidElement) firstInvalidElement.focus();
                return;
            }

            const getSelectedText = (el) => el && el.selectedIndex >= 0 ? el.options[el.selectedIndex].getAttribute('data-name') || "" : "";

            const senderRegionName = getSelectedText(senderRegion);
            const senderProvName = getSelectedText(senderProvince);
            const senderCityName = getSelectedText(senderCity);
            const senderBrgyName = getSelectedText(senderBarangay);
            const senderStreetVal = senderStreet ? senderStreet.value.trim() : "Main Parcel Terminal";

            const senderAddressParts = [senderStreetVal, senderBrgyName, senderCityName, senderProvName].filter(p => p && p.trim() !== "");
            const combinedSenderAddress = senderAddressParts.length > 0 ? senderAddressParts.join(", ") : "Main Parcel Terminal";

            let receiverDestinationSummary = "";
            let simplifiedDestinationString = "";
            let assignedOutletHubVal = "";
            let isOutletDropoffVal = false;

            if (selectedOption === "PickupOutlet") {
                simplifiedDestinationString = receiverOutlet ? receiverOutlet.value : "";
                receiverDestinationSummary = simplifiedDestinationString;
                assignedOutletHubVal = simplifiedDestinationString;
                isOutletDropoffVal = true;
            } else {
                const receiverRegionName = getSelectedText(receiverRegion);
                const receiverProvName = getSelectedText(receiverProvince);
                const receiverCityName = getSelectedText(receiverCity);
                const receiverBrgyName = getSelectedText(receiverBarangay);
                const receiverStreetVal = receiverStreet ? receiverStreet.value.trim() : "";

                simplifiedDestinationString = `${receiverCityName}, ${receiverProvName}`;
                const receiverAddressParts = [receiverStreetVal, receiverBrgyName, receiverCityName, receiverProvName].filter(p => p && p.trim() !== "");
                receiverDestinationSummary = receiverAddressParts.join(", ");
            }

            const shouldSaveSender = saveSenderAddress ? saveSenderAddress.checked : false;
            const shouldSaveReceiver = saveReceiverAddress ? saveReceiverAddress.checked : false;
            const resolvedServiceType = sessionStorage.getItem("activeBookingServiceType") || "Standard Parcel";

            const tempDetailsPayload = {
                services: {
                    standardParcel: {
                        trackingId: "", 
                        serviceWorkflowType: resolvedServiceType,
                        deliveryArrangementOption: selectedOption,
                        senderDetails: {
                            fullName: senderName.value.trim(),
                            phoneNumber: senderMobile.value,
                            region: senderRegionName,
                            province: senderProvName,
                            city: senderCityName,
                            barangay: senderBrgyName,
                            streetAddress: senderStreetVal,
                            fullAddress: combinedSenderAddress,
                            saveSenderToAddressBook: shouldSaveSender
                        },
                        receiverDetails: {
                            fullName: receiverName.value.trim(),
                            phoneNumber: receiverMobile.value,
                            region: getSelectedText(receiverRegion),
                            province: getSelectedText(receiverProvince),
                            city: getSelectedText(receiverCity),
                            barangay: getSelectedText(receiverBarangay),
                            streetAddress: receiverStreet ? receiverStreet.value.trim() : "",
                            fullAddress: receiverDestinationSummary,
                            assignedOutletHub: assignedOutletHubVal,
                            isOutletDropoff: isOutletDropoffVal,
                            saveReceiverToAddressBook: shouldSaveReceiver
                        },
                        parcelDetails: {
                            category: "",
                            weight: "",
                            dimensions: "",
                            dashboardDisplayDestination: simplifiedDestinationString
                        },
                        paymentDetails: {
                            assignedPayer: "Sender", 
                            modeOfPayment: "Cash",
                            billingLedger: {}
                        }
                    }
                }
            };

            localStorage.setItem('tempDetails', JSON.stringify(tempDetailsPayload));
            window.location.href = "book-standard-parcel-package.html";
        });
    }
});