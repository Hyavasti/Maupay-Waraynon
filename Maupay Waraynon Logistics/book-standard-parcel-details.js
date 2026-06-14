document.addEventListener("DOMContentLoaded", () => {
    const detailsForm = document.getElementById("standardParcelDetailsForm");
    const btnBackToShipmentMenu = document.getElementById("btnBackToShipmentMenu");
    const deliveryCards = document.querySelectorAll('.delivery-option-card');
    
    // Form Dropdown Element References (Region -> Province -> City -> Barangay)
    const senderRegion = document.getElementById("senderRegion");
    const senderProvince = document.getElementById("senderProvince");
    const senderCity = document.getElementById("senderCity");
    const senderBarangay = document.getElementById("senderBarangay");

    const receiverRegion = document.getElementById("receiverRegion");
    const receiverProvince = document.getElementById("receiverProvince");
    const receiverCity = document.getElementById("receiverCity");
    const receiverBarangay = document.getElementById("receiverBarangay");
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

    // Profile Avatar Display Setup
    const profileAvatar = document.getElementById("profileAvatar");
    const savedAccountRaw = localStorage.getItem('dummyTestingAccount');
    if (savedAccountRaw && profileAvatar) {
        const userAccount = JSON.parse(savedAccountRaw);
        if (userAccount.firstName) {
            profileAvatar.innerText = userAccount.firstName.charAt(0).toUpperCase();
        }
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

    // PHONE NUMBER STRICT VALIDATION & SANITIZATION
    function sanitizePhoneNumberInput(inputElement) {
        if (!inputElement) return;
        inputElement.addEventListener("input", (e) => {
            let sanitizedValue = e.target.value.replace(/\D/g, "");
            if (sanitizedValue.length > 11) {
                sanitizedValue = sanitizedValue.slice(0, 11);
            }
            e.target.value = sanitizedValue;
        });
    }

    sanitizePhoneNumberInput(senderMobile);
    sanitizePhoneNumberInput(receiverMobile);

    //PSGC ENGINE
    const PSGC_BASE_URL = "https://psgc.gitlab.io/api";

    async function prefetchNationalGeographicRegistry() {
        try {
            // Concurrent asset fetch
            const [regionsRes, provincesRes, citiesRes] = await Promise.all([
                fetch(`${PSGC_BASE_URL}/regions.json`),
                fetch(`${PSGC_BASE_URL}/provinces.json`),
                fetch(`${PSGC_BASE_URL}/cities-municipalities.json`)
            ]);

            cachedRegionsList = await regionsRes.json();
            cachedProvincesList = await provincesRes.json();
            cachedCitiesMunicipalitiesList = await citiesRes.json();

            // Sort Regions alphabetically
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

        //Metro Manila (NCR) has no provinces. Direct to Cities.
        if (selectedRegionCode === "130000000") {
            const optNCR = document.createElement("option");
            optNCR.value = "130000000";
            optNCR.textContent = "METRO MANILA (NCR)";
            optNCR.setAttribute("data-name", "METRO MANILA (NCR)");
            provinceSelect.appendChild(optNCR);
            
            // Auto-select NCR option to bypass alternative provincial clicks
            provinceSelect.value = "130000000";
            handleProvinceSelectionChange(provinceSelect, citySelect, barangaySelect);
            return;
        }

        // Filter standard provinces matching the chosen region code branch
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
            // Fetch NCR cities 
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
            // Dynamically load deep local barangay listings safely
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

    // Bind Core Chain Event Hooks
    if (senderRegion) senderRegion.addEventListener("change", () => handleRegionSelectionChange(senderRegion, senderProvince, senderCity, senderBarangay));
    if (senderProvince) senderProvince.addEventListener("change", () => handleProvinceSelectionChange(senderProvince, senderCity, senderBarangay));
    if (senderCity) senderCity.addEventListener("change", () => handleCitySelectionChange(senderCity, senderBarangay));

    if (receiverRegion) receiverRegion.addEventListener("change", () => handleRegionSelectionChange(receiverRegion, receiverProvince, receiverCity, receiverBarangay));
    if (receiverProvince) receiverProvince.addEventListener("change", () => handleProvinceSelectionChange(receiverProvince, receiverCity, receiverBarangay));
    if (receiverCity) receiverCity.addEventListener("change", () => handleCitySelectionChange(receiverCity, receiverBarangay));

    // Initialize Prefetch Setup Engines
    prefetchNationalGeographicRegistry();

    //DOOR-TO-DOOR vs PICKUP TO OUTLET
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
        const receiverStreet = document.getElementById("receiverStreet");

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

    // NAVIGATION SUBMISSIONS & WORKSPACE PERSISTENCE
    if (btnBackToShipmentMenu) {
        btnBackToShipmentMenu.addEventListener("click", () => {
            window.location.href = "book-shipment.html";
        });
    }

    if (detailsForm) {
        detailsForm.addEventListener("submit", (e) => {
            e.preventDefault();

            if (senderMobile.value.length < 11 || receiverMobile.value.length < 11) {
                alert("❌ Mobile numbers must be exactly 11 digits long (e.g., 09171234567).");
                return;
            }

            const selectedOption = document.querySelector('input[name="deliveryOption"]:checked').value;

            const senderRegionName = senderRegion.options[senderRegion.selectedIndex].getAttribute('data-name');
            const senderProvName = senderProvince.options[senderProvince.selectedIndex].getAttribute('data-name');
            const senderCityName = senderCity.options[senderCity.selectedIndex].getAttribute('data-name');
            const senderBrgyName = senderBarangay.options[senderBarangay.selectedIndex].getAttribute('data-name');

            let receiverDestinationSummary = {};
            let simplifiedDestinationString = "";

            if (selectedOption === "PickupOutlet") {
                simplifiedDestinationString = receiverOutlet.value;
                receiverDestinationSummary = {
                    isOutletDropoff: true,
                    assignedOutletHub: receiverOutlet.value
                };
            } else {
                const receiverRegionName = receiverRegion.options[receiverRegion.selectedIndex].getAttribute('data-name');
                const receiverProvName = receiverProvince.options[receiverProvince.selectedIndex].getAttribute('data-name');
                const receiverCityName = receiverCity.options[receiverCity.selectedIndex].getAttribute('data-name');
                const receiverBrgyName = receiverBarangay.options[receiverBarangay.selectedIndex].getAttribute('data-name');
                simplifiedDestinationString = `${receiverCityName}, ${receiverProvName}`;
                
                receiverDestinationSummary = {
                    isOutletDropoff: false,
                    region: receiverRegionName,
                    province: receiverProvName,
                    city: receiverCityName,
                    barangay: receiverBrgyName,
                    street: document.getElementById("receiverStreet").value.trim()
                };
            }

            const shouldSaveSender = saveSenderAddress ? saveSenderAddress.checked : false;
            const shouldSaveReceiver = saveReceiverAddress ? saveReceiverAddress.checked : false;

            const resolvedServiceType = sessionStorage.getItem("activeBookingServiceType") || "Standard Parcel";

            const trackingManifest = {
                serviceWorkflowType: resolvedServiceType,
                deliveryArrangementOption: selectedOption,
                dashboardDisplayDestination: simplifiedDestinationString,
                saveSenderToAddressBook: shouldSaveSender,
                saveReceiverToAddressBook: shouldSaveReceiver,
                senderContactDetails: {
                    fullName: senderName.value.trim(),
                    mobile: senderMobile.value,
                    region: senderRegionName,
                    province: senderProvName,
                    city: senderCityName,
                    barangay: senderBrgyName,
                    street: document.getElementById("senderStreet").value.trim()
                },
                receiverContactDetails: {
                    fullName: receiverName.value.trim(),
                    mobile: receiverMobile.value,
                    ...receiverDestinationSummary
                }
            };

            localStorage.setItem('consolidatedBookingManifest', JSON.stringify(trackingManifest));
            window.location.href = "book-standard-parcel-package.html";
        });
    }
});