document.addEventListener("DOMContentLoaded", () => {
    const metricTotalBookings = document.getElementById("metricTotalBookings");
    const metricLipatBahay = document.getElementById("metricLipatBahay");
    const metricStandardParcel = document.getElementById("metricStandardParcel");
    const metricHeavyCargo = document.getElementById("metricHeavyCargo");
    
    const activeShipmentsContainer = document.getElementById("activeShipmentsProgressContainer");
    const bookingsTableBody = document.getElementById("bookingsTableBody");
    const welcomeSummaryLabel = document.getElementById("welcomeSummaryLabel");
    const quickTrackForm = document.getElementById("quickTrackForm");

    // Fetch data from localStorage or fallback to an empty array
    const shipments = JSON.parse(localStorage.getItem("maupayShipments")) || [];

    // Function to calculate and update dashboard metrics counters
    function calculateMetrics() {
        const total = shipments.length;
        const lipatBahayCount = shipments.filter(s => s.serviceType === "Lipat-Bahay").length;
        const standardCount = shipments.filter(s => s.serviceType === "Standard Parcel").length;
        const cargoCount = shipments.filter(s => s.serviceType === "Heavy Cargo").length;

        // Counter UI Assignment safely checking if elements exist first
        if (metricTotalBookings) metricTotalBookings.textContent = total;
        if (metricLipatBahay) metricLipatBahay.textContent = lipatBahayCount;
        if (metricStandardParcel) metricStandardParcel.textContent = standardCount;
        if (metricHeavyCargo) metricHeavyCargo.textContent = cargoCount;

        // Dynamic Sub-Header string change
        const activeCount = shipments.filter(s => s.status !== "Delivered").length;
        if (welcomeSummaryLabel) {
            welcomeSummaryLabel.textContent = `You have ${activeCount} active operational shipments recorded.`;
        }
    }

    // Function to build and show the active transit progress bar components
    function renderActiveProgressCards() {
        if (!activeShipmentsContainer) return;
        
        activeShipmentsContainer.innerHTML = ""; 

        // Filter out items that are already closed or delivered
        const activeShipments = shipments.filter(s => s.status !== "Delivered");

        if (activeShipments.length === 0) {
            activeShipmentsContainer.innerHTML = `
                <div style="padding: 20px; text-align: center; color: #64748b; background: #fff; border-radius: 8px;">
                    <i class="fas fa-folder-open" style="font-size: 24px; margin-bottom: 8px; color: #cbd5e1;"></i>
                    <p style="margin: 0; font-size: 0.9rem;">No active transit routes discovered. Create a new booking to populate real-time milestones.</p>
                </div>`;
            return;
        }

        // Generate progress bars dynamically based on transit states
        activeShipments.forEach(shipment => {
            let progressPercentage = 35; 
            let statusClass = "status-transit";
            
            if (shipment.status === "Out for Delivery") {
                progressPercentage = 85;
                statusClass = "status-delivery";
            }

            const cardHtml = `
                <div class="shipment-progress-card">
                    <div class="shipment-meta-icon">
                        <div class="meta-box blue-bg"></div>
                        <div class="meta-labels">
                            <h4>${shipment.trackingId}</h4>
                            <span>To: ${shipment.destination}</span>
                        </div>
                    </div>
                    <div class="progress-track-wrapper">
                        <div class="progress-bar-container">
                            <div class="progress-fill-line" style="width: ${progressPercentage}%;"></div>
                        </div>
                        <span class="progress-pct-lbl">${progressPercentage}%</span>
                    </div>
                    <span class="badge ${statusClass}">${shipment.status}</span>
                </div>
            `;
            activeShipmentsContainer.insertAdjacentHTML("beforeend", cardHtml);
        });
    }

    // Function to render the history ledger data table rows
    function renderLedgerTable() {
        if (!bookingsTableBody) return;
        
        bookingsTableBody.innerHTML = "";

        if (shipments.length === 0) {
            bookingsTableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 24px; color: #94a3b8;">
                        No shipments booked yet. Click "Book a Shipment" to begin.
                    </td>
                </tr>`;
            return;
        }

        // Sort ledger to show newest bookings first
        const sortedShipments = [...shipments].reverse();

        sortedShipments.forEach(shipment => {
            let statusBadgeClass = "status-transit";
            if (shipment.status === "Out for Delivery") statusBadgeClass = "status-delivery";
            if (shipment.status === "Delivered") statusBadgeClass = "status-delivered";

            const rowHtml = `
                <tr>
                    <td><strong>${shipment.trackingId}</strong></td>
                    <td>${shipment.serviceType}</td>
                    <td>${shipment.destination}</td>
                    <td>${shipment.dateBooked || "Today"}</td>
                    <td><span class="badge ${statusBadgeClass}">${shipment.status}</span></td>
                </tr>
            `;
            bookingsTableBody.insertAdjacentHTML("beforeend", rowHtml);
        });
    }

    // Fast-redirect function passing text control numbers over to the track parcel screen
    if (quickTrackForm) {
        quickTrackForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const quickTrackInput = document.getElementById("quickTrackInput");
            if (quickTrackInput) {
                const trackNum = quickTrackInput.value.trim();
                if (trackNum) {
                    sessionStorage.setItem("pendingTrackId", trackNum);
                    window.location.href = "track-parcel.html";
                }
            }
        });
    }

    // Initialize operations panel engine calculations on layout loading
    calculateMetrics();
    renderActiveProgressCards();
    renderLedgerTable();
});