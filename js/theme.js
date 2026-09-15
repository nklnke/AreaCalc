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
                    const theme = e.matches ? 'dark' : 'light';
                    document.documentElement.setAttribute('data-theme', theme);
                    updateIcon(theme);
                }
            });
        }
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
                document.documentElement.setAttribute('data-theme', savedTheme);
                updateIcon(savedTheme);
            } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.setAttribute('data-theme', 'dark');
                updateIcon('dark');
            }
        } catch (e) {
            console.log('Theme loading error:', e);
        }
    }
    
    function toggle() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateIcon(newTheme);
        
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
