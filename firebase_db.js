// Firebase Firestore Logic
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    query,
    where,
    orderBy,
    getDocs,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Re-use the same config (Ideal way is to export app from auth.js, but for simplicity we re-declare or import config if possible. 
// Here we'll just re-use the config object to ensure it works standalone)
const firebaseConfig = {
    apiKey: "AIzaSyBOa0xVWz3Say6JA_RNmyuGbxFVk8I3P7s",
    authDomain: "bluecore-bb865.firebaseapp.com",
    projectId: "bluecore-bb865",
    storageBucket: "bluecore-bb865.firebasestorage.app",
    messagingSenderId: "283345381458",
    appId: "1:283345381458:web:22bb6f6112c360d194d78b",
    measurementId: "G-F4XEDMDVT3"
};

const app = initializeApp(firebaseConfig);
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
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
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
