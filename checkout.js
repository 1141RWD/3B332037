// Checkout Logic

const cityDistricts = {
    "Taipei": { name: "台北市", districts: ["中正區", "大同區", "中山區", "松山區", "大安區", "萬華區", "信義區", "士林區", "北投區", "內湖區", "南港區", "文山區"] },
    "NewTaipei": { name: "新北市", districts: ["板橋區", "三重區", "中和區", "永和區", "新莊區", "新店區", "樹林區", "鶯歌區", "三峽區", "淡水區", "汐止區", "瑞芳區", "土城區", "蘆洲區", "五股區", "泰山區", "林口區", "深坑區", "石碇區", "坪林區", "三芝區", "石門區", "八里區", "平溪區", "雙溪區", "貢寮區", "金山區", "萬里區", "烏來區"] },
    "Taoyuan": { name: "桃園市", districts: ["桃園區", "中壢區", "大溪區", "楊梅區", "蘆竹區", "大園區", "龜山區", "八德區", "龍潭區", "平鎮區", "新屋區", "觀音區", "復興區"] },
    "Taichung": { name: "台中市", districts: ["中區", "東區", "南區", "西區", "北區", "北屯區", "西屯區", "南屯區", "太平區", "大里區", "霧峰區", "烏日區", "豐原區", "后里區", "石岡區", "東勢區", "和平區", "新社區", "潭子區", "大雅區", "神岡區", "大肚區", "沙鹿區", "龍井區", "梧棲區", "清水區", "大甲區", "外埔區", "大安區"] },
    "Tainan": { name: "台南市", districts: ["中西區", "東區", "南區", "北區", "安平區", "安南區", "永康區", "歸仁區", "新化區", "左鎮區", "玉井區", "楠西區", "南化區", "仁德區", "關廟區", "龍崎區", "官田區", "麻豆區", "佳里區", "西港區", "七股區", "將軍區", "學甲區", "北門區", "新營區", "後壁區", "白河區", "東山區", "六甲區", "下營區", "柳營區", "鹽水區", "善化區", "大內區", "山上區", "新市區", "安定區"] },
    "Kaohsiung": { name: "高雄市", districts: ["楠梓區", "左營區", "鼓山區", "三民區", "鹽埕區", "前金區", "新興區", "苓雅區", "前鎮區", "旗津區", "小港區", "鳳山區", "林園區", "大寮區", "大樹區", "大社區", "仁武區", "鳥松區", "岡山區", "橋頭區", "燕巢區", "田寮區", "阿蓮區", "路竹區", "湖內區", "茄萣區", "永安區", "彌陀區", "梓官區", "旗山區", "美濃區", "六龜區", "甲仙區", "杉林區", "內門區", "茂林區", "桃源區", "那瑪夏區"] },
    "Keelung": { name: "基隆市", districts: ["仁愛區", "信義區", "中正區", "中山區", "安樂區", "暖暖區", "七堵區"] },
    "HsinchuCity": { name: "新竹市", districts: ["東區", "北區", "香山區"] },
    "HsinchuCounty": { name: "新竹縣", districts: ["竹北市", "竹東鎮", "新埔鎮", "關西鎮", "湖口鄉", "新豐鄉", "芎林鄉", "橫山鄉", "北埔鄉", "寶山鄉", "峨眉鄉", "尖石鄉", "五峰鄉"] },
    "Miaoli": { name: "苗栗縣", districts: ["苗栗市", "頭份市", "竹南鎮", "後龍鎮", "通霄鎮", "苑裡鎮", "卓蘭鎮", "造橋鄉", "西湖鄉", "頭屋鄉", "公館鄉", "銅鑼鄉", "三義鄉", "大湖鄉", "獅潭鄉", "泰安鄉", "南庄鄉", "三灣鄉"] },
    "Changhua": { name: "彰化縣", districts: ["彰化市", "員林市", "和美鎮", "鹿港鎮", "溪湖鎮", "二林鎮", "田中鎮", "北斗鎮", "花壇鄉", "芬園鄉", "大村鄉", "永靖鄉", "伸港鄉", "線西鄉", "福興鄉", "秀水鄉", "埔心鄉", "埔鹽鄉", "大城鄉", "芳苑鄉", "竹塘鄉", "社頭鄉", "二水鄉", "田尾鄉", "埤頭鄉", "溪州鄉"] },
    "Nantou": { name: "南投縣", districts: ["南投市", "埔里鎮", "草屯鎮", "竹山鎮", "集集鎮", "名間鄉", "鹿谷鄉", "中寮鄉", "魚池鄉", "國姓鄉", "水里鄉", "信義鄉", "仁愛鄉"] },
    "Yunlin": { name: "雲林縣", districts: ["斗六市", "斗南鎮", "虎尾鎮", "西螺鎮", "土庫鎮", "北港鎮", "古坑鄉", "大埤鄉", "莿桐鄉", "林內鄉", "二崙鄉", "崙背鄉", "麥寮鄉", "東勢鄉", "褒忠鄉", "台西鄉", "元長鄉", "四湖鄉", "口湖鄉", "水林鄉"] },
    "ChiayiCity": { name: "嘉义市", districts: ["東區", "西區"] },
    "ChiayiCounty": { name: "嘉义縣", districts: ["太保市", "朴子市", "布袋鎮", "大林鎮", "民雄鄉", "溪口鄉", "新港鄉", "六腳鄉", "東石鄉", "義竹鄉", "鹿草鄉", "水上鄉", "中埔鄉", "竹崎鄉", "梅山鄉", "番路鄉", "大埔鄉", "阿里山鄉"] },
    "Pingtung": { name: "屏東縣", districts: ["屏東市", "潮州鎮", "東港鎮", "恆春鎮", "萬丹鄉", "長治鄉", "麟洛鄉", "九如鄉", "里港鄉", "鹽埔鄉", "高樹鄉", "萬巒鄉", "內埔鄉", "竹田鄉", "新埤鄉", "枋寮鄉", "新園鄉", "崁頂鄉", "林邊鄉", "南州鄉", "佳冬鄉", "琉球鄉", "車城鄉", "滿州鄉", "枋山鄉", "三地門鄉", "霧台鄉", "瑪家鄉", "泰武鄉", "來義鄉", "春日鄉", "獅子鄉", "牡丹鄉"] },
    "Yilan": { name: "宜蘭縣", districts: ["宜蘭市", "羅東鎮", "蘇澳鎮", "頭城鎮", "礁溪鄉", "壯圍鄉", "員山鄉", "冬山鄉", "五結鄉", "三星鄉", "大同鄉", "南澳鄉"] },
    "Hualien": { name: "花蓮縣", districts: ["花蓮市", "鳳林鎮", "玉里鎮", "新城鄉", "吉安鄉", "壽豐鄉", "光復鄉", "豐濱鄉", "瑞穗鄉", "富里鄉", "秀林鄉", "萬榮鄉", "卓溪鄉"] },
    "Taitung": { name: "台東縣", districts: ["台東市", "成功鎮", "關山鎮", "卑南鄉", "大武鄉", "太麻里鄉", "東河鄉", "長濱鄉", "鹿野鄉", "池上鄉", "綠島鄉", "蘭嶼鄉", "延平鄉", "金峰鄉", "達仁鄉", "海端鄉"] },
    "Penghu": { name: "澎湖縣", districts: ["馬公市", "湖西鄉", "白沙鄉", "西嶼鄉", "望安鄉", "七美鄉"] },
    "Kinmen": { name: "金門縣", districts: ["金城鎮", "金湖鎮", "金沙鎮", "金寧鄉", "烈嶼鄉", "烏坵鄉"] },
    "Lienchiang": { name: "連江縣", districts: ["南竿鄉", "北竿鄉", "莒光鄉", "東引鄉"] }
};

