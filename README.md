# BlueCore - 頂級全方位選物商城 v2.0

BlueCore 是一個現代化、響應式 (RWD) 的電子商務網站，提供從數位 3C 到居家生活、美妝保養的多元頂級選物。本專案整合了動態互動介面、購物車系統、Firebase 會員驗證以及資安防護機制。

## 🔧 Firebase Configuration (Firestore Rules)

To ensure the checkout and order history features work correctly, you must set up the **Firestore Security Rules** in your Firebase Console.

1. Go to **Firebase Console** > **Build** > **Firestore Database** > **Rules**.
2. Paste the following code to allow authenticated users to read/write their own orders:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Orders: Users can read/write only their own orders
    match /orders/{orderId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Default: Deny everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```
3. Click **Publish**.

## 🌟 核心功能 (Features)

### 1. 現代化使用者介面 (UI/UX)
-   **全響應式設計 (RWD)**：完美支援桌面、平板與手機裝置。
-   **玻璃擬態 (Glassmorphism)**：側邊欄與彈窗採用毛玻璃特效，營造科技質感。
-   **動態互動**：精緻的 Hover 動畫、購物車飛入特效與平滑滾動體驗。

### 2. 進階商品互動
-   **動態產品彈窗**：點擊商品可查看詳情，無需跳轉頁面。
-   **規格與價格連動**：選擇不同顏色或規格（如 iPhone 容量、MacBook 晶片），價格即時更新。
-   **背景鎖定**：彈窗開啟時自動鎖定背景滾動，提升瀏覽專注度。

### 3. 購物車系統
-   **即時狀態更新**：加入購物車後，圖示數字即時跳動更新。
-   **下拉式預覽**：滑鼠移過購物車圖示可快速預覽已選商品。
-   **商品管理**：可直接在預覽選單中移除個別商品。

### 4. 會員系統與安全性
-   **Firebase Authentication**：整合 Email/Password 註冊與登入功能。
-   **會員中心**：支援修改顯示名稱與密碼更新。
-   **個人化問候**：登入後顯示「歡迎回來! [使用者名稱]」。
-   **資安防護**：整合 **Google reCAPTCHA v2** 驗證，有效防止機器人惡意註冊。

## 🛠️ 技術棧 (Tech Stack)

-   **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+), Font Awesome
-   **Backend / Auth**: Google Firebase Authentication
-   **Security**: Google reCAPTCHA v2
-   **Design**: Custom CSS Variables, Flexbox/Grid Layout

## 🚀 快速開始 (Quick Start)

1.  **複製專案**：
    ```bash
    git clone https://github.com/1141RWD/3B332037.git
    cd 3B332037
    ```

2.  **啟動服務**：
    由於使用了 ES6 Modules (`import/export`)，請使用 Local Server 開啟（如 VS Code 的 Live Server 插件）。
    *   直接打開 `index.html` 可能會因為 CORS 策略導致 JavaScript 無法載入。

3.  **體驗功能**：
    *   瀏覽首頁 RWD 效果。
    *   嘗試註冊帳號（體驗 reCAPTCHA 驗證）。
    *   將商品加入購物車並結帳。

## 📂 專案結構

```
/
├── index.html      # 首頁
├── register.html   # 註冊頁面
├── login.html      # 登入頁面
├── profile.html    # 會員資料頁面
├── style.css       # 全域樣式表
├── script.js       # 主要邏輯 (購物車、UI)
├── products.js     # 產品資料庫
├── auth.js         # Firebase 驗證邏輯
└── images/         # 圖片資源
```

---
© 2025 BlueCore. All Rights Reserved.
