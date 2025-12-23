// Sample Product Data
const products = [
    {
        id: 1,
        title: "Apple iPhone 15 Pro Max (256GB) - Titanium Black",
        price: 44900,
        image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=200",
        sold: 1200
    },
    {
        id: 2,
        title: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
        price: 11900,
        image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=200",
        sold: 850
    },
    {
        id: 3,
        title: "Nintendo Switch OLED Model - White Joy-Con",
        price: 10480,
        image: "https://images.unsplash.com/photo-1578303512597-81de50a55000?auto=format&fit=crop&q=80&w=200",
        sold: 5000
    },
    {
        id: 4,
        title: "MacBook Air 13-inch M2 Chip - Midnight",
        price: 35900,
        image: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&q=80&w=200",
        sold: 340
    },
    {
        id: 5,
        title: "Logitech MX Master 3S Performance Wireless Mouse",
        price: 3290,
        image: "https://images.unsplash.com/photo-1615663245857-acda6b025cda?auto=format&fit=crop&q=80&w=200",
        sold: 2100
    },
    {
        id: 6,
        title: "Dyson Supersonic™ Hair Dryer - Iron/Fuchsia",
        price: 14600,
        image: "https://images.unsplash.com/photo-1572522778216-778817a00f1c?auto=format&fit=crop&q=80&w=200",
        sold: 156
    },
    {
        id: 7,
        title: "Samsung 27-inch Curved Gaming Monitor 144Hz",
        price: 6990,
        image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=200",
        sold: 890
    },
    {
        id: 8,
        title: "Keychron K2 Pro Custom Mechanical Keyboard",
        price: 3490,
        image: "https://images.unsplash.com/photo-1587829745563-14b96fca0524?auto=format&fit=crop&q=80&w=200",
        sold: 670
    }
];

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
function renderProducts() {
    if (!productGrid) return;

    productGrid.innerHTML = products.map(product => `
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
    // Removed alert for smoother experience
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
        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.title}">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.title}</div>
                    <div class="cart-item-price">${formatCurrency(item.price)} x ${item.quantity}</div>
                </div>
            </div>
        `).join('');

        // Update Total
        const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotalElement.textContent = formatCurrency(totalAmount);
    }
}

// Expose addToCart to global scope for onclick handler
window.addToCart = addToCart;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();

    // Category Toggle
    const categoryToggle = document.getElementById('categories-toggle');
    const categoryList = document.getElementById('categories-list');

    if (categoryToggle && categoryList) {
        categoryToggle.addEventListener('click', () => {
            categoryList.classList.toggle('collapsed');
            categoryToggle.classList.toggle('collapsed');
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
