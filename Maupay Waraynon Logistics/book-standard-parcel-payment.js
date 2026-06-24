// 1. Modern Modular Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

// 2. Your Web App's Firebase Configuration
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

// 3. Initialize Firebase Services
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

document.addEventListener("DOMContentLoaded", () => {
    const btnBackToPackage = document.getElementById("btnBackToPackage");
    const btnConfirmBooking = document.getElementById("btnConfirmBooking");
    const summaryPayer = document.getElementById("summaryPayer");

    const bookingReviewModal = document.getElementById("bookingReviewModal");
    const btnCloseModalX = document.getElementById("btnCloseModalX");
    const btnCancelModal = document.getElementById("btnCancelModal");
    const btnFinalSubmitModal = document.getElementById("btnFinalSubmitModal");

    const successModalOverlay = document.getElementById("successModalOverlay");
    const successTrackingId = document.getElementById("successTrackingId");
    const btnSuccessDashboard = document.getElementById("btnSuccessDashboard");

    const popDeliveryMode = document.getElementById("popDeliveryMode");
    const popSenderName = document.getElementById("popSenderName");
    const popReceiverName = document.getElementById("popReceiverName");
    const popItemDesc = document.getElementById("popItemDesc");
    const popWeight = document.getElementById("popWeight");
    const popVolume = document.getElementById("popVolume");
    const popSpecialNotes = document.getElementById("popSpecialNotes");

    const popPayer = document.getElementById("popPayer");
    const popMethod = document.getElementById("popMethod");
    const popGrandTotal = document.getElementById("popGrandTotal");

    const gcashRefInput = document.getElementById("gcashRefNum");
    const bankRefInput = document.getElementById("bankRefNum");

    const summaryBaseRate = document.getElementById("summaryBaseRate");
    const summaryWeightSurcharge = document.getElementById("summaryWeightSurcharge");
    const summaryInsurance = document.getElementById("summaryInsurance");
    const summaryGrandTotal = document.getElementById("summaryGrandTotal");

    const profileAvatar = document.getElementById("profileAvatar");
    const avatarTooltip = document.getElementById("avatarTooltip");

    // 🌟 Capture tracking context securely from event lifecycle streams
let currentAuthenticatedUID = "oZ55xPFsSYWyVTD5R8G1kYmx43";

    const savedAccountRaw = localStorage.getItem('dummyTestingAccount');
    if (savedAccountRaw && profileAvatar) {
        try {
            const userAccount = JSON.parse(savedAccountRaw);
            if (userAccount && userAccount.firstName) {
                profileAvatar.innerText = userAccount.firstName.charAt(0).toUpperCase();
            }
        } catch (e) { console.error("Error setting avatar display initial:", e); }
    }

    // 🌟 LIVE CLOUD FIRESTORE AVATAR LOOKUP (With Tooltip safety guards)
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentAuthenticatedUID = user.uid; 
            console.log("Firebase Auth detected active UID:", currentAuthenticatedUID);

            if (profileAvatar) {
                const userDocRef = doc(db, "Customer", user.uid);
                
                getDoc(userDocRef).then((docSnapshot) => {
                    if (docSnapshot.exists()) {
                        const userData = docSnapshot.data();
                        console.log("Profile data retrieved successfully:", userData);
                        
                        // Update main text circle letter initial
                        if (userData && userData.firstName) {
                            profileAvatar.innerText = userData.firstName.charAt(0).toUpperCase();
                        }

                        // 🔒 SAFETY GUARD: Populate Tooltip fields ONLY if it exists in HTML
                        if (avatarTooltip) {
                            const nameEl = avatarTooltip.querySelector(".tooltip-name");
                            const emailEl = avatarTooltip.querySelector(".tooltip-email");

                            const fName = userData.firstName || "";
                            const lName = userData.lastName || "";
                            const email = userData.emailAddress || user.email || "";

                            if (nameEl) nameEl.innerText = `${fName} ${lName}`.trim();
                            if (emailEl) emailEl.innerText = email;
                        }
                    } else if (user.displayName) {
                        // Auth display name backup fallback channel
                        profileAvatar.innerText = user.displayName.charAt(0).toUpperCase();
                        
                        // 🔒 SAFETY GUARD: Backup channel check
                        if (avatarTooltip) {
                            const nameEl = avatarTooltip.querySelector(".tooltip-name");
                            const emailEl = avatarTooltip.querySelector(".tooltip-email");
                            if (nameEl) nameEl.innerText = user.displayName;
                            if (emailEl) emailEl.innerText = user.email || "";
                        }
                    }
                }).catch((error) => {
                    console.error("Error reading profile document from Cloud Firestore:", error);
                });
            }
        } else {
            console.warn("No active auth state detected on page load.");
        }
    });

    // Extract Session Data Memory Blocks safely
    const savedDetails = JSON.parse(localStorage.getItem('tempDetails') || '{}');
    const savedPackage = JSON.parse(localStorage.getItem('tempPackage') || '{}');

    // 🌟 DEEP EXTRACTION ENGINE: Loops through maps to find sub-nested values if present
    let baseParcelPayload = savedDetails;
    if (savedDetails.services && savedDetails.services.standardParcel) {
        const spGroup = savedDetails.services.standardParcel;
        if (spGroup["1_trackingId"] || spGroup.senderDetails) {
            baseParcelPayload = spGroup;
        } else {
            const firstKey = Object.keys(spGroup)[0];
            if (firstKey) baseParcelPayload = spGroup[firstKey];
        }
    }

    const localPackagePayload = savedPackage.packageConfiguration || {};
    const localLedgerPayload = savedPackage.billingLedger || {};

    if (localLedgerPayload.grandTotal !== undefined) {
        if (summaryBaseRate) summaryBaseRate.textContent = parseFloat(localLedgerPayload.baseRate || 150).toFixed(2);
        if (summaryWeightSurcharge) summaryWeightSurcharge.textContent = parseFloat(localLedgerPayload.weightSurcharge || 0).toFixed(2);
        if (summaryInsurance) summaryInsurance.textContent = parseFloat(localLedgerPayload.insuranceCharge || 0).toFixed(2);
        if (summaryGrandTotal) summaryGrandTotal.textContent = parseFloat(localLedgerPayload.grandTotal || 150).toFixed(2);
    }

    const payerRadios = document.querySelectorAll('input[name="payerType"]');
    payerRadios.forEach(radio => {
        radio.addEventListener("change", () => {
            payerRadios.forEach(r => {
                const card = r.closest('.custom-selection-card');
                if (card) card.classList.remove("active");
            });
            if (radio.checked) {
                const activeCard = radio.closest('.custom-selection-card');
                if (activeCard) activeCard.classList.add("active");
                if (summaryPayer) summaryPayer.textContent = radio.value;
            }
        });
    });

    const methodRadios = document.querySelectorAll('input[name="paymentMethod"]');
    methodRadios.forEach(radio => {
        radio.addEventListener("change", () => {
            methodRadios.forEach(r => {
                const wrapper = r.closest('.method-card-wrapper');
                if (wrapper) wrapper.classList.remove("active");
            });
            if (radio.checked) {
                const activeWrapper = radio.closest('.method-card-wrapper');
                if (activeWrapper) activeWrapper.classList.add("active");
            }
        });
    });

    function openReviewModalPopup() { if (bookingReviewModal) bookingReviewModal.classList.add("is-visible"); }
    function closeReviewModalPopup() { if (bookingReviewModal) bookingReviewModal.classList.remove("is-visible"); }

    [btnCloseModalX, btnCancelModal].forEach(btn => { if (btn) btn.addEventListener("click", closeReviewModalPopup); });

    if (btnConfirmBooking) {
        btnConfirmBooking.addEventListener("click", () => {
            const checkedMethod = document.querySelector('input[name="paymentMethod"]:checked');
            const checkedPayer = document.querySelector('input[name="payerType"]:checked');

            if (!checkedMethod || !checkedPayer) {
                alert("⚠️ Please confirm both your payment terms configuration and method channels.");
                return;
            }

            const finalMethodChoice = checkedMethod.value;
            if (finalMethodChoice === "GCash" && (!gcashRefInput || !gcashRefInput.value.trim())) {
                alert("⚠️ Invalid Gcash reference.");
                if (gcashRefInput) gcashRefInput.focus();
                return;
            } else if (finalMethodChoice === "BankTransfer" && (!bankRefInput || !bankRefInput.value.trim())) {
                alert("⚠️ Invalid bank transfer reference.");
                if (bankRefInput) bankRefInput.focus();
                return;
            }

            const senderDetails = baseParcelPayload.senderDetails || baseParcelPayload["2_senderDetails"] || {};
            const receiverDetails = baseParcelPayload.receiverDetails || baseParcelPayload["3_receiverDetails"] || {};

            if (popDeliveryMode) popDeliveryMode.textContent = baseParcelPayload.deliveryArrangementOption || "DoorToDoor";
            if (popSenderName) popSenderName.textContent = senderDetails.fullName || "Sender Name Unavailable";
            if (popReceiverName) popReceiverName.textContent = receiverDetails.fullName || "Receiver Name Unavailable";
            
            if (popItemDesc) popItemDesc.textContent = localPackagePayload.description || "General Goods";
            if (popWeight) popWeight.textContent = `${localPackagePayload.weightKg || 0} kg`;
            
            if (popVolume) {
                if (localPackagePayload.dimensions) {
                    const dim = localPackagePayload.dimensions;
                    popVolume.textContent = `${dim.length || 0}x${dim.width || 0}x${dim.height || 0} cm`;
                } else {
                    popVolume.textContent = "0x0x0 cm";
                }
            }

            if (popSpecialNotes) {
                popSpecialNotes.textContent = (localPackagePayload.specialHandlingNotes && String(localPackagePayload.specialHandlingNotes).trim() !== "") ? localPackagePayload.specialHandlingNotes : "None";
            }

            if (popPayer) popPayer.textContent = checkedPayer.value;
            if (popMethod) popMethod.textContent = (finalMethodChoice === "Cash") ? "Cash / COD" : finalMethodChoice;
            if (popGrandTotal && summaryGrandTotal) popGrandTotal.textContent = `PHP ${summaryGrandTotal.textContent}`;

            openReviewModalPopup();
        });
    }

    if (btnFinalSubmitModal) {
        btnFinalSubmitModal.addEventListener("click", async () => {
            try {
                const checkedPayer = document.querySelector('input[name="payerType"]:checked');
                const checkedMethod = document.querySelector('input[name="paymentMethod"]:checked');
                
                const finalPayerChoice = checkedPayer ? checkedPayer.value : "Sender";
                const finalMethodChoice = checkedMethod ? checkedMethod.value : "Cash";
                let referenceVerificationCodeValue = "N/A (Cash Settlement)";

                if (finalMethodChoice === "GCash" && gcashRefInput) referenceVerificationCodeValue = gcashRefInput.value.trim();
                if (finalMethodChoice === "BankTransfer" && bankRefInput) referenceVerificationCodeValue = bankRefInput.value.trim();

                const uniqueTrackingId = "BAC-" + Math.floor(10000000 + Math.random() * 90000000) + "-PH";
                const currentEpochTime = Date.now();
                const uniqueBookingKey = `booking_${currentEpochTime}`;

                const senderDetails = baseParcelPayload.senderDetails || baseParcelPayload["2_senderDetails"] || {};
                const receiverDetails = baseParcelPayload.receiverDetails || baseParcelPayload["3_receiverDetails"] || {};
                const dimensionsObj = localPackagePayload.dimensions || {};
                
                let cleanNumericPrice = 150;
                if (summaryGrandTotal && summaryGrandTotal.textContent) {
                    cleanNumericPrice = parseFloat(summaryGrandTotal.textContent.replace(/[^0-9.]/g, "")) || 150;
                }

                const firebaseStandardParcelPayload = {
                    "1_trackingId": uniqueTrackingId,
                    "2_senderDetails": {
                        fullName: senderDetails.fullName || "Sender Name N/A",
                        phoneNumber: senderDetails.phoneNumber || "N/A",
                        region: senderDetails.region || "",
                        province: senderDetails.province || "",
                        city: senderDetails.city || "",
                        barangay: senderDetails.barangay || "",
                        streetAddress: senderDetails.streetAddress || "",
                        fullAddress: senderDetails.fullAddress || "Main Parcel Terminal",
                        saveSenderToAddressBook: senderDetails.saveSenderToAddressBook || false
                    },
                    "3_receiverDetails": {
                        fullName: receiverDetails.fullName || "Authorized Receiver",
                        phoneNumber: receiverDetails.phoneNumber || "N/A",
                        region: receiverDetails.region || "",
                        province: receiverDetails.province || "",
                        city: receiverDetails.city || "",
                        barangay: receiverDetails.barangay || "",
                        streetAddress: receiverDetails.streetAddress || "",
                        fullAddress: receiverDetails.fullAddress || "N/A",
                        assignedOutletHub: receiverDetails.assignedOutletHub || "",
                        isOutletDropoff: receiverDetails.isOutletDropoff || false,
                        saveReceiverToAddressBook: receiverDetails.saveReceiverToAddressBook || false
                    },
                    "4_parcelDetails": {
                        description: localPackagePayload.description || "General Goods",
                        category: localPackagePayload.category || "General",
                        dimensions: {
                            length: parseInt(dimensionsObj.length) || 0,
                            width: parseInt(dimensionsObj.width) || 0,
                            height: parseInt(dimensionsObj.height) || 0
                        },
                        weightKg: parseFloat(localPackagePayload.weightKg) || 0,
                        declaredValue: localPackagePayload.declaredValue || "PHP 0.00",
                        specialHandlingNotes: localPackagePayload.specialHandlingNotes || "",
                        dashboardDisplayDestination: receiverDetails.city || "N/A"
                    },
                    "5_paymentDetails": {
                        assignedPayer: finalPayerChoice,
                        modeOfPayment: finalMethodChoice,
                        transactionReferenceCode: referenceVerificationCodeValue,
                        billingLedger: {
                            baseRate: parseFloat(localLedgerPayload.baseRate) || 150,
                            weightSurcharge: parseFloat(localLedgerPayload.weightSurcharge) || 0,
                            insuranceCharge: parseFloat(localLedgerPayload.insuranceCharge) || 0,
                            grandTotal: cleanNumericPrice
                        }
                    },
                    bookingTimestamp: new Date().toISOString(),
                    dateBooked: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                    deliveryArrangementOption: baseParcelPayload.deliveryArrangementOption || "DoorToDoor",
                    estDelivery: "Pending Dispatch",
                    idTimestamp: uniqueBookingKey,
                    serviceWorkflowType: "Standard Parcel",
                    status: "Pending Dispatch"
                };

                const masterShipmentsDatabase = JSON.parse(localStorage.getItem("maupayShipments")) || [];
                masterShipmentsDatabase.push({
                    trackingId: uniqueTrackingId,
                    serviceType: "Standard Parcel",
                    destination: firebaseStandardParcelPayload["3_receiverDetails"].fullAddress,
                    dateBooked: firebaseStandardParcelPayload.dateBooked,
                    idTimestamp: firebaseStandardParcelPayload.idTimestamp,
                    estDelivery: "Pending Dispatch",
                    totalAmount: cleanNumericPrice.toString(),
                    status: "Pending Dispatch"
                });
                localStorage.setItem("maupayShipments", JSON.stringify(masterShipmentsDatabase));

                let targetDocUID = auth.currentUser?.uid || "oZ55xPFsSYWyVTD5R8G1kYmx43";

                const completePageWorkflowTransition = () => {
                    localStorage.removeItem("tempDetails");
                    localStorage.removeItem("tempPackage");
                    sessionStorage.removeItem("activeBookingServiceType");

                    closeReviewModalPopup();
                    if (successTrackingId) successTrackingId.textContent = uniqueTrackingId;
                    if (successModalOverlay) successModalOverlay.classList.add("display-modal-active");
                };

                console.log("Updating fields inside Customer document ID:", targetDocUID);
                const customerDocRef = doc(db, "Customer", targetDocUID);
                
                // 🔥 THE STACK FIX: Targets a deeper nested timestamp map path explicitly!
                await updateDoc(customerDocRef, {
                    [`services.standardParcel.${uniqueBookingKey}`]: firebaseStandardParcelPayload
                });
                
                console.log("💾 Step 3 Data saved into stacked database successfully.");
                completePageWorkflowTransition();

            } catch (runtimeError) {
                console.error("❌ Exception captured during database transmission:", runtimeError);
                closeReviewModalPopup();
                const trackingIdFallback = "BAC-" + Math.floor(10000000 + Math.random() * 90000000) + "-PH";
                if (successTrackingId) successTrackingId.textContent = trackingIdFallback;
                if (successModalOverlay) successModalOverlay.classList.add("display-modal-active");
            }
        });
    }

    if (btnSuccessDashboard) {
        btnSuccessDashboard.addEventListener("click", () => {
            if (successModalOverlay) successModalOverlay.classList.remove("display-modal-active");
            window.location.href = "dashboard.html";
        });
    }

    if (btnBackToPackage) {
        btnBackToPackage.addEventListener("click", () => { window.location.href = "book-standard-parcel-package.html"; });
    }
});