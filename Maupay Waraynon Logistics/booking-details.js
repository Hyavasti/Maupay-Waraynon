document.addEventListener("DOMContentLoaded", () => {
    const detTrackingId = document.getElementById("detTrackingId");
    const detStatusBadge = document.getElementById("detStatusBadge");
    const detServiceType = document.getElementById("detServiceType");
    const detBookingDate = document.getElementById("detBookingDate");
    const detEstDelivery = document.getElementById("detEstDelivery");
    const detTotalAmount = document.getElementById("detTotalAmount");

    const detSenderName = document.getElementById("detSenderName");
    const detSenderPhone = document.getElementById("detSenderPhone");
    const detSenderAddress = document.getElementById("detSenderAddress");
    const detReceiverName = document.getElementById("detReceiverName");
    const detReceiverPhone = document.getElementById("detReceiverPhone");
    const detReceiverAddress = document.getElementById("detReceiverAddress");

    const detPkgDescription = document.getElementById("detPkgDescription");
    const detPkgCategory = document.getElementById("detPkgCategory");
    const detPkgDimensions = document.getElementById("detPkgDimensions");
    const detPkgWeight = document.getElementById("detPkgWeight");
    const detPkgDeclared = document.getElementById("detPkgDeclared");
    const detPkgNotes = document.getElementById("detPkgNotes"); 

    const detPayMethod = document.getElementById("detPayMethod");
    const detPayAmount = document.getElementById("detPayAmount");

    const timelineStack = document.getElementById("timelineStack");
    const editBookingBtn = document.querySelector(".btn-edit-booking");
    const cancelBookingBtn = document.getElementById("cancelBookingBtn");

    const targetViewingId = localStorage.getItem("activeViewingTrackingId");
    const masterShipmentsDatabase = JSON.parse(localStorage.getItem("maupayShipments")) || [];
    
    let currentShipment = masterShipmentsDatabase.find(item => item.trackingId === targetViewingId);

    if (!currentShipment && masterShipmentsDatabase.length > 0) {
        currentShipment = masterShipmentsDatabase[masterShipmentsDatabase.length - 1];
    }

    if (!currentShipment) {
        alert("❌ Shipment details could not be found. Returning to My Bookings.");
        window.location.href = "my-bookings.html";
        return;
    }

    if (detTrackingId) detTrackingId.textContent = currentShipment.trackingId;
    if (detStatusBadge) detStatusBadge.textContent = `• ${currentShipment.status || 'Pending Dispatch'}`;
    if (detServiceType) detServiceType.textContent = currentShipment.serviceType || 'Standard Parcel';
    if (detBookingDate) detBookingDate.textContent = currentShipment.dateBooked || 'N/A';
    if (detEstDelivery) detEstDelivery.textContent = currentShipment.estDelivery || 'Pending Dispatch';
    
    const formattedPriceText = `PHP ${parseFloat(currentShipment.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (detTotalAmount) detTotalAmount.textContent = formattedPriceText;

    // Sender render
    const sndNode = currentShipment.sender || {};
    if (detSenderName) detSenderName.textContent = sndNode.name || "N/A";
    if (detSenderPhone) detSenderPhone.textContent = sndNode.phone || "N/A";
    if (detSenderAddress) detSenderAddress.textContent = sndNode.address || "Main Parcel Terminal";

    // Receiver render 
    const rcvNode = currentShipment.receiver || {};
    if (detReceiverName) detReceiverName.textContent = rcvNode.name || "N/A";
    if (detReceiverPhone) detReceiverPhone.textContent = rcvNode.phone || "N/A";
    if (detReceiverAddress) detReceiverAddress.textContent = rcvNode.address || "N/A";

    // Package details render
    const pkgNode = currentShipment.package || {};
    if (detPkgDescription) detPkgDescription.textContent = pkgNode.desc || "General Merchandise Items";
    if (detPkgCategory) detPkgCategory.textContent = pkgNode.category || "Standard Delivery Parcel";
    if (detPkgDimensions) detPkgDimensions.textContent = pkgNode.dims || "N/A";
    if (detPkgWeight) detPkgWeight.textContent = pkgNode.weight || "0 kg";
    
    if (detPkgDeclared) {
        detPkgDeclared.textContent = pkgNode.value || "PHP 0.00";
    }

    // Safely reads notes regardless of model property naming conventions
    if (detPkgNotes) {
        detPkgNotes.textContent = pkgNode.specialHandlingNotes || pkgNode.specialNotes || "None";
    }

    const payNode = currentShipment.payment || {};
    if (detPayMethod) detPayMethod.textContent = payNode.method || "Cash / COD";
    if (detPayAmount) detPayAmount.textContent = formattedPriceText;

    if (timelineStack) {
        timelineStack.innerHTML = `
            <div class="timeline-item current-active">
                <div class="timeline-marker-dot"></div>
                <div class="timeline-details-text">
                    <strong>Booking Registered Successfully</strong>
                    <span>${currentShipment.dateBooked || 'Today'} — Pending Dispatch Confirmation</span>
                </div>
            </div>
        `;
    }

    // Edit Button Handler Matrix
    if (editBookingBtn) {
        editBookingBtn.addEventListener("click", (e) => {
            e.preventDefault();

            let lengthVal = 0, widthVal = 0, heightVal = 0;
            if (pkgNode.dims && pkgNode.dims !== "N/A") {
                const pieces = pkgNode.dims.replace(/ cm/gi, "").split(/[×xX]/);
                if (pieces.length === 3) {
                    lengthVal = parseInt(pieces[0]) || 0;
                    widthVal = parseInt(pieces[1]) || 0;
                    heightVal = parseInt(pieces[2]) || 0;
                }
            }

            let cleanDeclaredValue = 0;
            if (pkgNode.value) {
                cleanDeclaredValue = parseFloat(pkgNode.value.replace(/[^0-9.]/g, "")) || 0;
            }

            // Extract core fields cleanly
            const verifiedNotes = pkgNode.specialHandlingNotes || pkgNode.specialNotes || "";
            const currentWeightNum = parseFloat(pkgNode.weight) || 0;

            const synchronizedManifestPayload = {
                serviceWorkflowType: currentShipment.serviceType || "Standard Parcel",
                deliveryArrangementOption: "DoorToDoor",
                dashboardDisplayDestination: currentShipment.destination || rcvNode.address || "",
                generatedTrackingId: currentShipment.trackingId,
                status: currentShipment.status || "Pending Dispatch",
                bookingTimestamp: currentShipment.dateBooked || "",
                isEditingMode: true,
                
                senderContactDetails: {
                    fullName: sndNode.name || "",
                    phoneNumber: sndNode.phone && sndNode.phone !== "N/A" ? sndNode.phone : "",
                    fullAddress: sndNode.address || "Main Parcel Terminal"
                },
                receiverContactDetails: {
                    fullName: rcvNode.name || "",
                    phoneNumber: rcvNode.phone && rcvNode.phone !== "N/A" ? rcvNode.phone : "",
                    fullAddress: rcvNode.address || ""
                },
                packageConfiguration: {
                    description: pkgNode.desc || "",
                    category: pkgNode.category || "",
                    weightKg: currentWeightNum,
                    declaredValue: cleanDeclaredValue,
                    specialHandlingNotes: verifiedNotes,
                    specialInstructions: verifiedNotes, // Symmetric mirror mapping
                    dimensions: {
                        length: lengthVal,
                        width: widthVal,
                        height: heightVal
                    },
                    // Preserve custom structural types across form loads
                    vehicleSize: currentShipment.vehicleSize || pkgNode.vehicleSize || "",
                    crewHelpers: parseInt(currentShipment.crewHelpers || pkgNode.crewHelpers) || 0,
                    originFloor: currentShipment.originFloor || pkgNode.originFloor || "",
                    dropoffFloor: currentShipment.dropoffFloor || pkgNode.dropoffFloor || "",
                    freightType: currentShipment.freightType || pkgNode.freightType || ""
                },
                billingLedger: {
                    grandTotal: parseFloat(currentShipment.totalAmount) || 150
                }
            };

            localStorage.setItem("consolidatedBookingManifest", JSON.stringify(synchronizedManifestPayload));
            localStorage.setItem("activeEditingTrackingId", currentShipment.trackingId);

            window.location.href = "edit-parcel-booking.html";
        });
    }

    // Cancellation implementation logic 
    if (cancelBookingBtn) {
        cancelBookingBtn.addEventListener("click", () => {
            if (confirm(`⚠️ Are you sure you want to cancel booking file shipment number ${currentShipment.trackingId}?`)) {
                const updatedDatabaseList = masterShipmentsDatabase.filter(item => item.trackingId !== currentShipment.trackingId);
                localStorage.setItem("maupayShipments", JSON.stringify(updatedDatabaseList));
                alert("🗑️ Shipment booking file has been deleted successfully.");
                window.location.href = "my-bookings.html";
            }
        });
    }
});