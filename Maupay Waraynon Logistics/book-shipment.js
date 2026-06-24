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
    const serviceCards = document.querySelectorAll(".service-option-card");
    const btnContinue = document.getElementById("btnContinueBooking");
    const profileAvatar = document.getElementById("profileAvatar");
    const avatarTooltip = document.getElementById("avatarTooltip");

    let currentAuthenticatedUID = "oZ55xPFsSYWyVTD5R8G1kYmx43";
    
    // Default fallback selection state parameter matching your baseline setup
    let selectedService = "standard"; 

    // PROFILE SESSION DISPLAY LOADER
    const savedAccountRaw = localStorage.getItem('dummyTestingAccount');
    if (savedAccountRaw) {
        const userAccount = JSON.parse(savedAccountRaw);
        const fullFirstName = userAccount.firstName || "User";
        if (fullFirstName.length > 0) {
            profileAvatar.innerText = fullFirstName.charAt(0).toUpperCase();
        }
    }

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

    // INTERACTIVE SELECTION EVENT HANDLING
    serviceCards.forEach(card => {
        card.addEventListener("click", () => {
            //Clear existing active frame selection indicators from all cards
            serviceCards.forEach(c => c.classList.remove("selected"));

            //Attach visual selected class highlights to the clicked card block
            card.classList.add("selected");

            //Keep track of selected parameter type token references
            selectedService = card.getAttribute("data-service-id");
            console.log(`Logistics Workflow: Category selected set to -> ${selectedService}`);
        });
    });

    // STEP TRANSITION CONTINUATION TRIGGER
    if (btnContinue) {
        btnContinue.addEventListener("click", () => {
            
            // Map the selected service ID token to clean readable names for the ledger
            let serviceLabel = "Standard Parcel";
            if (selectedService === "commercial-cargo") serviceLabel = "Heavy Cargo";
            if (selectedService === "lipat-bahay") serviceLabel = "Lipat-Bahay";

            // Save the selection token temporarily so the final details form can access it
            sessionStorage.setItem("activeBookingServiceType", serviceLabel);

            // Execute clean redirection routing
            if (selectedService === "cardStandardParcel" || selectedService === "standard") {
                window.location.href = "book-standard-parcel-details.html";
            } 
            //commercial cargo selection attribute
            else if (selectedService === "commercial-cargo" || selectedService === "cargo") {
                window.location.href = "book-cargo-details.html";
            } 
            //lipat-bahay workflow selection attribute
            else if (selectedService === "lipat-bahay") {
                window.location.href = "book-lipatbahay.html";
            } 
            else {
                alert(`Selected ${selectedService}. 404 target module under active development.`);
            }
        });
    }
});