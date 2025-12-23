// Firebase Authentication Logic
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBOa0xVWz3Say6JA_RNmyuGbxFVk8I3P7s",
    authDomain: "bluecore-bb865.firebaseapp.com",
    projectId: "bluecore-bb865",
    storageBucket: "bluecore-bb865.firebasestorage.app",
    messagingSenderId: "283345381458",
    appId: "1:283345381458:web:22bb6f6112c360d194d78b",
    measurementId: "G-F4XEDMDVT3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 1. Handle Register
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm_password').value;

        if (password !== confirmPassword) {
            alert('兩次密碼輸入不一致！');
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update Display Name
            await updateProfile(user, {
                displayName: name
            });

            alert('註冊成功！歡迎加入 BlueCore');
            window.location.href = 'index.html';
        } catch (error) {
            let msg = '註冊失敗：' + error.message;
            if (error.code === 'auth/email-already-in-use') {
                msg = '此 Email 已經被註冊過了！';
            } else if (error.code === 'auth/weak-password') {
                msg = '密碼強度不足（至少6位數）';
            }
            alert(msg);
        }
    });
}

// 2. Handle Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            alert('登入成功！');
            window.location.href = 'index.html';
        } catch (error) {
            let msg = '登入失敗：' + error.message;
            if (error.code === 'auth/invalid-credential') {
                msg = '帳號或密碼錯誤！';
            }
            alert(msg);
        }
    });
}

// 3. Auth State Listener (Runs on every page)
onAuthStateChanged(auth, (user) => {
    const userLinks = document.querySelector('.user-links');
    if (userLinks) {
        if (user) {
            // Logged In
            const displayName = user.displayName || user.email.split('@')[0];
            userLinks.innerHTML = `
                <span><i class="fa-solid fa-user"></i> ${displayName}</span>
                <span>|</span>
                <a href="#" id="logoutBtn">登出</a>
            `;
        } else {
            // Logged Out (Reset to default)
            userLinks.innerHTML = `
                <a href="register.html">註冊</a>
                <span>|</span>
                <a href="login.html">登入</a>
            `;
        }
    }
});

// 4. Global Event Listener for Logout (Event Delegation)
document.addEventListener('click', async (e) => {
    if (e.target && e.target.id === 'logoutBtn') {
        e.preventDefault();
        try {
            await signOut(auth);
            // alert('已登出'); 
            window.location.reload();
        } catch (error) {
            console.error("Logout failed:", error);
            alert('登出失敗，請稍後再試');
        }
    }
});

// Expose auth for debugging if needed (optional)
window.auth = auth;
