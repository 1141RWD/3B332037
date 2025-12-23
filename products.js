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
    }
];
