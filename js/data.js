// ===== РАБОТА С ДАННЫМИ =====
window.Data = (function() {
    let history = [];
    
    async function load() {
        try {
            const data = await window.electronAPI.loadData();
            history = data || [];
            return history;
        } catch (error) {
            console.error('Error loading data:', error);
            history = [];
            return history;
        }
    }
    
    async function save() {
        try {
            const ok = await window.electronAPI.saveData(history);
            if (ok === false && window.Modal) {
                await window.Modal.showError('Не удалось сохранить данные на диск.');
            }
            return ok !== false;
        } catch (error) {
            console.error('Error saving data:', error);
            if (window.Modal) {
                try { await window.Modal.showError('Не удалось сохранить данные на диск.'); } catch (e) { /* noop */ }
            }
            return false;
        }
    }
    
    function get() {
        return history;
    }
    
    function set(newHistory) {
        history = newHistory;
    }
    
    function add(item) {
        history.push(item);
    }
    
    function removeById(id) {
        const index = history.findIndex(item => item.id === id);
        if (index !== -1) {
            history.splice(index, 1);
            return true;
        }
        return false;
    }
    
    function clear() {
        history = [];
    }
    
    return {
        load,
        save,
        get,
        set,
        add,
        removeById,
        clear
    };
})();
