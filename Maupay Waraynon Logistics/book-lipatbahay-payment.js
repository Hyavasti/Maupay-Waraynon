document.addEventListener("DOMContentLoaded", () => {
    const paymentForm = document.getElementById("lipatBahayPaymentForm");
    const btnBackToInfo = document.getElementById("btnBackToInfo");
    
    // Summary Structural Node Outputs
    const displayFinalPaymentDue = document.getElementById("displayFinalPaymentDue");
    
    // Dynamic Dropdowns 
    const gcashDetailsContainer = document.getElementById("gcashDetailsContainer");
    const bankDetailsContainer = document.getElementById("bankDetailsContainer");
    
    // Form Entry Boxes
    const gcashReferenceInput = document.getElementById("gcashReferenceNumber");
    const bankReferenceInput = document.getElementById("bankTransactionRef");
    
    // Selection Wrapper Blocks
    const paymentRows = document.querySelectorAll('.payment-selection-row');

    // Profile Avatar Injector Engine
    const profileAvatar = document.getElementById("profileAvatar");
    const savedAccountRaw = localStorage.getItem('dummyTestingAccount');
    if (savedAccountRaw && profileAvatar) {
        const userAccount = JSON.parse(savedAccountRaw);
        if (userAccount.firstName) {
            profileAvatar.innerText = userAccount.firstName.charAt(0).toUpperCase();
        }
    }

    // LOAD CACHED PRICE AMOUNTS FROM SESSION REGISTRY
    const masterManifestRaw = localStorage.getItem('consolidatedBookingManifest');
    let finalQuoteStringValue = "Php 150";

    if (masterManifestRaw) {
        try {
            const compiledManifest = JSON.parse(masterManifestRaw);
            if (compiledManifest.logisticsArrangements && compiledManifest.logisticsArrangements.computedQuoteSummaryValue) {
                finalQuoteStringValue = compiledManifest.logisticsArrangements.computedQuoteSummaryValue;
            }
        } catch (err) {
            console.error("Error reading stored manifest layout files:", err);
        }
    }

    if (displayFinalPaymentDue) {
        displayFinalPaymentDue.innerText = finalQuoteStringValue;
    }

    // CLICK LISTENER ASSIGNMENTS TO SELECTION 
    paymentRows.forEach(row => {
        row.addEventListener("click", (e) => {
            // Prevent multiple activations if clicking label contents directly
            const internalRadio = row.querySelector('.native-payment-radio');
            if (e.target !== internalRadio && internalRadio) {
                internalRadio.checked = true;
            }
            
            const currentValue = internalRadio ? internalRadio.value : row.getAttribute('data-value');
            togglePaymentContentFormZone(currentValue);
        });
    });

    function togglePaymentContentFormZone(selectedValue) {
        // Toggle selected styling classes 
        paymentRows.forEach(box => {
            box.classList.remove('active-row');
            if (box.getAttribute('data-value') === selectedValue) {
                box.classList.add('active-row');
            }
        });

        // Hide optional transaction field wrappers
        if (gcashDetailsContainer) gcashDetailsContainer.classList.remove('visible');
        if (bankDetailsContainer) bankDetailsContainer.classList.remove('visible');
        
        if (gcashReferenceInput) gcashReferenceInput.required = false;
        if (bankReferenceInput) bankReferenceInput.required = false;

        // Show context block matching current radio value state
        if (selectedValue === "GCash") {
            if (gcashDetailsContainer) gcashDetailsContainer.classList.add('visible');
            if (gcashReferenceInput) gcashReferenceInput.required = true;
        } else if (selectedValue === "Bank") {
            if (bankDetailsContainer) bankDetailsContainer.classList.add('visible');
            if (bankReferenceInput) bankReferenceInput.required = true;
        }
    }

    // non-digits strings GCash
    if (gcashReferenceInput) {
        gcashReferenceInput.addEventListener("input", (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }

    // MULTI-STEP NAVIGATION FLOW CONTROLLERS
    if (btnBackToInfo) {
        btnBackToInfo.addEventListener("click", () => {
            window.location.href = "book-lipatbahay-info.html";
        });
    }

    if (paymentForm) {
        paymentForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const checkedRadio = document.querySelector('input[name="paymentOption"]:checked');
            if (!checkedRadio) {
                alert("❌ Please pick a preferred payment method to proceed.");
                return;
            }

            const chosenMethod = checkedRadio.value;
            let finalReferenceText = "N/A";

            if (chosenMethod === "GCash") {
                if (gcashReferenceInput.value.length !== 13) {
                    alert("❌ Invalid GCash Reference Number! It must be exactly 13 digits long.");
                    return;
                }
                finalReferenceText = gcashReferenceInput.value;
            } else if (chosenMethod === "Bank") {
                if (!bankReferenceInput.value.trim()) {
                    alert("❌ Please enter your Bank Transfer confirmation reference.");
                    return;
                }
                finalReferenceText = bankReferenceInput.value.trim();
            } else {
                finalReferenceText = "N/A (Cash Settle)";
            }

            if (masterManifestRaw) {
                try {
                    const completeManifestRecord = JSON.parse(masterManifestRaw);
                    
                    completeManifestRecord.billingSummaryDetails = {
                        paymentMethodChosen: chosenMethod,
                        transactionReferenceString: finalReferenceText,
                        finalInvoicedAmountPaid: finalQuoteStringValue,
                        bookingTimestamp: new Date().toISOString()
                    };

                    localStorage.setItem('consolidatedBookingManifest', JSON.stringify(completeManifestRecord));
                    alert("🎉 Booking Confirmed Successfully!\nRedirecting you back to your overview dashboard dashboard...");
                    
                    localStorage.removeItem('activeBookingFormStep2');
                    window.location.href = "dashboard.html";
                } catch (err) {
                    console.error("Failed saving checkout compilation records:", err);
                }
            } else {
                alert("❌ Session Timeout! Please fill out the wizard info pages again.");
                window.location.href = "book-lipatbahay.html";
            }
        });
    }
});