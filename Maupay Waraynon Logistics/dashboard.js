// ==========================================================================
// 📦 MAUPAY WARAYNON PADALA CENTER - USER DASHBOARD CONTROLLER
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

// GLOBAL DATA ARRAY
let shipments = [];

// DOM ELEMENT REGISTRY HOOKS
const activeShipmentsProgressContainer = document.getElementById("activeShipmentsProgressContainer");
const bookingsTableBody = document.getElementById("bookingsTableBody");
const welcomeSummaryLabel = document.getElementById("welcomeSummaryLabel");
const liveDashboardDate = document.getElementById("liveDashboardDate");
const profileAvatar = document.getElementById("profileAvatar");
const welcomeGreeting = document.getElementById("welcomeGreeting"); 

// NUMERIC METRIC COUNTER NODES
const metricTotalBookings = document.getElementById("metricTotalBookings");
const metricLipatBahay = document.getElementById("metricLipatBahay");
const metricStandardParcel = document.getElementById("metricStandardParcel");
const metricHeavyCargo = document.getElementById("metricHeavyCargo");

// FORM ACTIONS NAVIGATION HOOK
const quickTrackForm = document.getElementById("quickTrackForm");
const quickTrackInput = document.getElementById("quickTrackInput");

// ==========================================================================
// 🚀 ENGINE INITIALIZATION LOGIC
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    initializeDashboardDate();
    setupEventListeners();
    listenToLiveShipments();
});

/**
 * Sets up live calendar timestamps on the primary banner row
 */
function initializeDashboardDate() {
    if (!liveDashboardDate) return;
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const today = new Date();
    liveDashboardDate.textContent = today.toLocaleDateString('en-US', options);
}

/**
 * 🔌 FIRESTORE REAL-TIME REPOSITORY STREAM LISTENER
 */
