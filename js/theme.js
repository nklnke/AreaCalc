// ===== УПРАВЛЕНИЕ ТЕМОЙ =====
window.Theme = (function() {
    let themeToggle = null;
    
    function init() {
        themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', toggle);
        }
        
        // Слушаем системную тему
        if (window.matchMedia) {
            const darkModeMedia = window.matchMedia('(prefers-color-scheme: dark)');
            darkModeMedia.addEventListener('change', (e) => {
                if (!localStorage.getItem('theme')) {
                    applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }
    
    // Применяет тему за 1 кадр: давит транзишены классом theme-instant
    // (см. base.css), чтобы блоки не перекрашивались вразнобой 0.2-0.3с.
    function applyTheme(theme) {
        const html = document.documentElement;
        html.classList.add('theme-instant');
        void html.offsetWidth;
        html.setAttribute('data-theme', theme);
        try { html.style.colorScheme = theme; } catch (e) { /* noop */ }
        updateIcon(theme);
        void html.offsetWidth;
        requestAnimationFrame(() => {
            requestAnimationFrame(() => html.classList.remove('theme-instant'));
        });
    }
    
    function updateIcon(theme) {
        if (!themeToggle) return;
        if (theme === 'dark') {
            themeToggle.textContent = '☀️';
            themeToggle.title = 'Переключить на светлую тему';
        } else {
            themeToggle.textContent = '🌙';
            themeToggle.title = 'Переключить на тёмную тему';
        }
    }
    
    function load() {
        try {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme) {
                applyTheme(savedTheme);
            } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                applyTheme('dark');
            } else {
                try { document.documentElement.style.colorScheme = 'light'; } catch (e) { /* noop */ }
            }
        } catch (e) {
            console.log('Theme loading error:', e);
        }
    }
    
    function toggle() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        
        if (themeToggle) {
            themeToggle.classList.add('changing');
            setTimeout(() => themeToggle.classList.remove('changing'), 500);
        }
    }
    
    return {
        init,
        load,
        toggle
    };
})();
