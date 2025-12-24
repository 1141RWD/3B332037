// Custom UI Notifications & Confirmations (Moved to notification.js)
import { APP_VERSION } from './version.js';

document.addEventListener('DOMContentLoaded', () => {
    // 0. Auto-Inject Version to Footer
    const versionSpans = document.querySelectorAll('.version');
    versionSpans.forEach(span => {
        span.textContent = APP_VERSION;
    });
});