function listenToLiveShipments() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const userDocRef = doc(db, "Customer", user.uid);

            // onSnapshot actively listens to Firestore updates instantly!
            onSnapshot(userDocRef, (docSnap) => {
                shipments = [];
                
                if (docSnap.exists()) {
                    const userData = docSnap.data();

                    // 1. Sync User Profile Avatar Letter Icon & Name Text Greeting Symmetrically
                    const firstName = userData.firstName || userData.fullName || "";
                    if (firstName) {
                        if (profileAvatar) {
                            profileAvatar.textContent = firstName.charAt(0).toUpperCase();
                        }
                        if (welcomeGreeting) {
                            const hour = new Date().getHours();
                            let greetingTime = "Day";
                            if (hour < 12) greetingTime = "Morning";
                            else if (hour < 18) greetingTime = "Afternoon";
                            else greetingTime = "Evening";

                            welcomeGreeting.textContent = `Good ${greetingTime}, ${firstName}`;
                        }
                    }

                    // 2. Extract Nested Booking Structures from Firestore Fields
                    const services = userData.services || {};

                    // Array of your sub-service categories defined in Firestore
                    const categories = ["standardParcel", "lipatbahay", "cargo"];

                    categories.forEach(categoryName => {
                        const serviceGroup = services[categoryName];
                        if (serviceGroup) {
                            
                            // Check if the group is directly a single legacy booking object map
                            if (serviceGroup["1_trackingId"] || serviceGroup.trackingId || serviceGroup["01_trackingId"]) {
                                const trackingId = serviceGroup["01_trackingId"] || serviceGroup["1_trackingId"] || serviceGroup.trackingId;
                                const rxDetails = serviceGroup["03_receiverDetails"] || serviceGroup["3_receiverDetails"] || serviceGroup.receiverDetails || {};
                                const pcDetails = serviceGroup["04_orderDetails"] || serviceGroup["4_parcelDetails"] || serviceGroup.parcelDetails || {};
                                
                                shipments.push({
                                    id: serviceGroup.idTimestamp || "1",
                                    trackingId: trackingId,
                                    serviceType: pcDetails.serviceType || serviceGroup.serviceWorkflowType || "Standard Parcel",
                                    destination: pcDetails.dashboardDisplayDestination || rxDetails.dropoffAddress || rxDetails.city || rxDetails.fullAddress || "Unknown",
                                    dateBooked: pcDetails.scheduledMoveDate || serviceGroup.dateBooked || "Recent",
                                    status: serviceGroup.status || "Pending Dispatch",
                                    timestamp: serviceGroup.bookingTimestamp ? new Date(serviceGroup.bookingTimestamp).getTime() : 0
                                });
                            } else {
                                // Loop over dynamic unique stack keys (e.g. booking_1718741250000)
                                Object.keys(serviceGroup).forEach(key => {
                                    const item = serviceGroup[key];
                                    if (item && (item.trackingId || item["1_trackingId"] || item["01_trackingId"])) {
                                        const trackingId = item["01_trackingId"] || item.trackingId || item["1_trackingId"];
                                        const rxDetails = item["03_receiverDetails"] || item.receiverDetails || item["3_receiverDetails"] || {};
                                        const pcDetails = item["04_orderDetails"] || item.parcelDetails || item["4_parcelDetails"] || {};
                                        
                                        // Safely derive booking timestamp or clean tracking key values
                                        let rawTimestamp = 0;
                                        if (item.bookingTimestamp) {
                                            rawTimestamp = new Date(item.bookingTimestamp).getTime();
                                        } else if (pcDetails.orderCreatedDateTime) {
                                            rawTimestamp = new Date(pcDetails.orderCreatedDateTime).getTime();
                                        } else {
                                            rawTimestamp = parseInt(key.replace("booking_", "")) || 0;
                                        }

                                        shipments.push({
                                            id: key,
                                            trackingId: trackingId,
                                            serviceType: pcDetails.serviceType || item.serviceWorkflowType || item.serviceType || categoryName,
                                            destination: pcDetails.dashboardDisplayDestination || rxDetails.dropoffAddress || rxDetails.city || "Unknown",
                                            dateBooked: pcDetails.scheduledMoveDate || item.dateBooked || "Recent",
                                            status: item.status || "Pending Dispatch",
                                            timestamp: rawTimestamp
                                        });
                                    }
                                });
                            }
                        }
                    });
                }

                // 🌟 SAFE SORTING: Safeguard against NaN calculations with legacy fallback structures
                shipments.sort((a, b) => {
                    const timeA = isNaN(a.timestamp) ? 0 : a.timestamp;
                    const timeB = isNaN(b.timestamp) ? 0 : b.timestamp;
                    return timeB - timeA;
                });

                // Refresh UI views instantly with your clean database data
                calculateAndRenderMetrics();
                renderActiveProgressCards();
                renderLedgerTable();
            });
        } else {
            console.log("No authenticated user active.");
            const fallbackUid = "oZ55xPFsSYWyVTD5R8G1kYmx43"; 
            setupStaticListenerFallback(fallbackUid);
        }
    });
}

/**
 * Fallback static document watcher context configuration helper
 */
