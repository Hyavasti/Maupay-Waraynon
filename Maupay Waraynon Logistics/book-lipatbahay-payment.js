// ==========================================================================
// 📦 MAUPAY WARAYNON PADALA CENTER - LIPATBAHAY ROUTING INFRASTRUCTURE
// ==========================================================================

// 1. Modern Modular Firebase Imports matching your setup
import { getFirestore, doc, updateDoc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";

// 2. Firebase Safe Configuration Hook
const firebaseConfig = {
    apiKey: "AIzaSyBVUVvHJfsZGvaZmOq2Sz23kI8dnml4dI0",
    authDomain: "mpc-bacoor.firebaseapp.com",
    databaseURL: "https://mpc-bacoor-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "mpc-bacoor",
    storageBucket: "mpc-bacoor.firebasestorage.app",
    messagingSenderId: "105917197007",
    appId: "1:105917197007:web:ec34d45a969be00a30e5ba",
    measurementId: "G-GSF6CFML1Y"
};

// Prevent duplicate initialization crashes across page transitions
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

document.addEventListener("DOMContentLoaded", () => {
    const paymentForm = document.getElementById("lipatBahayPaymentForm");
    const btnBackToInfo = document.getElementById("btnBackToInfo");
    
    const payerOptions = document.querySelectorAll('input[name="paymentPayer"]');
    const methodOptions = document.querySelectorAll('input[name="paymentOption"]');
    
    const codNotice = document.getElementById("codNoticeContainer");
    const gcashContainer = document.getElementById("gcashDetailsContainer");
    const bankContainer = document.getElementById("bankDetailsContainer");
    
    const gcashInput = document.getElementById("gcashReferenceNumber");
    const bankInput = document.getElementById("bankTransactionRef");
    const summaryAssignedPayer = document.getElementById("summaryAssignedPayer");

    const modalOverlay = document.getElementById("reviewOrderModalOverlay");
    const modalCloseX = document.getElementById("modalCloseXBtn");
    const modalCancel = document.getElementById("modalCancelBtn");
    const modalSubmitFinal = document.getElementById("modalSubmitFinalBtn");

    const successModalOverlay = document.getElementById("successModalOverlay");
    const successTrackingId = document.getElementById("successTrackingId");
    const btnSuccessDashboard = document.getElementById("btnSuccessDashboard");

    let basePriceValue = 0;
    let addonsPriceValue = 0;
    let roundTripValue = 0;
    let grandTotalValue = 0;
    
    let vehicleModelUsed = "";
    let movementDate = "";
    let capacityCount = "";
    let selectedAddonsTextList = [];
    let bookingManifestSource = {};

    // 💡 SECURE TRACKING VARIABLES FOR SPECIAL HANDLING AND VALUABLES WITH FALLBACKS
    let specialInstructionsValue = "None stated";
    let valuableItemsValue = "None stated";

    const profileAvatar = document.getElementById("profileAvatar");

    // Profile State Check via Modern SDK
    onAuthStateChanged(auth, async (user) => {
        if (user && profileAvatar) {
            try {
                const userDocRef = doc(db, "Customer", user.uid);
                const snapshot = await getDoc(userDocRef);
                if (snapshot.exists()) {
                    const userData = snapshot.data();
                    const firstName = userData.firstName || userData.name || "";
                    if (firstName) {
                        profileAvatar.innerText = firstName.trim().charAt(0).toUpperCase();
                        return;
                    }
                }
            } catch (err) {
                console.warn("Database avatar read error:", err);
            }
        }
        fallbackLocalStorageAvatar();
    });

    function fallbackLocalStorageAvatar() {
        const savedAccountRaw = localStorage.getItem('dummyTestingAccount');
        if (savedAccountRaw && profileAvatar) {
            const userAccount = JSON.parse(savedAccountRaw);
            if (userAccount.firstName) {
                profileAvatar.innerText = userAccount.firstName.charAt(0).toUpperCase();
            }
        }
    }

    bookingManifestSource = JSON.parse(localStorage.getItem('consolidatedBookingManifest')) || 
                            JSON.parse(localStorage.getItem('activeBookingFormStep2')) || {};

    if (bookingManifestSource) {
        if (bookingManifestSource.vehicleSelection) {
            vehicleModelUsed = bookingManifestSource.vehicleSelection.displayName || "Van Truck";
            basePriceValue = Number(bookingManifestSource.vehicleSelection.basePrice || 0);
        } else if (bookingManifestSource.logisticsArrangements) {
            vehicleModelUsed = bookingManifestSource.logisticsArrangements.vehicleClassSelected || "Van Truck";
        }

        // Deep mapping checking across varying manifest versions
        if (bookingManifestSource.moveDetails) {
            movementDate = bookingManifestSource.moveDetails.preferredDate || "--/--/----";
            capacityCount = bookingManifestSource.moveDetails.estimatedItemsCount || "0";
            specialInstructionsValue = bookingManifestSource.moveDetails.specialHandlingInstructions || specialInstructionsValue;
            valuableItemsValue = bookingManifestSource.moveDetails.specialValuableItems || valuableItemsValue;
        } 
        
        if (bookingManifestSource.moveSpecifications) {
            if (bookingManifestSource.moveSpecifications.scheduledDate) movementDate = bookingManifestSource.moveSpecifications.scheduledDate;
            if (bookingManifestSource.moveSpecifications.loadQuantityEstimate) capacityCount = bookingManifestSource.moveSpecifications.loadQuantityEstimate;
            if (bookingManifestSource.moveSpecifications.specialInstructionsText) specialInstructionsValue = bookingManifestSource.moveSpecifications.specialInstructionsText;
            if (bookingManifestSource.moveSpecifications.valuableHighTierItems) valuableItemsValue = bookingManifestSource.moveSpecifications.valuableHighTierItems;
        }

        if (bookingManifestSource.selectedAddons) {
            selectedAddonsTextList = bookingManifestSource.selectedAddons;
        } else if (bookingManifestSource.logisticsArrangements && bookingManifestSource.logisticsArrangements.selectedAddonServices) {
            selectedAddonsTextList = bookingManifestSource.logisticsArrangements.selectedAddonServices;
        }

        if (bookingManifestSource.estimatedTotalQuote) {
            grandTotalValue = Number(bookingManifestSource.estimatedTotalQuote);
        } else if (bookingManifestSource.logisticsArrangements && bookingManifestSource.logisticsArrangements.computedQuoteSummaryValue) {
            const rawPriceText = bookingManifestSource.logisticsArrangements.computedQuoteSummaryValue;
            grandTotalValue = parseFloat(rawPriceText.replace(/[^0-9.]/g, '')) || 0;
        }

        if (basePriceValue > 0 && grandTotalValue >= basePriceValue) {
            addonsPriceValue = grandTotalValue - basePriceValue;
        } else {
            basePriceValue = grandTotalValue;
            addonsPriceValue = 0;
        }

        if (document.getElementById("summaryVehicleName")) document.getElementById("summaryVehicleName").textContent = vehicleModelUsed;
        if (document.getElementById("summaryVehicleRate")) document.getElementById("summaryVehicleRate").textContent = `PHP ${basePriceValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        if (document.getElementById("summaryAddonsPrice")) document.getElementById("summaryAddonsPrice").textContent = `PHP ${addonsPriceValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        if (document.getElementById("summaryMoveDate")) document.getElementById("summaryMoveDate").textContent = movementDate;
        if (document.getElementById("summaryItemsCount")) document.getElementById("summaryItemsCount").textContent = capacityCount;
        
        const roundTripRow = document.getElementById("summaryRoundTripRow");
        if (roundTripRow) roundTripRow.style.display = "none";

        if (document.getElementById("displayFinalPaymentDue")) {
            document.getElementById("displayFinalPaymentDue").textContent = `Php ${grandTotalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        }
    }

    payerOptions.forEach(radio => {
        const row = radio.closest(".payment-selection-row");
        if (!row) return;
        row.addEventListener("click", (e) => {
            if (e.target !== radio) radio.checked = true;
            payerOptions.forEach(r => {
                const pRow = r.closest(".payment-selection-row");
                if (pRow) pRow.classList.remove("active-row");
            });
            row.classList.add("active-row");
            if (summaryAssignedPayer) summaryAssignedPayer.textContent = radio.value;
        });
    });

    methodOptions.forEach(radio => {
        const row = radio.closest(".payment-selection-row");
        if (!row) return;
        row.addEventListener("click", (e) => {
            if (e.target.tagName === "INPUT" && e.target.type === "text") return;
            if (e.target !== radio) radio.checked = true;

            methodOptions.forEach(r => {
                const mRow = r.closest(".payment-selection-row");
                if (mRow) mRow.classList.remove("active-row");
            });
            row.classList.add("active-row");
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

    if (btnBackToInfo) {
        btnBackToInfo.addEventListener("click", () => {
            window.location.href = "book-lipatbahay-info.html";
        });
    }

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

            if (bookingManifestSource.origin && bookingManifestSource.origin.name) senderFullName = bookingManifestSource.origin.name;
            if (bookingManifestSource.destination && bookingManifestSource.destination.name) receiverFullName = bookingManifestSource.destination.name;

            if (document.getElementById("popRouteSender")) document.getElementById("popRouteSender").textContent = senderFullName;
            if (document.getElementById("popRouteReceiver")) document.getElementById("popRouteReceiver").textContent = receiverFullName;
            if (document.getElementById("popMoveVehicle")) document.getElementById("popMoveVehicle").textContent = vehicleModelUsed;
            if (document.getElementById("popMoveDate")) document.getElementById("popMoveDate").textContent = movementDate;
            if (document.getElementById("popMoveItems")) document.getElementById("popMoveItems").textContent = `${capacityCount} items est.`;

            // ✅ Defensive elements check ensures missing fields won't crash execution
            const specInstructionsEl = document.getElementById("popSpecialInstructions");
            if (specInstructionsEl) specInstructionsEl.textContent = specialInstructionsValue;

            const valItemsEl = document.getElementById("popValuableItems");
            if (valItemsEl) valItemsEl.textContent = valuableItemsValue;

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

    function closeReviewModalZone() {
        if (modalOverlay) modalOverlay.classList.remove("display-modal-active");
    }

    if (modalCloseX) modalCloseX.addEventListener("click", closeReviewModalZone);
    if (modalCancel) modalCancel.addEventListener("click", closeReviewModalZone);

    if (modalSubmitFinal) {
        modalSubmitFinal.addEventListener("click", async () => {
            const checkedPayerEl = document.querySelector('input[name="paymentPayer"]:checked');
            const checkedMethodEl = document.querySelector('input[name="paymentOption"]:checked');
            
            const finalPayer = checkedPayerEl ? checkedPayerEl.value : "Sender";
            const finalMethod = checkedMethodEl ? checkedMethodEl.value : "COD";

            const uniqueTrackingId = "LBH-" + Math.floor(10000000 + Math.random() * 90000000) + "-PH";
            const uniqueBookingKey = `booking_${Date.now()}`;

            let originAddress = "Malate, Manila";
            let destinationAddress = "Tacloban City, Leyte";
            let senderName = "Juan Dela Cruz";
            let receiverName = "Maria Clara";
            let senderPhoneNum = "09171112222";
            let receiverPhoneNum = "09246810121";

            if (bookingManifestSource.origin) {
                senderName = bookingManifestSource.origin.name || senderName;
                originAddress = bookingManifestSource.origin.address || originAddress;
                senderPhoneNum = bookingManifestSource.origin.phone || senderPhoneNum;
            }
            if (bookingManifestSource.destination) {
                receiverName = bookingManifestSource.destination.name || receiverName;
                destinationAddress = bookingManifestSource.destination.address || destinationAddress;
                receiverPhoneNum = bookingManifestSource.destination.phone || receiverPhoneNum;
            }

            const standardizedDestinationText = destinationAddress;
            const displayDateText = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

            const finalDashboardRecord = {
                trackingId: uniqueTrackingId,
                serviceType: "Lipat Bahay (Moving)", 
                destination: standardizedDestinationText,
                dateBooked: displayDateText,
                estDelivery: movementDate || "Pending Dispatch",
                totalAmount: grandTotalValue.toString(),
                status: "Pending Dispatch",
                sender: {
                    name: senderName,
                    phone: senderPhoneNum.replace(/\s+/g, ''),
                    address: originAddress
                },
                receiver: {
                    name: receiverName,
                    phone: receiverPhoneNum.replace(/\s+/g, ''),
                    address: destinationAddress
                },
                package: {
                    desc: `Lipat-Bahay Cargo via ${vehicleModelUsed}`,
                    category: "Moving Freight Cargo",
                    dims: "N/A — Truck Load",
                    weight: `${capacityCount} items est.`,
                    value: grandTotalValue.toLocaleString('en-PH', { minimumFractionDigits: 2 }),
                    specialInstructions: specialInstructionsValue,
                    valuableItems: valuableItemsValue
                },
                payment: {
                    method: finalMethod === "COD" ? "Cash on Delivery (COD)" : `${finalMethod} Wallet`,
                    amount: grandTotalValue.toLocaleString('en-PH', { minimumFractionDigits: 2 })
                }
            };

            const masterShipmentsDatabase = JSON.parse(localStorage.getItem("maupayShipments")) || [];
            masterShipmentsDatabase.push(finalDashboardRecord);
            localStorage.setItem("maupayShipments", JSON.stringify(masterShipmentsDatabase));

            // ==================================================================
            // 🏷️ PREPARING THE ORDERED STRUCTURE FOR FIREBASE DESIRED SCHEME
            // ==================================================================
            const structuredFirebasePayload = {
                "01_trackingId": uniqueTrackingId,
                "02_senderDetails": {
                    fullName: senderName,
                    contactNumber: senderPhoneNum.replace(/\s+/g, ''),
                    pickupAddress: originAddress
                },
                "03_receiverDetails": {
                    fullName: receiverName,
                    contactNumber: receiverPhoneNum.replace(/\s+/g, ''),
                    dropoffAddress: destinationAddress
                },
                "04_orderDetails": {
                    serviceType: "Lipat-Bahay (Moving Services)",
                    vehicleType: vehicleModelUsed,
                    scheduledMoveDate: movementDate || "Pending Scheduling",
                    estimatedItemCount: capacityCount,
                    valuableItemsDeclared: valuableItemsValue,
                    specialHandlingInstructions: specialInstructionsValue,
                    selectedAddonServices: selectedAddonsTextList,
                    orderCreatedDateTime: new Date().toLocaleString()
                },
                "05_paymentDetails": {
                    assignedPayer: finalPayer,
                    paymentMethod: finalMethod === "COD" ? "Cash on Delivery (COD)" : finalMethod,
                    referenceNumber: finalMethod === "GCash" ? gcashInput.value : (finalMethod === "Bank" ? bankInput.value : "N/A (COD)"),
                    totalAmountDue: `PHP ${grandTotalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
                    rawNumericAmount: grandTotalValue
                }
            };

            // Maintain standard local storage layout copies for backward compatibility with your dashboard view setup
            bookingManifestSource.serviceType = "Lipat-Bahay";
            bookingManifestSource.orderDateTime = new Date().toLocaleString();
            bookingManifestSource.generatedTrackingId = uniqueTrackingId;
            bookingManifestSource.paymentDetails = {
                assignedPayer: finalPayer,
                methodChosen: finalMethod,
                referenceNumberLogged: finalMethod === "GCash" ? gcashInput.value : (finalMethod === "Bank" ? bankInput.value : "COD-PENDING")
            };
            localStorage.setItem('consolidatedBookingManifest', JSON.stringify(bookingManifestSource));
            
            // ==================================================================
            // 🌐 MODERN FIREBASE MODULAR SAFE DEEP PATH WRITE WITH MERGE
            // ==================================================================
            try {
                const currentUserId = auth.currentUser ? auth.currentUser.uid : "GUEST_USER";
                const customerDocRef = doc(db, "Customer", currentUserId);

                try {
                    // Modern modular update call with ordered formatting keys
                    await updateDoc(customerDocRef, {
                        [`services.lipatbahay.${uniqueBookingKey}`]: structuredFirebasePayload
                    });
                    console.log("🎉 Ordered numerical structure updated in Firestore successfully.");
                } catch (updateError) {
                    // Fallback configuration path mapping
                    console.log("🔄 Initializing structural map merge configuration...");
                    await setDoc(customerDocRef, {
                        services: {
                            lipatbahay: {
                                [uniqueBookingKey]: structuredFirebasePayload
                            }
                        }
                    }, { merge: true });
                    console.log("🎉 Ordered numerical structure merged into Firestore successfully.");
                }
            } catch (cloudError) {
                console.error("❌ Modern Cloud write exception:", cloudError);
            }

            localStorage.removeItem('activeBookingFormStep2');
            sessionStorage.removeItem("activeBookingServiceType");
            closeReviewModalZone();

            if (successTrackingId) successTrackingId.textContent = uniqueTrackingId;
            if (successModalOverlay) successModalOverlay.classList.add("display-modal-active");
        });
    }

    if (btnSuccessDashboard) {
        btnSuccessDashboard.addEventListener("click", () => {
            if (successModalOverlay) successModalOverlay.classList.remove("display-modal-active");
            window.location.href = "dashboard.html";
        });
    }
});