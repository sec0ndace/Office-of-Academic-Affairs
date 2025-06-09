// Import Firebase functions from the modular SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getDatabase, ref, set, get, remove } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyCEf9If3R9r8F_JSXaxmtx0liqrMIODebo",
    authDomain: "office-of-student-affairs.firebaseapp.com",
    databaseURL: "https://office-of-student-affairs-default-rtdb.firebaseio.com/",
    projectId: "office-of-student-affairs",
    storageBucket: "office-of-student-affairs.appspot.com",
    messagingSenderId: "807502412285",
    appId: "1:807502412285:web:9dd217701e71750249c194"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Initialize EmailJS
emailjs.init("KO3rUQUeWw9YYY3xt");

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("contactForm");
    const emailInput = document.getElementById("emailInput");
    const sendOtpBtn = document.getElementById("sendOtpBtn");
    const verifyOtpBtn = document.getElementById("verifyOtpBtn");
    const otpInput = document.getElementById("otpInput");
    const otpSection = document.getElementById("otpSection");
    const result = document.getElementById("result");
    const statusMessage = document.getElementById("statusMessage");
    const submitBtn = document.getElementById("submitBtn");

    let verified = false;
    let verifiedEmail = "";

    // Send OTP
    sendOtpBtn.addEventListener("click", async () => {
        const email = emailInput.value.trim();
        statusMessage.textContent = "";

        if (!email) {
            statusMessage.textContent = "Please enter a valid email address.";
            statusMessage.style.color = "white";
            return;
        }

        const otp = Math.floor(100000 + Math.random() * 900000);
        const encodedEmail = email.replace(/@/g, "_").replace(/\./g, "_");

        try {
            statusMessage.textContent = "Generating OTP...";
            statusMessage.style.color = "white";

            const otpRef = ref(db, "otpoaa/" + encodedEmail);
            await set(otpRef, { otp: otp });

            statusMessage.textContent = "OTP stored. Sending email...";
            statusMessage.style.color = "orange";

            await emailjs.send("service_4j7ff6s", "template_rp0coeb", {
                to_email: email,
                otp_code: otp
            });

            otpSection.classList.remove("d-none");
            statusMessage.textContent = "OTP sent! Please check your email.";
            statusMessage.style.color = "white";

            sendOtpBtn.disabled = true;

        } catch (err) {
            console.error("Error during OTP process:", err);
            statusMessage.textContent = "Error sending OTP. Please try again.";
            statusMessage.style.color = "white";
        }
    });

    // Verify OTP
    verifyOtpBtn.addEventListener("click", async () => {
        const email = emailInput.value.trim();
        const enteredOtp = otpInput.value.trim();
        const encodedEmail = email.replace(/@/g, "_").replace(/\./g, "_");

        try {
            const otpRef = ref(db, "otpoaa/" + encodedEmail);
            const snapshot = await get(otpRef);

            if (snapshot.exists() && snapshot.val().otp == enteredOtp) {
                verified = true;
                verifiedEmail = email;
                result.textContent = "Email verified!";
                result.style.color = "white";

                submitBtn.disabled = false;
                emailInput.value = verifiedEmail;
                otpInput.value = "";
                await remove(otpRef);

                otpSection.classList.add("d-none");
            } else {
                result.textContent = "Invalid OTP. Please try again.";
                result.style.color = "white";
                otpInput.value = "";
            }
        } catch (error) {
            console.error("Error verifying OTP:", error);
            result.textContent = "Error verifying OTP. Please try again.";
            result.style.color = "red";
        }
    });

    // Submit contact form
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!verified) {
            result.textContent = "Please verify your email first.";
            result.style.color = "red";
            return;
        }

        const formData = new FormData(form);
        formData.set("email", verifiedEmail);

        const name = formData.get("name");
        formData.append("subject", `${name} sent a message from the website`);

        if (!formData.get("access_key")) {
            formData.set("access_key", "d1204e55-f9f4-42c6-8528-b98705749afc");
        }

        result.textContent = "Sending message...";
        result.style.display = "block";
        result.style.color = "white";

        try {
            const response = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                body: formData
            });

            const data = await response.json();
            console.log("Web3Forms response:", data);

            if (data.success) {
                result.textContent = "Message sent successfully!";
                result.style.color = "white";

                form.reset();
                otpSection.classList.add("d-none");
                statusMessage.textContent = "";
                otpInput.value = "";
                verified = false;
                verifiedEmail = "";
                submitBtn.disabled = true;
            } else {
                console.error("Web3Forms error:", data);
                result.textContent = "Error sending message. Please try again.";
                result.style.color = "white";
            }
        } catch (error) {
            console.error("Fetch error:", error);
            result.textContent = "Something went wrong!";
            result.style.color = "white";
        } finally {
            setTimeout(() => {
                result.style.display = "none";
            }, 3000);
        }
    });
});
