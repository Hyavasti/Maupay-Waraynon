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

    // =========================================================
    // 🛡️ INPUT VALIDATION & CHARACTER RESTRICTIONS
    // =========================================================
    
    // 1. Estimated Items Count: Strictly allow integers only (No letters, spaces, or special characters)
    if (estimatedItems) {
        estimatedItems.addEventListener("input", (e) => {
            e.target.value = e.target.value.replace(/\D/g, "");
        });
    }

    // 2. Special/Valuable Items: Allow ONLY letters and spaces (No numbers or special characters)
    if (valuableItems) {
        valuableItems.addEventListener("input", (e) => {
            e.target.value = e.target.value.replace(/[^a-zA-Z\s]/g, "");
        });
    }


    // =========================================================
    // 1. INTERACTIVE REAL-TIME COMPUTATION ENGINE
    // =========================================================
    function calculateLiveQuote() {
        let baseVehiclePrice = 0;
        let flatAddonCharges = 0;
        let scalePercentageMultiplier = 0;

        // Check selected vehicle class option
        vehicleRadios.forEach(radio => {
            const cardLabel = radio.closest('.vehicle-card-label');
            if (radio.checked) {
                baseVehiclePrice = parseFloat(radio.getAttribute('data-price')) || 0;
                if (cardLabel) cardLabel.classList.add('active-vehicle');
            } else {
                if (cardLabel) cardLabel.classList.remove('active-vehicle');
            }
        });

        // Check value added checkboxes flat rates vs modifiers
        addonCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                if (checkbox.hasAttribute('data-flat-price')) {
                    flatAddonCharges += parseFloat(checkbox.getAttribute('data-flat-price')) || 0;
                }
                if (checkbox.hasAttribute('data-percentage')) {
                    scalePercentageMultiplier += parseFloat(checkbox.getAttribute('data-percentage')) || 0;
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

    // Wire up UX wrapper modifiers and pricing triggers
    vehicleRadios.forEach(radio => radio.addEventListener('change', calculateLiveQuote));
    addonCheckboxes.forEach(box => box.addEventListener('change', calculateLiveQuote));

    // Initialize layout display value at startup
    calculateLiveQuote();

    // =========================================================
    // 2. BACK AND NEXT REDIRECT ACTIONS (CONSOLIDATED SUBMIT)
    // =========================================================
    if (btnBack) {
        btnBack.addEventListener("click", () => {
            // Directs cleanly back to address form file
            window.location.href = "book-lipatbahay.html";
        });
    }

    if (infoForm) {
        infoForm.addEventListener("submit", (e) => {
            e.preventDefault();

            // 1. Gather vehicle type label text from layout meta data safely
            let chosenVehicle = "Unknown";
            let baseVehiclePrice = 0;
            vehicleRadios.forEach(r => { 
                if (r.checked) {
                    baseVehiclePrice = parseFloat(r.getAttribute('data-price')) || 0;
                    const detailsMeta = r.closest('.vehicle-details-meta');
                    if (detailsMeta) {
                        const titleEl = detailsMeta.querySelector('.vehicle-name-title');
                        chosenVehicle = titleEl ? titleEl.innerText.trim() : r.value;
                    } else {
                        chosenVehicle = r.value;
                    }
                } 
            });

            // 2. Extract active addon textual descriptions
            let activeAddonsList = [];
            addonCheckboxes.forEach(box => {
                if (box.checked) {
                    const tickItem = box.closest('.addon-tick-item');
                    if (tickItem) {
                        const labelText = tickItem.querySelector('.addon-label-text');
                        if (labelText) activeAddonsList.push(labelText.innerText.trim());
                    }
                }
            });

            // 3. Extract the current raw price text string representation
            const currentQuoteText = displayTotalQuote ? displayTotalQuote.innerText : "PHP 0.00";
            // Convert currency string back to a pure numeric float for mathematical manipulations
            const currentQuoteNumeric = parseFloat(currentQuoteText.replace(/[^0-9.]/g, '')) || 0;

            // 4. Pull active location data logged by book-lipatbahay.js
            const primaryAddressPayloadRaw = localStorage.getItem('activeBookingFormStep2');
            const primaryAddressPayload = primaryAddressPayloadRaw ? JSON.parse(primaryAddressPayloadRaw) : {};
            
            // 5. Build an omni-compatible consolidated object payload architecture
            const consolidatedOrderManifest = {
                ...primaryAddressPayload,
                
                // Style A: Properties mapped from your raw snippet structure
                moveSpecifications: {
                    typeOfMove: typeOfMove ? typeOfMove.value : "",
                    scheduledDate: moveDate ? moveDate.value : "",
                    loadQuantityEstimate: estimatedItems ? estimatedItems.value : "",
                    valuableHighTierItems: (valuableItems && valuableItems.value.trim()) ? valuableItems.value.trim() : "None stated",
                    specialInstructionsText: (specialInstructions && specialInstructions.value.trim()) ? specialInstructions.value.trim() : "None stated"
                },
                logisticsArrangements: {
                    vehicleClassSelected: chosenVehicle,
                    selectedAddonServices: activeAddonsList,
                    computedQuoteSummaryValue: currentQuoteText
                },

                // Style B: Redundant fallbacks expected by book-lipatbahay-payment.js hooks
                moveDetails: {
                    typeOfMove: typeOfMove ? typeOfMove.value : "",
                    preferredDate: moveDate ? moveDate.value : "",
                    estimatedItemsCount: estimatedItems ? estimatedItems.value : "",
                    specialValuableItems: (valuableItems && valuableItems.value.trim()) ? valuableItems.value.trim() : "None stated",
                    specialHandlingInstructions: (specialInstructions && specialInstructions.value.trim()) ? specialInstructions.value.trim() : "None stated"
                },
                vehicleSelection: {
                    code: chosenVehicle.toLowerCase().replace(/\s+/g, '-'),
                    displayName: chosenVehicle,
                    basePrice: baseVehiclePrice
                },
                selectedAddons: activeAddonsList,
                estimatedTotalQuote: currentQuoteNumeric
            };

            // 6. Write tracking maps concurrently to both keys for zero layout friction
            localStorage.setItem('activeBookingFormStep2', JSON.stringify(consolidatedOrderManifest));
            localStorage.setItem('consolidatedBookingManifest', JSON.stringify(consolidatedOrderManifest));
            
            // Route seamlessly down the funnel line to your step 3 landing screen (Alert Popup Removed)
            window.location.href = "book-lipatbahay-payment.html";
        });
    }
});