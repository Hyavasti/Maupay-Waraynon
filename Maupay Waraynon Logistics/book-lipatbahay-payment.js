document.addEventListener("DOMContentLoaded", () => {
    const paymentForm = document.getElementById("lipatBahayPaymentForm");
    const btnBackToInfo = document.getElementById("btnBackToInfo");
    
    // Select elements mapping groups
    const payerOptions = document.querySelectorAll('input[name="paymentPayer"]');
    const methodOptions = document.querySelectorAll('input[name="paymentOption"]');
    
    // Target nested blocks
    const codNotice = document.getElementById("codNoticeContainer");
    const gcashContainer = document.getElementById("gcashDetailsContainer");
    const bankContainer = document.getElementById("bankDetailsContainer");
    
    const gcashInput = document.getElementById("gcashReferenceNumber");
    const bankInput = document.getElementById("bankTransactionRef");
    const summaryAssignedPayer = document.getElementById("summaryAssignedPayer");

    // Modal DOM Elements Reference Group
    const modalOverlay = document.getElementById("reviewOrderModalOverlay");
    const modalCloseX = document.getElementById("modalCloseXBtn");
    const modalCancel = document.getElementById("modalCancelBtn");
    const modalSubmitFinal = document.getElementById("modalSubmitFinalBtn");

    // NEW Custom Success Modal Elements
    const successModalOverlay = document.getElementById("successModalOverlay");
    const successTrackingId = document.getElementById("successTrackingId");
    const btnSuccessDashboard = document.getElementById("btnSuccessDashboard");

    // Operational Tracking Stores initialized empty to load local manifest files cleanly
    let basePriceValue = 0;
    let addonsPriceValue = 0;
    let roundTripValue = 0;
    let grandTotalValue = 0;
    
    let vehicleModelUsed = "";
    let movementDate = "";
    let capacityCount = "";
    let selectedAddonsTextList = [];
    let bookingManifestSource = {};

    // Profile Avatar setup
    const profileAvatar = document.getElementById("profileAvatar");
    const savedAccountRaw = localStorage.getItem('dummyTestingAccount');
    if (savedAccountRaw && profileAvatar) {
        const userAccount = JSON.parse(savedAccountRaw);
        if (userAccount.firstName) {
            profileAvatar.innerText = userAccount.firstName.charAt(0).toUpperCase();
        }
    }

 
    //DYNAMIC ORDER SUMMARY & ADDONS DATA
    bookingManifestSource = JSON.parse(localStorage.getItem('consolidatedBookingManifest')) || 
                            JSON.parse(localStorage.getItem('activeBookingFormStep2')) || {};

    if (bookingManifestSource) {
        // Extract vehicle selections populated
        if (bookingManifestSource.vehicleSelection) {
            vehicleModelUsed = bookingManifestSource.vehicleSelection.displayName || "Van Truck";
            basePriceValue = Number(bookingManifestSource.vehicleSelection.basePrice || 0);
        } else if (bookingManifestSource.logisticsArrangements) {
            vehicleModelUsed = bookingManifestSource.logisticsArrangements.vehicleClassSelected || "Van Truck";
        }

        // Extract move specifications details
        if (bookingManifestSource.moveDetails) {
            movementDate = bookingManifestSource.moveDetails.preferredDate || "--/--/----";
            capacityCount = bookingManifestSource.moveDetails.estimatedItemsCount || "0";
        } else if (bookingManifestSource.moveSpecifications) {
            movementDate = bookingManifestSource.moveSpecifications.scheduledDate || "--/--/----";
            capacityCount = bookingManifestSource.moveSpecifications.loadQuantityEstimate || "0";
        }

        // Extract selected additions list array seamlessly 
        if (bookingManifestSource.selectedAddons) {
            selectedAddonsTextList = bookingManifestSource.selectedAddons;
        } else if (bookingManifestSource.logisticsArrangements && bookingManifestSource.logisticsArrangements.selectedAddonServices) {
            selectedAddonsTextList = bookingManifestSource.logisticsArrangements.selectedAddonServices;
        }

        // Extract dynamic live grand totals computed
        if (bookingManifestSource.estimatedTotalQuote) {
            grandTotalValue = Number(bookingManifestSource.estimatedTotalQuote);
        } else if (bookingManifestSource.logisticsArrangements && bookingManifestSource.logisticsArrangements.computedQuoteSummaryValue) {
            const rawPriceText = bookingManifestSource.logisticsArrangements.computedQuoteSummaryValue;
            grandTotalValue = parseFloat(rawPriceText.replace(/[^0-9.]/g, '')) || 0;
        }

        // Deduct base price from grand total to dynamically show total addon cost if fields aren't split
        if (basePriceValue > 0 && grandTotalValue >= basePriceValue) {
            addonsPriceValue = grandTotalValue - basePriceValue;
        } else {
            basePriceValue = grandTotalValue;
            addonsPriceValue = 0;
        }

        //Update matching invoice layout summaries
        if (document.getElementById("summaryVehicleName")) {
            document.getElementById("summaryVehicleName").textContent = vehicleModelUsed;
        }
        if (document.getElementById("summaryVehicleRate")) {
            document.getElementById("summaryVehicleRate").textContent = `PHP ${basePriceValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        }
        if (document.getElementById("summaryAddonsPrice")) {
            document.getElementById("summaryAddonsPrice").textContent = `PHP ${addonsPriceValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        }
        if (document.getElementById("summaryMoveDate")) {
            document.getElementById("summaryMoveDate").textContent = movementDate;
        }
        if (document.getElementById("summaryItemsCount")) {
            document.getElementById("summaryItemsCount").textContent = capacityCount;
        }
        
        const roundTripRow = document.getElementById("summaryRoundTripRow");
        if (roundTripRow) {
            roundTripRow.style.display = "none";
        }

        if (document.getElementById("displayFinalPaymentDue")) {
            document.getElementById("displayFinalPaymentDue").textContent = `Php ${grandTotalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        }
    }

    // PAYER ROW SELECTION 
    payerOptions.forEach(radio => {
        const row = radio.closest(".payment-selection-row");
        if (!row) return;
        row.addEventListener("click", () => {
            payerOptions.forEach(r => {
                const pRow = r.closest(".payment-selection-row");
                if (pRow) pRow.classList.remove("active-row");
            });
            row.classList.add("active-row");
            radio.checked = true;
            if (summaryAssignedPayer) summaryAssignedPayer.textContent = radio.value;
        });
    });

    //METHOD SELECTION
    methodOptions.forEach(radio => {
        const row = radio.closest(".payment-selection-row");
        if (!row) return;
        row.addEventListener("click", (e) => {
            if (e.target.tagName === "INPUT" && e.target.type === "text") return;

            methodOptions.forEach(r => {
                const mRow = r.closest(".payment-selection-row");
                if (mRow) mRow.classList.remove("active-row");
            });
            row.classList.add("active-row");
            radio.checked = true;
            
            toggleInlinePaymentMethodZones(radio.value);
        });
    });

    function toggleInlinePaymentMethodZones(methodValue) {
        if (codNotice) codNotice.classList.remove("active-zone");
        if (gcashContainer) gcashContainer.classList.remove("active-zone");
        if (bankContainer) bankContainer.classList.remove("active-zone");
        
        if (gcashInput) gcashInput.required = false;
        if (bankInput) bankInput.required = false;

        if (methodValue === "COD" && codNotice) {
            codNotice.classList.add("active-zone");
        } else if (methodValue === "GCash" && gcashContainer) {
            gcashContainer.classList.add("active-zone");
            if (gcashInput) gcashInput.required = true;
        } else if (methodValue === "Bank" && bankContainer) {
            bankContainer.classList.add("active-zone");
            if (bankInput) bankInput.required = true;
        }
    }

    if (gcashInput) {
        gcashInput.addEventListener("input", (e) => {
            e.target.value = e.target.value.replace(/\D/g, "");
        });
    }

    // Navigation Step-Back Action
    if (btnBackToInfo) {
        btnBackToInfo.addEventListener("click", () => {
            window.location.href = "book-lipatbahay-info.html";
        });
    }

 
    // INTERCEPT SUBMISSION TO OPEN MODAL & MAP ISOLATED ADDONS
    if (paymentForm) {
        paymentForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const checkedMethodEl = document.querySelector('input[name="paymentOption"]:checked');
            const selectedMethod = checkedMethodEl ? checkedMethodEl.value : "COD";

            if (selectedMethod === "GCash" && gcashInput && gcashInput.value.length !== 13) {
                alert("❌ Verification Error: GCash Reference Number must be exactly 13 digits long.");
                return;
            }

            if (selectedMethod === "Bank" && bankInput && bankInput.value.trim() === "") {
                alert("❌ Verification Error: Please provide your bank transaction reference code.");
                return;
            }

            const checkedPayerEl = document.querySelector('input[name="paymentPayer"]:checked');
            const selectedPayer = checkedPayerEl ? checkedPayerEl.value : "Sender";
            
            let senderFullName = "Juan Dela Cruz";
            let receiverFullName = "Maria Clara";

            if (bookingManifestSource.origin && bookingManifestSource.origin.name) {
                senderFullName = bookingManifestSource.origin.name;
            }
            if (bookingManifestSource.destination && bookingManifestSource.destination.name) {
                receiverFullName = bookingManifestSource.destination.name;
            }

            // Populate Modal Fields cleanly
            if (document.getElementById("popRouteSender")) document.getElementById("popRouteSender").textContent = senderFullName;
            if (document.getElementById("popRouteReceiver")) document.getElementById("popRouteReceiver").textContent = receiverFullName;
            
            if (document.getElementById("popMoveVehicle")) document.getElementById("popMoveVehicle").textContent = vehicleModelUsed;
            if (document.getElementById("popMoveDate")) document.getElementById("popMoveDate").textContent = movementDate;
            
            //Stays cleanly on its own line
            if (document.getElementById("popMoveItems")) {
                document.getElementById("popMoveItems").textContent = `${capacityCount} items est.`;
            }

            //Maps target summary cleanly or defaults to "None"
            const popMoveAddons = document.getElementById("popMoveAddons");
            if (popMoveAddons) {
                if (selectedAddonsTextList && selectedAddonsTextList.length > 0) {
                    const listItemsHTML = selectedAddonsTextList.map(item => `<li>${item}</li>`).join('');
                    popMoveAddons.innerHTML = `<ul class="addons-list-container">${listItemsHTML}</ul>`;
                } else {
                    popMoveAddons.innerHTML = `<span>None</span>`;
                }
            }
            
            if (document.getElementById("popSettlementPayer")) document.getElementById("popSettlementPayer").textContent = selectedPayer;
            if (document.getElementById("popSettlementMethod")) document.getElementById("popSettlementMethod").textContent = selectedMethod === "COD" ? "Cash / COD" : selectedMethod;
            if (document.getElementById("popSettlementGrandTotal")) {
                document.getElementById("popSettlementGrandTotal").textContent = `PHP ${grandTotalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            }

            if (modalOverlay) modalOverlay.classList.add("display-modal-active");
        });
    }

    // Modal view closures
    function closeReviewModalZone() {
        if (modalOverlay) modalOverlay.classList.remove("display-modal-active");
    }

    if (modalCloseX) modalCloseX.addEventListener("click", closeReviewModalZone);
    if (modalCancel) modalCancel.addEventListener("click", closeReviewModalZone);


    // SUBMIT FINAL TRANSACTION DATA ENGINE
    if (modalSubmitFinal) {
        modalSubmitFinal.addEventListener("click", () => {
            const checkedPayerEl = document.querySelector('input[name="paymentPayer"]:checked');
            const checkedMethodEl = document.querySelector('input[name="paymentOption"]:checked');
            
            const finalPayer = checkedPayerEl ? checkedPayerEl.value : "Sender";
            const finalMethod = checkedMethodEl ? checkedMethodEl.value : "COD";

            // GENERATE TRACKING ID CODE SPECIFICALLY FOR LIPATBAHAY
            const uniqueTrackingId = "LBH-" + Math.floor(10000000 + Math.random() * 90000000) + "-PH";

            // Extract the recipient's name/company and pair it cleanly with the delivery location address
            let receiverName = "Authorized Receiver";
            let rawAddress = "Tacloban City, Leyte";

            if (bookingManifestSource.destination) {
                if (bookingManifestSource.destination.name) {
                    receiverName = bookingManifestSource.destination.name;
                }
                if (bookingManifestSource.destination.address) {
                    rawAddress = bookingManifestSource.destination.address;
                }
            }

            // Real-world uniform format structure generation: "Recipient Name - Address Location"
            const standardizedDestinationText = `${receiverName} - ${rawAddress}`;

            // FORMAT RECORD TARGETING THE CENTRAL maupayShipments MASTER ARRAY SCHEMA
            const finalDashboardRecord = {
                trackingId: uniqueTrackingId,
                serviceType: "Lipat-Bahay", 
                destination: standardizedDestinationText,
                dateBooked: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                status: "Pending Dispatch" 
            };

            // PUSH THE NEW SHIPMENT CLEANLY INTO CENTRAL SHIPS LEDGER LOG ARRAYS
            const masterShipmentsDatabase = JSON.parse(localStorage.getItem("maupayShipments")) || [];
            masterShipmentsDatabase.push(finalDashboardRecord);
            localStorage.setItem("maupayShipments", JSON.stringify(masterShipmentsDatabase));

            // Keep local deep history log updated
            bookingManifestSource.serviceType = "Lipat-Bahay";
            bookingManifestSource.orderDateTime = new Date().toLocaleString();
            bookingManifestSource.generatedTrackingId = uniqueTrackingId;
            
            bookingManifestSource.orderDetails = {
                vehicleSelected: vehicleModelUsed,
                scheduledMoveDate: movementDate,
                estimatedItemsCount: capacityCount,
                selectedAddonServicesList: selectedAddonsTextList,
                financialBreakdown: {
                    baseVehicleRate: basePriceValue,
                    addonsTotalFee: addonsPriceValue,
                    roundTripSurcharge: roundTripValue,
                    totalAmountPaid: grandTotalValue
                }
            };

            bookingManifestSource.paymentDetails = {
                assignedPayer: finalPayer,
                methodChosen: finalMethod,
                referenceNumberLogged: finalMethod === "GCash" ? gcashInput.value : (finalMethod === "Bank" ? bankInput.value : "COD-PENDING"),
                status: finalMethod === "COD" ? "Pending Cash Collection" : "Awaiting Manual Verification"
            };

            // Save historical record to consolidated manifest
            localStorage.setItem('consolidatedBookingManifest', JSON.stringify(bookingManifestSource));
            
            // Explicitly DELETE the wizard data key so that step 1 is empty on next run
            localStorage.removeItem('activeBookingFormStep2');
            sessionStorage.removeItem("activeBookingServiceType");

            // Close the initial review checkout modal screen zone cleanly
            closeReviewModalZone();

            //POP OPEN THE SUCCESS MODAL
            if (successTrackingId) successTrackingId.textContent = uniqueTrackingId;
            if (successModalOverlay) successModalOverlay.classList.add("display-modal-active");
        });
    }

    // Handle button confirmation inside the custom success popup card container
    if (btnSuccessDashboard) {
        btnSuccessDashboard.addEventListener("click", () => {
            if (successModalOverlay) successModalOverlay.classList.remove("display-modal-active");
            window.location.href = "dashboard.html";
        });
    }
});