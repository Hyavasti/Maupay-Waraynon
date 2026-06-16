document.addEventListener("DOMContentLoaded", () => {
    const btnBackToPackage = document.getElementById("btnBackToPackage");
    const btnConfirmBooking = document.getElementById("btnConfirmBooking");
    const summaryPayer = document.getElementById("summaryPayer");
    const profileAvatar = document.getElementById("profileAvatar");
    const codNoticeWrapper = document.getElementById("codNoticeWrapper");

    // Modal Control element hooks references
    const bookingReviewModal = document.getElementById("bookingReviewModal");
    const btnCloseModalX = document.getElementById("btnCloseModalX");
    const btnCancelModal = document.getElementById("btnCancelModal");
    const btnFinalSubmitModal = document.getElementById("btnFinalSubmitModal");

    // Custom Success Modal Elements Reference Hooks
    const successModalOverlay = document.getElementById("successModalOverlay");
    const successTrackingId = document.getElementById("successTrackingId");
    const btnSuccessDashboard = document.getElementById("btnSuccessDashboard");

    // Modal Target Data Value fields pointers
    const popDeliveryMode = document.getElementById("popDeliveryMode");
    const popSenderName = document.getElementById("popSenderName");
    const popReceiverName = document.getElementById("popReceiverName");
    const popItemDesc = document.getElementById("popItemDesc");
    const popWeight = document.getElementById("popWeight");
    const popVolume = document.getElementById("popVolume");
    const popInstructions = document.getElementById("popInstructions");
    const popPayer = document.getElementById("popPayer");
    const popMethod = document.getElementById("popMethod");
    const popGrandTotal = document.getElementById("popGrandTotal");

    // Dynamic targets for referencing digital verification string values
    const gcashRefInput = document.getElementById("gcashRefNum");
    const bankRefInput = document.getElementById("bankRefNum");

    // Summary calculation UI values pointers
    const summaryBaseRate = document.getElementById("summaryBaseRate");
    const summarySurcharge = document.getElementById("summarySurcharge");
    const summaryInsurance = document.getElementById("summaryInsurance");
    const summaryGrandTotal = document.getElementById("summaryGrandTotal");

    // Initialize Profile Header Badge
    const savedAccountRaw = localStorage.getItem('dummyTestingAccount');
    if (savedAccountRaw && profileAvatar) {
        const userAccount = JSON.parse(savedAccountRaw);
        if (userAccount.firstName) {
            profileAvatar.innerText = userAccount.firstName.charAt(0).toUpperCase();
        }
    }


    //RECOVER CONSOLIDATED DATA MANIFEST
    const rawManifestStringData = localStorage.getItem('consolidatedBookingManifest');
    if (!rawManifestStringData) {
        alert("❌ Missing active booking session values. Heading back to Step 1.");
        window.location.href = "book-cargo-details.html";
        return;
    }

    const currentBookingDataManifest = JSON.parse(rawManifestStringData);
    
    // Auto-populate Ledger Breakdown Numbers
    const step2Data = currentBookingDataManifest.cargoStep2Specifications || {};
    if (step2Data && step2Data.pricing) {
        const pricing = step2Data.pricing;
        if (summaryBaseRate) summaryBaseRate.textContent = pricing.baseRate;
        if (summarySurcharge) summarySurcharge.textContent = pricing.weightSurcharge;
        if (summaryInsurance) summaryInsurance.textContent = pricing.insurance;
        if (summaryGrandTotal) summaryGrandTotal.textContent = pricing.estimatedTotal;
    }


    //WHO WILL PAY
    const payerRadios = document.querySelectorAll('input[name="paymentOption"]');
    payerRadios.forEach(radio => {
        const optionCard = radio.closest('.payment-option-card');
        if (!optionCard) return;

        optionCard.addEventListener("click", () => {
            payerRadios.forEach(r => {
                const parent = r.closest('.payment-option-card');
                if (parent) parent.classList.remove("checked");
            });
            optionCard.classList.add("checked");
            radio.checked = true;
            
            if (summaryPayer) {
                summaryPayer.textContent = radio.value;
            }
        });
    });


    // PAYMENT METHOD
    const methodRadios = document.querySelectorAll('input[name="paymentMethod"]');
    methodRadios.forEach(radio => {
        const wrapperCardFrame = radio.closest('.clickable-method-card');
        if (!wrapperCardFrame) return;

        wrapperCardFrame.addEventListener("click", () => {
            methodRadios.forEach(r => {
                const siblingWrapper = r.closest('.clickable-method-card');
                if (siblingWrapper) siblingWrapper.classList.remove("checked");
            });
            wrapperCardFrame.classList.add("checked");
            radio.checked = true;

            // Handle inline visibility condition for COD alert notice wrapper
            if (codNoticeWrapper) {
                codNoticeWrapper.style.display = (radio.value === "Cash / COD") ? "flex" : "none";
            }
        });
    });


    //REVIEW POPUP INTERACTION INTERFACE HANDLERS

    function openReviewModalPopup() {
        if (bookingReviewModal) bookingReviewModal.classList.add("is-visible");
    }

    function closeReviewModalPopup() {
        if (bookingReviewModal) bookingReviewModal.classList.remove("is-visible");
    }

    [btnCloseModalX, btnCancelModal].forEach(btn => {
        if (btn) btn.addEventListener("click", closeReviewModalPopup);
    });


    //CONFIRM AND POPULATE SUMMARY REVIEW MODAL

    if (btnConfirmBooking) {
        btnConfirmBooking.addEventListener("click", () => {
            const selectedMethodRadio = document.querySelector('input[name="paymentMethod"]:checked');
            const finalMethodChoice = selectedMethodRadio ? selectedMethodRadio.value : "Cash / COD";
            
            // Dynamic Verification Check Rules
            if (finalMethodChoice === "GCash" && gcashRefInput && !gcashRefInput.value.trim()) {
                alert("⚠️ Please fill out your 13-digit GCash transfer reference string code before finalizing booking details.");
                gcashRefInput.focus();
                return;
            } else if (finalMethodChoice === "Bank Transfer" && bankRefInput && !bankRefInput.value.trim()) {
                alert("⚠️ Please provide your bank transaction verification tracking number block.");
                bankRefInput.focus();
                return;
            }

            //DATA ADAPTER PARSING
            const s1 = currentBookingDataManifest.cargoStep1Details || {};
            const companyNode = s1.company || {};
            
            if (popDeliveryMode) popDeliveryMode.textContent = currentBookingDataManifest.serviceType || "Commercial Cargo";
            if (popSenderName) popSenderName.textContent = companyNode.name || "Company Origin Shipper";
            if (popReceiverName) popReceiverName.textContent = companyNode.contactPerson || "Authorized Receiver";
            
            //PACKAGE DATA ADAPTER PARSING
            const s2 = currentBookingDataManifest.cargoStep2Specifications || {};
            
            if (popItemDesc) popItemDesc.textContent = `${s2.pieces || 1} pc(s) - ${s2.description || "General Cargo Goods"}`;
            if (popWeight) popWeight.textContent = `${s2.weight || 0} kg`;
            
            if (popVolume && s2.dimensions) {
                const dim = s2.dimensions;
                popVolume.textContent = `${dim.length || 0}x${dim.width || 0}x${dim.height || 0} cm`;
            } else if (popVolume) {
                popVolume.textContent = "0x0x0 cm";
            }

            // POPULATE SPECIAL HANDLING INSTRUCTIONS
            if (popInstructions) {
                if (s2.handlingInstructions && s2.handlingInstructions.trim() !== "") {
                    popInstructions.textContent = s2.handlingInstructions;
                } else {
                    popInstructions.textContent = "None";
                }
            }

            // POPULATING THE PAYMENT TERMS BLOCK INSIDE REVIEW CARD
            const selectedPayerRadio = document.querySelector('input[name="paymentOption"]:checked');
            const finalPayerChoice = selectedPayerRadio ? selectedPayerRadio.value : "Sender";
            
            if (popPayer) popPayer.textContent = finalPayerChoice;
            if (popMethod) popMethod.textContent = finalMethodChoice;
            if (popGrandTotal) popGrandTotal.textContent = summaryGrandTotal ? `PHP ${summaryGrandTotal.textContent}` : "PHP 150.00";

            // Open up the confirmation dialog screen!
            openReviewModalPopup();
        });
    }


    //FINAL SUBMISSION TO RE-COMMIT AND SAVE TO HISTORIC LEDGER

    if (btnFinalSubmitModal) {
        btnFinalSubmitModal.addEventListener("click", () => {
            const selectedPayerRadio = document.querySelector('input[name="paymentOption"]:checked');
            const finalPayerChoice = selectedPayerRadio ? selectedPayerRadio.value : "Sender";

            const selectedMethodRadio = document.querySelector('input[name="paymentMethod"]:checked');
            const finalMethodChoice = selectedMethodRadio ? selectedMethodRadio.value : "Cash / COD";
            
            let referenceVerificationCodeValue = "N/A (Cash Settlement)";
            if (finalMethodChoice === "GCash" && gcashRefInput) referenceVerificationCodeValue = gcashRefInput.value.trim();
            if (finalMethodChoice === "Bank Transfer" && bankRefInput) referenceVerificationCodeValue = bankRefInput.value.trim();

            //Generate Unique Cargo Tracking ID String
            const uniqueTrackingId = "CRG-" + Math.floor(10000000 + Math.random() * 90000000) + "-PH";

            //Format Summary Record Payload for the Master Shipment System Index
            const s1 = currentBookingDataManifest.cargoStep1Details || {};
            const companyNode = s1.company || {};

            // Real-world standardization: "Recipient Name (City Location)"
            const standardRecipient = companyNode.contactPerson || "Authorized Receiver";
            const standardDestination = s1.destinationAddress || "Tacloban City, Leyte";

            const finalDashboardRecord = {
                trackingId: uniqueTrackingId,
                serviceType: currentBookingDataManifest.serviceType || "Commercial Cargo",
                destination: `${standardRecipient} - ${standardDestination}`,
                dateBooked: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                status: "In Transit"
};

            //  Append directly to Dashboard Master Array Ledger Storage
            const masterShipmentsDatabase = JSON.parse(localStorage.getItem("maupayShipments")) || [];
            masterShipmentsDatabase.push(finalDashboardRecord);
            localStorage.setItem("maupayShipments", JSON.stringify(masterShipmentsDatabase));

            // Append operational metadata fields to payload object parameters
            currentBookingDataManifest.assignedPayer = finalPayerChoice;
            currentBookingDataManifest.paymentMethodSelected = finalMethodChoice;
            currentBookingDataManifest.transactionReferenceCode = referenceVerificationCodeValue;
            currentBookingDataManifest.bookingTimestamp = new Date().toISOString();
            currentBookingDataManifest.generatedTrackingId = uniqueTrackingId;
            currentBookingDataManifest.status = (finalMethodChoice === "Cash / COD") ? "Pending Pickup" : "Verifying Settle Signature";

            // Save the complete manifest out to data memory space registry
            localStorage.setItem('consolidatedBookingManifest', JSON.stringify(currentBookingDataManifest));
            
            // Move block dataset item array into historic record index storage pipeline
            let globalLedger = JSON.parse(localStorage.getItem('globalShipmentsLedger') || "[]");
            globalLedger.push(currentBookingDataManifest);
            localStorage.setItem('globalShipmentsLedger', JSON.stringify(globalLedger));

            // Close down checkout review popup window block frame
            closeReviewModalPopup();
            
            //  POP OPEN THE CUSTOM MODAL EMBED OVERLAY CARD (Replaces standard window alert block)
            if (successTrackingId) successTrackingId.textContent = uniqueTrackingId;
            if (successModalOverlay) successModalOverlay.classList.add("display-modal-active");
        });
    }

    //  Handle redirection execution logic for the custom dashboard button hook
    if (btnSuccessDashboard) {
        btnSuccessDashboard.addEventListener("click", () => {
            if (successModalOverlay) successModalOverlay.classList.remove("display-modal-active");
            
            // Wipe session tracking memory block cache staging buffer out before returning
            localStorage.removeItem('consolidatedBookingManifest');
            window.location.href = "dashboard.html";
        });
    }

    // Step Route Backtracking Execution
    if (btnBackToPackage) {
        btnBackToPackage.addEventListener("click", () => {
            window.location.href = "book-cargo-package.html";
        });
    }
});