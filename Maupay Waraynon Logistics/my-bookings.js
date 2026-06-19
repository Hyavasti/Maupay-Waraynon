document.addEventListener("DOMContentLoaded", () => {
    const bookingsListContainer = document.getElementById("bookingsListContainer");
    const bookingSearchInput = document.getElementById("bookingSearchInput");
    const bookingSortSelect = document.getElementById("bookingSortSelect");
    const filterButtons = document.querySelectorAll(".tab-btn");

    // Fetch unified dataset or run mock defaults matching structural profiles
    let shipments = JSON.parse(localStorage.getItem("maupayShipments"));
    
    if (!shipments || shipments.length === 0) {
        shipments = [
            { 
                trackingId: "BAC-03252026-1", 
                serviceType: "Standard Parcel", 
                destination: "Bacoor, Cavite 4102", 
                dateBooked: "2024-04-23", 
                estDelivery: "2024-04-26", 
                totalAmount: "1269", 
                status: "Pending",
                sender: { name: "John Carl Ola", phone: "0912 345 6789", address: "041, Zapote 3, Bacoor, Cavite 4102" },
                receiver: { name: "Paul Jake Ola", phone: "0924 681 0121", address: "041, Zapote 3, Bacoor, Cavite 4102" },
                package: { desc: "Clothing and accessories", category: "Clothing and accessories", dims: "30 × 20 × 15 cm", weight: "2.5 kg", value: "3,500.00" },
                payment: { method: "Clothing and accessories", amount: "3,500.00" }
            },
            { 
                trackingId: "BAC-03252026-2", 
                serviceType: "Heavy Cargo", 
                destination: "Tacloban City, Leyte", 
                dateBooked: "2024-04-22", 
                estDelivery: "2024-04-27", 
                totalAmount: "4500", 
                status: "Pending Dispatch",
                sender: { name: "Maria Clara", phone: "0917 111 2222", address: "Block 5, Lot 2, Alabang, Muntinlupa" },
                receiver: { name: "Juan Dela Cruz", phone: "Avenida St., City of Las Piñas, NCR", address: "Real St., Tacloban City, Leyte" },
                package: { desc: "Industrial Machine Parts", category: "Heavy Equipment Equipment", dims: "120 × 80 × 90 cm", weight: "45.0 kg", value: "25,000.00" },
                payment: { method: "Bank Transfer Link", amount: "4,500.00" }
            },
            { 
                trackingId: "BAC-03252026-3", 
                serviceType: "Lipat Bahay (Moving)", 
                destination: "Pasay City, NCR", 
                dateBooked: "2024-04-15", 
                estDelivery: "2024-04-18", 
                totalAmount: "8200", 
                status: "Delivered",
                sender: { name: "Antonio Luna", phone: "0999 555 6666", address: "Malate, Manila" },
                receiver: { name: "Emilio Aguinaldo", phone: "0915 777 8888", address: "Harrison Avenue, Pasay City, NCR" },
                package: { desc: "Household Furniture & Appliances", category: "Moving Freight Cargo", dims: "N/A - Full Truck Load", weight: "350 kg", value: "75,000.00" },
                payment: { method: "Cash on Delivery", amount: "8,200.00" }
            },
            { 
                trackingId: "BAC-03252026-4", 
                serviceType: "Standard Parcel", 
                destination: "San Juan, Manila", 
                dateBooked: "2024-04-10", 
                estDelivery: "2024-04-13", 
                totalAmount: "950", 
                status: "Cancelled",
                sender: { name: "Corazon Aquino", phone: "0912 999 8888", address: "Times St., Quezon City" },
                receiver: { name: "Benigno Aquino", phone: "0918 777 6666", address: "Greenhills, San Juan, Manila" },
                package: { desc: "Document Binder Parcels", category: "Office Stationary Supply", dims: "15 × 10 × 5 cm", weight: "0.8 kg", value: "500.00" },
                payment: { method: "GCash App Wallet", amount: "950.00" }
            }
        ];
        localStorage.setItem("maupayShipments", JSON.stringify(shipments));
    }

    let currentFilter = "all";
    let searchQuery = "";
    let currentSort = "newest";

    // Helper Utility: Select semantic color/icon schemes based on active service tracking structures
    function getServiceTheme(serviceType) {
        const type = (serviceType || "").toLowerCase();
        if (type.includes("lipat") || type.includes("bahay") || type.includes("moving")) {
            return { icon: "fas fa-truck-ramp-box", bg: "#e0e7ff", color: "#4f46e5" };
        } else if (type.includes("heavy") || type.includes("cargo")) {
            return { icon: "fas fa-dolly", bg: "#fef3c7", color: "#d97706" };
        } else {
            return { icon: "fas fa-box-open", bg: "#e0f2fe", color: "#0284c7" };
        }
    }

    // Helper Utility: Maps matching status badges cleanly
    function getStatusClass(status) {
        const check = (status || "").toLowerCase();
        if (check.includes("deliver")) return "status-delivery";
        if (check.includes("pending")) return "status-pending";
        if (check.includes("cancel")) return "status-cancelled"; 
        return "status-transit";
    }

    // Main Filtering & Rendering Routine
    function renderBookings() {
        if (!bookingsListContainer) return;
        bookingsListContainer.innerHTML = "";

        // 1. Apply Status Filter Selection Rule
        let filtered = shipments.filter(s => {
            if (currentFilter === "all") return true;
            if (currentFilter === "active") return s.status !== "Delivered" && s.status !== "Cancelled";
            if (currentFilter === "completed") return s.status === "Delivered";
            if (currentFilter === "cancelled") return s.status === "Cancelled";
            return true;
        });

        // 2. Apply Dynamic Input Search String Matching
        if (searchQuery) {
            filtered = filtered.filter(s => 
                s.trackingId.toLowerCase().includes(searchQuery) || 
                (s.destination || "").toLowerCase().includes(searchQuery) ||
                (s.serviceType || "").toLowerCase().includes(searchQuery)
            );
        }

        // 3. Process Layout Ordering Sort Sequences
        if (currentSort === "newest") {
            filtered = [...filtered].reverse(); // Flips the array so the absolute latest addition stays on top
        } else {
            // Keep default array sequence index orientation intact for oldest view
            filtered = [...filtered];
        }

        // Empty State Handler Block
        if (filtered.length === 0) {
            bookingsListContainer.innerHTML = `
                <div style="padding: 40px; text-align: center; background: #fff; border-radius: 12px; border: 2px dashed #e2e8f0; color: #94a3b8;">
                    <i class="fas fa-receipt" style="font-size: 2rem; margin-bottom: 10px; color: #cbd5e1;"></i>
                    <p style="margin: 0; font-size: 0.95rem; font-weight: 600;">No matching booking records discoverable.</p>
                </div>`;
            return;
        }

        // 4. Generate Cards DOM Loop Matching UI Split Rows
        filtered.forEach(shipment => {
            const theme = getServiceTheme(shipment.serviceType);
            const badgeClass = getStatusClass(shipment.status);
            const formattedPrice = Number(shipment.totalAmount || 0).toLocaleString('en-PH', { minimumFractionDigits: 0 });

            const cardHtml = `
                <div class="booking-card">
                    <div class="card-upper-segment">
                        <div class="card-meta-core">
                            <div class="card-icon-avatar" style="background-color: ${theme.bg}; color: ${theme.color};">
                                <i class="${theme.icon}"></i>
                            </div>
                            <div class="card-ident-details">
                                <h3>${shipment.trackingId}</h3>
                                <div class="sub-type">${shipment.serviceType}</div>
                                <div class="loc-date-row">
                                    <span><i class="fas fa-location-dot"></i> ${shipment.destination}</span>
                                    <span><i class="fas fa-calendar-days"></i> ${shipment.dateBooked || 'Today'}</span>
                                </div>
                            </div>
                        </div>
                        <span class="badge ${badgeClass}">• ${shipment.status}</span>
                    </div>

                    <div class="card-lower-segment">
                        <div class="card-metrics-grid">
                            <div class="metric-data-node">
                                <span class="m-lbl">Service Type</span>
                                <span class="m-val" style="font-weight: 600;">${shipment.serviceType.split(' ')[0]}</span>
                            </div>
                            <div class="metric-data-node">
                                <span class="m-lbl">Booking Date</span>
                                <span class="m-val">${shipment.dateBooked || 'Today'}</span>
                            </div>
                            <div class="metric-data-node">
                                <span class="m-lbl">Est. Delivery</span>
                                <span class="m-val">${shipment.estDelivery || 'Pending'}</span>
                            </div>
                            <div class="metric-data-node">
                                <span class="m-lbl">Total Amount</span>
                                <span class="m-val" style="color: #0c2340;">PHP ${formattedPrice}</span>
                            </div>
                        </div>

                        <div class="card-actions-wrapper">
                            <button class="btn-action-outline" onclick="triggerQuickTrack('${shipment.trackingId}')">Track</button>
                            <button class="btn-action-primary" onclick="navigateToDetails('${shipment.trackingId}')">
                                View Details <i class="fas fa-angle-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            bookingsListContainer.insertAdjacentHTML("beforeend", cardHtml);
        });
    }

    // Interactive Tab Filter Selection Management
    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            filterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentFilter = btn.getAttribute("data-filter");
            renderBookings();
        });
    });

    // Real-Time Search Query Event Handling
    bookingSearchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderBookings();
    });

    // Sort Dropdown Selector Event Handling
    bookingSortSelect.addEventListener("change", (e) => {
        currentSort = e.target.value;
        renderBookings();
    });

    // Global Action Bridge to Pass Selected Row Tracking Items to tracking-parcel module
    window.triggerQuickTrack = function(trackId) {
        sessionStorage.setItem("pendingTrackId", trackId);
        window.location.href = "track-parcel.html";
    };

    // FIXED: Corrected key alignment and synchronized memory storage type to match booking-details.js context requirements
    window.navigateToDetails = function(trackId) {
        localStorage.setItem("activeViewingTrackingId", trackId);
        window.location.href = "booking-details.html";
    };

    // Trigger Initial Workspace Board Render Loop Sequence
    renderBookings();
});