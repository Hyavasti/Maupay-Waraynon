document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    
    // Safely check if form element exists on current page track
    if (!loginForm) {
        console.error("Error: Could not find element with id 'login-form' inside this HTML file.");
        return;
    }

    const emailError = document.getElementById("email-error");
    const passwordError = document.getElementById("password-error");

    function clearErrors() {
        if (emailError) emailError.innerText = "";
        if (passwordError) passwordError.innerText = "";
        document.querySelectorAll(".input-group input").forEach(input => {
            input.style.borderColor = "#cccccc";
        });
    }

    function markInputError(inputElementId) {
        const el = document.getElementById(inputElementId);
        if (el) el.style.borderColor = "#ef5350";
    }

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        clearErrors();

        const email = document.getElementById("email").value.trim().toLowerCase();
        const password = document.getElementById("password").value;

        // Visual loading state trigger on the main button
        const loginButton = loginForm.querySelector(".btn-submit-login");
        const originalBtnText = loginButton ? loginButton.innerText : "Sign In";
        
        if (loginButton) {
            loginButton.innerText = "Signing In...";
            loginButton.disabled = true;
        }

        setTimeout(() => {
            try {
                // Read dummy account saved in LocalStorage browser cache database tracking space
                const savedAccountRaw = localStorage.getItem('dummyTestingAccount');
                
                let validEmail = "test@gmail.com";
                let validPassword = "Password123!";

                if (savedAccountRaw) {
                    const savedAccount = JSON.parse(savedAccountRaw);
                    validEmail = savedAccount.emailAddress;
                    validPassword = savedAccount.password;
                }

                // Authentication Evaluation Checkpoints
                if (email !== validEmail.toLowerCase()) {
                    if (emailError) {
                        emailError.innerText = "This account does not exist. Please check your email or register.";
                    }
                    markInputError("email");
                    resetButton();
                    return;
                } 
                
                if (password !== validPassword) {
                    if (passwordError) {
                        passwordError.innerText = "Incorrect password. Your credentials do not match our records.";
                    }
                    markInputError("password");
                    resetButton();
                    return;
                }

                // SUCCESS STATE
                alert(`Welcome back! Routing straight to dashboard overview panel window context.`);
                window.location.href = "dashboard.html";

            } catch (err) {
                alert("An internal testing crash occurred: " + err.message);
                resetButton();
            }
        }, 600);

        function resetButton() {
            if (loginButton) {
                loginButton.innerText = originalBtnText;
                loginButton.disabled = false;
            }
        }
    });
});