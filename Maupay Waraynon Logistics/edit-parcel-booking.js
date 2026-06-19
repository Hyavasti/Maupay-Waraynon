document.addEventListener("DOMContentLoaded", () => {
    // Extract local cache storage layer mapping models
    const rawManifest = localStorage.getItem('consolidatedBookingManifest');
    if (!rawManifest) {
        console.warn("⚠️ Data transfer manifest missing from localStorage cache.");
        alert("No shipment data detected. Returning back to bookings.");
        window.location.href = "my-bookings.html";
        return;
    }
    const manifest = JSON.parse(rawManifest);

    // Form input selection nodes
    const editBookingForm = document.getElementById('editBookingForm');
    const editRxName = document.getElementById('recipientName');
    const editRxContact = document.getElementById('recipientContact');
    const editRxAddress = document.getElementById('recipientAddress');
    const dynamicFormFieldsContainer = document.getElementById('dynamicFormFieldsContainer');

    // Inline Validation Message Elements Hooks
    const nameError = document.getElementById('nameError');
    const phoneError = document.getElementById('phoneError');

    // Normalize string casing patterns securely ("Standard Parcel", "Lipat-Bahay", "Heavy Cargo")
    let serviceType = manifest.serviceWorkflowType || manifest.serviceType || "Standard Parcel";
    const normalizer = serviceType.toLowerCase().replace(/[^a-z]/g, "");
    if (normalizer.includes("lipat") || normalizer.includes("bahay")) {
        serviceType = "Lipat-Bahay";
    } else if (normalizer.includes("heavy") || normalizer.includes("cargo")) {
        serviceType = "Heavy Cargo";
    } else {
        serviceType = "Standard Parcel";
    }

    // ==========================================
    // SERVICE VARIATION FORM INJECTOR (WITH DIRECT PRE-FILL)
    // ==========================================
    function renderCustomInputsForService(type, pkg) {
        if (!dynamicFormFieldsContainer) return;

        // Safeguard special handling note references (checking all database key naming variants)
        const notesValue = pkg.specialHandlingNotes || pkg.specialInstructions || pkg.specialNotes || '';
        
        let targetHTML = '';

        if (type === "Standard Parcel") {
            targetHTML = `
                <div class="form-grid-two-col">
                    <div class="form-field-group">
                        <label for="itemDescription">Item Description</label>
                        <input type="text" id="itemDescription" value="${pkg.description || ''}" placeholder="e.g., Clothing, Electronics" required>
                    </div>
                    <div class="form-field-group">
                        <label for="itemCategory">Category</label>
                        <select id="itemCategory">
                            <option value="General" ${pkg.category === 'General' ? 'selected' : ''}>General</option>
                            <option value="Fragile" ${pkg.category === 'Fragile' ? 'selected' : ''}>Fragile</option>
                            <option value="Perishable" ${pkg.category === 'Perishable' ? 'selected' : ''}>Perishable</option>
                        </select>
                    </div>
                </div>
                <div class="form-grid-four-col">
                    <div class="form-field-group">
                        <label for="length">Length (cm)</label>
                        <input type="number" id="length" value="${pkg.dimensions?.length || 0}" required>
                    </div>
                    <div class="form-field-group">
                        <label for="width">Width (cm)</label>
                        <input type="number" id="width" value="${pkg.dimensions?.width || 0}" required>
                    </div>
                    <div class="form-field-group">
                        <label for="height">Height (cm)</label>
                        <input type="number" id="height" value="${pkg.dimensions?.height || 0}" required>
                    </div>
                    <div class="form-field-group">
                        <label for="weight">Weight (kg)</label>
                        <input type="number" step="0.1" id="weight" value="${pkg.weightKg || 0}" required>
                    </div>
                </div>
                <div class="form-field-group" style="margin-bottom: 16px;">
                    <label for="declaredValue">Declared value (PHP)</label>
                    <input type="number" id="declaredValue" value="${pkg.declaredValue || 0}" required>
                </div>
            `;
        } else if (type === "Lipat-Bahay") {
            targetHTML = `
                <div class="form-grid-two-col">
                    <div class="form-field-group">
                        <label for="vehicleSize">Vehicle Requirement Size</label>
                        <select id="vehicleSize">
                            <option value="Van" ${pkg.vehicleSize === 'Van' ? 'selected' : ''}>Cargo Van Fleet</option>
                            <option value="4-Wheeler" ${pkg.vehicleSize === '4-Wheeler' ? 'selected' : ''}>4-Wheeler Closed Truck</option>
                            <option value="6-Wheeler" ${pkg.vehicleSize === '6-Wheeler' ? 'selected' : ''}>6-Wheeler Forward Carrier</option>
                        </select>
                    </div>
                    <div class="form-field-group">
                        <label for="crewHelpers">Requested Assistant Helpers</label>
                        <input type="number" id="crewHelpers" value="${pkg.crewHelpers || 2}" min="1" max="6">
                    </div>
                </div>
                <div class="form-grid-two-col">
                    <div class="form-field-group">
                        <label for="originFloor">Pickup Floor Level Elevation</label>
                        <input type="text" id="originFloor" value="${pkg.originFloor || ''}" placeholder="e.g., Ground Floor">
                    </div>
                    <div class="form-field-group">
                        <label for="dropoffFloor">Destination Floor Level</label>
                        <input type="text" id="dropoffFloor" value="${pkg.dropoffFloor || ''}" placeholder="e.g., Room 3B Elevator access">
                    </div>
                </div>
            `;
        } else if (type === "Heavy Cargo") {
            targetHTML = `
                <div class="form-grid-two-col">
                    <div class="form-field-group">
                        <label for="freightType">Freight Classification Mode</label>
                        <select id="freightType">
                            <option value="Palletized" ${pkg.freightType === 'Palletized' ? 'selected' : ''}>Palletized Industrial Units</option>
                            <option value="Machinery" ${pkg.freightType === 'Machinery' ? 'selected' : ''}>Heavy Crates / Machineries</option>
                            <option value="Bulk" ${pkg.freightType === 'Bulk' ? 'selected' : ''}>Loose Commercial Bulk Delivery</option>
                        </select>
                    </div>
                    <div class="form-field-group">
                        <label for="weight">Estimated Unit Mass Load (kg)</label>
                        <input type="number" step="0.1" id="weight" value="${pkg.weightKg || 0}" required>
                    </div>
                </div>
            `;
        }

        // Combine everything inside a clean single DOM payload injection
        targetHTML += `
            <div class="form-field-group" style="margin-top: 14px;">
                <label for="specialInstructions">Special Handling Instructions</label>
                <textarea id="specialInstructions" rows="3" placeholder="Optional: Special instructions">${notesValue}</textarea>
            </div>
        `;

        dynamicFormFieldsContainer.innerHTML = targetHTML;
    }

    // Execute Layout & Prefill Constructor
    renderCustomInputsForService(serviceType, manifest.packageConfiguration || {});

    // ==========================================================================
    // DYNAMIC NATIONWIDE PSGC LIVE API SYSTEM (INTEGRATED & PRE-FILLED)
    // ==========================================================================
    const API_BASE_URL = "https://psgc.gitlab.io/api";
    const rcv = manifest.receiverContactDetails || {};
    const fullAddressString = rcv.fullAddress || "";

    function parseSavedGeographicTokens(addressStr) {
        const parts = addressStr.split(',').map(p => p.trim());
        let regionStr = "";
        let provinceStr = "";
        let cityStr = "";
        let barangayStr = "";

        if (parts.length >= 4) {
            regionStr = parts[parts.length - 1];
            provinceStr = parts[parts.length - 2];
            cityStr = parts[parts.length - 3];
            
            let bgyPart = parts[parts.length - 4];
            if (bgyPart.toLowerCase().startsWith("brgy.")) {
                barangayStr = bgyPart.substring(5).trim();
            } else {
                barangayStr = bgyPart;
            }
        }
        return { regionStr, provinceStr, cityStr, barangayStr };
    }

    const savedTokens = parseSavedGeographicTokens(fullAddressString);

    async function initNationwidePSGC(prefix) {
        const regSelect = document.getElementById(`${prefix}Region`);
        const provSelect = document.getElementById(`${prefix}Province`);
        const citySelect = document.getElementById(`${prefix}City`);
        const bgySelect = document.getElementById(`${prefix}Barangay`);

        try {
            const response = await fetch(`${API_BASE_URL}/regions/`);
            const regions = await response.json();
            
            regSelect.innerHTML = '<option value="">Select region</option>';
            regions.sort((a, b) => a.name.localeCompare(b.name)).forEach(reg => {
                regSelect.innerHTML += `<option value="${reg.code}" data-name="${reg.name}">${reg.name}</option>`;
            });

            if (savedTokens.regionStr) {
                const matchedOpt = Array.from(regSelect.options).find(opt => opt.getAttribute('data-name') === savedTokens.regionStr);
                if (matchedOpt) {
                    regSelect.value = matchedOpt.value;
                    await handleRegionChange(regSelect.value);
                }
            }
        } catch (err) {
            console.error("Critical failure tracking down regional data metrics.", err);
            regSelect.innerHTML = '<option value="">Error loading geographic database</option>';
        }

        regSelect.addEventListener("change", async () => {
            await handleRegionChange(regSelect.value);
        });

        async function handleRegionChange(regCode) {
            provSelect.innerHTML = '<option value="">Select province</option>';
            citySelect.innerHTML = '<option value="">Select city/municipality</option>';
            bgySelect.innerHTML = '<option value="">Select barangay</option>';
            provSelect.disabled = true; 
            citySelect.disabled = true; 
            bgySelect.disabled = true;
            
            if (!regCode) return;

            if (regCode === "130000000" || regCode === "1300000000") {
                provSelect.innerHTML = '<option value="NCR" data-name="Metro Manila">Metro Manila (NCR)</option>';
                provSelect.disabled = false;
                provSelect.value = "NCR";

                try {
                    const cityRes = await fetch(`${API_BASE_URL}/regions/${regCode}/cities-municipalities/`);
                    let cities = await cityRes.json();
                    
                    if(!cities || cities.length === 0) {
                        const altCityRes = await fetch(`${API_BASE_URL}/regions/${regCode}/cities/`);
                        cities = await altCityRes.json();
                    }

                    citySelect.innerHTML = '<option value="">Select city/municipality</option>';
                    cities.sort((a, b) => a.name.localeCompare(b.name)).forEach(c => {
                        citySelect.innerHTML += `<option value="${c.code}" data-name="${c.name}">${c.name}</option>`;
                    });
                    citySelect.disabled = false;

                    if (savedTokens.cityStr) {
                        const matchedOpt = Array.from(citySelect.options).find(opt => opt.getAttribute('data-name') === savedTokens.cityStr);
                        if (matchedOpt) {
                            citySelect.value = matchedOpt.value;
                            await handleCityChange(citySelect.value);
                        }
                    }
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

                if (savedTokens.provinceStr) {
                    const matchedOpt = Array.from(provSelect.options).find(opt => opt.getAttribute('data-name') === savedTokens.provinceStr);
                    if (matchedOpt) {
                        provSelect.value = matchedOpt.value;
                        await handleProvinceChange(provSelect.value);
                    }
                }
            } catch (err) { 
                console.error("Error loading regional provinces:", err); 
            }
        }

        provSelect.addEventListener("change", async () => {
            await handleProvinceChange(provSelect.value);
        });

        async function handleProvinceChange(provCode) {
            if (provCode === "NCR") return;

            citySelect.innerHTML = '<option value="">Select city/municipality</option>';
            bgySelect.innerHTML = '<option value="">Select barangay</option>';
            citySelect.disabled = true; 
            bgySelect.disabled = true;
            
            if (!provCode) return;

            try {
                const res = await fetch(`${API_BASE_URL}/provinces/${provCode}/cities-municipalities/`);
                const cities = await res.json();
                citySelect.innerHTML = '<option value="">Select city/municipality</option>';
                cities.sort((a, b) => a.name.localeCompare(b.name)).forEach(c => {
                    citySelect.innerHTML += `<option value="${c.code}" data-name="${c.name}">${c.name}</option>`;
                });
                citySelect.disabled = false;

                if (savedTokens.cityStr) {
                    const matchedOpt = Array.from(citySelect.options).find(opt => opt.getAttribute('data-name') === savedTokens.cityStr);
                    if (matchedOpt) {
                        citySelect.value = matchedOpt.value;
                        await handleCityChange(citySelect.value);
                    }
                }
            } catch (err) { 
                console.error("Error loading city records:", err); 
            }
        }

        citySelect.addEventListener("change", async () => {
            await handleCityChange(citySelect.value);
        });

        async function handleCityChange(cityCode) {
            bgySelect.innerHTML = '<option value="">Select barangay</option>';
            bgySelect.disabled = true;
            
            if (!cityCode) return;

            try {
                const res = await fetch(`${API_BASE_URL}/cities-municipalities/${cityCode}/barangays/`);
                const barangays = await res.json();
                bgySelect.innerHTML = '<option value="">Select barangay</option>';
                barangays.sort((a, b) => a.name.localeCompare(b.name)).forEach(b => {
                    bgySelect.innerHTML += `<option value="${b.code}" data-name="${b.name}">${b.name}</option>`;
                });
                bgySelect.disabled = false;

                if (savedTokens.barangayStr) {
                    const matchedOpt = Array.from(bgySelect.options).find(opt => opt.getAttribute('data-name') === savedTokens.barangayStr);
                    if (matchedOpt) {
                        bgySelect.value = matchedOpt.value;
                    }
                }
            } catch (err) { 
                console.error("Error loading barangay records:", err); 
            }
        }
    }

    initNationwidePSGC("recipient");

    // ==========================================================================
    // INTERACTIVE REAL-TIME INPUT VALIDATION
    // ==========================================================================
    editRxName.addEventListener('input', () => {
        editRxName.value = editRxName.value.replace(/[^A-Za-z\s\.]/g, '');
        if (editRxName.value.trim() === "") {
            nameError.textContent = "Names must contain letters, spaces, and periods only.";
            nameError.style.setProperty("display", "block", "important");
            editRxName.classList.add('invalid-input-border');
        } else {
            nameError.textContent = "";
            nameError.style.setProperty("display", "none", "important");
            editRxName.classList.remove('invalid-input-border');
        }
    });

    editRxContact.addEventListener('input', () => {
        editRxContact.value = editRxContact.value.replace(/\D/g, '');
        const val = editRxContact.value;
        
        if (val.length > 0 && !val.startsWith('09')) {
            phoneError.textContent = "Philippine numbers must begin with '09'.";
            phoneError.style.setProperty("display", "block", "important");
            editRxContact.classList.add('invalid-input-border');
        } else if (val.length > 0 && val.length !== 11) {
            phoneError.textContent = "Must contain exactly 11 numeric digits.";
            phoneError.style.setProperty("display", "block", "important");
            editRxContact.classList.add('invalid-input-border');
        } else {
            phoneError.textContent = "";
            phoneError.style.setProperty("display", "none", "important");
            editRxContact.classList.remove('invalid-input-border');
        }
    });

    // ==========================================================================
    // DATA PRE-FILL ENGINE FROM STORAGE MANIFEST (STATIC FIELDS)
    // ==========================================================================
    if (document.getElementById('displayControlNo')) document.getElementById('displayControlNo').innerText = manifest.generatedTrackingId || "N/A";
    if (document.getElementById('displayStatus')) document.getElementById('displayStatus').innerText = manifest.status || "Pending";
    if (document.getElementById('displayServiceType')) document.getElementById('displayServiceType').innerText = serviceType;
    if (document.getElementById('displayBookingDate')) document.getElementById('displayBookingDate').innerText = (manifest.bookingTimestamp || "").split("T")[0] || "N/A";

    const snd = manifest.senderContactDetails || {};
    if (document.getElementById('senderNameText')) document.getElementById('senderNameText').innerText = snd.fullName || "N/A";
    if (document.getElementById('senderContactText')) document.getElementById('senderContactText').innerText = snd.phoneNumber || "N/A";
    if (document.getElementById('senderAddressText')) document.getElementById('senderAddressText').innerText = snd.fullAddress || "N/A";

    if (editRxName) editRxName.value = rcv.fullName || "";
    if (editRxContact) editRxContact.value = rcv.phoneNumber || "";
    if (editRxAddress) {
        if (rcv.fullAddress && rcv.fullAddress.includes(',')) {
            editRxAddress.value = rcv.fullAddress.split(',')[0].trim();
        } else {
            editRxAddress.value = rcv.fullAddress || "";
        }
    }

    // ==========================================================================
    // PRICING RE-ASSESSMENT LOGIC ENGINE
    // ==========================================================================
    function executeRecalculationEngine() {
        let originalPrice = parseFloat(manifest.billingLedger?.grandTotal || 150);
        let weightSurcharge = 0;
        
        const weightInput = document.getElementById('weight');
        const currentWeight = weightInput ? parseFloat(weightInput.value) || 0 : 0;
        
        if (currentWeight > 20 && serviceType === "Heavy Cargo") {
            weightSurcharge = (currentWeight - 20) * 15; 
        } else if (currentWeight > 10 && serviceType === "Standard Parcel") {
            weightSurcharge = (currentWeight - 10) * 10;
        }

        let calculatedNewTotal = originalPrice + weightSurcharge;

        if (document.getElementById('summaryBasePrice')) document.getElementById('summaryBasePrice').innerText = `PHP ${originalPrice.toFixed(2)}`;
        if (document.getElementById('summaryAddonPrice')) document.getElementById('summaryAddonPrice').innerText = `PHP ${weightSurcharge.toFixed(2)}`;
        if (document.getElementById('summaryAdditionalPayment')) document.getElementById('summaryAdditionalPayment').innerText = `+PHP ${weightSurcharge.toFixed(2)}`;
        if (document.getElementById('displayTotalAmount')) document.getElementById('displayTotalAmount').innerText = `PHP ${calculatedNewTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        
        return { base: originalPrice, surcharge: weightSurcharge, total: calculatedNewTotal };
    }

    function assignRecalcListeners() {
        const targetInputs = ['weight', 'length', 'width', 'height'];
        targetInputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', executeRecalculationEngine);
        });
    }

    assignRecalcListeners();
    executeRecalculationEngine();

    // ==========================================================================
    // DATA PIPELINE SUBMISSION AND STORAGE ENGINE
    // ==========================================================================
    if (editBookingForm) {
        editBookingForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const nameVal = editRxName.value.trim();
            const phoneVal = editRxContact.value.trim();

            if (/[^A-Za-z\s\.]/.g.test(nameVal) || nameVal === "") {
                nameError.textContent = "Names must contain letters, spaces, and periods only.";
                nameError.style.setProperty("display", "block", "important");
                editRxName.classList.add('invalid-input-border');
                editRxName.focus();
                return;
            }

            if (phoneVal.length !== 11 || !phoneVal.startsWith('09')) {
                phoneError.textContent = "Must be an 11-digit number starting with 09.";
                phoneError.style.setProperty("display", "block", "important");
                editRxContact.classList.add('invalid-input-border');
                editRxContact.focus();
                return;
            }

            const regSelect = document.getElementById('recipientRegion');
            const provSelect = document.getElementById('recipientProvince');
            const citySelect = document.getElementById('recipientCity');
            const bgySelect = document.getElementById('recipientBarangay');

            if (!regSelect.value || !provSelect.value || !citySelect.value || !bgySelect.value) {
                alert("Please complete the required Region, Province, City, and Barangay data fields.");
                return;
            }

            const regionText = regSelect.options[regSelect.selectedIndex].getAttribute('data-name');
            const provinceText = provSelect.options[provSelect.selectedIndex].getAttribute('data-name');
            const cityText = citySelect.options[citySelect.selectedIndex].getAttribute('data-name');
            const brgyText = bgySelect.options[bgySelect.selectedIndex].getAttribute('data-name');
            
            const fullDestinationStr = `${editRxAddress.value.trim()}, Brgy. ${brgyText}, ${cityText}, ${provinceText}, ${regionText}`;
            const pricingLog = executeRecalculationEngine();

            manifest.receiverContactDetails = {
                fullName: nameVal,
                phoneNumber: phoneVal,
                fullAddress: fullDestinationStr
            };

            const itemDescInput = document.getElementById('itemDescription');
            const itemCategorySelect = document.getElementById('itemCategory');
            const specialInstructionsTextarea = document.getElementById('specialInstructions');
            const liveWeightInput = document.getElementById('weight');
            const liveDeclaredValue = document.getElementById('declaredValue');

            manifest.packageConfiguration = {
                description: itemDescInput ? itemDescInput.value.trim() : (manifest.packageConfiguration?.description || "General Goods"),
                category: itemCategorySelect ? itemCategorySelect.value : (manifest.packageConfiguration?.category || "General"),
                weightKg: liveWeightInput ? parseFloat(liveWeightInput.value) || 0 : 0,
                declaredValue: liveDeclaredValue ? parseFloat(liveDeclaredValue.value) || 0 : (manifest.packageConfiguration?.declaredValue || 0),
                specialHandlingNotes: specialInstructionsTextarea ? specialInstructionsTextarea.value.trim() : "",
                dimensions: {
                    length: document.getElementById('length') ? parseFloat(document.getElementById('length').value) || 0 : 0,
                    width: document.getElementById('width') ? parseFloat(document.getElementById('width').value) || 0 : 0,
                    height: document.getElementById('height') ? parseFloat(document.getElementById('height').value) || 0 : 0
                },
                vehicleSize: document.getElementById('vehicleSize') ? document.getElementById('vehicleSize').value : "",
                crewHelpers: document.getElementById('crewHelpers') ? parseInt(document.getElementById('crewHelpers').value) || 0 : 0,
                originFloor: document.getElementById('originFloor') ? document.getElementById('originFloor').value : "",
                dropoffFloor: document.getElementById('dropoffFloor') ? document.getElementById('dropoffFloor').value : ""
            };

            manifest.billingLedger = {
                baseRate: pricingLog.base,
                weightSurcharge: pricingLog.surcharge,
                insuranceCharge: parseFloat(manifest.billingLedger?.insuranceCharge || 0),
                grandTotal: pricingLog.total
            };

            manifest.serviceWorkflowType = serviceType;
            manifest.dashboardDisplayDestination = fullDestinationStr;

            localStorage.setItem('consolidatedBookingManifest', JSON.stringify(manifest));

            if (serviceType === "Heavy Cargo") {
                window.location.href = "book-cargo-payment.html";
            } else if (serviceType === "Lipat-Bahay") {
                window.location.href = "book-lipatbahay-payment.html";
            } else {
                window.location.href = "book-standard-parcel-payment.html";
            }
        });
    }

    const btnCancelDiscard = document.querySelector('.btn-cancel-discard');
    if (btnCancelDiscard) {
        btnCancelDiscard.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = "booking-details.html";
        });
    }
});