// Valid Coupons (Mock Database)
const validCoupons = {
    'WELCOME100': { type: 'fixed', value: 100, minPurchase: 500 },
    'VIP2024': { type: 'percent', value: 0.9, minPurchase: 1000 }, // 10% off
    'FREESHIP': { type: 'shipping', value: 0, minPurchase: 0 }
};

let appliedCoupon = null;

document.addEventListener('DOMContentLoaded', () => {
    loadCartForCheckout();
    initCitySelector();

    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handlePlaceOrder);
    }

    const applyCouponBtn = document.getElementById('applyCouponBtn');
    if (applyCouponBtn) {
        applyCouponBtn.addEventListener('click', handleApplyCoupon);
    }
});

function initCitySelector() {
    const citySelect = document.getElementById('city');
    const districtSelect = document.getElementById('district');

    if (!citySelect || !districtSelect) return;

    // Populate City Dropdown
    citySelect.innerHTML = '<option value="">請選擇縣市...</option>';
    for (const [key, data] of Object.entries(cityDistricts)) {
        citySelect.innerHTML += `<option value="${key}">${data.name}</option>`;
    }

    // Handle Change
    citySelect.addEventListener('change', () => {
        const selectedCity = citySelect.value;

        // Reset District
        districtSelect.innerHTML = '<option value="">請選擇鄉鎮市區...</option>';
        districtSelect.disabled = true;

        if (selectedCity && cityDistricts[selectedCity]) {
            const districts = cityDistricts[selectedCity].districts;
            districts.forEach(district => {
                districtSelect.innerHTML += `<option value="${district}">${district}</option>`;
            });
            districtSelect.disabled = false;
        }
    });
}

