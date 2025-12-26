import { db, getProducts, addProduct, updateProduct, deleteProduct, getUserRole, setUserRole, getAllUserRoles } from './firebase_db.js?v=9';

import { onAuthStateChanged, getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Make admin helper available in console
window.setRole = setUserRole;

const auth = getAuth();

// 1. Auth Check
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userEmail = user.email;
        console.log("Checking permission for:", userEmail);

        // Check Role (Now includes whitelist check internally)
        const role = await getUserRole(user.uid, user.email);
        console.log("User Role:", role);

        if (role === 'admin' || role === 'seller') {
            if (role === 'admin') {
                const name = user.displayName || userEmail;
                if (typeof showToast === 'function') showToast(`歡迎超級管理員 ${name}`, 'success');
            }
            initDashboard();
        } else {
            alert(`抱歉，您 (${userEmail}) 的身份是 'customer'，無權進入賣家中心。\n請聯繫管理員協助。`);
            window.location.href = 'index.html';
        }
    } else {
        window.location.href = 'login.html';
    }
});

async function initDashboard() {
    loadProducts();
    loadProducts();
    // initUserManagement(); // Removed
}

// 2. Load & Render Products
async function loadProducts() {
    const listBody = document.getElementById('product-list');
    listBody.innerHTML = '<tr><td colspan="6" style="text-align:center">載入中...</td></tr>';

    try {
        const products = await getProducts();

        // Sort by CreatedAt desc (if available) or just by ID
        // products.sort((a, b) => b.id - a.id); 

        if (products.length === 0) {
            listBody.innerHTML = '<tr><td colspan="6" style="text-align:center">目前沒有商品</td></tr>';
            return;
        }

        listBody.innerHTML = products.map(p => `
            <tr>
                <td><img src="${p.image}" class="product-thumb" onerror="this.src='https://via.placeholder.com/60'"></td>
                <td>${p.title}</td>
                <td>NT$${p.price.toLocaleString()}</td>
                <td>${translateCategory(p.category)}</td>
                <td>${p.sold || 0}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editProduct('${p.id}')"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-btn delete-btn" onclick="removeProduct('${p.id}')"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
    `).join('');

        // Cache products for editing
        window.currentProducts = products;

    } catch (error) {
        console.error(error);
        showToast('載入商品失敗: ' + error.message, 'error');
        listBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red">載入失敗</td></tr>';
    }
}

// Helper: Translate Category
function translateCategory(cat) {
    const map = {
        'mobile': '手機平板',
        'computer': '電腦筆電',
        'fashion': '流行服飾',
        'beauty': '美妝保養',
        'gaming': '遊戲電玩',
        'lifestyle': '居家生活',
        'food': '美食保健',
        'auto': '汽機車百貨'
    };
    return map[cat] || cat;
}

// 3. Form Handling
const modal = document.getElementById('product-form-modal');
const form = document.getElementById('productForm');

window.openProductForm = function () {
    document.getElementById('form-title').textContent = '新增商品';
    document.getElementById('productId').value = '';
    form.reset();
    document.getElementById('p-colors').value = ''; // Reset options
    document.getElementById('p-specs').value = '';
    document.getElementById('p-image-file').value = ''; // Reset file input
    document.getElementById('p-image-preview').style.display = 'none'; // Hide preview
    document.getElementById('p-image-preview').src = '';
    modal.style.display = 'block';
};

window.closeProductForm = function () {
    modal.style.display = 'none';
};

window.editProduct = function (id) {
    const product = window.currentProducts.find(p => p.id == id);
    if (!product) return;

    document.getElementById('form-title').textContent = '編輯商品';
    document.getElementById('productId').value = product.id;
    document.getElementById('p-title').value = product.title;
    document.getElementById('p-image').value = product.image;

    // Show Preview
    const preview = document.getElementById('p-image-preview');
    if (product.image) {
        preview.src = product.image;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }

    document.getElementById('p-price').value = product.price;
    document.getElementById('p-category').value = product.category || 'mobile';
    document.getElementById('p-sold').value = product.sold || 0;

    // Load Options
    if (product.options) {
        document.getElementById('p-colors').value = product.options.colors ? product.options.colors.join(', ') : '';
        document.getElementById('p-specs').value = product.options.specs ? product.options.specs.join(', ') : '';
    } else {
        document.getElementById('p-colors').value = '';
        document.getElementById('p-specs').value = '';
    }
    document.getElementById('p-image-file').value = ''; // Reset file input

    modal.style.display = 'block';
};

window.removeProduct = async function (id) {
    const confirmFunc = window.showConfirm || confirm;
    if (!(await confirmFunc('確定要刪除這項商品嗎？此動作無法復原。'))) return;

    try {
        await deleteProduct(id);
        if (window.showToast) showToast('商品已刪除', 'success');
        else alert('商品已刪除');
        loadProducts(); // Reload list
    } catch (e) {
        if (window.showToast) showToast('刪除失敗: ' + e.message, 'error');
        else alert('刪除失敗: ' + e.message);
    }
};

