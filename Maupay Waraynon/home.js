document.addEventListener('DOMContentLoaded', () => {
    const trackingForm = document.getElementById('trackingForm');
    const trackingInput = document.getElementById('trackingInput');

    if (trackingForm) {
        trackingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const trackingNo = trackingInput.value.trim();
            
            if (trackingNo) {
                // Sends tracking info to the second page (tracking.html)
                window.location.href = `tracking.html?id=${encodeURIComponent(trackingNo)}`;
            }
        });
    }
});