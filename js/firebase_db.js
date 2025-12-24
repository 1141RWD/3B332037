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
const db = getFirestore(app);

// 1. Create a New Order
export async function createOrder(userId, orderData) {
    try {
        const docRef = await addDoc(collection(db, "orders"), {
            userId: userId,
            ...orderData,
            createdAt: serverTimestamp(),
            status: "Processing" // Default status
        });
        console.log("Order written with ID: ", docRef.id);
        return docRef.id;
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
