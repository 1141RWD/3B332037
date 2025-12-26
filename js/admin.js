import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    getUserRole,
    getAllUserRoles,
    setUserRole,
    getSellerRequests,
    resolveSellerRequest
} from './firebase_db.js';

const auth = getAuth();

// State
let allUsers = [];
let currentUserRole = null;

// DOM Elements
const sellerRequestsContainer = document.getElementById('seller-requests-container');
const userListBody = document.getElementById('user-list-body');
const searchInput = document.getElementById('userLinkSearch');
const roleModal = document.getElementById('roleModal');
const modalUid = document.getElementById('modalUid');
const modalRoleSelect = document.getElementById('modalRoleSelect');
const saveRoleBtn = document.getElementById('saveRoleBtn');

// Initialize
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            currentUserRole = await getUserRole(user.uid, user.email);
            if (currentUserRole !== 'admin') {
                alert('權限不足：您不是管理員！');
                window.location.href = 'index.html';
                return;
            }
            // Is Admin
            initAdminPage();
        } catch (e) {
            console.error("Auth check failed", e);
            window.location.href = 'index.html';
        }
    } else {
        window.location.href = 'login.html';
    }
});

async function initAdminPage() {
    console.log("Admin Loaded");
    await loadSellerRequests();
    await loadUserList();
}

// 1. Seller Requests Logic
async function loadSellerRequests() {
    sellerRequestsContainer.innerHTML = '<p style="color:#666;">載入中...</p>';
    try {
        const requests = await getSellerRequests();
        if (requests.length === 0) {
            sellerRequestsContainer.innerHTML = '<p class="text-gray-500">目前沒有待審核的申請。</p>';
            return;
        }

        sellerRequestsContainer.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>申請人 (Email)</th>
                        <th>申請原因</th>
                        <th>申請時間</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${requests.map(req => `
                        <tr>
                            <td>${req.email}<br><small style="color:#888;">${req.uid}</small></td>
                            <td>${req.reason || '無'}</td>
                            <td>${req.createdAt ? new Date(req.createdAt.seconds * 1000).toLocaleDateString() : '-'}</td>
                            <td>
                                <button class="btn-action btn-approve" onclick="handleRequest('${req.uid}', true)">通過</button>
                                <button class="btn-action btn-reject" onclick="handleRequest('${req.uid}', false)">拒絕</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        sellerRequestsContainer.innerHTML = `<p style="color:red;">載入失敗: ${e.message}</p>`;
    }
}

window.handleRequest = async (uid, isApproved) => {
    const confirmFunc = window.showConfirm || confirm;
    const msg = isApproved ? `確定要通過此賣家申請嗎？` : `確定要拒絕此申請嗎？`;

    if (!(await confirmFunc(msg))) return;

    try {
        await resolveSellerRequest(uid, isApproved);
        if (window.showToast) window.showToast('處理完成！', 'success');
        else alert('處理完成！');

        loadSellerRequests(); // Refresh
        loadUserList(); // Refresh roles list too
    } catch (e) {
        if (window.showToast) window.showToast('處理失敗: ' + e.message, 'error');
        else alert('處理失敗: ' + e.message);
    }
};

// 2. User Roles Logic
async function loadUserList() {
    try {
        allUsers = await getAllUserRoles();
        renderUserTable(allUsers);
    } catch (e) {
        userListBody.innerHTML = `<tr><td colspan="4" style="color:red; text-align:center;">讀取失敗: ${e.message}</td></tr>`;
    }
}

function renderUserTable(users) {
    if (users.length === 0) {
        userListBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">沒有找到符合的用戶</td></tr>`;
        return;
    }

    // Sort: Admins first, then Sellers
    const sorted = [...users].sort((a, b) => {
        const roles = { 'admin': 3, 'seller': 2, 'customer': 1 };
        return (roles[b.role] || 0) - (roles[a.role] || 0);
    });

    userListBody.innerHTML = sorted.map(u => {
        let badgeClass = 'bg-customer';
        if (u.role === 'admin') badgeClass = 'bg-admin';
        if (u.role === 'seller') badgeClass = 'bg-seller';

        return `
            <tr>
                <td>
                    <div style="font-weight:bold;">${u.email || 'No Email'}</div>
                    <div style="font-size:0.85em; color:#888;">${u.uid || u.id}</div>
                </td>
                <td><span class="status-badge ${badgeClass}">${u.role || 'customer'}</span></td>
                <td>${u.updatedAt ? new Date(u.updatedAt.seconds * 1000).toLocaleString() : '-'}</td>
                <td>
                    <button class="btn-action btn-edit" onclick="openRoleModal('${u.id || u.uid}', '${u.role || 'customer'}')">
                        <i class="fa-solid fa-pen"></i> 編輯
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Search Logic
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    if (!term) {
        renderUserTable(allUsers);
        return;
    }
    const filtered = allUsers.filter(u =>
        (u.email && u.email.toLowerCase().includes(term)) ||
        (u.uid && u.uid.toLowerCase().includes(term)) ||
        (u.id && u.id.toLowerCase().includes(term))
    );
    renderUserTable(filtered);
});

// Modal Logic
window.openRoleModal = (uid, currentRole) => {
    modalUid.value = uid;
    modalRoleSelect.value = currentRole;
    roleModal.style.display = 'block';
};

document.querySelector('.close-modal').addEventListener('click', () => {
    roleModal.style.display = 'none';
});

window.onclick = (event) => {
    if (event.target == roleModal) {
        roleModal.style.display = "none";
    }
};

saveRoleBtn.addEventListener('click', async () => {
    const uid = modalUid.value;
    const newRole = modalRoleSelect.value;
    const originalBtnText = saveRoleBtn.innerHTML;

    try {
        saveRoleBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 儲存中...';
        saveRoleBtn.disabled = true;

        await setUserRole(uid, newRole, 'Admin-Panel-Update');

        if (window.showToast) window.showToast('權限設定成功！', 'success');
        else alert('權限設定成功！');

        roleModal.style.display = 'none';
        loadUserList(); // Refresh
    } catch (e) {
        if (window.showToast) window.showToast('設定失敗: ' + e.message, 'error');
        else alert('設定失敗: ' + e.message);
    } finally {
        saveRoleBtn.innerHTML = originalBtnText;
        saveRoleBtn.disabled = false;
    }
});
