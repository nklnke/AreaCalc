// ===== ТОЧНОСТЬ ОКРУГЛЕНИЯ =====
window.Precision = (function() {
    let currentPrecision = 2;
    let precisionBtns = [];
    
    function init() {
        precisionBtns = document.querySelectorAll('.precision-btn');
        
        precisionBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const precision = parseInt(this.dataset.precision);
                set(precision);
            });
        });
    }
    
    function set(precision) {
        currentPrecision = precision;
        localStorage.setItem('precision', precision);
        
        precisionBtns.forEach(btn => {
            if (parseInt(btn.dataset.precision) === precision) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Перерисовываем историю
        if (window.History && window.History.render) {
            window.History.render();
        }
    }
    
    function load() {
        try {
            const saved = localStorage.getItem('precision');
            if (saved) {
                const precision = parseInt(saved);
                if (precision === 2 || precision === 3 || precision === 4) {
                    currentPrecision = precision;
                }
            }
        } catch (e) {
            console.log('Precision loading error:', e);
        }
        
        precisionBtns.forEach(btn => {
            if (parseInt(btn.dataset.precision) === currentPrecision) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    function get() {
        return currentPrecision;
    }
    
    return {
        init,
        load,
        get,
        set
    };
})();
