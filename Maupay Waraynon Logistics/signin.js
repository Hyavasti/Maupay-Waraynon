// Import the necessary Firebase SDK functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence 
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
// Added Firestore imports to handle live user generation on Google login
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

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
const db = getFirestore(app); // Initialized database layer
const googleProvider = new GoogleAuthProvider();

document.addEventListener("DOMContentLoaded", () => {
    // Declare elements
    const loginForm = document.getElementById("login-form");
    const googleBtn = document.getElementById("google-signin-btn");
    const passwordInput = document.getElementById("password");
    const passwordEye = document.getElementById("togglePassword");
    const emailField = document.getElementById("email");
    const rememberMeCheckbox = document.getElementById("rememberMe");
    
    // Modals
    const successModal = document.getElementById("loginSuccessModal");
    const errorModal = document.getElementById("loginErrorModal");
    const closeErrorBtn = document.getElementById("closeErrorModal");
    const errorModalTitle = document.getElementById("error-modal-title");
    const errorModalMsg = document.getElementById("error-modal-msg");

    // Clear browser cached auto-fill values safely on load
    if (passwordInput) passwordInput.value = "";
    if (emailField) emailField.value = "";

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

    // Helper function to show custom pop-up error modal
    function showErrorPopup(title, message) {
        if (errorModal && errorModalTitle && errorModalMsg) {
            errorModalTitle.innerText = title;
            errorModalMsg.innerText = message;
            errorModal.classList.remove("hidden");
        } else {
            // Fallback to legacy alert if modal items aren't configured in HTML yet
            alert(`${title}: ${message}`);
        }
    }

    // Close error modal listener
    if (closeErrorBtn && errorModal) {
        closeErrorBtn.addEventListener("click", () => {
            errorModal.classList.add("hidden");
        });
    }

    // =======================================================
    // FIXED DYNAMIC EYE VISIBILITY CONTROLLER FOR PASSWORD
    // =======================================================
    if (passwordInput && passwordEye) {
        passwordInput.addEventListener("input", () => {
            if (passwordInput.value.length > 0) {
                passwordEye.classList.add("visible");
                passwordEye.style.display = "inline-block"; 
            } else {
                passwordEye.classList.remove("visible");
                passwordEye.style.display = "none";
                passwordInput.type = "password";
                passwordEye.classList.remove("fa-eye-slash");
                passwordEye.classList.add("fa-eye");
            }
        });

        passwordEye.addEventListener("click", (e) => {
            e.preventDefault(); 
            e.stopPropagation();
            
            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                passwordEye.classList.remove("fa-eye");
                passwordEye.classList.add("fa-eye-slash");
            } else {
                passwordInput.type = "password";
                passwordEye.classList.remove("fa-eye-slash");
                passwordEye.classList.add("fa-eye");
            }
        });
    }

    // =======================================================
    // AUTHENTIC FIREBASE SIGN-IN WITH PERSISTENCE LAYER
    // =======================================================
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearErrors();

        const email = emailField ? emailField.value.trim().toLowerCase() : "";
        const password = passwordInput ? passwordInput.value : "";

        const loginButton = loginForm.querySelector(".btn-submit-login");
        const originalBtnText = loginButton ? loginButton.innerText : "Sign In";
        
        if (loginButton) {
            loginButton.innerText = "Signing In...";
            loginButton.disabled = true;
        }

        try {
            const keepUserLoggedIn = rememberMeCheckbox ? rememberMeCheckbox.checked : false;
            
            if (keepUserLoggedIn) {
                await setPersistence(auth, browserLocalPersistence);
            } else {
                await setPersistence(auth, browserSessionPersistence);
            }

            await signInWithEmailAndPassword(auth, email, password);

            if (successModal) {
                successModal.classList.remove("hidden");
            }
            
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 2000);

        } catch (error) {
            console.error("Firebase Sign-In Error: ", error.code, error.message);
            
            // Handle expected invalid credentials errors
            if (
                error.code === "auth/user-not-found" || 
                error.code === "auth/invalid-email" || 
                error.code === "auth/wrong-password" || 
                error.code === "auth/invalid-credential" ||
                error.code === "auth/invalid-login-credentials"
            ) {
                if (emailError) emailError.innerText = "Invalid Credentials";
                if (passwordError) passwordError.innerText = "Invalid Credentials";
                markInputError("email");
                markInputError("password");
                
                // Show clean custom modal message
                showErrorPopup("Authentication Error", "Invalid Credentials");
            } else {
                // System or alternative error handler fallback
                showErrorPopup("Authentication Error", "An unexpected system error occurred. Please try again.");
            }
            
            resetButton();
        }

        function resetButton() {
            if (loginButton) {
                loginButton.innerText = originalBtnText;
                loginButton.disabled = false;
            }
        }
    });

    // =======================================================
    // LIVE PRODUCTION GOOGLE SIGN-IN INTERCEPT HANDLER
    // =======================================================
    if (googleBtn) {
        googleBtn.addEventListener("click", async () => {
            clearErrors();
            
            const originalGoogleText = googleBtn.innerHTML;
            googleBtn.innerHTML = '<i class="fab fa-google"></i> Connecting to Google...';
            googleBtn.disabled = true;

            try {
                const keepUserLoggedIn = rememberMeCheckbox ? rememberMeCheckbox.checked : false;
                const persistenceType = keepUserLoggedIn ? browserLocalPersistence : browserSessionPersistence;
                
                await setPersistence(auth, persistenceType);
                
                const result = await signInWithPopup(auth, googleProvider);
                const user = result.user;

                const nameParts = user.displayName ? user.displayName.split(" ") : ["Google", "User"];
                const firstName = nameParts[0];
                const lastName = nameParts.slice(1).join(" ") || "User";

                const customerDocRef = doc(db, "Customer", user.uid);
                const docSnap = await getDoc(customerDocRef);

                if (!docSnap.exists()) {
                    await setDoc(customerDocRef, {
                        firstName: firstName,
                        lastName: lastName,
                        emailAddress: user.email.toLowerCase(),
                        phoneNumber: user.phoneNumber || "", 
                        createdAt: serverTimestamp(),
                        services: {
                            standardParcel: {},
                            lipatbahay: {},
                            cargo: {}
                        }
                    });
                    console.log("New User DB Provisioning finalized successfully.");
                }

                if (successModal) {
                    successModal.classList.remove("hidden");
                    const statusText = successModal.querySelector("p");
                    if (statusText) statusText.innerText = `Welcome ${user.displayName}! Google Authentication successful. Preparing dashboard...`;
                }

                setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 2000);

            } catch (error) {
                console.error("Google Authentication Exception: ", error.message);
                
                if (error.code !== "auth/popup-closed-by-user") {
                    // Strips unneeded domains errors to keep visual message output streamlined
                    if (error.code === "auth/unauthorized-domain") {
                        showErrorPopup("Authentication Error", "This local server domain running environment configuration is not authorized in your Firebase web app setting setup parameters.");
                    } else {
                        showErrorPopup("Authentication Error", "Invalid Credentials");
                    }
                }
                
                if (googleBtn) {
                    googleBtn.innerHTML = originalGoogleText;
                    googleBtn.disabled = false;
                }
            }
        });
    }
});