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
 * Custom Date & Time Formatter to support unified FIFO tracking view
 */
function formatTimestampToDateTime(timestamp) {
    if (!timestamp || timestamp === 0) return "Recent";
    const dateObj = new Date(timestamp);
    if (isNaN(dateObj.getTime())) return "Recent";

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = months[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    
    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // conversion of hour '0' to '12'
    const formattedHour = String(hours).padStart(2, '0');

    return `${day} ${month} ${year}, ${formattedHour}:${minutes} ${ampm}`;
}

/**
 * 🔍 ULTIMATE DEEP SCANNER FOR DESTINATION / RECEIVER LOCATION
 */
function deepExtractFields(obj, categoryName) {
    let result = {
        destination: "",
        dateBooked: "Recent",
        serviceType: categoryName === "cargo" ? "Commercial Cargo" : (categoryName === "lipatbahay" ? "Lipat-Bahay" : "Standard Parcel")
    };

    if (!obj || typeof obj !== 'object') return result;

    const d03 = obj["03_receiverDetails"] || {};
    const d04Rec = obj["04_receiverDetails"] || {}; 
    const d04Ord = obj["04_orderDetails"] || {};
    const d06 = obj["06_orderDetails"] || {};            
    const d4  = obj["4_parcelDetails"] || {};
    const d3  = obj["3_receiverDetails"] || {};
    const rx  = obj.receiverDetails || {};
    const pc  = obj.parcelDetails || {};

    result.serviceType = d06.serviceType || d04Ord.serviceType || d4.serviceType || obj.serviceWorkflowType || obj.serviceType || result.serviceType;
    
    let foundDest = d04Rec.address || d04Rec.city || d04Rec.receiverCity || d04Rec.receiverLocation ||
                    d03.dropoffAddress || d03.city || d03.receiverCity ||
                    d3.dropoffAddress || d3.city || rx.dropoffAddress || rx.city || 
                    d4.dashboardDisplayDestination || pc.dashboardDisplayDestination || 
                    obj.destination || obj.receiverCity || obj.receiverLocation;

    if (!foundDest || foundDest === "N/A" || foundDest === "Unknown Destination") {
        const str = JSON.stringify(obj);
        const matches = [
            str.match(/"dashboardDisplayDestination"\s*:\s*"([^"]+)"/i),
            str.match(/"dropoffAddress"\s*:\s*"([^"]+)"/i),
            str.match(/"receiverCity"\s*:\s*"([^"]+)"/i),
            str.match(/"address"\s*:\s*"([^"]+)"/i),
            str.match(/"city"\s*:\s*"([^"]+)"/i)
        ];
        for (let match of matches) {
            if (match && match[1] && match[1] !== "Unknown City" && match[1] !== "Unknown Destination" && match[1] !== "N/A") {
                foundDest = match[1];
                break;
            }
        }
    }

    result.destination = foundDest && foundDest !== "N/A" ? foundDest : "Unknown Destination";
    return result;
}

/**
 * ⏰ TIME STAMP PARSER WITH MODERN PAYLOAD PRIORITIZATION
 */
function parseToTimestamp(item, key) {
    try {
        if (!item) return 0;

        // 1. Direct prioritization of high-resolution millisecond tracks
        if (item.createdAtMillis) return parseInt(item.createdAtMillis, 10);

        const d04 = item["04_orderDetails"] || {};
        const d06 = item["06_orderDetails"] || {};
        
        // 2. Scan exact ISO strings before parsing localized text dates to preserve hours/minutes
        const timestampCandidate = d06.orderCreatedDateTime || d04.orderCreatedDateTime || item.bookingTimestamp || d06.dateBooked;

        if (timestampCandidate) {
            if (typeof timestampCandidate.toDate === 'function') return timestampCandidate.toDate().getTime();
            if (timestampCandidate.seconds) return timestampCandidate.seconds * 1000;
            const p = Date.parse(timestampCandidate);
            if (!isNaN(p)) return p;
        }

        if (key && typeof key === 'string' && key.includes("booking_")) {
            const num = parseInt(key.replace("booking_", ""), 10);
            if (!isNaN(num) && num > 0) return num;
        }

    } catch (err) {
        console.error("Sorting engine parsing error fallback active:", err);
    }
    return 0; 
}

/**
 * 🔌 FIRESTORE REAL-TIME REPOSITORY STREAM LISTENER
 */