// Image Upload Logic
// Image Upload Logic
function initImageUpload() {
    const fileInput = document.getElementById('p-image-file');
    if (!fileInput) {
        console.error("Critical Error: File input 'p-image-file' not found in DOM.");
        return;
    }

    fileInput.addEventListener('change', function (e) {
        console.log("File input changed"); // Debug log
        const file = e.target.files[0];
        if (!file) return;

        // Show processing toast
        if (typeof showToast === 'function') {
            showToast('正在處理圖片...', 'info');
        } else {
            console.log('正在處理圖片...');
        }

        const reader = new FileReader();
        reader.onload = function (event) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Resize logic (Max 800px)
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Compress to JPEG 0.7
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

                // Set to input
                document.getElementById('p-image').value = dataUrl;

                // Update Preview
                const preview = document.getElementById('p-image-preview');
                if (preview) {
                    preview.src = dataUrl;
                    preview.style.display = 'block';
                }

                if (typeof showToast === 'function') {
                    showToast('圖片已壓縮並準備就緒', 'success');
                }
            };
            img.onerror = function (err) {
                console.error("Image load error", err);
                alert("圖片讀取失敗");
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Call init when script runs (deferred) or DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initImageUpload);
} else {
    initImageUpload();
}

// URL Input Preview Listener
document.getElementById('p-image').addEventListener('input', function (e) {
    const url = e.target.value;
    const preview = document.getElementById('p-image-preview');
    if (url) {
        preview.src = url;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }
});


form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('productId').value;

    // Parse Options
    const colorsInput = document.getElementById('p-colors').value;
    const specsInput = document.getElementById('p-specs').value;

    const specsRaw = specsInput ? specsInput.split(',').map(s => s.trim()).filter(s => s) : [];
    const specs = [];
    const priceModifiers = {};

    specsRaw.forEach(rawSpec => {
        // Match "Name : + 3000" or "Name : 3000" or "Name:+3000"
        // Regex: /[:：]\s*\+?\s*(\d+)/
        // But simpler: look for the last colon
        const separatorIdx = rawSpec.lastIndexOf(':');

        let processed = false;
        if (separatorIdx > -1) {
            const specPart = rawSpec.substring(0, separatorIdx);
            const pricePart = rawSpec.substring(separatorIdx + 1);

            // Check if pricePart is a valid number (allowing + sign)
            const priceClean = pricePart.replace('+', '').trim();
            const addPrice = parseInt(priceClean);

            if (!isNaN(addPrice) && specPart.trim().length > 0) {
                const cleanName = specPart.trim();
                specs.push(cleanName);
                priceModifiers[cleanName] = addPrice;
                processed = true;
            }
        }

        if (!processed) {
            specs.push(rawSpec);
        }
    });

    const options = {
        colors: colorsInput ? colorsInput.split(',').map(s => s.trim()).filter(s => s) : [],
        specs: specs,
        priceModifiers: priceModifiers
    };

    const data = {
        title: document.getElementById('p-title').value,
        image: document.getElementById('p-image').value,
        price: Number(document.getElementById('p-price').value),
        category: document.getElementById('p-category').value,
        sold: Number(document.getElementById('p-sold').value),
        soldDisplay: Number(document.getElementById('p-sold').value) + "+",
        options: options // Save options
    };

    try {
        if (id) {
            // Update
            await updateProduct(id, data);
            showToast('商品更新成功！', 'success');
        } else {
            // Add
            await addProduct(data);
            showToast('商品新增成功！', 'success');
        }
        closeProductForm();
        loadProducts(); // Reload list
    } catch (error) {
        showToast('儲存失敗: ' + error.message, 'error');
    }
});

// 5. Migration Tool
window.migrateImagesToDB = async function () {
    const btn = document.getElementById('btn-migrate');
    const log = document.getElementById('migration-log');

    const confirmFunc = window.showConfirm || confirm;
    if (!(await confirmFunc('這將會掃描所有商品，下載舊圖片並重新上傳到資料庫。確定要執行嗎？'))) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 處理中...';
    log.innerHTML = '<div>開始掃描...</div>';

    try {
        const products = window.currentProducts || await getProducts();
        let count = 0;

        for (const p of products) {
            // Check if it's a local path (simple check)
            if (p.image && !p.image.startsWith('data:') && !p.image.startsWith('http') && (p.image.includes('images/') || !p.image.includes('/'))) {
                log.innerHTML += `<div> 正在處理: ${p.title} (${p.image})...</div>`;

                try {
                    // Fetch the image
                    const res = await fetch(p.image);
                    if (!res.ok) throw new Error('無法讀取檔案');
                    const blob = await res.blob();

                    // Convert & Compress
                    const base64 = await compressBlob(blob);

                    // Update DB
                    await updateProduct(p.id, { image: base64 });
                    log.innerHTML += `<div style="color: green;"> -> 成功存入資料庫</div>`;
                    count++;
                } catch (err) {
                    console.error(err);
                    log.innerHTML += `<div style="color: red;"> -> 失敗: ${err.message}</div>`;
                }
            }
        }

        log.innerHTML += `<div style="font-weight: bold; margin-top: 5px;"> 處理完成！共更新了 ${count} 個商品。</div>`;
        if (window.showToast) showToast(`遷移完成！更新了 ${count} 個圖片`, 'success');

        // Refresh list
        loadProducts();

    } catch (e) {
        if (window.showToast) showToast('遷移過程發生錯誤', 'error');
        console.error(e);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> 轉換所有舊圖片到資料庫';
    }
};

// Helper: Compress Blob to Base64
function compressBlob(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (event) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX = 800;

                if (width > height) {
                    if (width > MAX) { height *= MAX / width; width = MAX; }
                } else {
                    if (height > MAX) { width *= MAX / height; height = MAX; }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = (e) => reject(new Error('Image decode failed'));
            img.src = event.target.result;
        };
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(blob);
    });
}

// Window click to close modal
// Window click to close modal
// window.onclick = function (event) {
//    if (event.target == modal) {
//        closeProductForm();
//    }
// };



