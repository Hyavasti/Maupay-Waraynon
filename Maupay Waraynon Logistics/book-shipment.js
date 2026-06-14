document.addEventListener("DOMContentLoaded", () => {
    const serviceCards = document.querySelectorAll(".service-option-card");
    const btnContinue = document.getElementById("btnContinueBooking");
    const profileAvatar = document.getElementById("profileAvatar");
    
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