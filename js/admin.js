import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    getUserRole,
    getAllUserRoles,
    setUserRole,
    getSellerRequests,
    resolveSellerRequest,
    db,
    addDoc,
    collection,
    serverTimestamp
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

        // Pass null for email so we don't overwrite it (firebase_db.js logic handles this now)
        await setUserRole(uid, newRole, null);

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
// ... (User Table Logic above)

// 3. Database Seeder
const btnSeedDb = document.getElementById('btn-seed-db');
if (btnSeedDb) {
    btnSeedDb.addEventListener('click', async () => {
        if (!confirm('確定要匯入範例商品嗎？這將會新增多個測試商品。')) return;

        try {
            if (typeof showToast === 'function') showToast('正在匯入商品...', 'info');
            btnSeedDb.disabled = true;
            await seedProducts();
            if (typeof showToast === 'function') showToast('匯入成功！請重整首頁查看。', 'success');
            else alert('匯入成功！請重整首頁查看。');
        } catch (e) {
            console.error(e);
            if (typeof showToast === 'function') showToast('匯入失敗: ' + e.message, 'error');
            else alert('匯入失敗: ' + e.message);
        } finally {
            btnSeedDb.disabled = false;
        }
    });
}

// 4. Data Repair (Sync Emails from Requests)
const btnSyncEmails = document.getElementById('btn-sync-emails');
if (btnSyncEmails) {
    btnSyncEmails.addEventListener('click', async () => {
        if (!confirm('這將會嘗試從「賣家申請紀錄」中找回遺失的 Email 資訊並更新到列表。\n確定要執行嗎？')) return;

        try {
            if (window.showToast) window.showToast('正在同步 Email...', 'info');
            btnSyncEmails.disabled = true;

            const { doc, getDoc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

            let count = 0;
            // Iterate over all loaded users
            for (const user of allUsers) {
                // Check if email is missing or looks like a status message
                if (!user.email || user.email === 'Approved-Request' || user.email === 'Admin-Panel-Update') {

                    // Try to find in seller_requests
                    const reqSnap = await getDoc(doc(db, "seller_requests", user.id));
                    if (reqSnap.exists()) {
                        const correctEmail = reqSnap.data().email;
                        if (correctEmail) {
                            // Update user_roles
                            await updateDoc(doc(db, "user_roles", user.id), {
                                email: correctEmail
                            });
                            count++;
                        }
                    }
                }
            }

            if (window.showToast) window.showToast(`同步完成！修復了 ${count} 筆資料`, 'success');
            else alert(`同步完成！修復了 ${count} 筆資料`);

            loadUserList(); // Reload UI

        } catch (e) {
            console.error(e);
            if (window.showToast) window.showToast('同步失敗: ' + e.message, 'error');
            else alert('同步失敗: ' + e.message);
        } finally {
            btnSyncEmails.disabled = false;
        }
    });
}



async function seedProducts() {
    const defaultProducts = [
        {
            title: "iPhone 17 Pro Max",
            price: 44900,
            image: "https://store.storeimages.cdn-apple.com/8756/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-naturaltitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1692845702708",
            category: "mobile",
            sold: 120,
            options: {
                colors: ["原色鈦金屬", "藍色鈦金屬", "白色鈦金屬", "黑色鈦金屬"],
                specs: ["256GB", "512GB", "1TB"],
                priceModifiers: { "512GB": 7000, "1TB": 14000 }
            }
        },
        {
            title: "PlayStation 5 Pro",
            price: 24280,
            image: "https://gmedia.playstation.com/is/image/SIEPDC/ps5-product-thumbnail-01-en-14sep20?$facebook$",
            category: "gaming",
            sold: 85,
            options: {
                colors: ["標準白", "午夜黑"],
                specs: ["數位版", "光碟版"],
                priceModifiers: { "光碟版": 3000 }
            }
        },
        {
            title: "Nintendo Switch OLED",
            price: 10480,
            image: "https://assets.nintendo.com/image/upload/f_auto/q_auto/dpr_1.5/c_scale,w_600/ncom/en_US/switch/site-design-update/hardware/switch/oled-model/gallery/white/01",
            category: "gaming",
            sold: 340,
            options: {
                colors: ["白色", "電光紅藍"],
                specs: ["標準版"]
            }
        },
        {
            title: "AirPods Pro 2",
            price: 7490,
            image: "https://store.storeimages.cdn-apple.com/8756/as-images.apple.com/is/MTJV3?wid=1144&hei=1144&fmt=jpeg&qlt=90&.v=1694014871985",
            category: "mobile",
            sold: 500,
            options: {
                colors: ["白色"],
                specs: ["USB-C"]
            }
        }
    ];

    const batchPromises = defaultProducts.map(p => {
        return addDoc(collection(db, 'products'), {
            ...p,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    });

    await Promise.all(batchPromises);
}
