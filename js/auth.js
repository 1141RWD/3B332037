// Firebase Authentication Logic
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    updatePassword,
    sendEmailVerification
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

        // reCAPTCHA Check
        const recaptchaResponse = grecaptcha.getResponse();
        if (recaptchaResponse.length === 0) {
            showToast('請勾選「我不是機器人」！', 'error');
            return;
        }

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm_password').value;

        if (password !== confirmPassword) {
            showToast('兩次密碼輸入不一致！', 'error');
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update Display Name
            await updateProfile(user, {
                displayName: name
            });

            // Send Verification Email
            await sendEmailVerification(user);

            // Force Sign Out
            await signOut(auth);

            showToast('註冊成功！驗證信已發送，請啟用帳號後登入。', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } catch (error) {
            let msg = '註冊失敗：' + error.message;
            if (error.code === 'auth/email-already-in-use') {
                msg = '此 Email 已經被註冊過了！';
            } else if (error.code === 'auth/weak-password') {
                msg = '密碼強度不足（至少6位數）';
            }
            showToast(msg, 'error');
        }
    });
}

// 2. Handle Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // reCAPTCHA Check
        const recaptchaResponse = grecaptcha.getResponse();
        if (recaptchaResponse.length === 0) {
            alert('請勾選「我不是機器人」！');
            return;
        }

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (!user.emailVerified) {
                // Determine if we should ask to resend
                const shouldResend = await showConfirm('您的帳號尚未通過驗證！\n\n請問您是否需要重新發送驗證信？\n(若不需要，請按取消並前往信箱收信)');
                if (shouldResend) {
                    try {
                        await sendEmailVerification(user);
                        showToast('✅ 驗證信已重新發送！請檢查您的信箱。', 'success');
                    } catch (emailError) {
                        // Sometimes fails if too many requests
                        showToast('發送失敗 (可能請求過於頻繁)：' + emailError.message, 'error');
                    }
                }

                await signOut(auth);
                return;
            }

            showToast('登入成功！', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
        } catch (error) {
            let msg = '登入失敗：' + error.message;
            if (error.code === 'auth/invalid-credential') {
                msg = '帳號或密碼錯誤！';
            }
            showToast(msg, 'error');
        }
    });
}

// 3. Handle Profile Update (profile.html)
const profileForm = document.getElementById('profileForm');
if (profileForm) {
    // Fill in current data when user loads
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const emailInput = document.getElementById('email');
            const nameInput = document.getElementById('displayName');
            if (emailInput) emailInput.value = user.email;
            if (nameInput) nameInput.value = user.displayName || '';
        } else {
            // Not logged in, redirect
            window.location.href = 'login.html';
        }
    });

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;

        const newName = document.getElementById('displayName').value;
        const newPassword = document.getElementById('newPassword').value;

        try {
            const updates = [];

            // Update Name
            if (newName !== user.displayName) {
                updates.push(updateProfile(user, { displayName: newName }));
            }

            // Update Password
            if (newPassword) {
                updates.push(updatePassword(user, newPassword));
            }

            if (updates.length > 0) {
                await Promise.all(updates);
                showToast('資料更新成功！', 'success');
                if (newPassword) {
                    showToast('密碼已修改，下次請使用新密碼登入。', 'info');
                }
                // Refresh to show new name
                setTimeout(() => window.location.reload(), 1000);
            } else {
                showToast('沒有資料被修改。', 'info');
            }
        } catch (error) {
            let msg = '更新失敗：' + error.message;
            if (error.code === 'auth/requires-recent-login') {
                msg = '為了安全，修改密碼需要重新登入後才能操作！請問您要現在重新登入嗎？';
                const shouldRelogin = await showConfirm(msg);
                if (shouldRelogin) {
                    await signOut(auth);
                    window.location.href = 'login.html';
                }
            } else {
                showToast(msg, 'error');
            }
        }
    });
}

// 4. Auth State Listener (Runs on every page)
onAuthStateChanged(auth, (user) => {
    const userLinks = document.querySelector('.user-links');
    if (userLinks) {
        if (user) {
            // Logged In
            const displayName = user.displayName || user.email.split('@')[0];
            userLinks.innerHTML = `
                <a href="profile.html" title="修改會員資料"><i class="fa-solid fa-user"></i> 歡迎回來! ${displayName}</a>
                <span>|</span>
                <a href="#" id="logoutBtn">登出</a>
            `;

            // Attach Logout Event Directly
            setTimeout(() => {
                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        console.log('Logout clicked');
                        try {
                            await signOut(auth);
                            window.location.href = 'index.html';
                        } catch (error) {
                            console.error("Logout failed:", error);
                            alert('登出失敗：' + error.message);
                        }
                    });
                }
            }, 0);

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

// Expose auth for debugging if needed (optional)
window.auth = auth;
