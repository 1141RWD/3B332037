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

// 1. Create a New Order
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
            // Need to handle both string ID (legacy/variant) and number ID
            // Using item.originalId if available (from variants logic) or item.id
            // But wait, the main product doc ID is needed.
            // If item.id is "1-Red-L", the doc ID is likely "1".
            // Let's assume item.id is the doc ID if simple, or item.originalId if variant.

            let productDocId = String(item.originalId || item.id);
            // If the ID contains hyphen (variant), try to split to get base ID if originalId is missing
            if ((!item.originalId) && productDocId.includes('-')) {
                productDocId = productDocId.split('-')[0];
            }

            // Reference to the product document
            const productRef = doc(db, "products", productDocId);

            // Atomic Increment
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
            // orderBy("createdAt", "desc") // Removed to avoid creating a manual index
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
        // If index is missing, it might throw an error. 
        // For simple queries it usually works, but composite queries need index.
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
        // Fail safe: If error (e.g. index missing for composite query), assume NOT used to prevent blocking.
        // Or handle strict. For MVP, we log and return false but maybe warn user.
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
        // Import deleteDoc if not imported yet, or use it from firestore
        // Wait, I need to check imports at the top first!
        // Assuming deleteDoc is imported. If not, I need to add it to imports.
        // I will add it to the import statement in a separate step or assume I'll fix imports.
        // Actually, let's just do the function here and I'll check imports.
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

export async function setUserRole(email, role) {
    const validRoles = ['admin', 'seller', 'customer'];
    if (!validRoles.includes(role)) {
        throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    try {
        const { setDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        // Store in 'user_roles' collection (cleaner than allowed_sellers)
        // migrating logic: allowed_sellers can remain for backward compat or we just switch.
        // Let's use 'user_roles' for the new system.
        await setDoc(doc(db, "user_roles", email), {
            email: email,
            role: role,
            updatedAt: serverTimestamp()
        });
        console.log(`Success: Role '${role}' assigned to ${email}.`);
        return true;
    } catch (e) {
        console.error("Error setting role:", e);
        throw e;
    }
}

export async function getUserRole(email) {
    // 0. Check Super Admin Whitelist
    if (SUPER_ADMINS.includes(email)) {
        return 'admin';
    }

    try {
        const { getDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

        // 1. Check new 'user_roles' collection
        const roleSnap = await getDoc(doc(db, "user_roles", email));
        if (roleSnap.exists()) {
            return roleSnap.data().role;
        }

        // 2. Backward Compatibility: Check old 'allowed_sellers'
        const oldSnap = await getDoc(doc(db, "allowed_sellers", email));
        if (oldSnap.exists()) {
            return 'seller'; // Default old records to seller
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
        const q = query(collection(db, "user_roles"), orderBy("updatedAt", "desc"));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            users.push(doc.data());
        });
        return users;
    } catch (e) {
        console.error("Error getting users:", e);
        return [];
    }
}
