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

    // Pull active authentication session parameters
    const savedAccountRaw = localStorage.getItem('dummyTestingAccount');
    let userAccountData = null;

    if (savedAccountRaw) {
        userAccountData = JSON.parse(savedAccountRaw);
        if (userAccountData.firstName) {
            profileAvatar.innerText = userAccountData.firstName.charAt(0).toUpperCase();
        }
    }

    // =========================================================
    // 1. NATIONWIDE COMPLETE PH LOCATIONS ENGINE (PSGC API)
    // =========================================================
    
    // Fetch complete official PSGC Geographic structure completely live
    fetch('https://psgc.gitlab.io/api/provinces.json')
        .then(res => res.json())
        .then(provinces => {
            provinces.sort((a, b) => a.name.localeCompare(b.name));
            
            pickupProvince.innerHTML = '<option value="" disabled selected>Select province</option>';
            dropoffProvince.innerHTML = '<option value="" disabled selected>Select province</option>';
            
            provinces.forEach(prov => {
                const optFrom = document.createElement("option");
                optFrom.value = prov.code; 
                optFrom.innerText = prov.name;
                pickupProvince.appendChild(optFrom);

                const optTo = document.createElement("option");
                optTo.value = prov.code;
                optTo.innerText = prov.name;
                dropoffProvince.appendChild(optTo);
            });
            console.log("🇵🇭 Nationwide Philippine Province Registry Fully Armed & Connected!");
            
            // Check if there is cached data to restore AFTER the provinces are loaded
            restoreCachedFormData();
        })
        .catch(err => console.error("Location API failed to connect:", err));

    // Universal handler to wire up Cascading City & Barangay searches dynamically
    function wirePsgcCascadingDropdowns(provinceSelect, citySelect, barangaySelect) {
        
        provinceSelect.addEventListener("change", (e, targetCityCode = null, targetBrgyName = null) => {
            const provinceCode = provinceSelect.value;
            if (!provinceCode) return;
            
            citySelect.innerHTML = '<option value="" disabled selected>Loading cities...</option>';
            barangaySelect.innerHTML = '<option value="" disabled selected>Select barangay</option>';
            citySelect.disabled = false;
            barangaySelect.disabled = true;

            fetch(`https://psgc.gitlab.io/api/provinces/${provinceCode}/cities-municipalities.json`)
                .then(res => res.json())
                .then(cities => {
                    cities.sort((a, b) => a.name.localeCompare(b.name));
                    citySelect.innerHTML = '<option value="" disabled selected>Select city/municipality</option>';
                    
                    cities.forEach(city => {
                        const opt = document.createElement("option");
                        opt.value = city.code; 
                        opt.innerText = city.name;
                        citySelect.appendChild(opt);
                    });

                    // If we have a cached city to restore, set it now
                    if (targetCityCode) {
                        citySelect.value = targetCityCode;
                        // Fire subsequent barangay load event manually
                        triggerCascadingCityChange(citySelect, barangaySelect, targetBrgyName);
                    }
                });
        });

        citySelect.addEventListener("change", () => {
            triggerCascadingCityChange(citySelect, barangaySelect);
        });
    }

    function triggerCascadingCityChange(citySelect, barangaySelect, targetBrgyName = null) {
        const cityCode = citySelect.value;
        if (!cityCode) return;
        
        barangaySelect.innerHTML = '<option value="" disabled selected>Loading barangays...</option>';
        barangaySelect.disabled = false;

        const targetUrl = `https://psgc.gitlab.io/api/cities-municipalities/${cityCode}/barangays.json`;

        fetch(targetUrl)
            .then(res => res.json())
            .then(barangays => {
                barangays.sort((a, b) => a.name.localeCompare(b.name));
                barangaySelect.innerHTML = '<option value="" disabled selected>Select barangay</option>';
                
                barangays.forEach(brgy => {
                    const opt = document.createElement("option");
                    opt.value = brgy.name; 
                    opt.innerText = brgy.name;
                    barangaySelect.appendChild(opt);
                });

                // If we have a cached barangay name to restore, set it now
                if (targetBrgyName) {
                    barangaySelect.value = targetBrgyName;
                }
            })
            .catch(() => {
                barangaySelect.innerHTML = '<option value="" disabled selected>Select barangay</option>';
            });
    }

    wirePsgcCascadingDropdowns(pickupProvince, pickupCity, pickupBarangay);
    wirePsgcCascadingDropdowns(dropoffProvince, dropoffCity, dropoffBarangay);

    // =========================================================
    // 2. SHORTCUT AUTO-FILL DATA UTILITIES
    // =========================================================
    pickupShortcut.addEventListener("change", () => {
        if (pickupShortcut.value === "profile") {
            if (userAccountData) {
                pickupContact.value = `${userAccountData.firstName} ${userAccountData.lastName}`.trim();
                pickupMobile.value = userAccountData.fullContactPhone || "";
            } else {
                pickupContact.value = "Juan Dela Cruz";
                pickupMobile.value = "09123456789";
            }
        } else if (pickupShortcut.value === "clear") {
            pickupContact.value = "";
            pickupMobile.value = "";
            pickupStreet.value = "";
            chkSavePickup.checked = false;
            pickupProvince.selectedIndex = 0;
            resetSelector(pickupCity, "city/municipality");
            resetSelector(pickupBarangay, "barangay");
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
        }
    });

    function resetSelector(element, typeName) {
        element.innerHTML = `<option value="" disabled selected>Select ${typeName}</option>`;
        element.disabled = true;
    }

    // =========================================================
    // 3. STATE PERSISTENCE ENGINE (RESTORE ON BACK NAVIGATION)
    // =========================================================
    function restoreCachedFormData() {
        const activeDetailsCache = localStorage.getItem('activeBookingFormStep2');
        if (!activeDetailsCache) return;

        try {
            const cachedData = JSON.parse(activeDetailsCache);

            // Restore Current Address (From) fields and cascaded values
            if (cachedData.origin) {
                pickupContact.value = cachedData.origin.name || "";
                pickupMobile.value = cachedData.origin.phone || "";
                pickupStreet.value = cachedData.origin.street || "";
                chkSavePickup.checked = cachedData.origin.shouldSaveToAddressBook || false;

                if (cachedData.origin.provinceCode) {
                    pickupProvince.value = cachedData.origin.provinceCode;
                    // Force the province element to trigger city populates via arguments
                    const event = new Event('change');
                    pickupProvince.dispatchEvent(event);
                    
                    // Wire up the asynchronous restoration loop
                    setTimeout(() => {
                        pickupProvince.dispatchEvent(new Event('change'));
                    }, 50);
                    
                    // Execute manual invocation to pass code state parameters down the chain
                    let citySelectHandler = pickupProvince.listeners?.change || function() {
                        // Custom handler bypass to catch dropdown timings natively
                        const pCode = pickupProvince.value;
                        fetch(`https://psgc.gitlab.io/api/provinces/${pCode}/cities-municipalities.json`)
                            .then(r => r.json()).then(cities => {
                                pickupCity.innerHTML = '<option value="" disabled selected>Select city/municipality</option>';
                                cities.sort((a, b) => a.name.localeCompare(b.name));
                                cities.forEach(c => {
                                    const o = new Option(c.name, c.code);
                                    pickupCity.add(o);
                                });
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
                    };
                    citySelectHandler();
                }
            }

            // Restore New Address (To) fields and cascaded values
            if (cachedData.destination) {
                dropoffContact.value = cachedData.destination.name || "";
                dropoffMobile.value = cachedData.destination.phone || "";
                dropoffStreet.value = cachedData.destination.street || "";
                chkSaveDropoff.checked = cachedData.destination.shouldSaveToAddressBook || false;

                if (cachedData.destination.provinceCode) {
                    dropoffProvince.value = cachedData.destination.provinceCode;
                    
                    let citySelectHandlerTo = function() {
                        const pCode = dropoffProvince.value;
                        fetch(`https://psgc.gitlab.io/api/provinces/${pCode}/cities-municipalities.json`)
                            .then(r => r.json()).then(cities => {
                                dropoffCity.innerHTML = '<option value="" disabled selected>Select city/municipality</option>';
                                cities.sort((a, b) => a.name.localeCompare(b.name));
                                cities.forEach(c => {
                                    const o = new Option(c.name, c.code);
                                    dropoffCity.add(o);
                                });
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
                    };
                    citySelectHandlerTo();
                }
            }
        } catch (err) {
            console.error("Error reading persistence data models:", err);
        }
    }

    // =========================================================
    // 4. ACTION CONTROL NAVIGATION & SUBMIT SUBMISSION TIMELINE
    // =========================================================
    btnBack.addEventListener("click", () => {
        window.location.href = "book-shipment.html";
    });

    formWizard.addEventListener("submit", (e) => {
        e.preventDefault();

        // Security Validation Guard Rails for mobile number string properties
        if (pickupMobile.value.length < 11 || dropoffMobile.value.length < 11) {
            alert("❌ Mobile numbers must be accurate contact text strings (Minimum 11 numbers).");
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
                provinceCode: pickupProvince.value, // Retained to trace the API branch on back steps
                city: selectedOrigCity,
                cityCode: pickupCity.value,         // Retained to trace the API branch on back steps
                barangay: pickupBarangay.value,
                street: pickupStreet.value,
                shouldSaveToAddressBook: chkSavePickup.checked
            },
            destination: {
                name: dropoffContact.value,
                phone: dropoffMobile.value,
                province: selectedDestProv,
                provinceCode: dropoffProvince.value, // Retained to trace the API branch on back steps
                city: selectedDestCity,
                cityCode: dropoffCity.value,         // Retained to trace the API branch on back steps
                barangay: dropoffBarangay.value,
                street: dropoffStreet.value,
                shouldSaveToAddressBook: chkSaveDropoff.checked
            }
        };

        localStorage.setItem('activeBookingFormStep2', JSON.stringify(completeNationalPayload));
        console.log("Success! Nationwide address log generated safely:", completeNationalPayload);
        
        // Corrected route direction mapping link -> Goes to Step 2 Move Info next!
        window.location.href = "book-lipatbahay-info.html";
    });
});