document.addEventListener("DOMContentLoaded", () => {
    const forgotForm = document.getElementById("forgot-form");
    const emailError = document.getElementById("email-error");

    // Modal Document Selectors
    const forgotModal = document.getElementById("forgotModal");
    const modalTargetEmail = document.getElementById("modalTargetEmail");
    const closeModalBtn = document.getElementById("closeModalBtn");

    function clearErrors() {
        emailError.innerText = "";
        document.getElementById("email").style.borderColor = "#cccccc";
    }

    function markInputError() {
        document.getElementById("email").style.borderColor = "#ef5350";
    }

    forgotForm.addEventListener("submit", (e) => {
        e.preventDefault();
        clearErrors();

        const email = document.getElementById("email").value.trim().toLowerCase();

        // Regex structural format checkpoint evaluation
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            emailError.innerText = "Please enter a valid complete email extension framework address.";
            markInputError();
            return;
        }

        // Button action element load transition states
        const submitButton = forgotForm.querySelector(".btn-submit-login");
        const originalBtnText = submitButton.innerText;
        submitButton.innerText = "Processing Reset...";
        submitButton.disabled = true;

        setTimeout(() => {
            // SAVED BROWSER ACCOUNTS TO VALIDATE IDENTITY EXISTENCE
            const savedAccountRaw = localStorage.getItem('dummyTestingAccount');
            let validEmail = "test@gmail.com";

            if (savedAccountRaw) {
                const savedAccount = JSON.parse(savedAccountRaw);
                validEmail = savedAccount.emailAddress;
            }

            // Verify identity crossmatch registry state
            if (email !== validEmail) {
                emailError.innerText = "This email is not registered under any account on our server tracks.";
                markInputError();
                
                submitButton.innerText = originalBtnText;
                submitButton.disabled = false;
                return;
            }

            // Fire and display popup validation tracking link modal sequence
            modalTargetEmail.innerText = email;
            forgotModal.classList.remove("hidden");
            
            forgotForm.reset();
            submitButton.innerText = originalBtnText;
            submitButton.disabled = false;

        }, 700);
    });

    // Handle button link close action redirect
    closeModalBtn.addEventListener("click", () => {
        forgotModal.classList.add("hidden");
        window.location.href = "signin.html";
    });
});