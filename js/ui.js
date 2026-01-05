// Custom UI Notifications & Confirmations (Moved to notification.js)
import { APP_VERSION } from './version.js';

document.addEventListener('DOMContentLoaded', () => {
    // 0. Auto-Inject Version to Footer
    const versionSpans = document.querySelectorAll('.version');
    versionSpans.forEach(span => {
        span.textContent = APP_VERSION;
    });

    // 1. Social Media Links Simulation
    const fbLink = document.getElementById('social-fb');
    const igLink = document.getElementById('social-ig');
    const lineLink = document.getElementById('social-line');

    [fbLink, igLink].forEach(link => {
        if (link) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.showToast) showToast('官方粉絲團建置中，敬請期待！🎉', 'info');
                else alert('官方粉絲團建置中！');
            });
        }
    });

    if (lineLink) {
        lineLink.addEventListener('click', (e) => {
            e.preventDefault();
            navigator.clipboard.writeText('@bluecore').then(() => {
                if (window.showToast) showToast('已複製官方 Line ID: @bluecore', 'success');
                else alert('已複製 Line ID: @bluecore');
            }).catch(() => {
                if (window.showToast) showToast('請搜尋 Line ID: @bluecore', 'info');
            });
        });
    }
});

