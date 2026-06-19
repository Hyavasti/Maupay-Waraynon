document.addEventListener("DOMContentLoaded", () => {
    const packageForm = document.getElementById("packageDetailsForm");
    const btnBackToDetails = document.getElementById("btnBackToDetails");
    const btnNextStep = document.getElementById("btnNextStep");
    
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

    // Enforce HTML5 required fields dynamically
    if (itemDescription) itemDescription.required = true;
    if (itemCategory) itemCategory.required = true;
    if (pkgLength) pkgLength.required = true;
    if (pkgWidth) pkgWidth.required = true;
    if (pkgHeight) pkgHeight.required = true;
    if (pkgWeight) pkgWeight.required = true;
    if (declaredValue) declaredValue.required = true;

    // ==========================================================================
    // REAL-TIME INPUT SANITIZATION CONTROLS
    // ==========================================================================
    
    // 1. Strict Letters-Only Rule for Item Description (Blocks numbers & special characters)
    if (itemDescription) {
        itemDescription.addEventListener("input", (e) => {
            e.target.value = e.target.value.replace(/[^a-zA-Z\s]/g, "");
        });
    }

    // 2. Strip Leading Zeros Hook (Converts "02" -> "2")
    function sanitizeLeadingZeros(inputElement) {
        if (!inputElement) return;
        inputElement.addEventListener("input", (e) => {
            let val = e.target.value;
            // If it's a multi-digit string starting with 0, drop the leading zero
            if (val.length > 1 && val.startsWith("0") && !val.startsWith("0.")) {
                e.target.value = val.replace(/^0+/, "");
            }
        });
    }

    sanitizeLeadingZeros(pkgLength);
    sanitizeLeadingZeros(pkgWidth);
    sanitizeLeadingZeros(pkgHeight);
    sanitizeLeadingZeros(pkgWeight);
    sanitizeLeadingZeros(declaredValue);

    // ==========================================================================
    // DYNAMIC ERROR NOTE ENGINE
    // ==========================================================================
    function createFieldErrorNote(inputElement, errorMessage) {
        if (!inputElement) return null;
        const errorNote = document.createElement("div");
        errorNote.className = "field-error-note";
        errorNote.style.color = "#dc3545";
        errorNote.style.fontSize = "12px";
        errorNote.style.marginTop = "4px";
        errorNote.style.display = "none";
        errorNote.innerText = `❌ ${errorMessage}`;
        inputElement.parentNode.appendChild(errorNote);
        return errorNote;
    }

    const descError = createFieldErrorNote(itemDescription, "Item description is required (Letters only).");
    const catError = createFieldErrorNote(itemCategory, "Please select an item category.");
    const lengthError = createFieldErrorNote(pkgLength, "Length is required (min 1 cm).");
    const widthError = createFieldErrorNote(pkgWidth, "Width is required (min 1 cm).");
    const heightError = createFieldErrorNote(pkgHeight, "Height is required (min 1 cm).");
    const weightError = createFieldErrorNote(pkgWeight, "Weight is required (must be greater than 0).");
    const declaredError = createFieldErrorNote(declaredValue, "Declared value is required (must be greater than 0).");

    // Profile Avatar Letter Display Configs
    const profileAvatar = document.getElementById("profileAvatar");
    const savedAccountRaw = localStorage.getItem('dummyTestingAccount');
    if (savedAccountRaw && profileAvatar) {
        try {
            const userAccount = JSON.parse(savedAccountRaw);
            if (userAccount && userAccount.firstName) {
                profileAvatar.innerText = userAccount.firstName.charAt(0).toUpperCase();
            }
        } catch (e) { console.error("Error setting avatar display initial:", e); }
    }

    // ==========================================================================
    // RESTORE EXISTING PRE-FILLED VALUES FROM PREVIOUS SESSIONS
    // ==========================================================================
    const savedPackageRaw = localStorage.getItem('tempPackage');
    if (savedPackageRaw) {
        try {
            const savedPackageData = JSON.parse(savedPackageRaw);
            const pkgConfig = savedPackageData.packageConfiguration;
            
            if (pkgConfig) {
                if (itemDescription && pkgConfig.description) itemDescription.value = pkgConfig.description;
                if (itemCategory && pkgConfig.category) itemCategory.value = pkgConfig.category;
                if (pkgWeight && pkgConfig.weightKg) pkgWeight.value = pkgConfig.weightKg;
                
                if (declaredValue && pkgConfig.declaredValue) {
                    const rawNum = pkgConfig.declaredValue.replace(/[^\d.]/g, '');
                    declaredValue.value = rawNum || pkgConfig.declaredValue;
                }
                
                if (pkgConfig.dimensions) {
                    if (pkgLength && pkgConfig.dimensions.length) pkgLength.value = pkgConfig.dimensions.length;
                    if (pkgWidth && pkgConfig.dimensions.width) pkgWidth.value = pkgConfig.dimensions.width;
                    if (pkgHeight && pkgConfig.dimensions.height) pkgHeight.value = pkgConfig.dimensions.height;
                }
                
                if (specialInstructions && pkgConfig.specialHandlingNotes) {
                    specialInstructions.value = pkgConfig.specialHandlingNotes;
                }
            }
        } catch (err) { console.error("Error parsing prefill tempPackage data:", err); }
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

        displayFare.textContent = completeGrandTotalSum.toFixed(2);
    }

    // Connect change hooks to fields
    const calculationInputElements = document.querySelectorAll('.pricing-trigger');
    calculationInputElements.forEach(inputComponent => {
        inputComponent.addEventListener("input", runLiveDynamicFareQuote);
        
        inputComponent.addEventListener("focus", (event) => {
            if (event.target.value === "0" || parseFloat(event.target.value) === 0) {
                event.target.value = "";
            }
        });

        inputComponent.addEventListener("blur", (event) => {
            if (event.target.value.trim() === "" || parseFloat(event.target.value) < 0) {
                event.target.value = "0";
                runLiveDynamicFareQuote();
            }
        });
    });

    if (btnBackToDetails) {
        btnBackToDetails.addEventListener("click", () => {
            window.location.href = "book-standard-parcel-details.html";
        });
    }

    // ==========================================================================
    // VALIDATE AND ADVANCE TRANSITION SYSTEM
    // ==========================================================================
    function advanceToNextStep() {
        let formIsValid = true;

        function checkValidation(field, errorEl, conditions = true) {
            if (!field || !conditions || !field.value.trim() || parseFloat(field.value) <= 0) {
                if (errorEl) errorEl.style.display = "block";
                if (field) field.style.borderColor = "#dc3545";
                formIsValid = false;
            } else {
                if (errorEl) errorEl.style.display = "none";
                if (field) field.style.borderColor = "";
            }
        }

        checkValidation(itemDescription, descError);
        checkValidation(itemCategory, catError);
        checkValidation(pkgLength, lengthError);
        checkValidation(pkgWidth, widthError);
        checkValidation(pkgHeight, heightError);
        checkValidation(pkgWeight, weightError);
        checkValidation(declaredValue, declaredError);

        if (!formIsValid) {
            const firstErrorField = document.querySelector('[style*="border-color: rgb(220, 53, 69)"]');
            if (firstErrorField) firstErrorField.focus();
            return;
        }

        const finalCalculatedWeightValue = parseFloat(pkgWeight.value) || 0;
        const finalValuationDeclaredValue = parseFloat(declaredValue.value) || 0;
        
        const calculatedWeightPremium = finalCalculatedWeightValue > BASE_WEIGHT_LIMIT ? 
            (finalCalculatedWeightValue - BASE_WEIGHT_LIMIT) * SURCHARGE_PER_OVERWEIGHT_KG : 0;
        const calculatedInsurancePremium = finalValuationDeclaredValue * DECLARED_VALUE_INSURANCE_RATE;
        const computedAbsoluteGrandTotal = BASE_RATE + calculatedWeightPremium + calculatedInsurancePremium;

        const parcelValueFormatted = `PHP ${finalValuationDeclaredValue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        const packageConfiguration = {
            description: itemDescription.value.trim(),
            category: itemCategory.value,
            dimensions: {
                length: parseInt(pkgLength.value) || 0,
                width: parseInt(pkgWidth.value) || 0,
                height: parseInt(pkgHeight.value) || 0
            },
            weightKg: finalCalculatedWeightValue,
            declaredValue: parcelValueFormatted,
            specialHandlingNotes: specialInstructions ? specialInstructions.value.trim() : ""
        };

        const billingLedger = {
            baseRate: BASE_RATE,
            weightSurcharge: calculatedWeightPremium,
            insuranceCharge: calculatedInsurancePremium,
            grandTotal: computedAbsoluteGrandTotal
        };

        localStorage.setItem('tempPackage', JSON.stringify({ packageConfiguration, billingLedger }));

        let masterDetailsPayload = localStorage.getItem('tempDetails');
        if (masterDetailsPayload) {
            try {
                let currentPayload = JSON.parse(masterDetailsPayload);
                
                if (!currentPayload.services) {
                    currentPayload = { services: { standardParcel: currentPayload } };
                }

                currentPayload.services.standardParcel.parcelDetails = packageConfiguration;
                currentPayload.services.standardParcel.paymentDetails.billingLedger = billingLedger;

                localStorage.setItem('tempDetails', JSON.stringify(currentPayload));
            } catch (e) {
                console.error("Error weaving configuration into master collection:", e);
            }
        }

        window.location.href = "book-standard-parcel-payment.html";
    }

    if (packageForm) {
        packageForm.addEventListener("submit", (e) => {
            e.preventDefault();
            advanceToNextStep();
        });
    }

    runLiveDynamicFareQuote();
});