function listenToLiveShipments() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const userDocRef = doc(db, "Customer", user.uid);

            onSnapshot(userDocRef, (docSnap) => {
                shipments = []; 
                
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    const firstName = userData.firstName || userData.fullName || "";
                    if (firstName) {
                        if (profileAvatar) profileAvatar.textContent = firstName.charAt(0).toUpperCase();
                        if (welcomeGreeting) {
                            const hour = new Date().getHours();
                            let greetingTime = hour < 12 ? "Morning" : (hour < 18 ? "Afternoon" : "Evening");
                            welcomeGreeting.textContent = `Good ${greetingTime}, ${firstName}`;
                        }
                    }

                    const services = userData.services || {};
                    const categories = ["standardParcel", "lipatbahay", "cargo"];

                    categories.forEach(categoryName => {
                        const serviceGroup = services[categoryName];
                        if (serviceGroup) {
                            if (serviceGroup["1_trackingId"] || serviceGroup.trackingId || serviceGroup["01_trackingId"]) {
                                const trackingId = serviceGroup["01_trackingId"] || serviceGroup.trackingId || serviceGroup["1_trackingId"];
                                const extracted = deepExtractFields(serviceGroup, categoryName);
                                const calculatedTime = parseToTimestamp(serviceGroup, serviceGroup.idTimestamp);
                                const d06 = serviceGroup["06_orderDetails"] || {};

                                shipments.push({
                                    id: serviceGroup.idTimestamp || "1",
                                    trackingId: trackingId,
                                    serviceType: extracted.serviceType,
                                    destination: extracted.destination,
                                    status: d06.status || serviceGroup.status || "Pending Dispatch",
                                    timestamp: calculatedTime
                                });
                            } else {
                                Object.keys(serviceGroup).forEach(key => {
                                    const item = serviceGroup[key];
                                    if (item) {
                                        const trackingId = item["01_trackingId"] || item.trackingId || item["1_trackingId"] || 
                                                           (key.startsWith("CRG-") ? key : (key.startsWith("booking_") ? "CRG-" + key.split("_")[1].substring(4,12) + "-PH" : "Awaiting ID..."));
                                        
                                        const extracted = deepExtractFields(item, categoryName);
                                        const calculatedTime = parseToTimestamp(item, key);
                                        const d06 = item["06_orderDetails"] || {};

                                        shipments.push({
                                            id: key,
                                            trackingId: trackingId,
                                            serviceType: extracted.serviceType,
                                            destination: extracted.destination,
                                            status: d06.status || item.status || "Pending Dispatch",
                                            timestamp: calculatedTime
                                        });
                                    }
                                });
                            }
                        }
                    });
                }

                // Absolute chronological cross-category sorting execution
                shipments.sort((a, b) => b.timestamp - a.timestamp);

                calculateAndRenderMetrics();
                renderActiveProgressCards();
                renderLedgerTable();
            });
        } else {
            const fallbackUid = "oZ55xPFsSYWyVTD5R8G1kYmx43"; 
            setupStaticListenerFallback(fallbackUid);
        }
    });
}

function setupStaticListenerFallback(uid) {
    const fallbackRef = doc(db, "Customer", uid);
    onSnapshot(fallbackRef, (docSnap) => {
        if (!auth.currentUser && docSnap.exists()) {
            shipments = [];
            const userData = docSnap.data();
            
            const services = userData.services || {};
            const categories = ["standardParcel", "lipatbahay", "cargo"];

            categories.forEach(categoryName => {
                const serviceGroup = services[categoryName];
                if (serviceGroup) {
                    Object.keys(serviceGroup).forEach(key => {
                        const item = serviceGroup[key];
                        if (item) {
                            const trackingId = item["01_trackingId"] || item.trackingId || item["1_trackingId"] || (key.startsWith("CRG-") ? key : "Awaiting ID...");
                            const extracted = deepExtractFields(item, categoryName);
                            const calculatedTime = parseToTimestamp(item, key);
                            const d06 = item["06_orderDetails"] || {};

                            shipments.push({
                                id: key,
                                trackingId: trackingId,
                                serviceType: extracted.serviceType,
                                destination: extracted.destination,
                                status: d06.status || item.status || "Pending Dispatch",
                                timestamp: calculatedTime
                                
                            });
                        }
                    });
                }
            });

            shipments.sort((a, b) => b.timestamp - a.timestamp);
            calculateAndRenderMetrics();
            renderActiveProgressCards();
            renderLedgerTable();
        }
    });
}

