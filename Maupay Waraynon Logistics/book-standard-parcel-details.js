document.addEventListener("DOMContentLoaded", () => {
    const detailsForm = document.getElementById("standardParcelDetailsForm");
    const btnBackToShipmentMenu = document.getElementById("btnBackToShipmentMenu");
    const deliveryCards = document.querySelectorAll('.delivery-option-card');
    
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

    // Profile Avatar Display Setup
    const profileAvatar = document.getElementById("profileAvatar");
    const savedAccountRaw = localStorage.getItem('dummyTestingAccount');
    if (savedAccountRaw && profileAvatar) {
        try {
            const userAccount = JSON.parse(savedAccountRaw);
            if (userAccount && userAccount.firstName) {
                profileAvatar.innerText = userAccount.firstName.charAt(0).toUpperCase();
            }
        } catch (e) { console.error("Error setting avatar initial:", e); }
    }

    // CONTACT PERSON STRICT NAME VALIDATION
    function sanitizeContactNameInput(inputElement) {
        if (!inputElement) return;
        inputElement.addEventListener("input", (e) => {
            let sanitizedValue = e.target.value.replace(/[0-9]/g, "");
            e.target.value = sanitizedValue;
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
        errorNote.innerText = "❌ Mobile number must start with 09 and be exactly 11 digits long.";
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
    if (senderCity) senderCity.addEventListener("change", () => handleCitySelectionChange(senderCity, senderBarangay));

    if (receiverRegion) receiverRegion.addEventListener("change", () => handleRegionSelectionChange(receiverRegion, receiverProvince, receiverCity, receiverBarangay));
    if (receiverProvince) receiverProvince.addEventListener("change", () => handleProvinceSelectionChange(receiverProvince, receiverCity, receiverBarangay));
    if (receiverCity) receiverCity.addEventListener("change", () => handleCitySelectionChange(receiverCity, receiverBarangay));

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
    // FORM SUBMIT HANDLER: FIELD VALIDATIONS
    // ==========================================================================
    if (detailsForm) {
        detailsForm.addEventListener("submit", (e) => {
            e.preventDefault();
            let formsAreValid = true;

            if (senderMobile && !validatePhilippineMobile(senderMobile.value)) {
                if (senderMobileError) senderMobileError.style.display = "block";
                senderMobile.style.borderColor = "#dc3545";
                senderMobile.focus();
                formsAreValid = false;
            }

            if (receiverMobile && !validatePhilippineMobile(receiverMobile.value)) {
                if (receiverMobileError) receiverMobileError.style.display = "block";
                receiverMobile.style.borderColor = "#dc3545";
                if (formsAreValid) receiverMobile.focus();
                formsAreValid = false;
            }

            const activeRadio = document.querySelector('input[name="deliveryOption"]:checked');
            const selectedOption = activeRadio ? activeRadio.value : "DoorToDoor";

            if (!senderRegion.value || !senderProvince.value || !senderCity.value || !senderBarangay.value) {
                formsAreValid = false;
            }

            if (selectedOption === "DoorToDoor") {
                if (!receiverRegion.value || !receiverProvince.value || !receiverCity.value || !receiverBarangay.value) {
                    formsAreValid = false;
                }
            } else if (selectedOption === "PickupOutlet") {
                if (!receiverOutlet.value) {
                    formsAreValid = false;
                }
            }

            if (!formsAreValid) {
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

            // ⚡ COMPILING INTO THE 5 TARGET VISUAL BUCKETS NESTED INSIDE THE SERVICES MAP
            const tempDetailsPayload = {
                services: {
                    standardParcel: {
                        // 1. TRACKING DATA
                        trackingId: "", // Will be filled dynamically by your generator during checkout
                        serviceWorkflowType: resolvedServiceType,
                        deliveryArrangementOption: selectedOption,

                        // 2. SENDER DETAILS
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

                        // 3. RECEIVER DETAILS
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

                        // 4. PARCEL DETAILS (Placeholders to be merged on the next step)
                        parcelDetails: {
                            category: "",
                            weight: "",
                            dimensions: "",
                            dashboardDisplayDestination: simplifiedDestinationString
                        },

                        // 5. PAYMENT DETAILS (Placeholders to be merged on the final step)
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