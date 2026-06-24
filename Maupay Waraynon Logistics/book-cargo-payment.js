// Import the necessary Firebase SDK functions matching your dashboard environment
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// =========================================================
// FIREBASE CONFIGURATION & INITIALIZATION
// =========================================================
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

// Initialize Core Engines
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
    const btnBackToPackage = document.getElementById("btnBackToPackage");
    const btnConfirmBooking = document.getElementById("btnConfirmBooking");
    const summaryPayer = document.getElementById("summaryPayer");
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

    // Target the input container elements directly by their unique HTML container IDs
    const gcashInputWrapper = document.getElementById("gcashInputWrapperGroup");
    const bankInputWrapper = document.getElementById("bankInputWrapperGroup");

    // Summary calculation UI values pointers
    const summaryBaseRate = document.getElementById("summaryBaseRate");
    const summarySurcharge = document.getElementById("summarySurcharge");
    const summaryInsurance = document.getElementById("summaryInsurance");
    const summaryGrandTotal = document.getElementById("summaryGrandTotal");

    const profileAvatar = document.getElementById("profileAvatar");
    const avatarTooltip = document.getElementById("avatarTooltip");
    
    

    // Global handles to bridge the async loaded database reference with your submit handler
    let activeDatabaseInstance = db;
    let currentlyLoggedInUser = null;
    let currentAuthenticatedUID = "oZ55xPFsSYWyVTD5R8G1kYmx43";

    // ==========================================
    // FIREBASE DATABASE PROFILE AVATAR SYNC
    // ==========================================
onAuthStateChanged(auth, (user) => {
        if (user) {
            // FIXED: Populate your validation anchors so they aren't null during submission
            currentlyLoggedInUser = user;
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
            currentlyLoggedInUser = null;
        }
    });

    // RECOVER CONSOLIDATED DATA MANIFEST
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

    // WHO WILL PAY
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

    // REAL-TIME INPUT RESTRICTIONS AND ENFORCEMENT
    if (gcashRefInput) {
        gcashRefInput.addEventListener("input", (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, "");
            if (e.target.value.length > 13) {
                e.target.value = e.target.value.slice(0, 13);
            }
        });
    }

    if (bankRefInput) {
        bankRefInput.addEventListener("input", (e) => {
            e.target.value = e.target.value.replace(/[^A-Za-z0-9]/g, "");
            if (e.target.value.length > 16) {
                e.target.value = e.target.value.slice(0, 16);
            }
        });
    }

    // PAYMENT METHOD SELECTION & DIRECT INPUT TOGGLE
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

            // Direct display toggle for GCash container block
            if (gcashInputWrapper) {
                if (radio.value === "GCash") {
                    gcashInputWrapper.style.display = "block";
                    if (gcashRefInput) gcashRefInput.focus();
                } else {
                    gcashInputWrapper.style.display = "none";
                    if (gcashRefInput) gcashRefInput.value = ""; 
                }
            }

            // Direct display toggle for Bank Transfer container block
            if (bankInputWrapper) {
                if (radio.value === "Bank Transfer") {
                    bankInputWrapper.style.display = "block";
                    if (bankRefInput) bankRefInput.focus();
                } else {
                    bankInputWrapper.style.display = "none";
                    if (bankRefInput) bankRefInput.value = ""; 
                }
            }
        });
    });

    // Run once at load to safely hide reference input elements by default
    if (gcashInputWrapper) gcashInputWrapper.style.display = "none";
    if (bankInputWrapper) bankInputWrapper.style.display = "none";

    // REVIEW POPUP INTERACTION INTERFACE HANDLERS
    function openReviewModalPopup() {
        if (bookingReviewModal) bookingReviewModal.classList.add("is-visible");
    }

    function closeReviewModalPopup() {
        if (bookingReviewModal) bookingReviewModal.classList.remove("is-visible");
    }

    [btnCloseModalX, btnCancelModal].forEach(btn => {
        if (btn) btn.addEventListener("click", closeReviewModalPopup);
    });

    // CONFIRM AND POPULATE SUMMARY REVIEW MODAL
    if (btnConfirmBooking) {
        btnConfirmBooking.addEventListener("click", () => {
            const selectedMethodRadio = document.querySelector('input[name="paymentMethod"]:checked');
            const finalMethodChoice = selectedMethodRadio ? selectedMethodRadio.value : "Cash / COD";
            
            // Dynamic Verification Check Rules
            if (finalMethodChoice === "GCash") {
                const gcashVal = gcashRefInput ? gcashRefInput.value.trim() : "";
                if (!/^\d{13}$/.test(gcashVal)) {
                    alert("⚠️ Invalid Reference Code. Please enter the exact 13-digit GCash transaction reference number containing numbers only.");
                    if (gcashRefInput) gcashRefInput.focus();
                    return;
                }
            } else if (finalMethodChoice === "Bank Transfer") {
                const bankVal = bankRefInput ? bankRefInput.value.trim() : "";
                if (!/^[A-Za-z0-9]{6,16}$/.test(bankVal)) {
                    alert("⚠️ Invalid Bank Reference. Please provide your bank transaction verification reference code (6 to 16 characters, alphanumeric symbols only).");
                    if (bankRefInput) bankRefInput.focus();
                    return;
                }
            }

            // DATA ADAPTER PARSING
            const s1 = currentBookingDataManifest.cargoStep1Details || {};
            const companyNode = s1.company || {};
            
            if (popDeliveryMode) popDeliveryMode.textContent = currentBookingDataManifest.serviceType || "Commercial Cargo";
            if (popSenderName) popSenderName.textContent = companyNode.name || "Company Origin Shipper";
            if (popReceiverName) popReceiverName.textContent = companyNode.contactPerson || "Authorized Receiver";
            
            // PACKAGE DATA ADAPTER PARSING
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

            openReviewModalPopup();
        });
    }

