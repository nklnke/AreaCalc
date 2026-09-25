// ===== ОКНО СПРАВКИ О ПРИЛОЖЕНИИ (кнопка ? в панели окна) =====
// Оверлей #helpModal описан в index.html, стили — в css/help.css.
// Внешние ссылки открываем через electronAPI.openExternal (main.js whitelist
// на GitHub-репозиторий): прямой <a href> в песочнице увёл бы окно на внешний сайт.
window.Help = (function() {
    let modal = null;
    let closeBtn = null;

    function api() {
        return window.electronAPI || null;
    }

    function init() {
        modal = document.getElementById('helpModal');
        if (!modal) return;
        closeBtn = document.getElementById('helpCloseBtn');

        const helpBtn = document.getElementById('helpBtn');
        if (helpBtn) {
            helpBtn.addEventListener('click', function() {
                open();
            });
        }
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                close();
            });
        }

        modal.addEventListener('click', function(e) {
            if (e.target === modal) close();
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.style.display === 'flex') close();
        });

        modal.querySelectorAll('.help-link').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const url = btn.getAttribute('data-url');
                if (api() && typeof api().openExternal === 'function' && url) {
                    api().openExternal(url).catch(function(err) { console.error(err); });
                }
            });
        });
    }

    function open() {
        if (!modal) return;
        loadVersion();
        modal.style.display = 'flex';
        if (closeBtn) setTimeout(function() { closeBtn.focus(); }, 50);
    }

    function close() {
        if (!modal) return;
        modal.style.display = 'none';
    }

    function loadVersion() {
        const el = document.getElementById('helpVersion');
        if (!el || !api() || typeof api().getVersion !== 'function') return;
        api().getVersion().then(function(version) {
            if (version) el.textContent = version;
        }).catch(function(err) { console.error(err); });
    }

    return {
        init: init,
        open: open,
        close: close
    };
})();
