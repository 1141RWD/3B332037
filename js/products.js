// Product Data
const products = [
    {
        id: 1,
        title: "Apple 蘋果iPhone 17 Pro Max ",
        price: 44900,
        image: "images/iphone17.png",
        sold: 9999 + "+",
        category: "mobile",
        options: {
            colors: ["銀色", "宇宙橙色", "藏藍色"],
            specs: ["256GB", "512GB", "1TB"],
            priceModifiers: {
                "512GB": 6000,
                "1TB": 18000
            }
        }
    },
    {
        id: 2,
        title: "Sony WH-1000XM6 耳罩式降噪耳機",
        price: 11900,
        image: "images/headphones.jpg",
        sold: 850,
        category: "mobile",
        options: {
            colors: ["深夜藍", "鉑金銀", "黑色"]
        }
    },
    {
        id: 3,
        title: "Nintendo Switch 2",
        price: 10480,
        image: "images/switch.jpg",
        sold: 5000,
        category: "gaming",
        options: {
            colors: ["白色", "電光紅/藍", "瑪利歐紅色版"]
        }
    },
    {
        id: 4,
        title: "MacBook Pro 16 Apple M5 (Pro/Max)",
        price: 84900,
        image: "images/macbook.jpg",
        sold: 340,
        category: "computer",
        options: {
            colors: ["太空黑", "銀色"],
            specs: ["M5 Pro 18GB/512GB", "M5 Pro 36GB/512GB", "M5 Max 36GB/1TB", "M5 Max 48GB/1TB"],
            priceModifiers: {
                "M5 Pro 36GB/512GB": 15000,
                "M5 Max 36GB/1TB": 30000,
                "M5 Max 48GB/1TB": 45000
            }
        }
    },
    {
        id: 5,
        title: "Logitech PRO X SUPERLIGHT 2",
        price: 3290,
        image: "images/mouse.jpg",
        sold: 2100,
        category: "computer",
        options: {
            colors: ["黑色", "白色", "桃紅色"]
        }
    },
    {
        id: 6,
        title: "Dyson Supersonic™ Hair Dryer - Iron/Fuchsia",
        price: 14600,
        image: "images/dyson.jpg",
        sold: 156,
        category: "beauty",
        options: {
            colors: ["桃紅色", "黑鎳色", "普魯士藍"]
        }
    },
    {
        id: 7,
        title: "SAMSUNG 三星 27吋 C27G55TQWC 2K+144Hz 超曲1000R電競",
        price: 6990,
        image: "images/monitor.jpg",
        sold: 890,
        category: "computer",
        options: {}
    },
    {
        id: 8,
        title: "Wooting 60HE+ 磁軸機械式鍵盤",
        price: 6990,
        image: "images/keyboard.jpg",
        sold: 670,
        category: "computer",
        options: {
            specs: ["磁軸"],
            colors: ["RGB 背光"]
        }
    },
    {
        id: 9,
        title: "Sony PlayStation 5 Pro Console",
        price: 24980,
        image: "images/ps5.jpg",
        sold: 230,
        category: "gaming",
        options: {
            specs: ["數位版", "光碟版"]
        }
    },
    {
        id: 10,
        title: "Premium Car Wash & Wax Kit (10-Piece)",
        price: 1599,
        image: "images/car-wash.jpg",
        sold: 450,
        category: "auto",
        options: {}
    },
    {
        id: 11,
        title: "HIRASHIMA - CARAMELLA 沙發",
        price: 8900,
        image: "images/sofa.jpg",
        sold: 120,
        category: "lifestyle",
        options: {
            colors: ["經典灰", "米杏色", "深藍色"],
            specs: ["雙人座", "三人座"]
        }
    },
    // Fashion
    {
        id: 12,
        title: "Nike Air Force 1 '07 - Triple White",
        price: 3400,
        image: "images/airforce.jpg",
        sold: 5000 + "+",
        category: "fashion",
        options: {
            specs: ["US 8", "US 9", "US 10", "US 11"],
            colors: ["White", "Black"]
        }
    },
    {
        id: 13,
        title: "Essential Omni-Tech™ 防水透氣外套",
        price: 4980,
        image: "images/omnitech.jpg",
        sold: 210,
        category: "fashion",
        options: {
            specs: ["S", "M", "L", "XL"],
            colors: ["黑色", "藏青色", "軍綠色"]
        }
    },
    {
        id: 14,
        title: "RayBan 雷朋 飛行員經典太陽眼鏡",
        price: 5200,
        image: "images/rayban.webp",
        sold: 89,
        category: "fashion",
        options: {
            colors: ["金色/綠片", "黑色/黑片"]
        }
    },
    // Food
    {
        id: 15,
        title: "日本 A5 和牛燒肉片 (200g)",
        price: 2900,
        image: "images/meat.jpg",
        sold: 560,
        category: "food",
        options: {}
    },
    {
        id: 16,
        title: "BlueBottle 藍瓶咖啡豆 - Bella Donovan",
        price: 850,
        image: "images/bluebottle.jpg",
        sold: 1200,
        category: "food",
        options: {
            specs: ["200g 入", "500g 入"]
        }
    },
    {
        id: 17,
        title: "ON 金牌乳清蛋白粉 - 雙倍巧克力",
        price: 2199,
        image: "images/onchoco.jpg",
        sold: 3400,
        category: "food",
        options: {
            specs: ["5磅"]
        }
    },
    // Beauty (Enrich)
    {
        id: 18,
        title: "SK-II 青春露 (230ml)",
        price: 4110,
        image: "images/sk2.webp",
        sold: 800,
        category: "beauty",
        options: {}
    },
    {
        id: 19,
        title: "Aesop 賦活芳香護手霜",
        price: 900,
        image: "images/aesop.jpg",
        sold: 2200,
        category: "beauty",
        options: {}
    },
    // Lifestyle (Enrich)
    {
        id: 20,
        title: "Muuto 丹麥設計吊燈",
        price: 12800,
        image: "images/lights.webp",
        sold: 45,
        category: "lifestyle",
        options: {
            colors: ["灰綠色", "白色", "黑色"]
        }
    },
    {
        id: 21,
        title: "Herman Miller Aeron 人體工學椅",
        price: 23400,
        image: "images/chair.jpg",
        sold: 30,
        category: "lifestyle",
        options: {
            specs: ["Size B", "Size C"]
        }
    },
    // Auto (Enrich)
    {
        id: 22,
        title: "Mio MiVue™ 汽車行車記錄器 (前後雙鏡)",
        price: 5990,
        image: "images/mio.jpg",
        sold: 300,
        category: "auto",
        options: {}
    },
    {
        id: 23,
        title: "Baseus 倍思 車用磁吸手機支架",
        price: 490,
        image: "images/baseus.jpeg",
        sold: 5000 + "+",
        category: "auto",
        options: {
            colors: ["黑色", "銀色"]
        }
    }
];
