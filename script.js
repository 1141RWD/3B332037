// Product data loaded from products.js

// DOM Elements
const productGrid = document.querySelector('.product-grid');
const cartBtn = document.getElementById('cart-btn');
const cartDropdown = document.getElementById('cart-dropdown');
const cartItemsContainer = document.getElementById('cart-items');
const cartCountElement = document.querySelector('.cart-count');
const cartTotalElement = document.querySelector('.total-price span');

// State
let cart = [];

// Functions
function formatCurrency(amount) {
    return 'NT$' + amount.toLocaleString();
}

// Render Products
function renderProducts(filterCategory = 'all') {
    if (!productGrid) return;

    let filteredProducts = products;
    if (filterCategory !== 'all') {
        filteredProducts = products.filter(p => p.category === filterCategory);
    }

    if (filteredProducts.length === 0) {
        productGrid.innerHTML = '<div class="no-products">此分類暫無商品</div>';
        return;
    }

    productGrid.innerHTML = filteredProducts.map(product => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.title}" class="product-image" onclick="openProductModal(${product.id})" style="cursor: pointer">
            <div class="product-info">
                <h3 class="product-title" onclick="openProductModal(${product.id})" style="cursor: pointer">${product.title}</h3>
                <div class="product-price">${formatCurrency(product.price)}</div>
                <div class="product-meta">
                    <span>Sold ${product.sold}</span>
                    <span>📍 TW</span>
                </div>
                <button class="add-to-cart-btn" onclick="openProductModal(${product.id})" style="
                    margin-top: 15px;
                    width: 100%;
                    padding: 10px;
                    background: var(--white);
                    color: var(--primary-color);
                    border: 2px solid var(--primary-color);
                    cursor: pointer;
                    font-size: 0.95rem;
                    font-weight: 600;
                    border-radius: 8px;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                " onmouseover="this.style.background='var(--primary-color)'; this.style.color='white'" onmouseout="this.style.background='white'; this.style.color='var(--primary-color)'">
                    <i class="fa-solid fa-cart-plus"></i> 加入購物車
                </button>
            </div>
        </div>
    `).join('');
}

// Modal State
let currentModalProduct = null;
let selectedOptions = {};

// Modal Functions
function openProductModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    currentModalProduct = product;
    selectedOptions = {}; // Reset selections

    const modal = document.getElementById('product-modal');
    const modalBody = document.getElementById('modal-body');

    // Generate Options HTML
    let optionsHtml = '';
    if (product.options) {
        if (product.options.colors && product.options.colors.length > 0) {
            optionsHtml += `
            <div class="modal-option-group">
                <label class="modal-option-label">顏色 / Color</label>
                <div class="modal-options">
                    ${product.options.colors.map(color =>
                `<button class="option-btn" onclick="selectOption('color', '${color}', this)">${color}</button>`
            ).join('')}
                </div>
            </div>`;
        }
        if (product.options.specs && product.options.specs.length > 0) {
            optionsHtml += `
            <div class="modal-option-group">
                <label class="modal-option-label">規格 / Spec</label>
                <div class="modal-options">
                    ${product.options.specs.map(spec =>
                `<button class="option-btn" onclick="selectOption('spec', '${spec}', this)">${spec}</button>`
            ).join('')}
                </div>
            </div>`;
        }
    }

    modalBody.innerHTML = `
        <div class="modal-grid">
            <div class="modal-image-col">
                <img src="${product.image}" alt="${product.title}">
            </div>
            <div class="modal-info-col">
                <h2 class="modal-title">${product.title}</h2>
                <div class="modal-price">${formatCurrency(product.price)}</div>
                
                ${optionsHtml}

                <div class="modal-actions">
                    <button class="add-to-cart-modal-btn" onclick="addToCartFromModal()">
                        <i class="fa-solid fa-cart-plus"></i> 加入購物車
                    </button>
                </div>
            </div>
        </div>
    `;

    modal.style.display = 'block';
    // Disable body scroll
    document.body.style.overflow = 'hidden';

    // Auto-select first options if available
    const firstBtns = modalBody.querySelectorAll('.modal-option-group');
    firstBtns.forEach(group => {
        const btn = group.querySelector('.option-btn');
        if (btn) btn.click();
    });
}

function selectOption(type, value, btnElement) {
    selectedOptions[type] = value;

    // UI Update
    const siblings = btnElement.parentElement.children;
    for (let btn of siblings) {
        btn.classList.remove('selected');
    }
    btnElement.classList.add('selected');

    // Price Update
    if (typeof updateModalPrice === 'function') {
        updateModalPrice();
    }
}

function updateModalPrice() {
    if (!currentModalProduct) return;

    let finalPrice = currentModalProduct.price;
    const modifiers = currentModalProduct.options ? currentModalProduct.options.priceModifiers : null;

    if (modifiers) {
        Object.values(selectedOptions).forEach(selectedValue => {
            if (modifiers[selectedValue]) {
                finalPrice += modifiers[selectedValue];
            }
        });
    }

    const priceEl = document.querySelector('.modal-price');
    if (priceEl) {
        priceEl.textContent = formatCurrency(finalPrice);

        // Visual feedback
        priceEl.style.transition = 'transform 0.2s, color 0.2s';
        priceEl.style.transform = 'scale(1.1)';
        priceEl.style.color = 'var(--primary-dark)';
        setTimeout(() => {
            priceEl.style.transform = 'scale(1)';
            priceEl.style.color = 'var(--primary-color)';
        }, 200);
    }
}

function addToCartFromModal() {
    if (!currentModalProduct) return;

    // Calculate Dynamic Price
    let finalPrice = currentModalProduct.price;
    const modifiers = currentModalProduct.options ? currentModalProduct.options.priceModifiers : null;

    if (modifiers) {
        Object.values(selectedOptions).forEach(selectedValue => {
            if (modifiers[selectedValue]) {
                finalPrice += modifiers[selectedValue];
            }
        });
    }

    // Validate if options are selected (primitive check)
    // For now, we assume auto-select works or user selects. 
    // You could force check here.

    // Create a variant title
    let variantTitle = currentModalProduct.title;
    const variants = [];
    if (selectedOptions.color) variants.push(selectedOptions.color);
    if (selectedOptions.spec) variants.push(selectedOptions.spec);

    if (variants.length > 0) {
        variantTitle += ` (${variants.join(' - ')})`;
    }

    // Unique ID for cart item based on variants
    const cartItemId = `${currentModalProduct.id}-${variants.join('-')}`;

    const cartItem = {
        ...currentModalProduct,
        id: cartItemId, // Override ID for cart distinctness
        originalId: currentModalProduct.id,
        title: variantTitle,
        price: finalPrice, // Use dynamic price
        quantity: 1
    };

    performAddToCart(cartItem);

    // Close Modal
    document.getElementById('product-modal').style.display = 'none';
    document.body.style.overflow = 'auto';

    // Trigger Fly Animation from Modal Image (optional, requires finding the element)
    // Just pulse cart for now
    const cartIcon = document.querySelector('.cart-icon');
    cartIcon.style.transform = 'scale(1.2)';
    setTimeout(() => cartIcon.style.transform = 'scale(1)', 200);
}

// Close Modal Logic
document.querySelector('.close-modal').addEventListener('click', () => {
    document.getElementById('product-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
});

window.onclick = function (event) {
    const modal = document.getElementById('product-modal');
    if (event.target == modal) {
        modal.style.display = "none";
        document.body.style.overflow = 'auto';
    }
}

// Expose functions
window.openProductModal = openProductModal;
window.selectOption = selectOption;
window.addToCartFromModal = addToCartFromModal;


// Cart Logic
function addToCart(productId, event) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // 1. Add to cart immediately (so logic never fails)
    performAddToCart(product);

    // 2. Visual Effect
    if (event) {
        const btn = event.currentTarget || event.target;
        const card = btn.closest('.product-card');
        const img = card.querySelector('.product-image');

        if (img) {
            runFlyAnimation(img);
        }
    }
}

function runFlyAnimation(sourceImg) {
    const cartIcon = document.querySelector('.cart-icon');
    if (!cartIcon) return;

    // Create clone
    const flyer = sourceImg.cloneNode(true);
    flyer.classList.add('fly-item');

    const startRect = sourceImg.getBoundingClientRect();
    const endRect = cartIcon.getBoundingClientRect();

    // Initial State
    Object.assign(flyer.style, {
        top: `${startRect.top}px`,
        left: `${startRect.left}px`,
        width: `${startRect.width}px`,
        height: `${startRect.height}px`,
        opacity: '1'
    });

    document.body.appendChild(flyer);

    // Force Reflow
    requestAnimationFrame(() => {
        // Target State
        Object.assign(flyer.style, {
            top: `${endRect.top + 10}px`,
            left: `${endRect.left + 10}px`,
            width: '20px',
            height: '20px',
            opacity: '0' // Fade out at end
        });
    });

    // Cleanup - use setTimeout as backup for transitionend
    const cleanup = () => {
        if (flyer.parentNode) {
            flyer.remove();
            // Pulse Cart
            cartIcon.style.transform = 'scale(1.2)';
            setTimeout(() => cartIcon.style.transform = 'scale(1)', 200);
        }
    };

    flyer.addEventListener('transitionend', cleanup);
    setTimeout(cleanup, 1000); // Safety net (longer than css transition 0.8s)
}

function performAddToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    updateCartUI();
}

function updateCartUI() {
    // Update Count
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountElement.textContent = totalCount;

    // Update List
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart-msg">購物車是空的</div>';
        cartTotalElement.textContent = formatCurrency(0);
    } else {
        cartItemsContainer.innerHTML = cart.map((item, index) => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.title}">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.title}</div>
                    <div class="cart-item-price">${formatCurrency(item.price)} x ${item.quantity}</div>
                </div>
                <button class="remove-cart-item-btn" onclick="removeFromCart('${item.id}', event)">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `).join('');

        // Update Total
        const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotalElement.textContent = formatCurrency(totalAmount);
    }
}