function setupStaticListenerFallback(uid) {
    const fallbackRef = doc(db, "Customer", uid);
    onSnapshot(fallbackRef, (docSnap) => {
        if (!auth.currentUser && docSnap.exists()) {
            shipments = [];
            const userData = docSnap.data();
            
            if (profileAvatar && userData.firstName) {
                profileAvatar.textContent = userData.firstName.charAt(0).toUpperCase();
            }
            if (welcomeGreeting && userData.firstName) {
                welcomeGreeting.textContent = `Good Evening, ${userData.firstName}`;
            }

            const services = userData.services || {};
            const categories = ["standardParcel", "lipatbahay", "cargo"];

            categories.forEach(categoryName => {
                const serviceGroup = services[categoryName];
                if (serviceGroup) {
                    if (serviceGroup["1_trackingId"] || serviceGroup.trackingId || serviceGroup["01_trackingId"]) {
                        const pcDetails = serviceGroup["04_orderDetails"] || serviceGroup["4_parcelDetails"] || {};
                        const rxDetails = serviceGroup["03_receiverDetails"] || serviceGroup["3_receiverDetails"] || {};
                        shipments.push({
                            id: serviceGroup.idTimestamp || "1",
                            trackingId: serviceGroup["01_trackingId"] || serviceGroup["1_trackingId"] || serviceGroup.trackingId,
                            serviceType: pcDetails.serviceType || serviceGroup.serviceWorkflowType || "Standard Parcel",
                            destination: pcDetails.dashboardDisplayDestination || rxDetails.dropoffAddress || rxDetails.city || "Unknown",
                            dateBooked: pcDetails.scheduledMoveDate || serviceGroup.dateBooked || "Recent",
                            status: serviceGroup.status || "Pending Dispatch",
                            timestamp: serviceGroup.bookingTimestamp ? new Date(serviceGroup.bookingTimestamp).getTime() : 0
                        });
                    } else {
                        Object.keys(serviceGroup).forEach(key => {
                            const item = serviceGroup[key];
                            if (item && (item.trackingId || item["1_trackingId"] || item["01_trackingId"])) {
                                const pcDetails = item["04_orderDetails"] || item["4_parcelDetails"] || {};
                                const rxDetails = item["03_receiverDetails"] || item["3_receiverDetails"] || {};
                                
                                let rawTimestamp = 0;
                                if (item.bookingTimestamp) {
                                    rawTimestamp = new Date(item.bookingTimestamp).getTime();
                                } else if (pcDetails.orderCreatedDateTime) {
                                    rawTimestamp = new Date(pcDetails.orderCreatedDateTime).getTime();
                                } else {
                                    rawTimestamp = parseInt(key.replace("booking_", "")) || 0;
                                }

                                shipments.push({
                                    id: key,
                                    trackingId: item["01_trackingId"] || item.trackingId || item["1_trackingId"],
                                    serviceType: pcDetails.serviceType || item.serviceWorkflowType || item.serviceType || categoryName,
                                    destination: pcDetails.dashboardDisplayDestination || rxDetails.dropoffAddress || rxDetails.city || "Unknown",
                                    dateBooked: pcDetails.scheduledMoveDate || item.dateBooked || "Recent",
                                    status: item.status || "Pending Dispatch",
                                    timestamp: rawTimestamp
                                });
                            }
                        });
                    }
                }
            });

            shipments.sort((a, b) => {
                const timeA = isNaN(a.timestamp) ? 0 : a.timestamp;
                const timeB = isNaN(b.timestamp) ? 0 : b.timestamp;
                return timeB - timeA;
            });

            calculateAndRenderMetrics();
            renderActiveProgressCards();
            renderLedgerTable();
        }
    });
}

/**
 * Evaluates the dataset and updates data metrics counters symmetrically
 */
function calculateAndRenderMetrics() {
    const totalCount = shipments.length;
    const activeCount = shipments.filter(s => (s.status || "").toLowerCase() !== "delivered").length;

    let lipatBahayCount = 0;
    let standardParcelCount = 0;
    let heavyCargoCount = 0;

    shipments.forEach(parcel => {
        const type = (parcel.serviceType || "").toLowerCase();
        const id = (parcel.trackingId || "");
        
        if (type.includes("lipat") || id.startsWith("LBH-")) {
            lipatBahayCount++;
        } else if (type.includes("heavy") || type.includes("cargo") || id.startsWith("CRG-")) {
            heavyCargoCount++;
        } else {
            standardParcelCount++;
        }
    });

    if (metricTotalBookings) metricTotalBookings.textContent = totalCount;
    if (metricLipatBahay) metricLipatBahay.textContent = lipatBahayCount;
    if (metricStandardParcel) metricStandardParcel.textContent = standardParcelCount;
    if (metricHeavyCargo) metricHeavyCargo.textContent = heavyCargoCount;

    if (welcomeSummaryLabel) {
        welcomeSummaryLabel.textContent = `You have ${activeCount} active shipment${activeCount === 1 ? '' : 's'} recorded.`;
    }
}

