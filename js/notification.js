export function initNotifications() {
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
        confirmModal.className = 'modal confirm-modal';
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
}

// Global Toast Function
export function showToast(message, type = 'info') {
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
}

// Global Confirm Function (Promise based)
export function showConfirm(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-confirm-modal');
        const msgEl = document.getElementById('confirm-message');
        const yesBtn = document.getElementById('confirm-yes-btn');
        const cancelBtn = document.getElementById('confirm-cancel-btn');

        if (!modal) {
            // Fallback if modal DOM missing
            const result = confirm(message);
            resolve(result);
            return;
        }

        msgEl.textContent = message;
        modal.classList.add('show'); // Use CSS class to show

        const close = (result) => {
            modal.classList.remove('show');
            // Remove listeners to avoid leaks/duplication
            yesBtn.onclick = null;
            cancelBtn.onclick = null;
            resolve(result);
        };

        yesBtn.onclick = () => close(true);
        cancelBtn.onclick = () => close(false);
    });
}

// Auto-init on import/load
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNotifications);
    } else {
        initNotifications();
    }
}

// Attach to window for global access
window.showToast = showToast;
window.showConfirm = showConfirm;
