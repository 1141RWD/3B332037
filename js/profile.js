import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getUserOrders, cancelOrder, getProducts } from './firebase_db.js';

const auth = getAuth();
let currentUserOrders = []; // Store for modal access
let productMap = {}; // Id -> Product Mapping

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

        if (!user) {
            orderListEl.innerHTML = '<p style="text-align: center;">請先登入以查看訂單。</p>';
            return;
        }

        try {
            // Fetch Orders AND Products (for image repair)
            const [orders, products] = await Promise.all([
                getUserOrders(user.uid),
                getProducts()
            ]);

            // Build Product Map for fast lookup
            products.forEach(p => {
                productMap[p.id] = p;
            });

            // Client-side sorting (Newest first)
            orders.sort((a, b) => {
                const timeA = a.createdAt ? a.createdAt.seconds : 0;
                const timeB = b.createdAt ? b.createdAt.seconds : 0;
                return timeB - timeA;
            });

            currentUserOrders = orders; // Save to global variable

            if (orders.length === 0) {
                orderListEl.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <i class="fa-solid fa-box-open" style="font-size: 3rem; margin-bottom: 20px; color: #ddd;"></i>
                        <p>您目前還沒有任何訂單喔！</p>
                        <a href="index.html" style="display: inline-block; margin-top: 10px; color: var(--primary-color); text-decoration: none; font-weight: bold;">去逛逛商品 &rarr;</a>
                    </div>
                `;
                return;
            }

            // Render Orders
            orderListEl.innerHTML = orders.map(order => {
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

                // Helper to get Best Image
                // Helper to get Best Image
                const getDisplayImage = (item) => {
                    const isSuspicious = !item.image || (!item.image.startsWith('http') && !item.image.startsWith('data:'));

                    // 1. Try Exact ID Match (e.g. "1")
                    if (productMap[item.id]) {
                        if (isSuspicious || productMap[item.id].image) return productMap[item.id].image;
                    }

                    // 2. Try Composite ID Match (e.g. "1-Color" -> "1")
                    if (item.id && typeof item.id === 'string') {
                        const baseId = item.id.split('-')[0];
                        if (productMap[baseId]) {
                            if (isSuspicious || productMap[baseId].image) return productMap[baseId].image;
                        }
                    }

                    // 3. Try Title Match (Fallback)
                    if (item.title) {
                        const groupByTitle = Object.values(productMap).find(p => p.title === item.title);
                        if (groupByTitle && (isSuspicious || groupByTitle.image)) {
                            return groupByTitle.image;
                        }
                    }

                    // 4. Default Fallback
                    return isSuspicious ? 'https://via.placeholder.com/60?text=No+Img' : item.image;
                };

                return `
                    <div class="order-card" style="border: 1px solid #eee; border-radius: 8px; padding: 20px; margin-bottom: 20px; background: #fafafa;">
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
                           <div style="display: flex; gap: 10px;">
                               <button class="view-order-btn" data-id="${order.id}" style="background: white; border: 1px solid #ddd; padding: 6px 12px; border-radius: 4px; cursor: pointer; color: #555;">
                                   <i class="fa-solid fa-eye"></i> 查看詳情
                               </button>
                               ${canCancel ? `
                                   <button class="cancel-order-btn" data-id="${order.id}" style="background: white; border: 1px solid #ef4444; padding: 6px 12px; border-radius: 4px; cursor: pointer; color: #ef4444;">
                                       取消訂單
                                   </button>
                               ` : ''}
                           </div>
                        </div>
                    </div>
                `;
            }).join('');

            // Event Listeners for Buttons
            document.querySelectorAll('.view-order-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const orderId = e.target.closest('button').dataset.id;
                    openOrderModal(orderId);
                });
            });

            document.querySelectorAll('.cancel-order-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const orderId = e.target.closest('button').dataset.id;
                    const confirmed = await showConfirm('確定要取消這筆訂單嗎？\n\n取消後無法恢復，需要重新下單。');
                    if (confirmed) {
                        try {
                            await cancelOrder(orderId);
                            showToast('訂單已取消', 'success');
                            setTimeout(() => location.reload(), 500); // Slight delay for toast
                        } catch (err) {
                            showToast('取消失敗：' + err.message, 'error');
                        }
                    }
                });
            });

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
                     <p>小計：NT$${order.subtotal}</p>
                     <p>運費：NT$${order.shippingFee}</p>
                     <p style="color: #ef4444;">折扣：-NT$${order.discount}</p>
                     <p style="font-weight: bold; font-size: 1.2rem; margin-top: 5px;">總計：NT$${order.total}</p>
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