function calculateAndRenderMetrics() {
    const totalCount = shipments.length;
    const activeCount = shipments.filter(s => (s.status || "").toLowerCase() !== "delivered").length;

    let lipatBahayCount = 0;
    let standardParcelCount = 0;
    let heavyCargoCount = 0;

    shipments.forEach(parcel => {
        const type = (parcel.serviceType || "").toLowerCase();
        const id = (parcel.trackingId || "");
        
        if (type.includes("lipat") || id.startsWith("LBH-")) lipatBahayCount++;
        else if (type.includes("cargo") || id.startsWith("CRG-")) heavyCargoCount++;
        else standardParcelCount++;
    });

    if (metricTotalBookings) metricTotalBookings.textContent = totalCount;
    if (metricLipatBahay) metricLipatBahay.textContent = lipatBahayCount;
    if (metricStandardParcel) metricStandardParcel.textContent = standardParcelCount;
    if (metricHeavyCargo) metricHeavyCargo.textContent = heavyCargoCount;
    if (welcomeSummaryLabel) welcomeSummaryLabel.textContent = `You have ${activeCount} active shipment${activeCount === 1 ? '' : 's'} recorded.`;
}

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
        
        let iconClass = "fas fa-box-open";
        let iconColorModifier = "icon-blue"; 
        
        if (service.includes("lipat") || trackingId.startsWith("LBH-")) {
            iconClass = "fas fa-truck-ramp-box";
            iconColorModifier = "icon-purple";
        } else if (service.includes("cargo") || trackingId.startsWith("CRG-")) {
            iconClass = "fas fa-dolly";
            iconColorModifier = "icon-orange";
        }

        const statusRaw = parcel.status || "Pending Dispatch";
        const statusClassModifier = statusRaw.toLowerCase().includes("pending") ? "status-pending" : "status-transit";
        
        const cardMarkup = `
            <div class="active-shipment-card">
                <div class="card-left-group">
                    <div class="card-icon-wrapper ${iconColorModifier}">
                        <i class="${iconClass}" style="font-size: 1.2rem;"></i>
                    </div>
                    <div class="card-details">
                        <span class="tracking-id">${trackingId}</span>
                        <span class="destination-text">To: ${parcel.destination}</span>
                    </div>
                </div>
                <div class="card-progress-wrapper">
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill" style="width: 15%;"></div>
                    </div>
                    <span class="progress-percentage">15%</span>
                </div>
                <div><span class="status-btn-pill ${statusClassModifier}">${statusRaw}</span></div>
            </div>`;
        activeShipmentsProgressContainer.insertAdjacentHTML("beforeend", cardMarkup);
    });
}

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
        const dateText = formatTimestampToDateTime(parcel.timestamp);
        const statusRaw = parcel.status || "Pending Dispatch";
        const statusClassModifier = statusRaw.toLowerCase().includes("pending") ? "status-pending" : "status-transit";

        const serviceLower = serviceText.toLowerCase();
        let ledgerIconColor = "#3b82f6"; 
        if (serviceLower.includes("lipat") || trackingId.startsWith("LBH-")) ledgerIconColor = "#a855f7";
        else if (serviceLower.includes("cargo") || trackingId.startsWith("CRG-")) ledgerIconColor = "#f97316";

        const rowElementMarkup = `
            <tr>
                <td style="font-weight: 700; color: #0c2340;">${trackingId}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-box" style="color: ${ledgerIconColor}; font-size: 0.9rem;"></i>
                        <span>${serviceText}</span>
                    </div>
                </td>
                <td style="max-width: 250px; line-height: 1.4; word-break: break-word;">${parcel.destination}</td>
                <td style="white-space: nowrap;">${dateText}</td>
                <td><span class="status-btn-pill ${statusClassModifier}" style="padding: 6px 14px; min-width: 120px; font-size: 0.78rem;">${statusRaw}</span></td>
            </tr>`;
        bookingsTableBody.insertAdjacentHTML("beforeend", rowElementMarkup);
    });
}

function setupEventListeners() {
    if (quickTrackForm) {
        quickTrackForm.addEventListener("submit", (e) => {
            e.preventDefault();
            if (quickTrackInput.value.trim()) alert(`Searching tracking matrix repository for: ${quickTrackInput.value.trim()}`);
        });
    }
    const bookingForm = document.getElementById("bookingForm");
    if (bookingForm) bookingForm.addEventListener("submit", handleBookingSubmission);
}

// ==========================================================================
// ➕ APPEND NEW STACKABLE BOOKING DATA ENGINE METHOD
// ==========================================================================
async function handleBookingSubmission(e) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return alert("You must be logged in to create a booking.");

    const serviceCategory = document.getElementById("serviceType")?.value || "standardParcel";
    const receiverCity = document.getElementById("receiverCity")?.value.trim() || "Unknown City";
    const displayDestination = document.getElementById("displayDestination")?.value.trim() || "Unknown Destination";

    let trackingPrefix = "MPC";
    let formattedServiceType = "Standard Parcel";
    if (serviceCategory === "lipatbahay") { trackingPrefix = "LBH"; formattedServiceType = "Lipat-Bahay"; }
    if (serviceCategory === "cargo") { trackingPrefix = "CRG"; formattedServiceType = "Commercial Cargo"; }

    const generatedTrackingId = `${trackingPrefix}-${Math.floor(10000000 + Math.random() * 90000000)}-PH`;
    const currentTimestamp = Date.now();
    const uniqueBookingKey = `booking_${currentTimestamp}`;

    const bookingPayload = {
        [`services.${serviceCategory}.${uniqueBookingKey}`]: {
            "01_trackingId": generatedTrackingId,
            "idTimestamp": uniqueBookingKey,
            "createdAtMillis": currentTimestamp, 
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
        const { updateDoc } = await import("https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js");
        await updateDoc(doc(db, "Customer", user.uid), bookingPayload);
        alert(`Booking success! Your tracking ID is: ${generatedTrackingId}`);
        document.getElementById("bookingForm")?.reset();
    } catch (error) {
        console.error("Firestore write failure:", error);
    }
}