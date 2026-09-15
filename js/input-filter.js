// ===== ФИЛЬТР ВВОДА (только цифры и разделитель) =====
window.InputFilter = (function() {
    
    function setup(input) {
        if (!input) return;
        
        input.addEventListener('input', function() {
            let value = this.value;
            
            value = value.replace(/,/g, '.');
            value = value.replace(/[^0-9.]/g, '');
            
            const parts = value.split('.');
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
            }
            
            const [intPart, decPart] = value.split('.');
            if (intPart && intPart.length > 10) {
                value = intPart.slice(0, 10) + (decPart !== undefined ? '.' + (decPart || '') : '');
            }
            if (decPart && decPart.length > 4) {
                value = intPart + '.' + decPart.slice(0, 4);
            }
            
            if (this.value !== value) {
                this.value = value;
            }
        });
        
        input.addEventListener('keydown', function(e) {
            const allowedKeys = [
                'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
                'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                'Home', 'End'
            ];
            
            if (allowedKeys.includes(e.key)) return;
            
            if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
                return;
            }
            
            if (/^[0-9]$/.test(e.key)) return;
            
            if (e.key === '.' || e.key === ',') {
                if (this.value.includes('.') || this.value.includes(',')) {
                    e.preventDefault();
                }
                return;
            }
            
            e.preventDefault();
        });
        
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            
            let cleaned = pastedText
                .replace(/,/g, '.')
                .replace(/[^0-9.]/g, '');
            
            const parts = cleaned.split('.');
            if (parts.length > 2) {
                cleaned = parts[0] + '.' + parts.slice(1).join('');
            }
            
            const start = this.selectionStart;
            const end = this.selectionEnd;
            const currentValue = this.value;
            const newValue = currentValue.slice(0, start) + cleaned + currentValue.slice(end);
            
            this.value = newValue;
            this.dispatchEvent(new Event('input'));
        });
    }
    
    function setupAll() {
        setup(document.getElementById('widthInput'));
        setup(document.getElementById('heightInput'));
        setup(document.getElementById('customMultInput'));
        setup(document.getElementById('editWidth'));
        setup(document.getElementById('editHeight'));
        setup(document.getElementById('editMultiplier'));
    }
    
    return {
        setup,
        setupAll
    };
})();
