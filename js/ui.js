// Custom UI Notifications & Confirmations
import { APP_VERSION } from './version.js';

document.addEventListener('DOMContentLoaded', () => {
    // 0. Auto-Inject Version to Footer
    const versionSpans = document.querySelectorAll('.version');
    versionSpans.forEach(span => {
        span.textContent = APP_VERSION;
    });

    // 1. Inject Toast Container
    if (!document.getElementById('toast-container')) {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    // 2. Inject Confirm Modal
    if (!document.getElementById('custom-confirm-modal')) {
        const confirmModal = document.createElement('div');
        confirmModal.id = 'custom-confirm-modal';
        confirmModal.className = 'modal confirm-modal'; // Use shared modal class but add specific
        confirmModal.innerHTML = `
            <div class="modal-content confirm-modal-content">
                <div class="modal-header">
                    <h2 id="confirm-title">確認</h2>
                </div>
                <div class="modal-body">
                    <p id="confirm-message" style="font-size: 1.1rem; color: #555; margin: 20px 0;"></p>
                </div>
                <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 10px;">
                    <button id="confirm-cancel-btn" class="btn-secondary">取消</button>
                    <button id="confirm-yes-btn" class="btn-primary">確定</button>
                </div>
            </div>
        `;
        document.body.appendChild(confirmModal);
    }
});

// Global Toast Function
window.showToast = function (message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // Icons
    let icon = '';
    if (type === 'success') icon = '<i class="fa-solid fa-check-circle"></i>';
    else if (type === 'error') icon = '<i class="fa-solid fa-circle-exclamation"></i>';
    else icon = '<i class="fa-solid fa-circle-info"></i>';

    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-message">${message}</div>
    `;

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Auto remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        }, 300); // Wait for fade out transition
    }, 3000);
};

// Global Confirm Function (Promise based)
window.showConfirm = function (message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-confirm-modal');
        const msgEl = document.getElementById('confirm-message');
        const yesBtn = document.getElementById('confirm-yes-btn');
        const cancelBtn = document.getElementById('confirm-cancel-btn');

        if (!modal) {
            // Fallback if DOM not ready
            resolve(window.confirm(message));
            return;
        }

        msgEl.textContent = message;
        modal.style.display = 'block';

        // Handlers
        const handleYes = () => {
            cleanup();
            resolve(true);
        };

        const handleCancel = () => {
            cleanup();
            resolve(false);
        };

        const cleanup = () => {
            modal.style.display = 'none';
            yesBtn.removeEventListener('click', handleYes);
            cancelBtn.removeEventListener('click', handleCancel);
        };

        yesBtn.addEventListener('click', handleYes);
        cancelBtn.addEventListener('click', handleCancel);

        // Click outside to close (optional, treated as cancel)
        modal.onclick = (e) => {
            if (e.target === modal) handleCancel();
        };
    });
};
