document.addEventListener("DOMContentLoaded", () => {
    // Shortcuts dropdowns
    const pickupShortcut = document.getElementById("dropdownPickupShortcut");
    const dropoffShortcut = document.getElementById("dropdownDropoffShortcut");
    
    // Pickup Target Elements (FROM)
    const pickupContact = document.getElementById("pickupContact");
    const pickupMobile = document.getElementById("pickupMobile");
    const pickupProvince = document.getElementById("pickupProvince"); // Acts as Region dropdown now
    const pickupCity = document.getElementById("pickupCity");
    const pickupBarangay = document.getElementById("pickupBarangay");
    const pickupStreet = document.getElementById("pickupStreetAddress");
    const chkSavePickup = document.getElementById("chkSavePickupAddress");

    // Dropoff Target Elements (TO)
    const dropoffContact = document.getElementById("dropoffContact");
    const dropoffMobile = document.getElementById("dropoffMobile");
    const dropoffProvince = document.getElementById("dropoffProvince"); // Acts as Region dropdown now
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
        if (userAccountData.firstName && profileAvatar) {
            profileAvatar.innerText = userAccountData.firstName.charAt(0).toUpperCase();
        }
    }

    // =========================================================
    // NEW: LIVE INPUT RESTRICTIONS & REGEX FILTERS
    // =========================================================
    
    /**
     * Blocks numbers and special characters instantly.
     * Allows only letters, spaces, and hyphens for names.
     */
    function restrictToLettersOnly(element) {
        if (!element) return;
        element.addEventListener("input", (e) => {
            e.target.value = e.target.value.replace(/[^a-zA-Z\s\-]/g, "");
        });
    }

    /**
     * Blocks letters and special characters instantly.
     * Caps the length strictly at 11 digits.
     */
    function restrictToMobileNumbersOnly(element) {
        if (!element) return;
        element.addEventListener("input", (e) => {
            let clearedValue = e.target.value.replace(/\D/g, ""); 
            if (clearedValue.length > 11) {
                clearedValue = clearedValue.slice(0, 11);
            }
            e.target.value = clearedValue;
        });
    }

    // Apply filters natively to your input variables
    restrictToLettersOnly(pickupContact);
    restrictToLettersOnly(dropoffContact);
    restrictToMobileNumbersOnly(pickupMobile);
    restrictToMobileNumbersOnly(dropoffMobile);


    // =========================================================
    // UPGRADED: REGION-FIRST CARGO-STYLE PSGC ENGINE
    // =========================================================
    
    // Fetch complete official PSGC Geographic structure starting at the Regional level
    fetch('https://psgc.gitlab.io/api/regions.json')
        .then(res => res.json())
        .then(regions => {
            regions.sort((a, b) => a.name.localeCompare(b.name));
            
            // Your original dropdown elements now act as the regional starting points
            pickupProvince.innerHTML = '<option value="" disabled selected>Select region</option>';
            dropoffProvince.innerHTML = '<option value="" disabled selected>Select region</option>';
            
            regions.forEach(reg => {
                pickupProvince.appendChild(new Option(reg.name, reg.code));
                dropoffProvince.appendChild(new Option(reg.name, reg.code));
            });
            console.log("🇵🇭 Cargo-Style Regional PSGC Registry Connected!");
            
            // Check if there is cached data to restore AFTER the regions are loaded
            restoreCachedFormData();
        })
        .catch(err => console.error("Location API failed to connect:", err));

    // Upgraded Cascading Engine logic structured to step from: Region -> Province -> City -> Barangay
    function wireRegionalCargoDropdowns(regionSelect, citySelect, barangaySelect) {
        
        regionSelect.addEventListener("change", (e, targetCityCode = null, targetBrgyName = null) => {
            const regionCode = regionSelect.value;
            if (!regionCode) return;
            
            citySelect.innerHTML = '<option value="" disabled selected>Loading cities...</option>';
            barangaySelect.innerHTML = '<option value="" disabled selected>Select barangay</option>';
            citySelect.disabled = false;
            barangaySelect.disabled = true;

            // Fetching cities directly from the region (skipping separate sub-province dropdown selection to match your HTML)
            fetch(`https://psgc.gitlab.io/api/regions/${regionCode}/cities-municipalities.json`)
                .then(res => res.json())
                .then(cities => {
                    cities.sort((a, b) => a.name.localeCompare(b.name));
                    citySelect.innerHTML = '<option value="" disabled selected>Select city/municipality</option>';
                    
                    cities.forEach(city => {
                        citySelect.appendChild(new Option(city.name, city.code));
                    });

                    if (targetCityCode) {
                        citySelect.value = targetCityCode;
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

        fetch(`https://psgc.gitlab.io/api/cities-municipalities/${cityCode}/barangays.json`)
            .then(res => res.json())
            .then(barangays => {
                barangays.sort((a, b) => a.name.localeCompare(b.name));
                barangaySelect.innerHTML = '<option value="" disabled selected>Select barangay</option>';
                
                barangays.forEach(brgy => {
                    barangaySelect.appendChild(new Option(brgy.name, brgy.name));
                });

                if (targetBrgyName) {
                    barangaySelect.value = targetBrgyName;
                }
            })
            .catch(() => {
                barangaySelect.innerHTML = '<option value="" disabled selected>Select barangay</option>';
            });
    }

    // Initialize cascading chains using your existing HTML layout elements
    wireRegionalCargoDropdowns(pickupProvince, pickupCity, pickupBarangay);
    wireRegionalCargoDropdowns(dropoffProvince, dropoffCity, dropoffBarangay);


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

            // Restore Pickup Address (From) fields and cascaded values
            if (cachedData.origin) {
                pickupContact.value = cachedData.origin.name || "";
                pickupMobile.value = cachedData.origin.phone || "";
                pickupStreet.value = cachedData.origin.street || "";
                chkSavePickup.checked = cachedData.origin.shouldSaveToAddressBook || false;

                if (cachedData.origin.provinceCode) {
                    pickupProvince.value = cachedData.origin.provinceCode; // Sets region code safely
                    
                    const pCode = pickupProvince.value;
                    fetch(`https://psgc.gitlab.io/api/regions/${pCode}/cities-municipalities.json`)
                        .then(r => r.json()).then(cities => {
                            pickupCity.innerHTML = '<option value="" disabled selected>Select city/municipality</option>';
                            cities.sort((a, b) => a.name.localeCompare(b.name));
                            cities.forEach(c => {
                                pickupCity.add(new Option(c.name, c.code));
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
                }
            }

            // Restore Dropoff Address (To) fields and cascaded values
            if (cachedData.destination) {
                dropoffContact.value = cachedData.destination.name || "";
                dropoffMobile.value = cachedData.destination.phone || "";
                dropoffStreet.value = cachedData.destination.street || "";
                chkSaveDropoff.checked = cachedData.destination.shouldSaveToAddressBook || false;

                if (cachedData.destination.provinceCode) {
                    dropoffProvince.value = cachedData.destination.provinceCode; // Sets region code safely
                    
                    const pCode = dropoffProvince.value;
                    fetch(`https://psgc.gitlab.io/api/regions/${pCode}/cities-municipalities.json`)
                        .then(r => r.json()).then(cities => {
                            dropoffCity.innerHTML = '<option value="" disabled selected>Select city/municipality</option>';
                            cities.sort((a, b) => a.name.localeCompare(b.name));
                            cities.forEach(c => {
                                dropoffCity.add(new Option(c.name, c.code));
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

        // Security Validation Guard Rails for mobile number string formatting
        if (pickupMobile.value.length < 11 || dropoffMobile.value.length < 11) {
            alert("❌ Mobile numbers must be complete 11-digit numbers (e.g., 09XXXXXXXXX).");
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
                province: selectedOrigProv,        // Now captures Region string name
                provinceCode: pickupProvince.value,  // Now captures Region PSGC code string
                city: selectedOrigCity,
                cityCode: pickupCity.value,
                barangay: pickupBarangay.value,
                street: pickupStreet.value,
                shouldSaveToAddressBook: chkSavePickup.checked
            },
            destination: {
                name: dropoffContact.value,
                phone: dropoffMobile.value,
                province: selectedDestProv,        // Now captures Region string name
                provinceCode: dropoffProvince.value,  // Now captures Region PSGC code string
                city: selectedDestCity,
                cityCode: dropoffCity.value,
                barangay: dropoffBarangay.value,
                street: dropoffStreet.value,
                shouldSaveToAddressBook: chkSaveDropoff.checked
            }
        };

        localStorage.setItem('activeBookingFormStep2', JSON.stringify(completeNationalPayload));
        console.log("Success! Cargo-style regional address log generated safely:", completeNationalPayload);
        
        window.location.href = "book-lipatbahay-info.html";
    });
});