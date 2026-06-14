document.addEventListener("DOMContentLoaded", () => {
    const cargoDetailsForm = document.getElementById("cargoDetailsForm");
    const btnBackToSelection = document.getElementById("btnBackToSelection");
    const profileAvatar = document.getElementById("profileAvatar");
    
    //PROFILE AVATAR DISPLAY INITIALIZER
    const savedAccountRaw = localStorage.getItem('dummyTestingAccount');
    if (savedAccountRaw && profileAvatar) {
        const userAccount = JSON.parse(savedAccountRaw);
        if (userAccount.firstName) {
            profileAvatar.innerText = userAccount.firstName.charAt(0).toUpperCase();
        }
    }

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
        });
    });

    // Numeric mobile safety gate routing mapping (Mobile Numbers)
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
            if (sanitizedValue.length === 11 || sanitizedValue.length === 0) removeInlineError(field);
        });

        field.addEventListener("blur", (e) => {
            if (e.target.value.length > 0 && e.target.value.length < 11) {
                showInlineError(field, "⚠️ Mobile numbers must be exactly 11 digits (e.g., 09171234567).");
            } else {
                removeInlineError(field);
            }
        });
    });


    //NATIONWIDE PSGC 
    const API_BASE_URL = "https://psgc.gitlab.io/api";

    async function initNationwidePSGC(prefix) {
        const regSelect = document.getElementById(`${prefix}Region`);
        const provSelect = document.getElementById(`${prefix}Province`);
        const citySelect = document.getElementById(`${prefix}City`);
        const bgySelect = document.getElementById(`${prefix}Barangay`);

        // Load all available regions out of endpoint array
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

        // Region -> Province change handler
        regSelect.addEventListener("change", async () => {
            const regCode = regSelect.value;
            
            // Clear all dependent fields immediately
            provSelect.innerHTML = '<option value="">Select province</option>';
            citySelect.innerHTML = '<option value="">Select city/municipality</option>';
            bgySelect.innerHTML = '<option value="">Select barangay</option>';
            provSelect.disabled = true; 
            citySelect.disabled = true; 
            bgySelect.disabled = true;
            
            if (!regCode) return;

            //ABSOLUTE NCR PATCH
            if (regCode === "130000000") {
                // 1. Manually assign alternative metadata to province block
                provSelect.innerHTML = '<option value="NCR" data-name="Metro Manila">Metro Manila (NCR)</option>';
                provSelect.disabled = false;
                provSelect.value = "NCR";

                //Immediately call specific API endpoint for NCR cities
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

            // STANDARD PROVINCE HANDLING
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

        // Province -> City change handler
        provSelect.addEventListener("change", async () => {
            const provCode = provSelect.value;
            
            // Skip loading if this is NCR since NCR was handled directly in the region listener
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

        // City -> Barangay change handler
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

            // Enforce validation constraints across mobile numeric lengths
            mobileFields.forEach(field => {
                if (field && field.value.length < 11) {
                    showInlineError(field, "⚠️ This field is required and must contain exactly 11 digits.");
                    hasErrors = true;
                }
            });

            // Catch missing dropdown selections across geographic fields
            const requiredDropdowns = [
                "pickupRegion", "pickupProvince", "pickupCity", "pickupBarangay", 
                "deliveryRegion", "deliveryProvince", "deliveryCity", "deliveryBarangay"
            ];
            requiredDropdowns.forEach(id => {
                const selectElement = document.getElementById(id);
                if (selectElement && !selectElement.value) {
                    showInlineError(selectElement, "⚠️ Dropdown mapping constraints require an assignment value.");
                    hasErrors = true;
                } else if (selectElement) {
                    removeInlineError(selectElement);
                }
            });

            if (hasErrors) {
                const firstError = document.querySelector(".error-note");
                if (firstError) firstError.parentElement.querySelector("input, select").focus();
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

            // Intercept and resolve Profile Shortcut check box updates
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

            // Consolidate values inside master tracking manifest object local storage registry
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
            
            // Proceed to the package specifications screen!
            window.location.href = "book-cargo-package.html";
        });
    }
});