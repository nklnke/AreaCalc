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
    
    return {
        init,
        show,
        showError
    };
})();
