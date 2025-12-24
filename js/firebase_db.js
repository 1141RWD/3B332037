// Firebase Firestore Logic
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    query,
    where,
    orderBy,
    getDocs,
    serverTimestamp,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBOa0xVWz3Say6JA_RNmyuGbxFVk8I3P7s",
    authDomain: "bluecore-bb865.firebaseapp.com",
    projectId: "bluecore-bb865",
    storageBucket: "bluecore-bb865.firebasestorage.app",
    messagingSenderId: "283345381458",
    appId: "1:283345381458:web:22bb6f6112c360d194d78b",
    measurementId: "G-F4XEDMDVT3"
};

// Initialize safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

// 1. Create a New Order (and Update Sold Counts)
export async function createOrder(userId, orderData) {
    // Import batch and atomic utils
    const { writeBatch, increment } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    const batch = writeBatch(db);

    try {
        // A. Prepare Order Document
        const orderRef = doc(collection(db, "orders")); // Generate ID first
        batch.set(orderRef, {
            userId: userId,
            ...orderData,
            createdAt: serverTimestamp(),
            status: "Processing"
        });

        // B. Increment Sold Count for each item
        const items = orderData.items || [];
        items.forEach(item => {
            let productDocId = String(item.originalId || item.id);
            if ((!item.originalId) && productDocId.includes('-')) {
                productDocId = productDocId.split('-')[0];
            }

            const productRef = doc(db, "products", productDocId);

            batch.update(productRef, {
                sold: increment(item.quantity || 1)
            });
        });

        // C. Commit Batch
        await batch.commit();

        console.log("Order written with ID: ", orderRef.id);
        return orderRef.id;

    } catch (e) {
        console.error("Error adding order: ", e);
        throw e;
    }
}

// 2. Get User Orders
export async function getUserOrders(userId) {
    const orders = [];
    try {
        const q = query(
            collection(db, "orders"),
            where("userId", "==", userId)
        );

        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            orders.push({
                id: doc.id,
                ...doc.data()
            });
        });
        return orders;
    } catch (e) {
        console.error("Error getting orders: ", e);
        throw e;
    }
}
// 3. Check Coupon Usage
export async function hasUserUsedCoupon(userId, couponCode) {
    try {
        const q = query(
            collection(db, "orders"),
            where("userId", "==", userId),
            where("couponApplied", "==", couponCode)
        );

        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty; // Returns true if used
    } catch (e) {
        console.error("Error checking coupon: ", e);
        return false;
    }
}

// 4. Cancel Order
export async function cancelOrder(orderId) {
    try {
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, {
            status: "Cancelled"
        });
        return true;
    } catch (e) {
        console.error("Error cancelling order: ", e);
        throw e;
    }
}
// 5. Product CRUD
export async function getProducts() {
    const products = [];
    try {
        const q = query(collection(db, "products")); // Get all
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });
        return products;
    } catch (e) {
        console.error("Error getting products: ", e);
        throw e;
    }
}

