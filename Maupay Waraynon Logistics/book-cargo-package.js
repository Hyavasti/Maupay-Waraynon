document.addEventListener("DOMContentLoaded", () => {
    const cargoPackageForm = document.getElementById("cargoPackageForm");
    const btnBackToDetails = document.getElementById("btnBackToDetails");
    const profileAvatar = document.getElementById("profileAvatar");

    // Pricing Element Selectors
    const txtLength = document.getElementById("cargoLength");
    const txtWidth = document.getElementById("cargoWidth");
    const txtHeight = document.getElementById("cargoHeight");
    const txtWeight = document.getElementById("cargoWeight");
    const txtValue = document.getElementById("declaredValue");
    const txtPieces = document.getElementById("numPieces");

    const lblBaseRate = document.getElementById("lblBaseRate");
    const lblWeightSurcharge = document.getElementById("lblWeightSurcharge");
    const lblCargoInsurance = document.getElementById("lblCargoInsurance");
    const lblMasterTotal = document.getElementById("lblMasterTotal");

    // Initialize Profile Initials Badge
    const savedAccountRaw = localStorage.getItem('dummyTestingAccount');
    if (savedAccountRaw && profileAvatar) {
        const userAccount = JSON.parse(savedAccountRaw);
        if (userAccount.firstName) {
            profileAvatar.innerText = userAccount.firstName.charAt(0).toUpperCase();
        }
    }

    // Navigation Back Button Route
    if (btnBackToDetails) {
        btnBackToDetails.addEventListener("click", () => {
            window.location.href = "book-cargo-details.html";
        });
    }


    // INLINE FORM EXTRA VALIDATION & SMART ZERO CLEARING
    function showInlineError(element, message) {
        removeInlineError(element);
        const err = document.createElement("span");
        err.className = "error-note";
        err.textContent = message;
        element.parentElement.appendChild(err);
        element.style.borderColor = "#dc2626";
    }

    function removeInlineError(element) {
        const existing = element.parentElement.querySelector(".error-note");
        if (existing) existing.remove();
        element.style.borderColor = "";
    }

    // Force values back to 0 or min instead of negative numbers, and handle smart clearing
    const numericInputs = [txtLength, txtWidth, txtHeight, txtWeight, txtValue, txtPieces];
    numericInputs.forEach(input => {
        if (!input) return;

        // Special treatment for the Pieces Input to allow smooth typing but block 0/negatives
        if (input === txtPieces) {
            
            // 1. Automatically select the text on click so typing a new number replaces the 1 instantly
            input.addEventListener("focus", () => {
                input.select();
            });

            // 2. Prevent entering 0 if the field is empty
            input.addEventListener("keydown", (e) => {
                if (input.value === "" && e.key === "0") {
                    e.preventDefault();
                }
            });

            // 3. Monitor live inputs to clear out negatives or leading zeros
            input.addEventListener("input", () => {
                let val = parseInt(input.value);
                
                // If they typed a negative or invalid setup, reset to 1
                if (val < 0) {
                    input.value = 1;
                }
                calculateLiveRates();
            });

            // 4. The safety net: If they leave it blank or 0 when clicking away, force it back to 1
            input.addEventListener("blur", () => {
                let val = parseInt(input.value);
                if (isNaN(val) || val <= 0) {
                    input.value = 1;
                }
                calculateLiveRates();
            });

        } else {
            // Default handling for other fields (Length, Width, Height, Weight, Value)
            input.addEventListener("focus", () => {
                if (parseFloat(input.value) === 0) {
                    input.value = "";
                }
            });

            input.addEventListener("blur", () => {
                if (input.value.trim() === "" || parseFloat(input.value) < 0) {
                    input.value = 0;
                }
                calculateLiveRates();
            });

            input.addEventListener("input", () => {
                if (parseFloat(input.value) < 0) {
                    input.value = 0;
                }
                calculateLiveRates();
            });
        }
    });


    // LIVE ESTIMATED FARE REACTION ENGINE
    function calculateLiveRates() {
        const length = parseFloat(txtLength.value) || 0;
        const width = parseFloat(txtWidth.value) || 0;
        const height = parseFloat(txtHeight.value) || 0;
        const weight = parseFloat(txtWeight.value) || 0;
        const declaredVal = parseFloat(txtValue.value) || 0;
        const pieces = parseInt(txtPieces.value) || 1;

        //Base Rate
        const baseRateValue = 150.00;

        //Weight Surcharge Calculation
        let weightSurchargeValue = 0;
        if (weight > 5) {
            weightSurchargeValue = (weight - 5) * 20;
        }

        //Volumetric Weight Calculation backup check (L * W * H / 3500)
        const volumetricWeight = (length * width * height) / 3500;
        if (volumetricWeight > weight) {
            // Apply alternative volume premium if volume exceeds actual scale weight
            weightSurchargeValue += (volumetricWeight - weight) * 15;
        }

        //Cargo Valuation Insurance premium structure (10% of total value declared)
        const insuranceValue = declaredVal * 0.10;

        // Multiply calculations against item counts
        const computedBase = baseRateValue * pieces;
        const computedSurcharge = weightSurchargeValue * pieces;
        const computedInsurance = insuranceValue;

        const masterTotalCalculated = computedBase + computedSurcharge + computedInsurance;

        // Reflect into visual summary view tracking panels
        lblBaseRate.textContent = `PHP ${computedBase.toFixed(2)}`;
        lblWeightSurcharge.textContent = `PHP ${computedSurcharge.toFixed(2)}`;
        lblCargoInsurance.textContent = `PHP ${computedInsurance.toFixed(2)}`;
        lblMasterTotal.textContent = `PHP ${masterTotalCalculated.toFixed(2)}`;
    }

    // Run rate engine calculation right away at launch
    calculateLiveRates();


    // FORM TRANSIT PROCESSOR
    if (cargoPackageForm) {
        cargoPackageForm.addEventListener("submit", (e) => {
            e.preventDefault();

            let holdsErrors = false;

            // Ensure items have dimensions assigned
            if (parseFloat(txtLength.value) <= 0 || txtLength.value === "") { showInlineError(txtLength, "⚠️ Length must be greater than 0."); holdsErrors = true; } else { removeInlineError(txtLength); }
            if (parseFloat(txtWidth.value) <= 0 || txtWidth.value === "") { showInlineError(txtWidth, "⚠️ Width must be greater than 0."); holdsErrors = true; } else { removeInlineError(txtWidth); }
            if (parseFloat(txtHeight.value) <= 0 || txtHeight.value === "") { showInlineError(txtHeight, "⚠️ Height must be greater than 0."); holdsErrors = true; } else { removeInlineError(txtHeight); }
            if (parseFloat(txtWeight.value) <= 0 || txtWeight.value === "") { showInlineError(txtWeight, "⚠️ Weight must be greater than 0."); holdsErrors = true; } else { removeInlineError(txtWeight); }
            
            // Hard Validation check against Number of Pieces explicitly equaling 0
            if (parseInt(txtPieces.value) <= 0 || txtPieces.value === "") { 
                showInlineError(txtPieces, "⚠️ Total pieces configuration value must be 1 or higher."); 
                holdsErrors = true; 
            } else { 
                removeInlineError(txtPieces); 
            }

            const txtDesc = document.getElementById("cargoDescription");
            if (!txtDesc.value.trim()) {
                showInlineError(txtDesc, "⚠️ Please enter a descriptive label for the parcel cargo.");
                holdsErrors = true;
            } else {
                removeInlineError(txtDesc);
            }

            if (holdsErrors) {
                const firstFault = document.querySelector(".error-note");
                if (firstFault) firstFault.parentElement.querySelector("input").focus();
                return;
            }

            // Extract pricing metrics strings cleanly
            const pricingBreakdownPayload = {
                baseRate: lblBaseRate.textContent,
                weightSurcharge: lblWeightSurcharge.textContent,
                insurance: lblCargoInsurance.textContent,
                estimatedTotal: lblMasterTotal.textContent
            };

            // Package final step dataset object
            const cargoSpecificationsDataset = {
                description: txtDesc.value.trim(),
                type: document.getElementById("cargoType").value,
                dimensions: {
                    length: txtLength.value,
                    width: txtWidth.value,
                    height: txtHeight.value
                },
                weight: txtWeight.value,
                declaredValue: txtValue.value,
                pieces: txtPieces.value,
                documentation: document.getElementById("docRequirements").value.trim(),
                handlingInstructions: document.getElementById("handlingInstructions").value.trim(),
                pricing: pricingBreakdownPayload
            };

            // Load master operational storage block manifest, attach updates, commit back
            let consolidatedManifest = JSON.parse(localStorage.getItem('consolidatedBookingManifest') || "{}");
            consolidatedManifest.cargoStep2Specifications = cargoSpecificationsDataset;
            localStorage.setItem('consolidatedBookingManifest', JSON.stringify(consolidatedManifest));

            window.location.href = "book-cargo-payment.html";
        });
    }
});