// 1. Modern Modular Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
// Changed from firebase-database to firebase-firestore
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js"; 

// 2. Web App's Firebase Configuration
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

// Initialize Firebase Services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Initializing Firestore instead of Realtime DB



document.addEventListener("DOMContentLoaded", () => {
    const packageForm = document.getElementById("packageDetailsForm");
    const btnBackToDetails = document.getElementById("btnBackToDetails");
    const btnNextStep = document.getElementById("btnNextStep");
    
    // Disable native browser validation tooltips so our custom errors display immediately
    if (packageForm) {
        packageForm.setAttribute("novalidate", "true");
    }

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
    // DYNAMIC EMPTY FIELD VALIDATION ENGINE (Uniform Design)
    // ==========================================================================
    function toggleFieldError(inputElement, show, message = "This field cannot be left blank.") {
        if (!inputElement) return;
        
        let errorNote = inputElement.parentNode.querySelector(".blank-error-note");
        
        if (show) {
            inputElement.style.borderColor = "#dc3545";
            if (!errorNote) {
                errorNote = document.createElement("div");
                errorNote.className = "blank-error-note";
                errorNote.style.color = "#dc3545";
                errorNote.style.fontSize = "12px";
                errorNote.style.marginTop = "4px";
                inputElement.parentNode.appendChild(errorNote);
            }
            errorNote.innerText = `⚠️ ${message}`;
            errorNote.style.display = "block";
        } else {
            inputElement.style.borderColor = "";
            if (errorNote) {
                errorNote.style.display = "none";
            }
        }
    }

    // ==========================================================================
    // REAL-TIME INPUT SANITIZATION CONTROLS
    // ==========================================================================
    
    // 1. Strict Letters-Only Rule for Item Description (Blocks numbers & special characters)
    if (itemDescription) {
        itemDescription.addEventListener("input", (e) => {
            e.target.value = e.target.value.replace(/[^a-zA-Z\s]/g, "");
            if (e.target.value.trim() !== "") {
                toggleFieldError(itemDescription, false);
            }
        });
    }

    if (itemCategory) {
        itemCategory.addEventListener("change", () => {
            if (itemCategory.value.trim() !== "") {
                toggleFieldError(itemCategory, false);
            }
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
            if (e.target.value.trim() !== "" && parseFloat(e.target.value) > 0) {
                toggleFieldError(inputElement, false);
            }
        });
    }

    sanitizeLeadingZeros(pkgLength);
    sanitizeLeadingZeros(pkgWidth);
    sanitizeLeadingZeros(pkgHeight);
    sanitizeLeadingZeros(pkgWeight);
    sanitizeLeadingZeros(declaredValue);

    // DYNAMIC MODULAR FIREBASE REAL-TIME ACCOUNT AVATAR SYNC
    // ==========================================================================
    const profileAvatar = document.getElementById("profileAvatar");
    const avatarTooltip = document.getElementById("avatarTooltip");

        // 🌟 Capture tracking context securely from event lifecycle streams
    let currentAuthenticatedUID = "oZ55xPFsSYWyVTD5R8G1kYmx43";

    // STEP 1: Fast Immediate Offline Fallback (while connection loads)
    const savedAccountRaw = localStorage.getItem('dummyTestingAccount');
    if (savedAccountRaw && profileAvatar) {
        try {
            const userAccount = JSON.parse(savedAccountRaw);
            if (userAccount && userAccount.firstName) {
                profileAvatar.innerText = userAccount.firstName.charAt(0).toUpperCase();
            }
        } catch (e) { console.error("Error setting avatar initial:", e); }
    }

    // STEP 2: Modern Cloud Firestore Sync Lookups with Native Hover Title
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
        let firstInvalidElement = null;

        function checkField(element, customMsg = "This field cannot be left blank.") {
            if (!element) return true;
            
            const isZeroOrLess = (element.tagName !== "SELECT" && (!element.value.trim() || parseFloat(element.value) <= 0));
            const isEmptySelect = (element.tagName === "SELECT" && !element.value.trim());

            if (isZeroOrLess || isEmptySelect) {
                toggleFieldError(element, true, customMsg);
                if (!firstInvalidElement) firstInvalidElement = element;
                return false;
            } else {
                toggleFieldError(element, false);
                return true;
            }
        }

        // Validate all required configurations sequentially
        if (!checkField(itemDescription)) formIsValid = false;
        if (!checkField(itemCategory, "Please select an item category.")) formIsValid = false;
        if (!checkField(pkgLength, "Length must be greater than 0 cm.")) formIsValid = false;
        if (!checkField(pkgWidth, "Width must be greater than 0 cm.")) formIsValid = false;
        if (!checkField(pkgHeight, "Height must be greater than 0 cm.")) formIsValid = false;
        if (!checkField(pkgWeight, "Weight must be greater than 0 kg.")) formIsValid = false;
        if (!checkField(declaredValue, "Declared value must be greater than 0.")) formIsValid = false;

        if (!formIsValid) {
            if (firstInvalidElement) firstInvalidElement.focus();
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