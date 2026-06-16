document.addEventListener("DOMContentLoaded", () => {
    const packageForm = document.getElementById("packageDetailsForm");
    const btnBackToDetails = document.getElementById("btnBackToDetails");
    
    // Element Input Model Track Targets
    const itemDescription = document.getElementById("itemDescription");
    const itemCategory = document.getElementById("itemCategory");
    const pkgLength = document.getElementById("pkgLength");
    const pkgWidth = document.getElementById("pkgWidth");
    const pkgHeight = document.getElementById("pkgHeight");
    const pkgWeight = document.getElementById("pkgWeight");
    const declaredValue = document.getElementById("declaredValue");
    const specialInstructions = document.getElementById("specialInstructions");
    const displayFare = document.getElementById("displayFare");

    // Live Calculator Constants Formulas
    const BASE_RATE = 150.00;
    const BASE_WEIGHT_LIMIT = 5.0; 
    const SURCHARGE_PER_OVERWEIGHT_KG = 20.00;
    const DECLARED_VALUE_INSURANCE_RATE = 0.10; 

    // Profile Avatar Letter Display Configs
    const profileAvatar = document.getElementById("profileAvatar");
    const savedAccountRaw = localStorage.getItem('dummyTestingAccount');
    if (savedAccountRaw && profileAvatar) {
        const userAccount = JSON.parse(savedAccountRaw);
        if (userAccount.firstName) {
            profileAvatar.innerText = userAccount.firstName.charAt(0).toUpperCase();
        }
    }

    // LIVE PARCEL FARE COST ENGINE CALCULATIONS
    function runLiveDynamicFareQuote() {
        if (!pkgWeight || !declaredValue || !displayFare) return;

        const currentWeightValue = parseFloat(pkgWeight.value) || 0;
        const totalDeclaredValValue = parseFloat(declaredValue.value) || 0;

        let addedOverweightSurchargeSum = 0;
        if (currentWeightValue > BASE_WEIGHT_LIMIT) {
            addedOverweightSurchargeSum = (currentWeightValue - BASE_WEIGHT_LIMIT) * SURCHARGE_PER_OVERWEIGHT_KG;
        }

        const addedInsurancePremiumSum = totalDeclaredValValue * DECLARED_VALUE_INSURANCE_RATE;
        const completeGrandTotalSum = BASE_RATE + addedOverweightSurchargeSum + addedInsurancePremiumSum;

        // Render dynamic calculated pricing text inside fare block
        displayFare.textContent = completeGrandTotalSum.toFixed(2);
    }

    // Connect change hooks to all interactive sizing numeric metric fields
    const calculationInputElements = document.querySelectorAll('.pricing-trigger');
    calculationInputElements.forEach(inputComponent => {
        inputComponent.addEventListener("input", runLiveDynamicFareQuote);
        
        // ✨ FIXED: Auto-clear default '0' values when the user clicks/focuses on the input
        inputComponent.addEventListener("focus", (event) => {
            if (event.target.value === "0" || parseFloat(event.target.value) === 0) {
                event.target.value = "";
            }
        });

        // Zero-value protection fallback rule on out-of-bounds focus losses
        inputComponent.addEventListener("blur", (event) => {
            if (event.target.value.trim() === "" || parseFloat(event.target.value) < 0) {
                event.target.value = "0";
                runLiveDynamicFareQuote();
            }
        });
    });

    // WORKFLOW INTER-PAGE REDIRECTIONS & TRANSACTIONS MAPPINGS
    if (btnBackToDetails) {
        btnBackToDetails.addEventListener("click", () => {
            window.location.href = "book-standard-parcel-details.html";
        });
    }

    if (packageForm) {
        packageForm.addEventListener("submit", (e) => {
            e.preventDefault();

            // Pull matching cross-page historical information maps
            const sessionManifestStringData = localStorage.getItem('consolidatedBookingManifest');
            if (!sessionManifestStringData) {
                alert("❌ Your booking session has expired. Returning to Step 1.");
                window.location.href = "book-standard-parcel-details.html";
                return;
            }

            const activeBookingManifestObject = JSON.parse(sessionManifestStringData);

            // Compute ledger variables
            const finalCalculatedWeightValue = parseFloat(pkgWeight.value) || 0;
            const finalValuationDeclaredValue = parseFloat(declaredValue.value) || 0;
            
            const calculatedWeightPremium = finalCalculatedWeightValue > BASE_WEIGHT_LIMIT ? 
                (finalCalculatedWeightValue - BASE_WEIGHT_LIMIT) * SURCHARGE_PER_OVERWEIGHT_KG : 0;
            const calculatedInsurancePremium = finalValuationDeclaredValue * DECLARED_VALUE_INSURANCE_RATE;
            const computedAbsoluteGrandTotal = BASE_RATE + calculatedWeightPremium + calculatedInsurancePremium;

            // Save detailed structural package parameters back inside manifest tracking loop
            activeBookingManifestObject.packageConfiguration = {
                description: itemDescription ? itemDescription.value.trim() : "",
                category: itemCategory ? itemCategory.value : "",
                dimensions: {
                    length: pkgLength ? (parseInt(pkgLength.value) || 0) : 0,
                    width: pkgWidth ? (parseInt(pkgWidth.value) || 0) : 0,
                    height: pkgHeight ? (parseInt(pkgHeight.value) || 0) : 0
                },
                weightKg: finalCalculatedWeightValue,
                declaredValuePhp: finalValuationDeclaredValue,
                specialHandlingNotes: specialInstructions ? specialInstructions.value.trim() : ""
            };

            // Inject cost billing parameters for Step 3 Summary panel card engines
            activeBookingManifestObject.billingLedger = {
                baseRate: BASE_RATE,
                weightSurcharge: calculatedWeightPremium,
                insuranceCharge: calculatedInsurancePremium,
                grandTotal: computedAbsoluteGrandTotal
            };

            // Commit complete state changes into system temporary memory space
            localStorage.setItem('consolidatedBookingManifest', JSON.stringify(activeBookingManifestObject));

            // Forward directly to Step 3: Payment page file layout
            window.location.href = "book-standard-parcel-payment.html";
        });
    }

    // Fire default render quote sequence on load
    runLiveDynamicFareQuote();
});