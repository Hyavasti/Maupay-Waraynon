// Import the necessary Firebase SDK functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// =======================================================
// FIREBASE APP CONFIGURATION MODULE
// =======================================================
const firebaseConfig = {
    apiKey: "AIzaSyBVUVvHJfsZGvaZmOq2Sz23kI8dnml4dI0",
    authDomain: "mpc-bacoor.firebaseapp.com",
    databaseURL: "https://mpc-bacoor-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "mpc-bacoor",
    storageBucket: "mpc-bacoor.firebasestorage.app",
    messagingSenderId: "105917197007",
    appId: "1:105917197007:web:ec34d45a969be00a30e5ba",
    measurementId: "G-GSF6CFML1Y"
};

// Initialize Firebase App Components
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signup-form");
    const firstNameInput = document.getElementById("firstName");
    const lastNameInput = document.getElementById("lastName");
    const emailInput = document.getElementById("email"); 
    const phoneInput = document.getElementById("phone");
    const passwordInput = document.getElementById("password");
    const confirmInput = document.getElementById("confirmPassword");
    
    // Password Eye Icon Selectors
    const passwordEye = document.getElementById("togglePassword");
    const confirmEye = document.getElementById("toggleConfirmPassword");

    // Modal Targets
    const successModal = document.getElementById("successModal");
    const modalTargetEmail = document.getElementById("modalTargetEmail");
    const closeModalBtn = document.getElementById("closeModalBtn");

    // Error UI Target Elements
    const firstnameError = document.getElementById("firstname-error");
    const lastnameError = document.getElementById("lastname-error");
    const emailError = document.getElementById("email-error");
    const phoneError = document.getElementById("phone-error");
    const passwordError = document.getElementById("password-error");
    const confirmError = document.getElementById("confirm-error");

    // =======================================================
    // REAL-TIME CHAR STRIPING
    // =======================================================
    if (firstNameInput) {
        firstNameInput.addEventListener("input", () => {
            firstNameInput.value = firstNameInput.value.replace(/[^A-Za-z\sñÑ]/g, "");
        });
    }

    if (lastNameInput) {
        lastNameInput.addEventListener("input", () => {
            lastNameInput.value = lastNameInput.value.replace(/[^A-Za-z\sñÑ]/g, "");
        });
    }

    if (phoneInput) {
        phoneInput.addEventListener("input", () => {
            phoneInput.value = phoneInput.value.replace(/[^0-9]/g, "");
        });
    }

    // =======================================================
    // DUAL EYE VISIBILITY CONTROLLER
    // =======================================================
    function setupPasswordToggle(inputEl, eyeEl) {
        if (!inputEl || !eyeEl) return;

        // Toggle visibility class depending on character length
        inputEl.addEventListener("input", () => {
            if (inputEl.value.length > 0) {
                eyeEl.classList.add("visible");
            } else {
                eyeEl.classList.remove("visible");
                inputEl.type = "password";
                eyeEl.classList.remove("fa-eye-slash");
                eyeEl.classList.add("fa-eye");
            }
        });

        // Click interaction logic to toggle visibility masks
        eyeEl.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (inputEl.type === "password") {
                inputEl.type = "text";
                eyeEl.classList.remove("fa-eye");
                eyeEl.classList.add("fa-eye-slash");
            } else {
                inputEl.type = "password";
                eyeEl.classList.remove("fa-eye-slash");
                eyeEl.classList.add("fa-eye");
            }
        });
    }

    setupPasswordToggle(passwordInput, passwordEye);
    setupPasswordToggle(confirmInput, confirmEye);

    // =======================================================
    // VALIDATION ENGINE & BORDER RESET HANDLERS
    // =======================================================
    function clearErrors() {
        if (firstnameError) firstnameError.innerText = "";
        if (lastnameError) lastnameError.innerText = "";
        if (emailError) emailError.innerText = "";
        if (phoneError) phoneError.innerText = "";
        if (passwordError) passwordError.innerText = "";
        if (confirmError) confirmError.innerText = "";
        document.querySelectorAll(".input-group input").forEach(i => i.style.borderColor = "#cccccc");
    }

    function markInputError(id) {
        const el = document.getElementById(id);
        if (el) el.style.borderColor = "#ef5350";
    }

    // =======================================================
    // AUTHENTIC FIREBASE REGISTER & SUBMISSION LAYER
    // =======================================================
    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            clearErrors();

            const firstName = firstNameInput ? firstNameInput.value.trim() : "";
            const lastName = lastNameInput ? lastNameInput.value.trim() : "";
            const email = emailInput ? emailInput.value.trim() : "";
            const phone = phoneInput ? phoneInput.value.trim() : "";
            const password = passwordInput ? passwordInput.value : "";
            const confirmPassword = confirmInput ? confirmInput.value : "";

            if (firstName.length === 0) {
                if (firstnameError) firstnameError.innerText = "First name is required.";
                markInputError("firstName");
                return;
            }
            if (lastName.length === 0) {
                if (lastnameError) lastnameError.innerText = "Last name is required.";
                markInputError("lastName");
                return;
            }

            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(email)) {
                if (emailError) emailError.innerText = "Please enter a valid email address.";
                markInputError("email"); 
                return;
            }

            if (!phone.startsWith("09") || phone.length !== 11) {
                if (phoneError) phoneError.innerText = "Must be an 11-digit PH mobile number starting with 09.";
                markInputError("phone");
                return;
            }

            if (password.length < 8 || password.length > 16 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*(),.?":{}|<>_+\-\[\]\\\/]/.test(password)) {
                if (passwordError) passwordError.innerText = "Password requirements: 8-16 characters, uppercase, lowercase, number, and special character.";
                markInputError("password");
                return;
            }

            if (password !== confirmPassword) {
                if (confirmError) confirmError.innerText = "Passwords do not match.";
                markInputError("confirmPassword");
                return;
            }

            const registerButton = signupForm.querySelector(".btn-submit-login") || signupForm.querySelector("button[type='submit']");
            const originalBtnText = registerButton ? registerButton.innerText : "Create an Account";
            
            if (registerButton) {
                registerButton.innerText = "Creating Account...";
                registerButton.disabled = true;
            }

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                const customerDocRef = doc(db, "Customer", user.uid);

                await setDoc(customerDocRef, {
                    firstName: firstName,
                    lastName: lastName,
                    emailAddress: email.toLowerCase(),
                    phoneNumber: phone,
                    createdAt: serverTimestamp(),
                    services: {
                        standardParcel: {},
                        lipatbahay: {},
                        cargo: {}
                    }
                });

                if (modalTargetEmail) modalTargetEmail.innerText = email;
                if (successModal) successModal.classList.remove("hidden");
                
                signupForm.reset();
                if (passwordEye) passwordEye.classList.remove("visible");
                if (confirmEye) confirmEye.classList.remove("visible");

            } catch (error) {
                console.error("Firebase Registration Error: ", error.code, error.message);
                
                if (error.code === "auth/email-already-in-use") {
                    if (emailError) emailError.innerText = "This email address is already registered.";
                    markInputError("email");
                } else if (error.code === "auth/invalid-email") {
                    if (emailError) emailError.innerText = "The specified email formatting is invalid.";
                    markInputError("email");
                } else if (error.code === "auth/weak-password") {
                    if (passwordError) passwordError.innerText = "The provided password matrix is too weak.";
                    markInputError("password");
                } else {
                    alert("System Exception Error: " + error.message);
                }
            } finally {
                if (registerButton) {
                    registerButton.innerText = originalBtnText;
                    registerButton.disabled = false;
                }
            }
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", () => {
            if (successModal) successModal.classList.add("hidden");
            window.location.href = "signin.html"; 
        });
    }
});