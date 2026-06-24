// Import the necessary Firebase SDK functions matching your dashboard environment
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, doc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

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
    const cargoPackageForm = document.getElementById("cargoPackageForm");
    const btnBackToDetails = document.getElementById("btnBackToDetails");

    // Pricing Element Selectors
    const txtLength = document.getElementById("cargoLength");
    const txtWidth = document.getElementById("cargoWidth");
    const txtHeight = document.getElementById("cargoHeight");
    const txtWeight = document.getElementById("cargoWeight");
    const txtValue = document.getElementById("declaredValue");
    const txtPieces = document.getElementById("numPieces");
    const txtDesc = document.getElementById("cargoDescription");

    // Drag and Drop Selectors
    const dropZone = document.getElementById("dropZone");
    const fileInput = document.getElementById("docRequirements");
    const fileListContainer = document.getElementById("fileList");
    let uploadedFilesBase64 = []; // Stores compiled files for manifest persistence

    const lblBaseRate = document.getElementById("lblBaseRate");
    const lblWeightSurcharge = document.getElementById("lblWeightSurcharge");
    const lblCargoInsurance = document.getElementById("lblCargoInsurance");
    const lblMasterTotal = document.getElementById("lblMasterTotal");
    const profileAvatar = document.getElementById("profileAvatar");
    const avatarTooltip = document.getElementById("avatarTooltip");


    //Capture tracking context securely
    let currentAuthenticatedUID = "oZ55xPFsSYWyVTD5R8G1kYmx43";

    // Initialize Profile Initials Badge
    const savedAccountRaw = localStorage.getItem('dummyTestingAccount');
    if (savedAccountRaw && profileAvatar) {
        const userAccount = JSON.parse(savedAccountRaw);
        if (userAccount.firstName) {
            profileAvatar.innerText = userAccount.firstName.charAt(0).toUpperCase();
        }
    }

        // =========================================================
        // Section 1 LIVE FIRESTORE CUSTOMER SYNC ENGINE
        // =========================================================
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

    // Navigation Back Button Route
    if (btnBackToDetails) {
        btnBackToDetails.addEventListener("click", () => {
            window.location.href = "book-cargo-details.html";
        });
    }

    // INLINE FORM EXTRA VALIDATION & SMART ZERO CLEARING
    function showInlineError(element, message) {
        removeInlineError(element);
        const err = document.createElement("span");
        err.className = "error-note";
        err.textContent = message;
        element.parentElement.appendChild(err);
        element.style.borderColor = "#dc2626";
    }

    function removeInlineError(element) {
        const existing = element.parentElement.querySelector(".error-note");
        if (existing) existing.remove();
        element.style.borderColor = "";
    }

    // Cargo Description validation restriction (Letters and spaces only)
    if (txtDesc) {
        txtDesc.addEventListener("input", (e) => {
            const sanitizedValue = e.target.value.replace(/[^a-zA-Z\s]/g, "");
            if (e.target.value !== sanitizedValue) {
                e.target.value = sanitizedValue;
            }
            if (sanitizedValue.trim().length > 0) {
                removeInlineError(txtDesc);
            }
        });
    }

    // DRAG & DROP INTEGRATION MECHANICS
    if (dropZone && fileInput) {
        // Click to trigger hidden input pick window
        dropZone.addEventListener("click", () => fileInput.click());

        // Dragover state styles
        dropZone.addEventListener("dragover", (e) => {
            e.preventDefault();
            dropZone.style.backgroundColor = "#f0fdf4";
            dropZone.style.borderColor = "#16a34a";
        });

        ["dragleave", "dragend"].forEach(type => {
            dropZone.addEventListener(type, () => {
                dropZone.style.backgroundColor = "";
                dropZone.style.borderColor = "";
            });
        });

        // Drop file drop capture handler
        dropZone.addEventListener("drop", (e) => {
            e.preventDefault();
            dropZone.style.backgroundColor = "";
            dropZone.style.borderColor = "";
            
            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                handleFilesProcessing(e.dataTransfer.files);
            }
        });

        // Standard file input selection change engine
        fileInput.addEventListener("change", () => {
            if (fileInput.files.length) {
                handleFilesProcessing(fileInput.files);
            }
        });
    }

    // Process files visually and compile text conversions for local storage storage operations
    function handleFilesProcessing(files) {
        fileListContainer.innerHTML = ""; 
        uploadedFilesBase64 = [];
        removeInlineError(dropZone);

        Array.from(files).forEach(file => {
            // Visual element confirmation card row
            const fileItem = document.createElement("div");
            fileItem.style.padding = "4px 8px";
            fileItem.style.fontSize = "13px";
            fileItem.style.color = "#4b5563";
            fileItem.textContent = `📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
            fileListContainer.appendChild(fileItem);

            // Convert to Base64 data strings for manifest transmission
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                uploadedFilesBase64.push({
                    name: file.name,
                    type: file.type,
                    base64Data: reader.result
                });
            };
        });
    }

    // Standardized numeric input tracking (Dimensions, Weight, Value, and Pieces)
    const numericInputs = [txtLength, txtWidth, txtHeight, txtWeight, txtValue, txtPieces];
    numericInputs.forEach(input => {
        if (!input) return;

        input.addEventListener("focus", () => {
            if (parseFloat(input.value) === 0) {
                input.value = "";
            }
        });

        input.addEventListener("blur", () => {
            if (input.value.trim() === "" || parseFloat(input.value) < 0) {
                input.value = 0;
            }
            calculateLiveRates();
        });

        input.addEventListener("input", () => {
            if (parseFloat(input.value) < 0) {
                input.value = 0;
            }
            if (parseFloat(input.value) > 0) {
                removeInlineError(input);
            }
            calculateLiveRates();
        });
    });

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

    sanitizeLeadingZeros(txtLength);
    sanitizeLeadingZeros(txtWidth);
    sanitizeLeadingZeros(txtHeight);
    sanitizeLeadingZeros(txtWeight);
    sanitizeLeadingZeros(txtValue);
    sanitizeLeadingZeros(txtPieces);

    // LIVE ESTIMATED FARE REACTION ENGINE
    function calculateLiveRates() {
        const length = parseFloat(txtLength.value) || 0;
        const width = parseFloat(txtWidth.value) || 0;
        const height = parseFloat(txtHeight.value) || 0;
        const weight = parseFloat(txtWeight.value) || 0;
        const declaredVal = parseFloat(txtValue.value) || 0;
        const pieces = parseInt(txtPieces.value) || 0;

        const baseRateValue = 150.00;
        let weightSurchargeValue = 0;
        if (weight > 5) {
            weightSurchargeValue = (weight - 5) * 20;
        }

        const volumetricWeight = (length * width * height) / 3500;
        if (volumetricWeight > weight) {
            weightSurchargeValue += (volumetricWeight - weight) * 15;
        }

        const insuranceValue = declaredVal * 0.10;

        const computedBase = baseRateValue * pieces;
        const computedSurcharge = weightSurchargeValue * pieces;
        const computedInsurance = insuranceValue;

        const masterTotalCalculated = computedBase + computedSurcharge + computedInsurance;

        lblBaseRate.textContent = `PHP ${computedBase.toFixed(2)}`;
        lblWeightSurcharge.textContent = `PHP ${computedSurcharge.toFixed(2)}`;
        lblCargoInsurance.textContent = `PHP ${computedInsurance.toFixed(2)}`;
        lblMasterTotal.textContent = `PHP ${masterTotalCalculated.toFixed(2)}`;
    }

    calculateLiveRates();

    // FORM TRANSIT PROCESSOR
    if (cargoPackageForm) {
        cargoPackageForm.addEventListener("submit", (e) => {
            e.preventDefault();

            let holdsErrors = false;

            if (parseFloat(txtLength.value) <= 0 || txtLength.value === "") { showInlineError(txtLength, "⚠️ Length must be greater than 0."); holdsErrors = true; } else { removeInlineError(txtLength); }
            if (parseFloat(txtWidth.value) <= 0 || txtWidth.value === "") { showInlineError(txtWidth, "⚠️ Width must be greater than 0."); holdsErrors = true; } else { removeInlineError(txtWidth); }
            if (parseFloat(txtHeight.value) <= 0 || txtHeight.value === "") { showInlineError(txtHeight, "⚠️ Height must be greater than 0."); holdsErrors = true; } else { removeInlineError(txtHeight); }
            if (parseFloat(txtWeight.value) <= 0 || txtWeight.value === "") { showInlineError(txtWeight, "⚠️ Weight must be greater than 0."); holdsErrors = true; } else { removeInlineError(txtWeight); }
            
            if (parseFloat(txtValue.value) <= 0 || txtValue.value === "") { 
                showInlineError(txtValue, "⚠️ Declared value must be greater than 0."); 
                holdsErrors = true; 
            } else { 
                removeInlineError(txtValue); 
            }

            if (parseInt(txtPieces.value) <= 0 || txtPieces.value === "") { 
                showInlineError(txtPieces, "⚠️ Total pieces value must be 1 or higher."); 
                holdsErrors = true; 
            } else { 
                removeInlineError(txtPieces); 
            }

            if (!txtDesc.value.trim()) {
                showInlineError(txtDesc, "⚠️  This field cannot be left blank ");
                holdsErrors = true;
            } else {
                removeInlineError(txtDesc);
            }

            // Document Requirements Drop Box Validation Sentry
            if (uploadedFilesBase64.length === 0) {
                showInlineError(dropZone, "⚠️ You must upload at least one mandatory documentation requirement file.");
                holdsErrors = true;
            } else {
                removeInlineError(dropZone);
            }

            if (holdsErrors) {
                const firstFault = document.querySelector(".error-note");
                if (firstFault) firstFault.parentElement.querySelector("input, textarea").focus();
                return;
            }

            const pricingBreakdownPayload = {
                baseRate: lblBaseRate.textContent,
                weightSurcharge: lblWeightSurcharge.textContent,
                insurance: lblCargoInsurance.textContent,
                estimatedTotal: lblMasterTotal.textContent
            };

            const cargoSpecificationsDataset = {
                description: txtDesc.value.trim(),
                type: document.getElementById("cargoType").value,
                dimensions: {
                    length: txtLength.value,
                    width: txtWidth.value,
                    height: txtHeight.value
                },
                weight: txtWeight.value,
                declaredValue: txtValue.value,
                pieces: txtPieces.value,
                documentationFiles: uploadedFilesBase64, // Saved converted file payload directly
                handlingInstructions: document.getElementById("handlingInstructions").value.trim(),
                pricing: pricingBreakdownPayload
            };

            let consolidatedManifest = JSON.parse(localStorage.getItem('consolidatedBookingManifest') || "{}");
            consolidatedManifest.cargoStep2Specifications = cargoSpecificationsDataset;
            localStorage.setItem('consolidatedBookingManifest', JSON.stringify(consolidatedManifest));

            window.location.href = "book-cargo-payment.html";
        });
    }
});