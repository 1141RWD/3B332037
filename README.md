# BlueCore - 頂級全方位選物商城 

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
-   **全站 UI 標準化**：使用自定義的 `showToast` 與 `showConfirm` 取代原生瀏覽器提示，提供一致的視覺體驗。

### 2. 進階商品互動
-   **熱門搜尋關鍵字**：首頁動態顯示熱門搜尋標籤，點擊即可快速篩選商品。
-   **規格與價格連動**：選擇不同顏色或規格（如 iPhone 容量、MacBook 晶片），價格即時更新。
-   **動態產品彈窗**：點擊商品可查看詳情，無需跳轉頁面。

### 3. 會員與訂單管理
-   **訂單隱藏與還原**：使用者可在「歷史訂單」中隱藏過往記錄，並透過「查看已隱藏訂單」功能隨時還原。
-   **即時購物車**：加入購物車後圖示數字即時跳動，並支援下拉式預覽與管理。
-   **安全性驗證**：整合 reCAPTCHA v2 防止機器人註冊。
-   **賣家身分申請**：一般會員可於個人資料頁面申請成為賣家。若申請駁回，可查看狀態並重新提交申請。

### 4. 管理中心 (Admin Center)
-   **專屬後台**：管理員可透過 `admin.html` 進入專屬管理介面。
-   **賣家審核**：審核使用者的賣家申請（批准/拒絕）。拒絕後系統會標記狀態，允許使用者再次申請。
-   **角色管理**：查看所有使用者列表，支援搜尋與手動修改使用者權限（Admin/Seller/Customer）。

## 🛠️ 技術棧 (Tech Stack)

-   **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+), Font Awesome
-   **Backend / Auth**: Google Firebase Authentication & Firestore
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
    *   申請成為賣家並進入管理後台審核。
    *   隱藏並還原歷史訂單。

## 📂 專案結構

```
/
├── index.html      # 首頁 (含熱門搜尋)
├── register.html   # 註冊頁面
├── login.html      # 登入頁面
├── profile.html    # 會員資料 & 訂單管理 (含隱藏功能)
├── admin.html      # 管理中心 (審核 & 角色管理)
├── seller.html     # 賣家中心 (商品上架)
├── css/
│   └── style.css   # 全域樣式表
├── js/
│   ├── script.js       # 核心邏輯
│   ├── firebase_db.js  # Firestore 資料庫操作
│   ├── admin.js        # 管理後台邏輯
│   ├── profile.js      # 會員頁面邏輯
│   └── notification.js # 自定義提示元件
└── images/         # 圖片資源
```

---
© 2025 BlueCore. All Rights Reserved.
