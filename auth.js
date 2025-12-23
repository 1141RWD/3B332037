// Authentication Logic

document.addEventListener('DOMContentLoaded', () => {
    // 1. Handle Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // Simulating API Call
            setTimeout(() => {
                // Determine user data
                const storedUser = JSON.parse(localStorage.getItem('user_' + email));

                if (storedUser && storedUser.password === password) {
                    // Login Success
                    loginUser(storedUser);
                } else {
                    // Quick hack for demo if no user registered, allow test/test
                    if (email === 'test@example.com' && password === 'test') {
                        loginUser({ name: '測試會員', email: 'test@example.com' });
                    } else {
                        alert('帳號或密碼錯誤！');
                    }
                }
            }, 500);
        });
    }

    // 2. Handle Register Form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm_password').value;

            // Validation
            if (password !== confirmPassword) {
                alert('兩次密碼輸入不一致！');
                return;
            }

            // Check if already exists
            if (localStorage.getItem('user_' + email)) {
                alert('這個 Email 已經被註冊過了！');
                return;
            }

            // Register
            const newUser = { name, email, password };
            localStorage.setItem('user_' + email, JSON.stringify(newUser));

            alert('註冊成功！請登入');
            window.location.href = 'login.html';
        });
    }

    // 3. Check Auth Status (Run on every page)
    checkAuthStatus();
});

function loginUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    alert('登入成功！歡迎回來 ' + user.name);
    window.location.href = 'index.html';
}

function logoutUser() {
    localStorage.removeItem('currentUser');
    window.location.reload();
}

function checkAuthStatus() {
    const userLinks = document.querySelector('.user-links');
    if (!userLinks) return;

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (currentUser) {
        // User is logged in
        userLinks.innerHTML = `
            <span><i class="fa-solid fa-user"></i> ${currentUser.name}</span>
            <span>|</span>
            <a href="#" onclick="logoutUser()">登出</a>
        `;
    } else {
        // User is guest
        // Ensure index.html links point to the right pages
        // This part is static HTML in index.html usually, but we can verify
    }
}
