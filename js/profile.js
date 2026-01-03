import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getUserOrders, cancelOrder, getProducts, hasUserUsedCoupon, validCoupons, hideOrder, unhideOrder } from './firebase_db.js?v=1';

const auth = getAuth();
let currentUserOrders = []; // Store ALL orders (Active + Hidden)
let productMap = {}; // Id -> Product Mapping
let isShowHidden = false; // State for filter

// Helper to resolve paths
const getPath = (page) => {
    const isPagesDir = window.location.pathname.includes('/pages/');
    if (page === 'index.html') return isPagesDir ? '../index.html' : 'index.html';
    return isPagesDir ? page : `pages/${page}`;
};

document.addEventListener('DOMContentLoaded', () => {
    // Modal Logic
    const modal = document.getElementById('orderModal');
    const closeBtn = document.querySelector('.close-modal');
    const closeViewBtn = document.querySelector('.btn-cancel-view');

    const closeModal = () => { if (modal) modal.style.display = 'none'; };
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (closeViewBtn) closeViewBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    onAuthStateChanged(auth, async (user) => {
        const orderListEl = document.getElementById('order-list');
        const couponListEl = document.querySelector('.coupon-list');
        const authContentWrapper = document.querySelector('.auth-content-wrapper');
        const toggleHiddenBtn = document.getElementById('toggle-hidden-orders-btn');

        if (!user) {
            orderListEl.innerHTML = '<p style="text-align: center;">請先登入以查看訂單。</p>';
            if (couponListEl) couponListEl.innerHTML = '';
            return;
        }

        // --- 1. Customer Service Section ---
        if (authContentWrapper && !document.getElementById('service-box')) {
            // ... (Keep existing injection code logic if implied)
        }

        // Helper to get Best Image
        const getDisplayImage = (item) => {
            const isSuspicious = !item.image || (!item.image.startsWith('http') && !item.image.startsWith('data:'));
            if (productMap[item.id]) {
                if (isSuspicious || productMap[item.id].image) return productMap[item.id].image;
            }
            if (item.id && typeof item.id === 'string') {
                const baseId = item.id.split('-')[0];
                if (productMap[baseId]) {
                    if (isSuspicious || productMap[baseId].image) return productMap[baseId].image;
                }
            }
            if (item.title) {
                const groupByTitle = Object.values(productMap).find(p => p.title === item.title);
                if (groupByTitle && (isSuspicious || groupByTitle.image)) return groupByTitle.image;
            }
            return isSuspicious ? 'https://via.placeholder.com/60?text=No+Img' : item.image;
        };

        const renderOrders = () => {
            // Filter based on state
            const filteredOrders = currentUserOrders.filter(o =>
                isShowHidden ? o.isHiddenForUser : !o.isHiddenForUser
            );

            // Update Toggle Button UI
            if (toggleHiddenBtn) {
                if (isShowHidden) {
                    toggleHiddenBtn.innerHTML = '<i class="fa-solid fa-list"></i> 查看一般訂單';
                    toggleHiddenBtn.style.color = 'var(--primary-color)';
                    toggleHiddenBtn.style.borderColor = 'var(--primary-color)';
                    toggleHiddenBtn.style.background = '#f0f9ff';
                } else {
                    toggleHiddenBtn.innerHTML = '<i class="fa-solid fa-eye-slash"></i> 查看已隱藏訂單';
                    toggleHiddenBtn.style.color = '#666';
                    toggleHiddenBtn.style.borderColor = '#ddd';
                    toggleHiddenBtn.style.background = 'white';
                }
            }

            if (filteredOrders.length === 0) {
                orderListEl.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <i class="fa-solid ${isShowHidden ? 'fa-eye-slash' : 'fa-box-open'}" style="font-size: 3rem; margin-bottom: 20px; color: #ddd;"></i>
                        <p>${isShowHidden ? '沒有已隱藏的訂單' : '您目前還沒有任何訂單喔！'}</p>
                        ${!isShowHidden ? `<a href="${getPath('index.html')}" style="display: inline-block; margin-top: 10px; color: var(--primary-color); text-decoration: none; font-weight: bold;">去逛逛商品 &rarr;</a>` : ''}
                    </div>
                `;
                return;
            }

            orderListEl.innerHTML = filteredOrders.map(order => {
                const date = order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleString() : '剛剛';
                let statusColor = '#64748b';
                let statusText = order.status;
                let canCancel = false;

                if (order.status === 'Processing') {
                    statusColor = '#eab308';
                    statusText = '處理中';
                    canCancel = true;
                } else if (order.status === 'Shipped') {
                    statusColor = '#22c55e';
                    statusText = '已出貨';
                } else if (order.status === 'Cancelled') {
                    statusColor = '#ef4444';
                    statusText = '已取消';
                }

                // Buttons Logic
                let buttonsHtml = `
                    <button class="view-order-btn" data-id="${order.id}" style="background: white; border: 1px solid #ddd; padding: 6px 12px; border-radius: 4px; cursor: pointer; color: #555;">
                        <i class="fa-solid fa-eye"></i> 查看詳情
                    </button>
                `;

                if (isShowHidden) {
                    // Hidden Mode: Show Restore
                    buttonsHtml += `
                        <button class="restore-order-btn" data-id="${order.id}" style="background: white; border: 1px solid #22c55e; padding: 6px 12px; border-radius: 4px; cursor: pointer; color: #22c55e; margin-left: 5px;" title="解除隱藏">
                            <i class="fa-solid fa-rotate-left"></i> 還原
                        </button>
                    `;
                } else {
                    // Active Mode: Show Cancel (if applicable) & Hide
                    if (canCancel) {
                        buttonsHtml += `
                            <button class="cancel-order-btn" data-id="${order.id}" style="background: white; border: 1px solid #ef4444; padding: 6px 12px; border-radius: 4px; cursor: pointer; color: #ef4444; margin-left: 5px;">
                                取消訂單
                            </button>
                        `;
                    }
                    buttonsHtml += `
                        <button class="hide-order-btn" data-id="${order.id}" style="background: white; border: 1px solid #9ca3af; padding: 6px 12px; border-radius: 4px; cursor: pointer; color: #6b7280; margin-left: 5px;" title="隱藏此訂單">
                            <i class="fa-solid fa-eye-slash"></i>
                        </button>
                    `;
                }

                return `
                    <div class="order-card" style="border: 1px solid #eee; border-radius: 8px; padding: 20px; margin-bottom: 20px; background: ${isShowHidden ? '#f9fafb' : '#fafafa'}; opacity: ${isShowHidden ? '0.9' : '1'};">
                        <div class="order-header" style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                            <div>
                                <div style="font-weight: bold; color: #333;">訂單編號：<span style="font-family: monospace;">${order.id}</span></div>
                                <div style="font-size: 0.85rem; color: #666; margin-top: 5px;">${date}</div>
                            </div>
                            <div style="text-align: right;">
                                <span style="background: ${statusColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: bold;">${statusText}</span>
                                <div style="font-weight: bold; color: var(--primary-color); font-size: 1.2rem; margin-top: 5px;">NT$${Math.round(order.total).toLocaleString()}</div>
                            </div>
                        </div>
                        
                        <div class="order-items">
                            ${order.items.slice(0, 2).map(item => `
                                <div class="order-item" style="display: flex; gap: 15px; margin-bottom: 10px; align-items: center;">
                                    <img src="${getDisplayImage(item)}" onerror="this.src='https://via.placeholder.com/50?text=No+Img'" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; border: 1px solid #eee;">
                                    <div style="flex: 1;">
                                        <div style="font-size: 0.95rem; font-weight: 500;">${item.title}</div>
                                        <div style="font-size: 0.85rem; color: #666;">x ${item.quantity}</div>
                                    </div>
                                </div>
                            `).join('')}
                            ${order.items.length > 2 ? `<div style="font-size: 0.85rem; color: #888; margin-left: 65px;">...還有 ${order.items.length - 2} 項商品</div>` : ''}
                        </div>

                        <div class="order-footer" style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #ddd; display: flex; justify-content: space-between; align-items: center;">
                           <div style="font-size: 0.9rem; color: #666;">付款方式：${order.paymentMethod === 'credit' ? '信用卡' : '貨到付款'}</div>
                           <div style="display: flex; gap: 0;">
                               ${buttonsHtml}
                           </div>
                        </div>
                    </div>
                `;
            }).join('');
        };

        // --- Seller Application Logic ---
        const initSellerApplication = async () => {
            const roleInput = document.getElementById('role');
            if (!roleInput) return;

            const roleValue = roleInput.value;

            // 1. Wait for Loading (Retry if not ready)
            if (roleValue === '載入中...' || roleValue === '') {
                setTimeout(initSellerApplication, 500);
                return;
            }

            const container = roleInput.parentElement;
            const existingBadge = document.getElementById('seller-status-badge');
            const existingBtn = document.getElementById('apply-seller-btn');

            // 2. If Admin or Seller, ensure no application UI is shown
            // (This fixes the bug where Admins see "Rejected" if the check ran too early)
            if (roleValue.includes('賣家') || roleValue.includes('Seller') || roleValue.includes('admin') || roleValue.includes('Admin')) {
                if (existingBadge) existingBadge.remove();
                if (existingBtn) existingBtn.remove();
                return;
            }

            // ... Proceed only if Customer ...

            try {
                const { getMySellerRequest, submitSellerRequest } = await import('./firebase_db.js?v=' + Date.now());
                const request = await getMySellerRequest(user.uid);

                // Remove existing status if any (to avoid duplicates if re-running)
                if (existingBadge) existingBadge.remove();
                if (existingBtn) existingBtn.remove();

                if (request && request.status === 'pending') {
                    const badge = document.createElement('span');
                    badge.id = 'seller-status-badge';
                    badge.innerHTML = '<i class="fa-solid fa-clock"></i> 賣家審核中';
                    badge.style.cssText = 'display: inline-block; margin-top: 5px; color: #f59e0b; font-size: 0.9rem; background: #fffbeb; padding: 4px 8px; border-radius: 4px; border: 1px solid #fcd34d;';
                    container.appendChild(badge);
                } else {
                    // Start: Logic for "No Request" OR "Rejected"

                    // If rejected, show badge first
                    if (request && request.status === 'rejected') {
                        const badge = document.createElement('span');
                        badge.id = 'seller-status-badge';
                        badge.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> 審核未通過';
                        badge.style.cssText = 'display: inline-block; margin-top: 5px; margin-right: 10px; color: #ef4444; font-size: 0.9rem; background: #fee2e2; padding: 4px 8px; border-radius: 4px; border: 1px solid #fca5a5;';
                        container.appendChild(badge);
                    }

                    // Check if actually a seller (double check)
                    // We'll trust the input value logic or just show the button and let backend reject if already seller.

                    const btn = document.createElement('button');
                    btn.id = 'apply-seller-btn';
                    const isReapply = (request && request.status === 'rejected');
                    btn.innerHTML = isReapply ? '<i class="fa-solid fa-rotate-right"></i> 重新申請' : '<i class="fa-solid fa-store"></i> 申請成為賣家';
                    btn.type = 'button';
                    btn.style.cssText = 'display: inline-block; margin-top: 5px; background: white; color: var(--primary-color); border: 1px solid var(--primary-color); padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 0.85rem; transition: all 0.2s;';

                    btn.onmouseover = () => { btn.style.background = 'var(--primary-color)'; btn.style.color = 'white'; };
                    btn.onmouseout = () => { btn.style.background = 'white'; btn.style.color = 'var(--primary-color)'; };

                    btn.onclick = async () => {
                        const promptMsg = isReapply ? '請輸入重新申請原因：' : '請輸入申請原因 (例如：我想販售二手手機)：';
                        const reason = prompt(promptMsg);
                        if (reason) {
                            try {
                                await submitSellerRequest(user, reason);
                                if (window.showToast) window.showToast('申請已送出！我們會盡快審核。', 'success');
                                else alert('申請已送出！');
                                btn.remove();
                                // Remove rejected badge if exists
                                const rejectedBadge = document.getElementById('seller-status-badge');
                                if (rejectedBadge) rejectedBadge.remove();

                                initSellerApplication(); // Re-render to show pending
                            } catch (e) {
                                console.error(e);
                                alert('申請失敗: ' + e.message);
                            }
                        }
                    };
                    container.appendChild(btn);
                }
            } catch (e) {
                console.error("Seller App Logic Error:", e);
            }
        };

        // Initial call
        initSellerApplication();




        // --- Event Listeners ---
        if (toggleHiddenBtn) {
            toggleHiddenBtn.addEventListener('click', () => {
                isShowHidden = !isShowHidden;
                renderOrders();
            });
        }

        // Consolidated Event Listener for Order List
        orderListEl.addEventListener('click', async (e) => {
            const target = e.target;

            // 1. Handle "Hide Order"
            const hideBtn = target.closest('.hide-order-btn');
            if (hideBtn) {
                e.stopPropagation();
                const orderId = hideBtn.dataset.id;

                const confirmFunc = window.showConfirm || confirm;
                if (!(await confirmFunc('確定要隱藏此訂單記錄嗎？\n\n隱藏後將不會出現在列表中，但商店端仍會有記錄。'))) return;

                try {
                    await hideOrder(orderId);
                    if (window.showToast) window.showToast('訂單已隱藏', 'success');
                    else console.log('訂單已隱藏');

                    // Update Local State & Re-render (Better than reload)
                    const order = currentUserOrders.find(o => o.id === orderId);
                    if (order) order.isHiddenForUser = true;
                    renderOrders();

                } catch (err) {
                    console.error(err);
                    if (window.showToast) window.showToast('隱藏失敗: ' + err.message, 'error');
                    else alert('隱藏失敗: ' + err.message);
                }
                return;
            }

            // 2. Handle "Restore Order" (Unhide)
            const restoreBtn = target.closest('.restore-order-btn');
            if (restoreBtn) {
                e.stopPropagation();
                const orderId = restoreBtn.dataset.id;

                // No confirm needed for restore usually, but let's be nice
                // Actually user might click by accident, maybe just direct restore with toast?
                // Let's just do it directly for better UX, or a quick confirm?
                // Direct restore is standard for "Undo" actions.
                try {
                    await unhideOrder(orderId);
                    if (window.showToast) window.showToast('訂單已還原', 'success');

                    // Update Local State & Re-render
                    const order = currentUserOrders.find(o => o.id === orderId);
                    if (order) order.isHiddenForUser = false;
                    renderOrders();

                } catch (err) {
                    console.error(err);
                    if (window.showToast) window.showToast('還原失敗: ' + err.message, 'error');
                    else alert('還原失敗');
                }
                return;
            }

            // 3. Handle "View Order"
            const viewBtn = target.closest('.view-order-btn');
            if (viewBtn) {
                openOrderModal(viewBtn.dataset.id);
                return;
            }

            // 4. Handle "Cancel Order"
            const cancelBtn = target.closest('.cancel-order-btn');
            if (cancelBtn) {
                const orderId = cancelBtn.dataset.id;

                const confirmFunc = window.showConfirm || confirm;
                if (!(await confirmFunc('確定要取消這筆訂單嗎？'))) return;

                try {
                    const { cancelOrder } = await import('./firebase_db.js');
                    await cancelOrder(orderId);
                    if (window.showToast) window.showToast('訂單已取消', 'success');
                    else alert('訂單已取消');
                    setTimeout(() => location.reload(), 500);
                } catch (e) {
                    if (window.showToast) window.showToast(e.message, 'error');
                    else alert(e.message);
                }
            }
        });


        try {
            // Fetch Orders (Include Hidden!) AND Products
            const [orders, products] = await Promise.all([
                getUserOrders(user.uid, true), // Pass true to get all
                getProducts()
            ]);

            // Build Product Map for fast lookup
            products.forEach(p => productMap[p.id] = p);

            // Client-side sorting (Newest first)
            orders.sort((a, b) => {
                const timeA = a.createdAt ? a.createdAt.seconds : 0;
                const timeB = b.createdAt ? b.createdAt.seconds : 0;
                return timeB - timeA;
            });

            currentUserOrders = orders; // Save to global variable
            renderOrders(); // Initial Render

        } catch (error) {
            console.error("Error fetching orders:", error);
            orderListEl.innerHTML = '<p style="text-align: center; color: red;">無法載入訂單記錄，請稍後再試。</p>';
        }
    });

    function openOrderModal(orderId) {
        const order = currentUserOrders.find(o => o.id === orderId);
        if (!order) return;

        const modalBody = document.getElementById('orderModalBody');
        const modal = document.getElementById('orderModal');

        const r = order.recipient;

        modalBody.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div>
                    <h3 style="font-size: 1rem; color: #666; margin-bottom: 10px;">收件資訊</h3>
                    <p><strong>姓名：</strong> ${r.lastName}${r.firstName}</p>
                    <p><strong>電話：</strong> ${r.phone}</p>
                    <p><strong>Email：</strong> ${r.email}</p>
                    <p><strong>地址：</strong> ${r.city}${r.district}${r.address}</p>
                </div>
                <div>
                     <h3 style="font-size: 1rem; color: #666; margin-bottom: 10px;">付款資訊</h3>
                     <p><strong>方式：</strong> ${order.paymentMethod === 'credit' ? '信用卡' : '貨到付款'}</p>
                     <p><strong>狀態：</strong> ${order.status}</p>
                     <h3 style="font-size: 1rem; color: #666; margin-bottom: 10px; margin-top: 15px;">金額計算</h3>
                     <p>小計：NT$${Math.round(order.subtotal).toLocaleString()}</p>
                     <p>運費：NT$${Math.round(order.shippingFee).toLocaleString()}</p>
                     <p style="color: #ef4444;">折扣：-NT$${Math.round(order.discount).toLocaleString()}</p>
                     <p style="font-weight: bold; font-size: 1.2rem; margin-top: 5px;">總計：NT$${Math.round(order.total).toLocaleString()}</p>
                </div>
            </div>
            
            <h3 style="font-size: 1rem; color: #666; margin-bottom: 10px; border-top: 1px solid #eee; padding-top: 15px;">商品清單</h3>
            <div style="max-height: 200px; overflow-y: auto;">
                 ${order.items.map(item => `
                    <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed #eee;">
                        <span style="flex: 2;">${item.title} x ${item.quantity}</span>
                         <span style="flex: 1; text-align: right;">NT$${item.price * item.quantity}</span>
                    </div>
                `).join('')}
            </div>
        `;

        modal.style.display = 'block';
    }
});
