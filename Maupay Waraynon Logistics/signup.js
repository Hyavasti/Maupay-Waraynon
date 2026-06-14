document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signup-form");
    const countryDropdown = document.getElementById("countryCode");

    // Modal Targets
    const successModal = document.getElementById("successModal");
    const modalTargetEmail = document.getElementById("modalTargetEmail");
    const closeModalBtn = document.getElementById("closeModalBtn");

    // Field Error Containers
    const firstnameError = document.getElementById("firstname-error");
    const lastnameError = document.getElementById("lastname-error");
    const emailError = document.getElementById("email-error");
    const phoneError = document.getElementById("phone-error");
    const passwordError = document.getElementById("password-error");
    const confirmError = document.getElementById("confirm-error");

    // Password Eye Elements
    const passwordInput = document.getElementById("password");
    const confirmInput = document.getElementById("confirmPassword");
    const passwordEye = document.getElementById("togglePassword");
    const confirmEye = document.getElementById("toggleConfirmPassword");

    
    // DYNAMIC GLOBAL COUNTRY DICTIONARY FETCH
    async function loadAllCountryCodes() {
        try {
            const response = await fetch("https://restcountries.com/v3.1/all?fields=name,idd,flag,cca2");
            const countries = await response.json();

            const formattedCountries = countries
                .filter(c => c.idd && c.idd.root)
                .map(c => {
                    const suffix = c.idd.suffixes ? c.idd.suffixes[0] : "";
                    return {
                        name: c.name.common,
                        code: c.idd.root + (c.idd.suffixes && c.idd.suffixes.length === 1 ? suffix : ""),
                        flag: c.flag || "",
                        cca2: c.cca2
                    };
                });

            formattedCountries.sort((a, b) => a.name.localeCompare(b.name));
            countryDropdown.innerHTML = "";

            formattedCountries.forEach(country => {
                const option = document.createElement("option");
                option.value = country.code;
                option.innerText = `${country.flag} ${country.code} (${country.cca2}) - ${country.name}`;
                
                if (country.cca2 === "PH") {
                    option.selected = true;
                }
                countryDropdown.appendChild(option);
            });

        } catch (error) {
            console.error("Country API error, loading local defaults:", error);
            countryDropdown.innerHTML = `
                <option value="+63" selected>🇵🇭 +63 (PH)</option>
                <option value="+1">🇺🇸 +1 (US)</option>
                <option value="+44">🇬🇧 +44 (UK)</option>
            `;
        }
    }

    loadAllCountryCodes();

    // PASSWORD EYE TOGGLE VISIBILITY TRACKING
    function setupPasswordToggle(inputField, eyeIcon) {
        inputField.addEventListener("input", () => {
            if (inputField.value.length > 0) {
                eyeIcon.classList.add("visible");
            } else {
                eyeIcon.classList.remove("visible");
                inputField.type = "password";
                eyeIcon.classList.replace("fa-eye-slash", "fa-eye");
            }
        });

        eyeIcon.addEventListener("click", () => {
            if (inputField.type === "password") {
                inputField.type = "text";
                eyeIcon.classList.replace("fa-eye", "fa-eye-slash");
            } else {
                inputField.type = "password";
                eyeIcon.classList.replace("fa-eye-slash", "fa-eye");
            }
        });
    }

    setupPasswordToggle(passwordInput, passwordEye);
    setupPasswordToggle(confirmInput, confirmEye);

  
    // FIELD ERROR CLEARING UTILITIES
    function clearErrors() {
        firstnameError.innerText = "";
        lastnameError.innerText = "";
        emailError.innerText = "";
        phoneError.innerText = "";
        passwordError.innerText = "";
        confirmError.innerText = "";
        
        document.querySelectorAll(".input-group input").forEach(input => {
            input.style.borderColor = "#cccccc";
        });
    }

    function markInputError(inputId) {
        document.getElementById(inputId).style.borderColor = "#ef5350";
    }


    // MAIN VALIDATION & INTERCEPT SUBMIT EVENT
    signupForm.addEventListener("submit", (e) => {
        e.preventDefault();
        clearErrors();

        const firstName = document.getElementById("firstName").value.trim();
        const lastName = document.getElementById("lastName").value.trim();
        const email = document.getElementById("email").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const countryCode = countryDropdown.value;
        const password = passwordInput.value;
        const confirmPassword = confirmInput.value;

        // 1. Name checks
        const nameRegex = /^[A-Za-z\sñÑ.]+$/;
        if (!nameRegex.test(firstName)) {
            firstnameError.innerText = "First name can only contain letters and spaces.";
            markInputError("firstName");
            return;
        }
        if (!nameRegex.test(lastName)) {
            lastnameError.innerText = "Last name can only contain letters and spaces.";
            markInputError("lastName");
            return;
        }

        // 2. Email suffix checks
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            emailError.innerText = "Please enter a complete email address with extension (e.g., .com).";
            markInputError("email");
            return;
        }

        // 3. Numbers only Phone Check
        const phoneRegex = /^[0-9]+$/;
        if (!phoneRegex.test(phone)) {
            phoneError.innerText = "Phone number can only contain numbers. Letters and symbols are not allowed.";
            markInputError("phone");
            return;
        }
        if (phone.length < 5 || phone.length > 14) {
            phoneError.innerText = "Please enter a valid local number length.";
            markInputError("phone");
            return;
        }

        // 4. Strict Passwords check parameters
        if (password.length < 8 || password.length > 16) {
            passwordError.innerText = "Password length must be between 8 and 16 characters.";
            markInputError("password");
            return;
        }
        if (!/[A-Z]/.test(password)) {
            passwordError.innerText = "Password requires at least one uppercase letter (A-Z).";
            markInputError("password");
            return;
        }
        if (!/[a-z]/.test(password)) {
            passwordError.innerText = "Password requires at least one lowercase letter (a-z).";
            markInputError("password");
            return;
        }
        if (!/[0-9]/.test(password)) {
            passwordError.innerText = "Password requires at least one number digit (0-9).";
            markInputError("password");
            return;
        }
        if (!/[!@#$%^&*(),.?":{}|<>_+\-\[\]\\\/]/.test(password)) {
            passwordError.innerText = "Password requires at least one special character.";
            markInputError("password");
            return;
        }

        if (password !== confirmPassword) {
            confirmError.innerText = "Passwords do not match. Please verify both inputs.";
            markInputError("confirmPassword");
            return;
        }

      
        // TESTING CHANNELS
       
        
        // emails to test validation rejections
        const mockDatabaseEmails = ["taken@gmail.com", "admin@maupay.com", "test@gmail.com"];

        // Trigger dynamic loading button state delay
        const registerButton = signupForm.querySelector(".btn-submit-login");
        const originalBtnText = registerButton.innerText;
        registerButton.innerText = "Creating Account...";
        registerButton.disabled = true;

        setTimeout(() => {
            // Test Rule A: Check if username is already "registered" inside our dummy database array
            if (mockDatabaseEmails.includes(email.toLowerCase())) {
                emailError.innerText = "This email address is already registered to an existing account.";
                markInputError("email");
                
                // Reset submit button text state
                registerButton.innerText = originalBtnText;
                registerButton.disabled = false;
                return;
            }

            // Test Rule B: If validation succeeds, build a dummy payload mapping structure
           const dummyUserPayload = {
                uid: "MWPC_" + Math.floor(100000 + Math.random() * 900000),
                firstName: firstName,
                lastName: lastName,
                emailAddress: email.toLowerCase(),
                fullContactPhone: countryCode + phone,
                password: password,
                accountCreatedTimestamp: new Date().toISOString()
            };

            // Save to browser memory so signin.html can read it!
            localStorage.setItem('dummyTestingAccount', JSON.stringify(dummyUserPayload));

            console.log("%c--- DUMMY ACCOUNT SAVED TO BROWSER ---", "color: #2e7d32; font-weight: bold; font-size: 1.1rem;");
            console.log("Saved to LocalStorage for Sign-In testing:", dummyUserPayload);
            console.log("Ready to push directly to Firebase Auth & Firestore DB instances:", dummyUserPayload);
            console.log("---------------------------------------");

            // Reveal success modal overlay panel components
            modalTargetEmail.innerText = email;
            successModal.classList.remove("hidden");
            
            // Clean interface configurations
            signupForm.reset();
            passwordEye.classList.remove("visible");
            confirmEye.classList.remove("visible");
            registerButton.innerText = originalBtnText;
            registerButton.disabled = false;

        }, 800);
    });

    // Close Modal and bounce back out to sign-in panel route
    closeModalBtn.addEventListener("click", () => {
        successModal.classList.add("hidden");
        window.location.href = "signin.html"; 
    });
});