export async function addProduct(productData) {
    try {
        const docRef = await addDoc(collection(db, "products"), {
            ...productData,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (e) {
        console.error("Error adding product: ", e);
        throw e;
    }
}

export async function updateProduct(productId, productData) {
    try {
        const productRef = doc(db, "products", String(productId));
        await updateDoc(productRef, productData);
        return true;
    } catch (e) {
        console.error("Error updating product: ", e);
        throw e;
    }
}

export async function deleteProduct(productId) {
    try {
        const { deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        await deleteDoc(doc(db, "products", String(productId)));
        return true;
    } catch (e) {
        console.error("Error deleting product: ", e);
        throw e;
    }
}

// 6. Role Management (Admin / Seller / Customer)
const SUPER_ADMINS = [
    'admin@bluecore.com',
    'seller@test.com',
    'herecitw@gmail.com'
];

export async function setUserRole(uid, role, email = '') {
    const validRoles = ['admin', 'seller', 'customer'];
    if (!validRoles.includes(role)) {
        throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    try {
        const { setDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        // Store in 'user_roles' using UID as key
        await setDoc(doc(db, "user_roles", uid), {
            uid: uid,
            email: email, // Optional: store email for reference
            role: role,
            updatedAt: serverTimestamp()
        });
        console.log(`Success: Role '${role}' assigned to ${uid} (${email}).`);
        return true;
    } catch (e) {
        console.error("Error setting role:", e);
        throw e;
    }
}

export async function getUserRole(uid, email = null) {
    // 0. Check Super Admin Whitelist (using Email)
    if (email && SUPER_ADMINS.includes(email)) {
        return 'admin';
    }

    try {
        const { getDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

        // 1. Check new 'user_roles' collection by UID
        const roleSnap = await getDoc(doc(db, "user_roles", uid));
        if (roleSnap.exists()) {
            return roleSnap.data().role;
        }

        // 2. Backward Compatibility: Check old 'allowed_sellers' (Email-based)
        // Only if email is provided
        if (email) {
            const oldSnap = await getDoc(doc(db, "allowed_sellers", email));
            if (oldSnap.exists()) {
                return 'seller';
            }

            // Also check if there was a legacy role saved by email in user_roles
            const oldEmailSnap = await getDoc(doc(db, "user_roles", email));
            if (oldEmailSnap.exists()) {
                return oldEmailSnap.data().role;
            }
        }

        return 'customer'; // Default role
    } catch (e) {
        console.error("Error checking role:", e);
        return 'customer'; // Fail safe
    }
}

export async function getAllUserRoles() {
    const users = [];
    try {
        console.log("getAllUserRoles: Start (Real Mode)");

        // Create a timeout promise
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Query Timed Out (5s)")), 5000));

        const q = query(collection(db, "user_roles"));
        console.log("getAllUserRoles: Executing query...");

        // Race getDocs against timeout
        const querySnapshot = await Promise.race([
            getDocs(q),
            timeout
        ]);

        console.log("getAllUserRoles: Got snapshot, size=" + querySnapshot.size);
        querySnapshot.forEach((doc) => {
            // Merge doc.id so we have a fallback if uid is missing
            users.push({ id: doc.id, ...doc.data() });
        });
        return users;
    } catch (e) {
        console.error("Error getting users:", e);
        return { error: e.message || "Unknown Error" }; // Return error info to UI
    }
}

// 7. Coupons Data (Shared)
export const validCoupons = {
    'WELCOME100': { type: 'fixed', value: 100, minPurchase: 500, code: 'WELCOME100', description: '新會員見面禮 - 折抵 NT$100' },
    'VIP2024': { type: 'percent', value: 0.9, minPurchase: 1000, code: 'VIP2024', description: 'VIP 專屬 - 全館 9 折' }
};

// 8. Seller Request Workflow
export async function submitSellerRequest(user, reason) {
    try {
        const { setDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        // Use UID as ID so one request per user
        await setDoc(doc(db, "seller_requests", user.uid), {
            uid: user.uid,
            email: user.email,
            reason: reason,
            status: 'pending',
            createdAt: serverTimestamp()
        });
        return true;
    } catch (e) {
        console.error("Error submitting request:", e);
        throw e;
    }
}

export async function getSellerRequests() {
    const requests = [];
    try {
        const q = query(
            collection(db, "seller_requests"),
            where("status", "==", "pending")
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            requests.push(doc.data());
        });
        return requests;
    } catch (e) {
        console.error("Error getting requests:", e);
        // Index might be needed for composite query
        return [];
    }
}

export async function resolveSellerRequest(uid, isApproved) {
    // Import atomic update
    const { updateDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

    try {
        // 1. Update Request Status
        await updateDoc(doc(db, "seller_requests", uid), {
            status: isApproved ? 'approved' : 'rejected',
            resolvedAt: serverTimestamp()
        });

        // 2. If Approved, Set Role
        if (isApproved) {
            await setUserRole(uid, 'seller', 'Approved-Request');
        }
        return true;
    } catch (e) {
        console.error("Error resolving request:", e);
        throw e;
    }
}