/**
 * 📇 GENERATES THE ACTIVE TRACKER CARD LAYOUT (Using Clean CSS Classes)
 */
function renderActiveProgressCards() {
    if (!activeShipmentsProgressContainer) return;
    activeShipmentsProgressContainer.innerHTML = ""; 
    
    const activeShipments = shipments.filter(s => (s.status || "").toLowerCase() !== "delivered");

    if (activeShipments.length === 0) {
        activeShipmentsProgressContainer.innerHTML = `
            <div style="padding: 24px; text-align: center; color: #94a3b8; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; width: 100%;">
                <p style="margin: 0; font-size: 0.9rem;">No active transit routes discovered.</p>
            </div>`;
        return;
    }

    activeShipments.forEach(parcel => {
        const service = (parcel.serviceType || "").toLowerCase();
        const trackingId = parcel.trackingId || "Awaiting ID...";
        const destinationText = parcel.destination || "Unknown Destination";
        
        let iconClass = "fas fa-box-open";
        let iconColorModifier = "icon-green"; 
        
        if (service.includes("lipat") || trackingId.startsWith("LBH-")) {
            iconClass = "fas fa-truck-ramp-box";
            iconColorModifier = "icon-purple";
        } else if (service.includes("heavy") || service.includes("cargo") || trackingId.startsWith("CRG-")) {
            iconClass = "fas fa-dolly";
            iconColorModifier = "icon-orange";
        } else {
            iconClass = "fas fa-box-open";
            iconColorModifier = "icon-blue";
        }

        const statusRaw = parcel.status || "Pending Dispatch";
        const statusClean = statusRaw.toLowerCase();
        const statusClassModifier = statusClean.includes("pending") ? "status-pending" : "status-transit";
        
        const cardMarkup = `
            <div class="active-shipment-card">
                <div class="card-left-group">
                    <div class="card-icon-wrapper ${iconColorModifier}">
                        <i class="${iconClass}" style="font-size: 1.2rem;"></i>
                    </div>
                    <div class="card-details">
                        <span class="tracking-id">${trackingId}</span>
                        <span class="destination-text">To: ${destinationText}</span>
                    </div>
                </div>
                <div class="card-progress-wrapper">
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill" style="width: 15%;"></div>
                    </div>
                    <span class="progress-percentage">15%</span>
                </div>
                <div>
                    <span class="status-btn-pill ${statusClassModifier}">
                        ${statusRaw}
                    </span>
                </div>
            </div>
        `;
        activeShipmentsProgressContainer.insertAdjacentHTML("beforeend", cardMarkup);
    });
}

/**
 * 📊 GENERATES RECENT BOOKINGS LEDROW LAYOUT
 */
function renderLedgerTable() {
    if (!bookingsTableBody) return;
    bookingsTableBody.innerHTML = "";

    if (shipments.length === 0) {
        bookingsTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 24px; color: #94a3b8;">No shipments booked yet.</td></tr>`;
        return;
    }

    shipments.forEach(parcel => {
        const trackingId = parcel.trackingId || "Awaiting ID...";
        const serviceText = parcel.serviceType || "Standard Parcel";
        const destinationText = parcel.destination || "Unknown Destination";
        const dateText = parcel.dateBooked || "Recent";
        const statusRaw = parcel.status || "Pending Dispatch";
        
        const statusClean = statusRaw.toLowerCase();
        const statusClassModifier = statusClean.includes("pending") ? "status-pending" : "status-transit";

        const rowElementMarkup = `
            <tr>
                <td style="font-weight: 700; color: #0c2340;">${trackingId}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-box" style="color: #64748b; font-size: 0.9rem;"></i>
                        <span>${serviceText}</span>
                    </div>
                </td>
                <td style="max-width: 250px; line-height: 1.4; word-break: break-word;">${destinationText}</td>
                <td style="white-space: nowrap;">${dateText}</td>
                <td>
                    <span class="status-btn-pill ${statusClassModifier}" style="padding: 6px 14px; min-width: 120px; font-size: 0.78rem;">
                        ${statusRaw}
                    </span>
                </td>
            </tr>
        `;
        bookingsTableBody.insertAdjacentHTML("beforeend", rowElementMarkup);
    });
}