// FINAL SUBMISSION TO RE-COMMIT AND SAVE TO HISTORIC LEDGER
    if (btnFinalSubmitModal) {
        btnFinalSubmitModal.addEventListener("click", async () => {
            const selectedPayerRadio = document.querySelector('input[name="paymentOption"]:checked');
            const finalPayerChoice = selectedPayerRadio ? selectedPayerRadio.value : "Sender";

            const selectedMethodRadio = document.querySelector('input[name="paymentMethod"]:checked');
            const finalMethodChoice = selectedMethodRadio ? selectedMethodRadio.value : "Cash / COD";
            
            let referenceVerificationCodeValue = "N/A (Cash Settlement)";
            if (finalMethodChoice === "GCash" && gcashRefInput) referenceVerificationCodeValue = gcashRefInput.value.trim();
            if (finalMethodChoice === "Bank Transfer" && bankRefInput) referenceVerificationCodeValue = bankRefInput.value.trim();

            const uniqueTrackingId = "CRG-" + Math.floor(10000000 + Math.random() * 90000000) + "-PH";

            // INTEGRATED RE-MAPPED DATA PARSING BLOCKS
            const s1 = currentBookingDataManifest.cargoStep1Details || {};
            const companyNode = s1.company || {};
            const pickupNode = s1.pickup || {};
            const deliveryNode = s1.delivery || {};
            const s2 = currentBookingDataManifest.cargoStep2Specifications || {};
            const dimensionsObj = s2.dimensions || {};

            // Synchronized keys directly matching step-1 outputs (.mobile)
            const fetchedSenderPhone = companyNode.mobile || pickupNode.mobile || "N/A";
            const fetchedReceiverPhone = deliveryNode.mobile || "N/A";

            // Constructing formatted geographic fallback strings
            const pureOriginAddress = pickupNode.street ? `${pickupNode.street}, ${pickupNode.barangay}, ${pickupNode.city}, ${pickupNode.province}` : (companyNode.address || "Main Corporate Terminal");
            const pureDestinationAddress = deliveryNode.street ? `${deliveryNode.street}, ${deliveryNode.barangay}, ${deliveryNode.city}, ${deliveryNode.province}` : "Tacloban City, Leyte";

            let cleanNumericPrice = "1500";
            if (summaryGrandTotal && summaryGrandTotal.textContent) {
                cleanNumericPrice = summaryGrandTotal.textContent.replace(/[^0-9.]/g, "");
            }

            // Capture exact current Unix millisecond track for precise FIFO sorting
            const currentTimestampMillis = Date.now();

            // 1. ORGANIZED PREFIXED SCHEMAS FOR FIRESTORE (WITH CHRONO KEYS ADDED)
            const firebaseCargoPayload = {
                "01_trackingId": uniqueTrackingId,
                "idTimestamp": uniqueTrackingId,
                "createdAtMillis": currentTimestampMillis, // <-- FIXED: Forces immediate sorting to absolute top
                "02_companyDetails": {
                    companyName: companyNode.name || "Company Origin Shipper",
                    contactPerson: companyNode.contactPerson || "Authorized Receiver",
                    phone: fetchedSenderPhone
                },
                "03_senderDetails": {
                    name: pickupNode.contactPerson || companyNode.name || "Company Origin Shipper",
                    phone: fetchedSenderPhone,
                    address: pureOriginAddress
                },
                "04_receiverDetails": {
                    name: deliveryNode.contactPerson || "Authorized Receiver",
                    phone: fetchedReceiverPhone, 
                    address: pureDestinationAddress
                },
                "05_packageDetails": {
                    desc: `${s2.pieces || 1} pc(s) - ${s2.description || "General Cargo Goods"}`,
                    category: "Commercial Cargo",
                    dims: `${dimensionsObj.length || 0} × ${dimensionsObj.width || 0} × ${dimensionsObj.height || 0} cm`,
                    weight: `${s2.weight || 0} kg`,
                    value: "Assessed Value",
                    handlingInstructions: s2.handlingInstructions || "None",
                    documents: s2.documentationFiles || []
                },
                "06_orderDetails": {
                    serviceType: currentBookingDataManifest.serviceType || "Heavy Cargo",
                    dateBooked: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                    orderCreatedDateTime: new Date().toISOString(), // <-- FIXED: Backup ISO tracking
                    estDelivery: "Pending Dispatch",
                    status: "Pending Dispatch",
                    payer: finalPayerChoice,
                    method: finalMethodChoice,
                    referenceCode: referenceVerificationCodeValue,
                    amount: cleanNumericPrice
                }
            };

            // 2. BACKWARD LOGICAL COMPATIBILITY: LOCAL LEDGER SYNCING
            const finalDashboardRecord = {
                trackingId: uniqueTrackingId,
                serviceType: currentBookingDataManifest.serviceType || "Heavy Cargo",
                destination: pureDestinationAddress,
                dateBooked: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                timestamp: currentTimestampMillis, // <-- FIXED: Sync local storage array records natively
                estDelivery: "Pending Dispatch",
                totalAmount: cleanNumericPrice,
                status: "Pending Dispatch",
                sender: firebaseCargoPayload["03_senderDetails"],
                receiver: firebaseCargoPayload["04_receiverDetails"],
                package: firebaseCargoPayload["05_packageDetails"],
                payment: { method: finalMethodChoice, amount: cleanNumericPrice }
            };

            // 3. EXECUTE SECURE ASYNC DATABASE SYNC USING CORRESPONDING LOADED ENVIRONMENT
            if (currentlyLoggedInUser && activeDatabaseInstance) {
                try {
                    const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js");
                    
                    // Directly apply payload safely under target dynamic prefix layout node maps
                    await setDoc(doc(activeDatabaseInstance, "Customer", currentlyLoggedInUser.uid), {
                        services: {
                            cargo: {
                                [uniqueTrackingId]: firebaseCargoPayload
                            }
                        }
                    }, { merge: true });
                    console.log("🚀 Data securely appended directly to your live profile cargo maps!");
                } catch (fsErr) {
                    console.error("Firestore sync process encountered a direct error state:", fsErr);
                }
            } else {
                console.warn("⚠️ No active user session discovered to write document states onto cloud clusters.");
            }

            // ================================================================
            // SAFETY WRAPPER: PREVENT LOCALSTORAGE QUOTA CRASHES FROM BLOCKING UI
            // ================================================================
            try {
                const masterShipmentsDatabase = JSON.parse(localStorage.getItem("maupayShipments")) || [];
                masterShipmentsDatabase.push(finalDashboardRecord);
                localStorage.setItem("maupayShipments", JSON.stringify(masterShipmentsDatabase));
            } catch (err) {
                console.error("⚠️ Failed to write to 'maupayShipments' (Storage Quota Exceeded)", err);
            }

            currentBookingDataManifest.assignedPayer = finalPayerChoice;
            currentBookingDataManifest.paymentMethodSelected = finalMethodChoice;
            currentBookingDataManifest.transactionReferenceCode = referenceVerificationCodeValue;
            currentBookingDataManifest.bookingTimestamp = new Date().toISOString();
            currentBookingDataManifest.createdAtMillis = currentTimestampMillis; // <-- FIXED
            currentBookingDataManifest.generatedTrackingId = uniqueTrackingId;
            currentBookingDataManifest.status = "Pending Dispatch";

            try {
                localStorage.setItem('consolidatedBookingManifest', JSON.stringify(currentBookingDataManifest));
            } catch (err) {
                console.error("⚠️ Failed to update 'consolidatedBookingManifest' (Storage Quota Exceeded)", err);
            }
            
            try {
                let globalLedger = JSON.parse(localStorage.getItem('globalShipmentsLedger') || "[]");
                globalLedger.push(currentBookingDataManifest);
                localStorage.setItem('globalShipmentsLedger', JSON.stringify(globalLedger));
            } catch (err) {
                console.error("⚠️ Failed to write to 'globalShipmentsLedger' (Storage Quota Exceeded)", err);
            }

            // ================================================================
            // MODAL DISPLAY TRANSITION (Now guaranteed to execute)
            // ================================================================
            closeReviewModalPopup();
            
            if (successTrackingId) successTrackingId.textContent = uniqueTrackingId;
            if (successModalOverlay) successModalOverlay.classList.add("display-modal-active");
        });
    }

    if (btnSuccessDashboard) {
        btnSuccessDashboard.addEventListener("click", () => {
            if (successModalOverlay) successModalOverlay.classList.remove("display-modal-active");
            localStorage.removeItem('consolidatedBookingManifest');
            window.location.href = "dashboard.html";
        });
    }

    if (btnBackToPackage) {
        btnBackToPackage.addEventListener("click", () => {
            window.location.href = "book-cargo-package.html";
        });
    }
});