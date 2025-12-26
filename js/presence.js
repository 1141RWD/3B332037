import { db } from './firebase_db.js?v=1';
import {
    doc,
    setDoc,
    serverTimestamp,
    collection,
    query,
    where,
    onSnapshot,
    Timestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const SESSION_KEY = 'bluecore_session_id';
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const ONLINE_THRESHOLD_MS = 60000; // 1 minute

function getSessionId() {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
        id = crypto.randomUUID();
        sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
}

export function initPresence(updateCallback) {
    const sessionId = getSessionId();
    const presenceRef = doc(db, "presence", sessionId);

    // 1. Send initial heartbeat
    const beat = async () => {
        try {
            await setDoc(presenceRef, {
                lastSeen: serverTimestamp(),
                userAgent: navigator.userAgent
            }, { merge: true });
        } catch (e) {
            console.error("Heartbeat failed", e);
        }
    };

    beat();
    setInterval(beat, HEARTBEAT_INTERVAL);

    // 2. Listen to active users count
    // Note: Firestore requires an index for this query usually, but for small datasets it might work 
    // or prompt for index creation. Queries on different fields (none here) + sorting/filtering.
    // Here we filter by 'lastSeen'.
    try {
        const threshold = Timestamp.fromMillis(Date.now() - ONLINE_THRESHOLD_MS);
        const q = query(
            collection(db, "presence"),
            where('lastSeen', '>', threshold)
        );

        onSnapshot(q, (snapshot) => {
            const count = snapshot.size;
            if (updateCallback) updateCallback(count);
        });
    } catch (e) {
        console.error("Presence listener failed", e);
    }
}
