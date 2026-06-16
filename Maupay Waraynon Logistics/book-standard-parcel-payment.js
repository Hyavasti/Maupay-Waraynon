document.addEventListener("DOMContentLoaded", () => {
    const btnBackToPackage = document.getElementById("btnBackToPackage");
    const btnConfirmBooking = document.getElementById("btnConfirmBooking");
    const summaryPayer = document.getElementById("summaryPayer");

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
    
    // 📝 Target Field Pointer for Special Handling Notes
    const popSpecialNotes = document.getElementById("popSpecialNotes");
    
    const popPayer = document.getElementById("popPayer");
    const popMethod = document.getElementById("popMethod");
    const popGrandTotal = document.getElementById("popGrandTotal");

    // Dynamic targets for referencing payment confirmation numbers
    const gcashRefInput = document.getElementById("gcashRefNum");
    const bankRefInput = document.getElementById("bankRefNum");

    // Summary calculation UI values pointers
    const summaryBaseRate = document.getElementById("summaryBaseRate");
    const summaryWeightSurcharge = document.getElementById("summaryWeightSurcharge");
    const summaryInsurance = document.getElementById("summaryInsurance");
    const summaryGrandTotal = document.getElementById("summaryGrandTotal");


    // RECOVER CONSOLIDATED DATA MANIFEST
    const rawManifestStringData = localStorage.getItem('consolidatedBookingManifest');
    if (!rawManifestStringData) {
        alert("❌ Missing active booking session values. Heading back to Step 1.");
        window.location.href = "book-standard-parcel-details.html";
        return;
    }

    const currentBookingDataManifest = JSON.parse(rawManifestStringData);
    
    // Auto-populate Ledger Breakdown Numbers
    if (currentBookingDataManifest.billingLedger) {
        const ledger = currentBookingDataManifest.billingLedger;
        if (summaryBaseRate) summaryBaseRate.textContent = parseFloat(ledger.baseRate || 150).toFixed(2);
        if (summaryWeightSurcharge) summaryWeightSurcharge.textContent = parseFloat(ledger.weightSurcharge || 0).toFixed(2);
        if (summaryInsurance) summaryInsurance.textContent = parseFloat(ledger.insuranceCharge || 0).toFixed(2);
        if (summaryGrandTotal) summaryGrandTotal.textContent = parseFloat(ledger.grandTotal || 150).toFixed(2);
    }

    // WHO WILL PAY
    const payerRadios = document.querySelectorAll('input[name="payerType"]');
    payerRadios.forEach(radio => {
        const optionCard = radio.closest('.custom-selection-card');
        if (!optionCard) return;

        optionCard.addEventListener("click", (e) => {
            payerRadios.forEach(r => {
                const parent = r.closest('.custom-selection-card');
                if (parent) parent.classList.remove("active");
            });
            optionCard.classList.add("active");
            radio.checked = true;
            
            if (summaryPayer) {
                summaryPayer.textContent = radio.value;
            }
        });
    });

    // PAYMENT METHOD
    const methodRadios = document.querySelectorAll('input[name="paymentMethod"]');
    methodRadios.forEach(radio => {
        const wrapperCardFrame = radio.closest('.method-card-wrapper');
        if (!wrapperCardFrame) return;

        wrapperCardFrame.addEventListener("click", () => {
            methodRadios.forEach(r => {
                const siblingWrapper = r.closest('.method-card-wrapper');
                if (siblingWrapper) siblingWrapper.classList.remove("active");
            });
            wrapperCardFrame.classList.add("active");
            radio.checked = true;
        });
    });

    // Helper functions to manage modal visibility
    function openReviewModalPopup() {
        if (bookingReviewModal) bookingReviewModal.classList.add("is-visible");
    }

    function closeReviewModalPopup() {
        if (bookingReviewModal) bookingReviewModal.classList.remove("is-visible");
    }

    [btnCloseModalX, btnCancelModal].forEach(btn => {
        if (btn) btn.addEventListener("click", closeReviewModalPopup);
    });

  
    // CONFIRM BOOKING & OPEN REVIEW POPUP
    if (btnConfirmBooking) {
        btnConfirmBooking.addEventListener("click", () => {
            const checkedMethod = document.querySelector('input[name="paymentMethod"]:checked');
            const checkedPayer = document.querySelector('input[name="payerType"]:checked');

            if (!checkedMethod || !checkedPayer) {
                alert("⚠️ Please confirm both your payment terms configuration and method channels.");
                return;
            }

            const finalMethodChoice = checkedMethod.value;
            
            // Validation step: Check reference strings if digital settlement channels are selected
            if (finalMethodChoice === "GCash" && (!gcashRefInput || !gcashRefInput.value.trim())) {
                alert("⚠️ Please fill out your 13-digit GCash transfer reference string code before finalizing booking details.");
                if (gcashRefInput) gcashRefInput.focus();
                return;
            } else if (finalMethodChoice === "BankTransfer" && (!bankRefInput || !bankRefInput.value.trim())) {
                alert("⚠️ Please provide your bank transaction verification tracking number block.");
                if (bankRefInput) bankRefInput.focus();
                return;
            }

            //Maps clean contact values saved in Details Form step
            const senderDetails = currentBookingDataManifest.senderContactDetails || {};
            const receiverDetails = currentBookingDataManifest.receiverContactDetails || {};

            if (popDeliveryMode) popDeliveryMode.textContent = currentBookingDataManifest.deliveryArrangementOption || "DoorToDoor";
            if (popSenderName) popSenderName.textContent = senderDetails.fullName || "Juan Dela Cruz";
            if (popReceiverName) popReceiverName.textContent = receiverDetails.fullName || "Maria Clara";
            
            //PACKAGE DATA PARSING
            const pkgConfig = currentBookingDataManifest.packageConfiguration || {};
            if (popItemDesc) popItemDesc.textContent = pkgConfig.description || "General Goods";
            if (popWeight) popWeight.textContent = `${pkgConfig.weightKg || 0} kg`;
            
            if (popVolume) {
                if (pkgConfig.dimensions) {
                    const dim = pkgConfig.dimensions;
                    popVolume.textContent = `${dim.length || 0}x${dim.width || 0}x${dim.height || 0} cm`;
                } else {
                    popVolume.textContent = "0x0x0 cm";
                }
            }

            // Map and inject special instructions safely to the review modal
            if (popSpecialNotes) {
                popSpecialNotes.textContent = (pkgConfig.specialHandlingNotes && pkgConfig.specialHandlingNotes.trim() !== "") 
                    ? pkgConfig.specialHandlingNotes 
                    : "None";
            }

            // POPULATING THE PAYMENT TERMS BLOCK
            if (popPayer) popPayer.textContent = checkedPayer.value;
            if (popMethod) popMethod.textContent = (finalMethodChoice === "Cash") ? "Cash / COD" : finalMethodChoice;
            if (popGrandTotal && summaryGrandTotal) popGrandTotal.textContent = `PHP ${summaryGrandTotal.textContent}`;

            // Launch the modal review window overlay
            openReviewModalPopup();
        });
    }

  

    // SUBMIT FINAL TRANSACTION DATA ENGINE
    if (btnFinalSubmitModal) {
        btnFinalSubmitModal.addEventListener("click", () => {
            const checkedPayer = document.querySelector('input[name="payerType"]:checked');
            const checkedMethod = document.querySelector('input[name="paymentMethod"]:checked');
            
            const finalPayerChoice = checkedPayer ? checkedPayer.value : "Sender";
            const finalMethodChoice = checkedMethod ? checkedMethod.value : "Cash";
            let referenceVerificationCodeValue = "N/A (Cash Settlement)";

            if (finalMethodChoice === "GCash" && gcashRefInput) referenceVerificationCodeValue = gcashRefInput.value.trim();
            if (finalMethodChoice === "BankTransfer" && bankRefInput) referenceVerificationCodeValue = bankRefInput.value.trim();

            // Generate unique systemic tracking reference ID code
            const uniqueTrackingId = "BAC-" + Math.floor(10000000 + Math.random() * 90000000) + "-PH";

            // Extract real-world recipient parameters from the data manifest
            const receiverDetails = currentBookingDataManifest.receiverContactDetails || {};
            const receiverName = receiverDetails.fullName || "Authorized Receiver";
            
            // Standardize raw location text gracefully
            let rawLocation = "Manila, NCR";
            if (currentBookingDataManifest.dashboardDisplayDestination) {
                rawLocation = currentBookingDataManifest.dashboardDisplayDestination;
            } else if (receiverDetails.fullAddress) {
                rawLocation = receiverDetails.fullAddress;
            }

            // Force real-world structured alignment: "Recipient Name - Location Address"
            const standardizedDestinationText = `${receiverName} - ${rawLocation}`;

            // Format payload data targeting the central schema engine
            const finalDashboardRecord = {
                trackingId: uniqueTrackingId,
                serviceType: "Standard Parcel", 
                destination: standardizedDestinationText, 
                dateBooked: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                status: "In Transit"
            };

            // Append the record cleanly to the master local storage database array ledger
            const masterShipmentsDatabase = JSON.parse(localStorage.getItem("maupayShipments")) || [];
            masterShipmentsDatabase.push(finalDashboardRecord);
            localStorage.setItem("maupayShipments", JSON.stringify(masterShipmentsDatabase));

            // Save metadata settings down into historical reference object for deep log files
            currentBookingDataManifest.assignedPayer = finalPayerChoice;
            currentBookingDataManifest.paymentMethodSelected = finalMethodChoice;
            currentBookingDataManifest.transactionReferenceCode = referenceVerificationCodeValue;
            currentBookingDataManifest.bookingTimestamp = new Date().toISOString();
            currentBookingDataManifest.generatedTrackingId = uniqueTrackingId;
            
            localStorage.setItem('consolidatedBookingManifest', JSON.stringify(currentBookingDataManifest));
            
            // Tear down transient runtime memory references so workspace resets perfectly
            sessionStorage.removeItem("activeBookingServiceType");

            // Close down checkout review modal frame
            closeReviewModalPopup();
            
            // POP OPEN THE SUCCESS MODAL
            if (successTrackingId) successTrackingId.textContent = uniqueTrackingId;
            if (successModalOverlay) successModalOverlay.classList.add("display-modal-active");
        });
    }

    // Handle redirection action inside the custom success popup confirmation card layout
    if (btnSuccessDashboard) {
        btnSuccessDashboard.addEventListener("click", () => {
            if (successModalOverlay) successModalOverlay.classList.remove("display-modal-active");
            window.location.href = "dashboard.html";
        });
    }

    if (btnBackToPackage) {
        btnBackToPackage.addEventListener("click", () => {
            window.location.href = "book-standard-parcel-package.html";
        });
    }
});