/**
 * Installs event listeners for utility controls like Search/Quick tracking
 */
function setupEventListeners() {
    if (quickTrackForm) {
        quickTrackForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const controlNumber = quickTrackInput.value.trim();
            if (controlNumber) {
                alert(`Searching tracking matrix repository for: ${controlNumber}`);
            }
        });
    }

    // Connect form listener for modal/popup elements present on this page template
    const bookingForm = document.getElementById("bookingForm");
    if (bookingForm) {
        bookingForm.addEventListener("submit", handleBookingSubmission);
    }
}

// ==========================================================================
// ➕ APPEND NEW STACKABLE BOOKING DATA ENGINE METHOD
// ==========================================================================
async function handleBookingSubmission(e) {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in to create a booking.");
        return;
    }

    const serviceTypeInput = document.getElementById("serviceType");
    const receiverCityInput = document.getElementById("receiverCity");
    const displayDestinationInput = document.getElementById("displayDestination");

    const serviceCategory = serviceTypeInput ? serviceTypeInput.value : "standardParcel";
    const receiverCity = receiverCityInput ? receiverCityInput.value.trim() : "Unknown City";
    const displayDestination = displayDestinationInput ? displayDestinationInput.value.trim() : "Unknown Destination";

    let trackingPrefix = "MPC";
    let formattedServiceType = "Standard Parcel";
    
    if (serviceCategory === "lipatbahay") {
        trackingPrefix = "LBH";
        formattedServiceType = "Lipat-Bahay";
    }
    if (serviceCategory === "cargo") {
        trackingPrefix = "CRG";
        formattedServiceType = "Heavy Cargo";
    }

    const generatedTrackingId = `${trackingPrefix}-${Math.floor(100000 + Math.random() * 900000)}`;
    const currentTimestamp = Date.now();
    const uniqueBookingKey = `booking_${currentTimestamp}`;

    // Fixes overwrite bug by using dynamic nested paths: services.categoryName.booking_timestamp
    const bookingPayload = {
        [`services.${serviceCategory}.${uniqueBookingKey}`]: {
            "01_trackingId": generatedTrackingId,
            "idTimestamp": uniqueBookingKey,
            "04_orderDetails": {
                serviceType: formattedServiceType,
                scheduledMoveDate: new Date().toLocaleDateString('en-US'),
                orderCreatedDateTime: new Date().toISOString()
            },
            "status": "Pending Dispatch",
            "bookingTimestamp": new Date().toISOString(),
            "dateBooked": new Date().toLocaleDateString('en-US'),
            "03_receiverDetails": { "dropoffAddress": receiverCity },
            "4_parcelDetails": { "dashboardDisplayDestination": displayDestination }
        }
    };

    try {
        // Updated path from 10.0.0 mismatch to stay unified with global architecture hooks
        const { updateDoc } = await import("https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js");
        const userDocRef = doc(db, "Customer", user.uid);

        await updateDoc(userDocRef, bookingPayload);
        alert(`Booking success! Your tracking ID is: ${generatedTrackingId}`);
        
        const bookingForm = document.getElementById("bookingForm");
        if (bookingForm) bookingForm.reset();
    } catch (error) {
        console.error("Error writing stacked transactional maps to Firestore instance:", error);
        alert("Failed to save booking. Please check database read/write permissions rules.");
    }
}