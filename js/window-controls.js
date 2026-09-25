// ===== СВОЯ ПАНЕЛЬ ОКНА (свернуть / закрыть) =====
// Окно фиксированного размера (main.js: resizable/maximizable false),
// поэтому кнопок разворачивания нет. Работает только в Electron
// (window.electronAPI). В браузере панель прячем.
window.WindowControls = (function() {
    function api() {
        return window.electronAPI || null;
    }

    function init() {
        const bar = document.getElementById('titlebar');
        if (!bar) return;
        if (!api()) {
            bar.style.display = 'none';
            return;
        }

        loadVersion();

        document.getElementById('winMinBtn').addEventListener('click', function() {
            api().minimizeWindow().catch(function(e) { console.error(e); });
        });
        document.getElementById('winCloseBtn').addEventListener('click', function() {
            api().closeWindow().catch(function(e) { console.error(e); });
        });
    }

    function loadVersion() {
        const el = document.getElementById('appVersion');
        if (!el || !api() || typeof api().getVersion !== 'function') return;
        api().getVersion().then(function(version) {
            if (version) el.textContent = version;
        }).catch(function(e) { console.error(e); });
    }

    return {
        init: init
    };
})();
