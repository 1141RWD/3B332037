import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getUserOrders } from './firebase_db.js';

const auth = getAuth();

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        const orderListEl = document.getElementById('order-list');

        if (!user) {
            orderListEl.innerHTML = '<p style="text-align: center;">請先登入以查看訂單。</p>';
            return;
        }

        try {
            const orders = await getUserOrders(user.uid);

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
                const statusColor = order.status === 'Processing' ? '#eab308' : (order.status === 'Shipped' ? '#22c55e' : '#64748b');
                const statusText = order.status === 'Processing' ? '處理中' : order.status;

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
                            ${order.items.map(item => `
                                <div class="order-item" style="display: flex; gap: 15px; margin-bottom: 10px; align-items: center;">
                                    <img src="${item.image}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; border: 1px solid #eee;">
                                    <div style="flex: 1;">
                                        <div style="font-size: 0.95rem; font-weight: 500;">${item.title}</div>
                                        <div style="font-size: 0.85rem; color: #666;">
                                            ${item.options && item.options.color ? `顏色: ${item.options.color} | ` : ''}
                                            數量: ${item.quantity}
                                        </div>
                                    </div>
                                    <div style="font-weight: 500;">NT$${item.price.toLocaleString()}</div>
                                </div>
                            `).join('')}
                        </div>

                        <div class="order-footer" style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #ddd; font-size: 0.9rem; color: #666; display: flex; justify-content: space-between;">
                           <div>付款方式：${order.paymentMethod === 'credit' ? '信用卡' : '貨到付款'}</div>
                           <div>運費：NT$${order.shippingFee}</div>
                        </div>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error("Error fetching orders:", error);
            orderListEl.innerHTML = '<p style="text-align: center; color: red;">無法載入訂單記錄，請稍後再試。</p>';
        }
    });
});
