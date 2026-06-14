document.addEventListener("DOMContentLoaded", () => {
    const infoForm = document.getElementById("lipatBahayInfoForm");
    const btnBack = document.getElementById("btnBackToDetails");
    const displayTotalQuote = document.getElementById("displayTotalQuote");

    // Form Field References
    const typeOfMove = document.getElementById("typeOfMove");
    const moveDate = document.getElementById("moveDate");
    const estimatedItems = document.getElementById("estimatedItems");
    const valuableItems = document.getElementById("valuableItems");
    const specialInstructions = document.getElementById("specialInstructions");

    // Dynamic Selectors for Pricing Mechanics
    const vehicleRadios = document.querySelectorAll('input[name="vehicleType"]');
    const addonCheckboxes = document.querySelectorAll('.addon-calc-trigger');

    // Prevent past date selectors
    const todayISO = new Date().toISOString().split('T')[0];
    if (moveDate) {
        moveDate.setAttribute('min', todayISO);
    }

    
    // INTERACTIVE REAL-TIME COMPUTATION ENGINE
    
    function calculateLiveQuote() {
        let baseVehiclePrice = 0;
        let flatAddonCharges = 0;
        let scalePercentageMultiplier = 0;

        // Check selected vehicle class option
        vehicleRadios.forEach(radio => {
            if (radio.checked) {
                baseVehiclePrice = parseFloat(radio.getAttribute('data-price'));
                radio.closest('.vehicle-card-label').classList.add('active-vehicle');
            } else {
                radio.closest('.vehicle-card-label').classList.remove('active-vehicle');
            }
        });

        // Check value added checkboxes flat rates vs modifiers
        addonCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                if (checkbox.hasAttribute('data-flat-price')) {
                    flatAddonCharges += parseFloat(checkbox.getAttribute('data-flat-price'));
                }
                if (checkbox.hasAttribute('data-percentage')) {
                    scalePercentageMultiplier += parseFloat(checkbox.getAttribute('data-percentage'));
                }
            }
        });

        // Complete price calculation
        let subtotalCost = baseVehiclePrice + flatAddonCharges;
        let finalComputedTotal = subtotalCost + (subtotalCost * scalePercentageMultiplier);

        // Render layout formatted total
        if (displayTotalQuote) {
            displayTotalQuote.innerText = `PHP ${finalComputedTotal.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
        }
    }

    vehicleRadios.forEach(radio => radio.addEventListener('change', calculateLiveQuote));
    addonCheckboxes.forEach(box => box.addEventListener('change', calculateLiveQuote));

    // Initialize layout display value at startup
    calculateLiveQuote();

    
    // BACK AND NEXT REDIRECT ACTIONS
    
    if (btnBack) {
        btnBack.addEventListener("click", () => {
            // Directs cleanly back to address form file
            window.location.href = "book-lipatbahay.html";
        });
    }

    if (infoForm) {
        infoForm.addEventListener("submit", (e) => {
            e.preventDefault();

            let chosenVehicle = "";
            vehicleRadios.forEach(r => { 
                if (r.checked) chosenVehicle = r.closest('.vehicle-details-meta').querySelector('.vehicle-name-title').innerText; 
            });

            let activeAddonsList = [];
            addonCheckboxes.forEach(box => {
                if (box.checked) {
                    activeAddonsList.push(box.closest('.addon-tick-item').querySelector('.addon-label-text').innerText);
                }
            });

            const step2Payload = {
                moveSpecifications: {
                    typeOfMove: typeOfMove.value,
                    scheduledDate: moveDate.value,
                    loadQuantityEstimate: estimatedItems.value,
                    valuableHighTierItems: valuableItems.value || "None stated",
                    specialInstructionsText: specialInstructions.value || "None stated"
                },
                logisticsArrangements: {
                    vehicleClassSelected: chosenVehicle,
                    selectedAddonServices: activeAddonsList,
                    computedQuoteSummaryValue: displayTotalQuote.innerText
                }
            };

            // Collect values to compile an overall transaction matrix manifest safely
            const primaryAddressPayload = JSON.parse(localStorage.getItem('activeBookingFormStep2')) || {};
            const consolidatedOrderManifest = { ...primaryAddressPayload, ...step2Payload };

            localStorage.setItem('consolidatedBookingManifest', JSON.stringify(consolidatedOrderManifest));
            
            alert(`Step 2 completed! Moving info captured successfully. Proceeding to Step 3: Payment details...`);
        });
    }

    // ... [Your existing Step 2 pricing validation logic remains untouched here] ...

if (infoForm) {
    infoForm.addEventListener("submit", (e) => {
        e.preventDefault();

        // 1. Gather vehicle type and selected addon values
        const selectedVehicleRadio = document.querySelector('input[name="vehicleType"]:checked');
        const chosenVehicle = selectedVehicleRadio ? selectedVehicleRadio.value : "Unknown";

        const activeAddonsList = [];
        addonCheckboxes.forEach(box => {
            if (box.checked) {
                activeAddonsList.push(box.closest('.addon-tick-item').querySelector('.addon-label-text').innerText);
            }
        });

        // 2. Formulate your Step 2 payload matching your original structure
        const step2Payload = {
            moveSpecifications: {
                typeOfMove: typeOfMove.value,
                scheduledDate: moveDate.value,
                loadQuantityEstimate: estimatedItems.value,
                valuableHighTierItems: valuableItems.value || "None stated",
                specialInstructionsText: specialInstructions.value || "None stated"
            },
            logisticsArrangements: {
                vehicleClassSelected: chosenVehicle,
                selectedAddonServices: activeAddonsList,
                computedQuoteSummaryValue: displayTotalQuote.innerText
            }
        };

        // 3. Unify Step 1 (Address Logs) and Step 2 Data Matrix payloads safely
        const primaryAddressPayload = JSON.parse(localStorage.getItem('activeBookingFormStep2')) || {};
        const consolidatedOrderManifest = { ...primaryAddressPayload, ...step2Payload };

        // 4. Commit unified manifest record back to client-side persistent cache storage
        localStorage.setItem('consolidatedBookingManifest', JSON.stringify(consolidatedOrderManifest));
        
        alert(`Step 2 completed! Moving info captured successfully. Proceeding to Step 3: Payment details...`);
        
        // --- LINK CODE ACTION: Change this line to route to Step 3 ---
        window.location.href = "book-lipatbahay-payment.html";
    });
}
});