// ==========================================================================
// 📦 MAUPAY WARAYNON PADALA CENTER - LIPATBAHAY ROUTING INFRASTRUCTURE
// ==========================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

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

// INITIALIZE CORE ENGINES
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); 
const auth = getAuth(app);

document.addEventListener("DOMContentLoaded", () => {
    const infoForm = document.getElementById("lipatBahayInfoForm");
    const btnBack = document.getElementById("btnBackToDetails");
    const displayTotalQuote = document.getElementById("displayTotalQuote");

    // Form Field References
    const typeOfMove = document.getElementById("typeOfMove");
    const moveDate = document.getElementById("moveDate");
    const estimatedItems = document.getElementById("estimatedItems");
    const valuableItems = document.getElementById("valuableItems");
    const specialInstructions = document.getElementById("specialInstructions");

    // Dynamic Selectors for Pricing Mechanics
    const vehicleRadios = document.querySelectorAll('input[name="vehicleType"]');
    const addonCheckboxes = document.querySelectorAll('.addon-calc-trigger');
    const profileAvatar = document.getElementById("profileAvatar");

    // Prevent past date selectors
    const todayISO = new Date().toISOString().split('T')[0];
    if (moveDate) {
        moveDate.setAttribute('min', todayISO);
    }

    // =========================================================
    // 👤 SYNC USER AVATAR WITH LIVE FIREBASE SNAPSHOT STREAM
    // =========================================================
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const userDocRef = doc(db, "Customer", user.uid);
            onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists() && profileAvatar) {
                    const userData = docSnap.data();
                    const firstName = userData.firstName || userData.fullName || "";
                    if (firstName) {
                        profileAvatar.textContent = firstName.charAt(0).toUpperCase();
                    }
                }
            }, (err) => {
                console.error("Live listener connection failed for avatar meta:", err);
            });
        }
    });

    // =========================================================
    // 🛡️ INPUT VALIDATION & CHARACTER RESTRICTIONS
    // =========================================================
    if (estimatedItems) {
        estimatedItems.addEventListener("input", (e) => {
            // Drop EVERYTHING except pure numbers (removes text, spaces, hyphens completely)
            e.target.value = e.target.value.replace(/\D/g, "");
            clearInlineError(estimatedItems);
        });
    }

    if (valuableItems) {
        valuableItems.addEventListener("input", (e) => {
            // Drop numbers and special symbols (Only permits letters, spaces, and hyphens)
            e.target.value = e.target.value.replace(/[^a-zA-Z\s\-]/g, "");
            clearInlineError(valuableItems);
        });
    }

    if (moveDate) {
        moveDate.addEventListener("change", () => clearInlineError(moveDate));
    }

    function showInlineError(inputElement, errorMessage) {
        clearInlineError(inputElement);
        inputElement.style.borderColor = "#ef4444";
        
        const errorContainer = document.createElement("div");
        errorContainer.className = "form-inline-error-msg";
        errorContainer.style.color = "#ef4444";
        errorContainer.style.fontSize = "0.78rem";
        errorContainer.style.marginTop = "4px";
        errorContainer.style.fontWeight = "600";
        errorContainer.innerText = errorMessage;
        
        inputElement.parentNode.appendChild(errorContainer);
    }

    function clearInlineError(inputElement) {
        if (!inputElement) return;
        inputElement.style.borderColor = "";
        const remainingError = inputElement.parentNode.querySelector(".form-inline-error-msg");
        if (remainingError) remainingError.remove();
    }

    // =========================================================
    // 1. INTERACTIVE REAL-TIME COMPUTATION ENGINE
    // =========================================================
    function calculateLiveQuote() {
        let baseVehiclePrice = 0;
        let flatAddonCharges = 0;
        let scalePercentageMultiplier = 0;

        vehicleRadios.forEach(radio => {
            const cardLabel = radio.closest('.vehicle-card-label');
            if (radio.checked) {
                baseVehiclePrice = parseFloat(radio.getAttribute('data-price')) || 0;
                if (cardLabel) cardLabel.classList.add('active-vehicle');
            } else {
                if (cardLabel) cardLabel.classList.remove('active-vehicle');
            }
        });

        addonCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                if (checkbox.hasAttribute('data-flat-price')) {
                    flatAddonCharges += parseFloat(checkbox.getAttribute('data-flat-price')) || 0;
                }
                if (checkbox.hasAttribute('data-percentage')) {
                    scalePercentageMultiplier += parseFloat(checkbox.getAttribute('data-percentage')) || 0;
                }
            }
        });

        let subtotalCost = baseVehiclePrice + flatAddonCharges;
        let finalComputedTotal = subtotalCost + (subtotalCost * scalePercentageMultiplier);

        if (displayTotalQuote) {
            displayTotalQuote.innerText = `PHP ${finalComputedTotal.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
        }
    }

    vehicleRadios.forEach(radio => radio.addEventListener('change', calculateLiveQuote));
    addonCheckboxes.forEach(box => box.addEventListener('change', calculateLiveQuote));

    calculateLiveQuote();

    // =========================================================
    // 2. BACK AND NEXT REDIRECT ACTIONS (CONSOLIDATED SUBMIT)
    // =========================================================
    if (btnBack) {
        btnBack.addEventListener("click", () => {
            window.location.href = "book-lipatbahay.html";
        });
    }

    if (infoForm) {
        infoForm.addEventListener("submit", (e) => {
            e.preventDefault();

            let clientSideValidationHasErrors = false;

            if (moveDate && !moveDate.value) {
                showInlineError(moveDate, "Please choose a deployment booking timeline option.");
                clientSideValidationHasErrors = true;
            }
            if (estimatedItems && !estimatedItems.value.trim()) {
                showInlineError(estimatedItems, "Please specify an estimated item density headcount.");
                clientSideValidationHasErrors = true;
            }

            if (clientSideValidationHasErrors) {
                const targetFirstError = document.querySelector(".form-inline-error-msg");
                if (targetFirstError) targetFirstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }

            // Gather vehicle metadata based on your specific label hierarchy
            let chosenVehicle = "Unknown";
            let baseVehiclePrice = 0;
            vehicleRadios.forEach(r => { 
                if (r.checked) {
                    baseVehiclePrice = parseFloat(r.getAttribute('data-price')) || 0;
                    const containerLabel = r.closest('.vehicle-card-label');
                    if (containerLabel) {
                        const titleEl = containerLabel.querySelector('.vehicle-name-title');
                        chosenVehicle = titleEl ? titleEl.innerText.trim() : r.value;
                    } else {
                        chosenVehicle = r.value;
                    }
                } 
            });

            // Extract active addon textual descriptions
            let activeAddonsList = [];
            addonCheckboxes.forEach(box => {
                if (box.checked) {
                    const tickItem = box.closest('.addon-tick-item');
                    if (tickItem) {
                        const labelText = tickItem.querySelector('.addon-label-text');
                        if (labelText) activeAddonsList.push(labelText.innerText.trim());
                    }
                }
            });

            const currentQuoteText = displayTotalQuote ? displayTotalQuote.innerText : "PHP 0.00";
            const currentQuoteNumeric = parseFloat(currentQuoteText.replace(/[^0-9.]/g, '')) || 0;

            const primaryAddressPayloadRaw = localStorage.getItem('activeBookingFormStep2');
            const primaryAddressPayload = primaryAddressPayloadRaw ? JSON.parse(primaryAddressPayloadRaw) : {};
            
            const consolidatedOrderManifest = {
                ...primaryAddressPayload,
                moveSpecifications: {
                    typeOfMove: typeOfMove ? typeOfMove.value : "",
                    scheduledDate: moveDate ? moveDate.value : "",
                    loadQuantityEstimate: estimatedItems ? estimatedItems.value : "",
                    valuableHighTierItems: (valuableItems && valuableItems.value.trim()) ? valuableItems.value.trim() : "None stated",
                    specialInstructionsText: (specialInstructions && specialInstructions.value.trim()) ? specialInstructions.value.trim() : "None stated"
                },
                logisticsArrangements: {
                    vehicleClassSelected: chosenVehicle,
                    selectedAddonServices: activeAddonsList,
                    computedQuoteSummaryValue: currentQuoteText
                },
                moveDetails: {
                    typeOfMove: typeOfMove ? typeOfMove.value : "",
                    preferredDate: moveDate ? moveDate.value : "",
                    estimatedItemsCount: estimatedItems ? estimatedItems.value : "",
                    specialValuableItems: (valuableItems && valuableItems.value.trim()) ? valuableItems.value.trim() : "None stated",
                    specialHandlingInstructions: (specialInstructions && specialInstructions.value.trim()) ? specialInstructions.value.trim() : "None stated"
                },
                vehicleSelection: {
                    code: chosenVehicle.toLowerCase().replace(/\s+/g, '-'),
                    displayName: chosenVehicle,
                    basePrice: baseVehiclePrice
                },
                selectedAddons: activeAddonsList,
                estimatedTotalQuote: currentQuoteNumeric
            };

            localStorage.setItem('activeBookingFormStep2', JSON.stringify(consolidatedOrderManifest));
            localStorage.setItem('consolidatedBookingManifest', JSON.stringify(consolidatedOrderManifest));
            
            window.location.href = "book-lipatbahay-payment.html";
        });
    }
});