document.addEventListener("DOMContentLoaded", () => {
    const profileAvatar = document.getElementById("profileAvatar");
    const btnExecuteTrackingSearch = document.getElementById("btnExecuteTrackingSearch");
    const txtWaybillControlNumber = document.getElementById("txtWaybillControlNumber");
    
    const mapCenterWelcomeMessage = document.getElementById("mapCenterWelcomeMessage");
    const logisticsTimelineDrawer = document.getElementById("logisticsTimelineDrawer");
    const btnCloseDrawer = document.getElementById("btnCloseDrawer");
    const lblParcelIdDisplay = document.getElementById("lblParcelIdDisplay");

    // Initialize Identity profile initials block header avatar badge
    const savedAccountRaw = localStorage.getItem('dummyTestingAccount');
    if (savedAccountRaw && profileAvatar) {
        const userAccount = JSON.parse(savedAccountRaw);
        if (userAccount.firstName) {
            profileAvatar.innerText = userAccount.firstName.charAt(0).toUpperCase();
        }
    }

    //Executes tracking search UI transformation logic toggle
    function processTrackingLookup() {
        const inputCode = txtWaybillControlNumber.value.trim().toUpperCase();

        if (!inputCode) {
            alert("⚠️ Please type your waybill tracking reference number code first.");
            return;
        }

        // Hide layout informational notice text label bubble
        if (mapCenterWelcomeMessage) {
            mapCenterWelcomeMessage.style.display = "none";
        }

        // Sync textual indicator variable slots and slide drawer up open
        if (lblParcelIdDisplay) lblParcelIdDisplay.textContent = inputCode;
        if (logisticsTimelineDrawer) logisticsTimelineDrawer.classList.add("is-expanded");
    }

    // Bind Interaction Triggers
    if (btnExecuteTrackingSearch) {
        btnExecuteTrackingSearch.addEventListener("click", processTrackingLookup);
    }

    if (txtWaybillControlNumber) {
        txtWaybillControlNumber.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                processTrackingLookup();
            }
        });
    }

    // Handle Closing tracking drawer layout resetting view states
    if (btnCloseDrawer) {
        btnCloseDrawer.addEventListener("click", () => {
            if (logisticsTimelineDrawer) logisticsTimelineDrawer.classList.remove("is-expanded");
            if (mapCenterWelcomeMessage) mapCenterWelcomeMessage.style.display = "block";
            if (txtWaybillControlNumber) txtWaybillControlNumber.value = "";
        });
    }
});