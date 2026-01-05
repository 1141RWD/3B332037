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
    updateDoc,
    writeBatch,
    increment,
    deleteDoc,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Re-export specific Firebase SDK functions for use in other modules
export {
    collection,
    addDoc,
    serverTimestamp,
    query,
    where,
    orderBy,
    getDocs,
    doc,
    updateDoc,
    deleteDoc // Need to import this first if not present
};

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
// 1. Create a New Order (and Update Sold Counts)
export async function createOrder(userId, orderData) {
    try {
        // A. Primary Action: Create Order Document (Must succeed)
        // Using addDoc automatically handles ID generation and is strictly a "create" operation
        const orderRef = await addDoc(collection(db, "orders"), {
            userId: userId,
            ...orderData,
            createdAt: serverTimestamp(),
            status: "Processing"
        });

        // B. Secondary Action: Increment Sold Count for each item (Best Effort)
        try {
            const batch = writeBatch(db);
            const items = orderData.items || [];
            let hasUpdates = false;

            items.forEach(item => {
                let productDocId = String(item.originalId || item.id);
                if ((!item.originalId) && productDocId.includes('-')) {
                    productDocId = productDocId.split('-')[0];
                }

                const productRef = doc(db, "products", productDocId);

                batch.update(productRef, {
                    sold: increment(item.quantity || 1)
                });
                hasUpdates = true;
            });

            if (hasUpdates) {
                await batch.commit();
            }
        } catch (updateError) {
            console.warn("Notice: Could not update product 'sold' counts. Order success is unaffected.", updateError);
        }

        console.log("Order written with ID: ", orderRef.id);
        return orderRef.id;

    } catch (e) {
        console.error("Error creating order: ", e);
        throw e;
    }
}

// 2. Get User Orders
export async function getUserOrders(userId, includeHidden = false) {
    const orders = [];
    try {
        const q = query(
            collection(db, "orders"),
            where("userId", "==", userId)
        );

        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // If includeHidden is true, we take everything.
            // If false (default), we only take those NOT hidden.
            if (includeHidden || !data.isHiddenForUser) {
                orders.push({
                    id: doc.id,
                    ...data
                });
            }
        });
        return orders;
    } catch (e) {
        console.error("Error getting user orders: ", e);
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

// 3. Update Status (Admin)
export async function updateOrderStatus(orderId, status) {
    try {
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, {
            status: status
        });
        return true;
    } catch (e) {
        console.error("Error updating order: ", e);
        throw e;
    }
}

// 4. Cancel Order (User)
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

// 4.1 Hide/Unhide Order (User Side)
export async function hideOrder(orderId) {
    try {
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, {
            isHiddenForUser: true
        });
        return true;
    } catch (e) {
        console.error("Error hiding order: ", e);
        throw e;
    }
}

export async function unhideOrder(orderId) {
    try {
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, {
            isHiddenForUser: false
        });
        return true;
    } catch (e) {
        console.error("Error unhiding order: ", e);
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

        // Prepare data to update
        const dataToUpdate = {
            uid: uid,
            role: role,
            updatedAt: serverTimestamp()
        };

        // Only update email if it's a valid email (simple check) and not a system message
        if (email && email.includes('@') && !email.includes('Approved-Request') && !email.includes('Admin-Panel')) {
            dataToUpdate.email = email;
        }

        // Store in 'user_roles' using UID as key, merging with existing data
        await setDoc(doc(db, "user_roles", uid), dataToUpdate, { merge: true });

        console.log(`Success: Role '${role}' assigned to ${uid}.`);
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
            // Fetch the email first from the request document to ensure we save it correctly
            let userEmail = '';
            try {
                const { getDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
                const requestSnap = await getDoc(doc(db, "seller_requests", uid));
                if (requestSnap.exists()) {
                    userEmail = requestSnap.data().email || '';
                }
            } catch (err) {
                console.warn("Could not fetch email from request doc:", err);
            }

            await setUserRole(uid, 'seller', userEmail);
        }
        return true;
    } catch (e) {
        console.error("Error resolving request:", e);
        throw e;
    }
}
export async function getMySellerRequest(uid) {
    try {
        const { getDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        const docRef = doc(db, "seller_requests", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (e) {
        console.error("Error getting my request:", e);
        return null;
    }
}

// Cart Management
export async function saveCartToDB(userId, cartItems) {
    if (!userId) return;
    try {
        const cartRef = doc(db, "carts", userId);
        await setDoc(cartRef, {
            items: cartItems,
            updatedAt: serverTimestamp()
        }, { merge: true });
        console.log("Cart saved to DB");
    } catch (e) {
        console.error("Error saving cart to DB:", e);
    }
}

export async function getCartFromDB(userId) {
    if (!userId) return [];
    try {
        const cartRef = doc(db, "carts", userId);
        const docSnap = await getDoc(cartRef);
        if (docSnap.exists()) {
            return docSnap.data().items || [];
        }
        return [];
    } catch (e) {
        console.error("Error fetching cart from DB:", e);
        return [];
    }
}
