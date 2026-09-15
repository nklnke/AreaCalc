// ===== РЕДАКТИРОВАНИЕ ЗАПИСЕЙ =====
window.Edit = (function() {
    let editModal = null;
    let editWidth = null;
    let editHeight = null;
    let editMultiplier = null;
    let editNote = null;
    let editPreview = null;
    let editCancelBtn = null;
    let editSaveBtn = null;
    let editingId = null;
    
    function init() {
        editModal = document.getElementById('editModal');
        editWidth = document.getElementById('editWidth');
        editHeight = document.getElementById('editHeight');
        editMultiplier = document.getElementById('editMultiplier');
        editNote = document.getElementById('editNote');
        editPreview = document.getElementById('editPreview');
        editCancelBtn = document.getElementById('editCancelBtn');
        editSaveBtn = document.getElementById('editSaveBtn');
        
        editWidth.addEventListener('input', updatePreview);
        editHeight.addEventListener('input', updatePreview);
        editMultiplier.addEventListener('input', updatePreview);
        
        editCancelBtn.addEventListener('click', close);
        editSaveBtn.addEventListener('click', save);
        
        [editWidth, editHeight, editMultiplier].forEach(input => {
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    save();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    close();
                }
            });
        });
        
        editNote.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                e.preventDefault();
                close();
            }
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                save();
            }
        });
        
        editModal.addEventListener('click', function(e) {
            if (e.target === editModal) close();
        });
    }
    
    function open(id) {
        const history = Data.get();
        const item = history.find(i => i.id === id);
        if (!item) return;
        
        editingId = id;
        editWidth.value = item.width;
        editHeight.value = item.height;
        editMultiplier.value = item.multiplier || 1;
        editNote.value = item.note || '';
        
        updatePreview();
        editModal.style.display = 'flex';
        
        setTimeout(() => {
            editWidth.focus();
            editWidth.select();
        }, 50);
    }
    
    function updatePreview() {
        const w = Utils.parseNumber(editWidth.value) || 0;
        const h = Utils.parseNumber(editHeight.value) || 0;
        const m = Utils.parseNumber(editMultiplier.value) || 1;
        const precision = Precision.get();
        
        const area = (w * h / 1000000) * m;
        editPreview.textContent = `${area.toFixed(precision)} м²`;
    }
    
    async function save() {
        if (editingId === null) return;
        
        const w = Utils.parseNumber(editWidth.value);
        const h = Utils.parseNumber(editHeight.value);
        const m = Utils.parseNumber(editMultiplier.value);
        const note = editNote.value.trim();
        
        if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
            await Modal.showError('Введите положительные числа для ширины и высоты.');
            return;
        }
        
        if (isNaN(m) || m <= 0) {
            await Modal.showError('Множитель должен быть положительным числом.');
            return;
        }
        
        const history = Data.get();
        const index = history.findIndex(i => i.id === editingId);
        if (index === -1) return;
        
        history[index].width = w;
        history[index].height = h;
        
        if (m !== 1) {
            history[index].multiplier = m;
            history[index].isMultiplied = true;
        } else {
            delete history[index].multiplier;
            history[index].isMultiplied = false;
        }
        
        if (note) {
            history[index].note = note;
        } else {
            delete history[index].note;
        }
        
        history[index].timestamp = Date.now();
        
        await Data.save();
        History.render();
        close();
    }
    
    function close() {
        editModal.style.display = 'none';
        editingId = null;
    }
    
    return {
        init,
        open,
        save,
        close
    };
})();