function formatCurrency(amount) {
    return 'NT$' + Math.round(amount).toLocaleString();
}

function loadCartForCheckout() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const container = document.getElementById('checkout-items');
    const subtotalEl = document.getElementById('subtotal');
    const shippingEl = document.getElementById('shipping');
    const totalEl = document.getElementById('total');
    const discountRow = document.getElementById('discount-row');
    const discountAmountEl = document.getElementById('discount-amount');

    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">購物車是空的</div>';
        const btn = document.querySelector('.place-order-btn');
        if (btn) {
            btn.disabled = true;
            btn.style.background = '#ccc';
            btn.textContent = '購物車是空的';
        }
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="checkout-item">
            <img src="${item.image}" alt="${item.title}">
            <div class="checkout-item-info">
                <div class="checkout-item-title">${item.title}</div>
                <div class="checkout-item-meta">數量: ${item.quantity}</div>
            </div>
            <div class="checkout-item-price">${formatCurrency(item.price * item.quantity)}</div>
        </div>
    `).join('');

    // Calculations
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let shipping = subtotal >= 499 ? 0 : 60; // Free shipping over 499
    let discount = 0;

    // Apply Coupon
    if (appliedCoupon) {
        // Validate Requirement
        if (subtotal < appliedCoupon.minPurchase) {
            alert(`此優惠券需消費滿 ${formatCurrency(appliedCoupon.minPurchase)} 才能使用！`);
            appliedCoupon = null; // Remove invalid coupon
            document.getElementById('couponMessage').textContent = '';
            document.getElementById('couponCode').value = '';
        } else {
            if (appliedCoupon.type === 'fixed') {
                discount = appliedCoupon.value;
            } else if (appliedCoupon.type === 'percent') {
                discount = subtotal * (1 - appliedCoupon.value);
            } else if (appliedCoupon.type === 'shipping') {
                shipping = 0;
            }
        }
    }

    if (discount > 0) {
        discountRow.style.display = 'flex';
        discountAmountEl.textContent = '-' + formatCurrency(discount);
    } else if (appliedCoupon && appliedCoupon.type === 'shipping') {
        discountRow.style.display = 'none'; // Shipping discount handled in shipping cost
    } else {
        discountRow.style.display = 'none';
    }

    const total = subtotal + shipping - discount;

    subtotalEl.textContent = formatCurrency(subtotal);
    shippingEl.textContent = shipping === 0 ? '免運費' : formatCurrency(shipping);
    totalEl.textContent = formatCurrency(total);
}

function handleApplyCoupon() {
    const codeInput = document.getElementById('couponCode');
    const msg = document.getElementById('couponMessage');
    const code = codeInput.value.trim().toUpperCase();

    if (!code) return;

    if (validCoupons[code]) {
        appliedCoupon = validCoupons[code];
        msg.textContent = '✅ 優惠券已套用';
        msg.style.color = 'green';
        loadCartForCheckout(); // Recalculate
    } else {
        appliedCoupon = null;
        msg.textContent = '❌ 無效的優惠代碼';
        msg.style.color = 'red';
        loadCartForCheckout(); // Reset
    }
}

function handlePlaceOrder(e) {
    e.preventDefault();

    // Validate if cart is empty again
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) return;

    // Simulate API Call / Processing
    const btn = document.querySelector('.place-order-btn');
    btn.disabled = true;
    btn.textContent = '訂單處理中...';

    setTimeout(() => {
        // Success
        alert('🎉 訂單已成功送出！\n\n感謝您的購買，我們將盡快為您出貨。');

        // Clear Cart
        localStorage.removeItem('cart');

        // Redirect to Home
        window.location.href = 'index.html';
    }, 1500);
}