function removeFromCart(cartItemId, event) {
    if (event) {
        event.stopPropagation();
    }

    // Find index of item
    // cartItemId could be number (for simple products) or string (for variants)
    const index = cart.findIndex(item => item.id == cartItemId);

    if (index !== -1) {
        cart.splice(index, 1);
        updateCartUI();
    }
}

window.removeFromCart = removeFromCart;

// Expose addToCart to global scope for onclick handler
window.addToCart = addToCart;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initial Render
    renderProducts();

    // Category Toggle
    const categoryToggle = document.getElementById('categories-toggle');
    const categoryList = document.getElementById('categories-list');

    // Category Names Mapping
    const categoryNames = {
        'all': '熱銷推薦',
        'mobile': '手機平板',
        'computer': '電腦筆電',
        'fashion': '流行服飾',
        'beauty': '美妝保養',
        'gaming': '遊戲電玩',
        'lifestyle': '居家生活',
        'food': '美食保健',
        'auto': '汽機車百貨'
    };

    // Category Icons Mapping
    const categoryIcons = {
        'all': 'fa-fire',
        'mobile': 'fa-mobile-screen',
        'computer': 'fa-laptop',
        'fashion': 'fa-shirt',
        'beauty': 'fa-pump-soap',
        'gaming': 'fa-gamepad',
        'lifestyle': 'fa-couch',
        'food': 'fa-utensils',
        'auto': 'fa-car'
    };

    if (categoryToggle && categoryList) {
        // Toggle Collapse
        categoryToggle.addEventListener('click', () => {
            const sidebar = categoryToggle.closest('.sidebar');
            categoryList.classList.toggle('collapsed');
            categoryToggle.classList.toggle('collapsed');
            if (sidebar) {
                sidebar.classList.toggle('collapsed');
            }
        });

        // Category Filtering
        const categoryLinks = categoryList.querySelectorAll('a');
        categoryLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();

                // Active State
                categoryLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                // Filter
                const category = link.getAttribute('data-category');
                renderProducts(category);

                // Update Section Title
                const sectionTitle = document.querySelector('.section-title');
                if (sectionTitle) {
                    const iconClass = categoryIcons[category] || 'fa-tag';
                    const name = categoryNames[category] || '商品列表';
                    sectionTitle.innerHTML = `<i class="fa-solid ${iconClass}" style="color: var(--primary-color)"></i> ${name}`;

                    // Add subtle animation to title
                    sectionTitle.style.animation = 'none';
                    sectionTitle.offsetHeight; /* trigger reflow */
                    sectionTitle.style.animation = 'fadeIn 0.5s ease-out';
                }

                // On mobile, might want to auto-collapse
                if (window.innerWidth < 768) {
                    categoryList.classList.add('collapsed');
                    categoryToggle.classList.add('collapsed');
                }
            });
        });
    }

    // Search Functionality
    const searchInput = document.querySelector('.search-bar input');
    const searchBtn = document.querySelector('.search-bar button');

    function performSearch() {
        const query = searchInput.value.trim().toLowerCase();
        if (!query) return;

        const filtered = products.filter(p =>
            p.title.toLowerCase().includes(query) ||
            (p.category && p.category.toLowerCase().includes(query))
        );

        // Update Title
        const sectionTitle = document.querySelector('.section-title');
        if (sectionTitle) {
            sectionTitle.innerHTML = `<i class="fa-solid fa-magnifying-glass" style="color: var(--primary-color)"></i> 搜尋結果：${query}`;
            sectionTitle.style.animation = 'none';
            sectionTitle.offsetHeight;
            sectionTitle.style.animation = 'fadeIn 0.5s ease-out';
        }

        // Remove active class from categories
        const categoryLinks = document.querySelectorAll('.categories a');
        categoryLinks.forEach(l => l.classList.remove('active'));

        // Render Manually (Reuse Template Logic)
        if (!productGrid) return;

        if (filtered.length === 0) {
            productGrid.innerHTML = '<div class="no-products">找不到相關商品</div>';
        } else {
            productGrid.innerHTML = filtered.map(product => `
                <div class="product-card">
                    <img src="${product.image}" alt="${product.title}" class="product-image">
                    <div class="product-info">
                        <h3 class="product-title">${product.title}</h3>
                        <div class="product-price">${formatCurrency(product.price)}</div>
                        <div class="product-meta">
                            <span>Sold ${product.sold}</span>
                            <span>📍 TW</span>
                        </div>
                        <button class="add-to-cart-btn" onclick="addToCart(${product.id}, event)" style="
                            margin-top: 15px;
                            width: 100%;
                            padding: 10px;
                            background: var(--white);
                            color: var(--primary-color);
                            border: 2px solid var(--primary-color);
                            cursor: pointer;
                            font-size: 0.95rem;
                            font-weight: 600;
                            border-radius: 8px;
                            transition: all 0.2s;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 5px;
                        " onmouseover="this.style.background='var(--primary-color)'; this.style.color='white'" onmouseout="this.style.background='white'; this.style.color='var(--primary-color)'">
                            <i class="fa-solid fa-cart-plus"></i> 加入購物車
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }

    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            performSearch();
        });
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });
    }
});

cartBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent closing immediately
    cartDropdown.classList.toggle('active');
});

// Close cart when clicking outside
document.addEventListener('click', (e) => {
    if (!cartDropdown.contains(e.target) && !cartBtn.contains(e.target)) {
        cartDropdown.classList.remove('active');
    }
});
