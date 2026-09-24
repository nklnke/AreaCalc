// ===== КАСТОМНОЕ МОДАЛЬНОЕ ОКНО =====
window.Modal = (function() {
    let modal = null;
    let modalMessage = null;
    let modalButton = null;
    
    function init() {
        modal = document.getElementById('customModal');
        modalMessage = document.getElementById('modalMessage');
        modalButton = document.getElementById('modalButton');
    }
    
    function show(message) {
        return new Promise((resolve) => {
            modalMessage.textContent = message;
            modal.style.display = 'flex';
            
            setTimeout(() => modalButton.focus(), 50);
            
            const handler = () => {
                modal.style.display = 'none';
                modalButton.removeEventListener('click', handler);
                modalButton.removeEventListener('keydown', keyHandler);
                resolve();
            };
            
            const keyHandler = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handler();
                }
            };
            
            modalButton.addEventListener('click', handler);
            modalButton.addEventListener('keydown', keyHandler);
            
            const overlayHandler = (e) => {
                if (e.target === modal) {
                    handler();
                }
            };
            modal.addEventListener('click', overlayHandler);
        });
    }
    
    async function showError(message) {
        await show('❌ ' + message);
    }

    // Диалог подтверждения: resolve(true) — Ok, resolve(false) — отмена
    function confirm(message) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.style.display = 'flex';

            overlay.innerHTML = `
                <div class="modal-content">
                    <div class="modal-icon">⚠️</div>
                    <div class="modal-message"></div>
                    <div class="edit-modal-actions">
                        <button class="edit-btn-cancel" data-choice="cancel">Отмена</button>
                        <button class="edit-btn-save" data-choice="ok">Удалить</button>
                    </div>
                </div>
            `;
            overlay.querySelector('.modal-message').textContent = message;
            document.body.appendChild(overlay);

            const done = (value) => {
                overlay.remove();
                resolve(value);
            };

            overlay.querySelector('[data-choice="ok"]').addEventListener('click', () => done(true));
            overlay.querySelector('[data-choice="cancel"]').addEventListener('click', () => done(false));
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) done(false);
            });
            document.addEventListener('keydown', function esc(e) {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', esc);
                    done(false);
                }
            });
        });
    }
    
    return {
        init,
        show,
        showError,
        confirm
    };
})();
