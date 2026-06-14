document.getElementById('btn-track').addEventListener('click', function() {
    const trackingNumber = document.getElementById('track-input').value.trim();
    if(trackingNumber !== "") {
        console.log("Tracking requested for number: " + trackingNumber);
    }
});