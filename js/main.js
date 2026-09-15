// ===== ТОЧКА ВХОДА =====
(async function() {
    // Инициализация модулей
    Skeleton.init();
    Modal.init();
    Theme.init();
    Precision.init();
    History.init();
    Edit.init();
    InputFilter.setupAll();
    
    // Показываем скелетон
    Skeleton.show();
    
    // Загружаем тему и точность
    Theme.load();
    Precision.load();
    
    // Настраиваем поля
    const widthInput = document.getElementById('widthInput');
    const heightInput = document.getElementById('heightInput');
    const addBtn = document.getElementById('addBtn');
    const customMultInput = document.getElementById('customMultInput');
    const applyCustomMult = document.getElementById('applyCustomMult');
    const clearAllBtn = document.getElementById('clearAllBtn');
    
    // Загружаем данные параллельно с минимальным временем скелетона
    const minTime = new Promise(resolve => setTimeout(resolve, 400));
    await Promise.all([Data.load(), minTime]);
    
    // Рендерим историю
    History.render();
    
    // Скрываем скелетон
    Skeleton.hide();
    
    // ===== ОБРАБОТЧИКИ КНОПОК =====
    
    // Кнопка "Добавить"
    addBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        
        const width = Utils.parseNumber(widthInput.value);
        const height = Utils.parseNumber(heightInput.value);
        
        if (widthInput.value.trim() === '' || heightInput.value.trim() === '') {
            await Modal.showError('Введите ширину и высоту');
            return;
        }
        
        if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
            await Modal.showError('Введите положительные числа (в миллиметрах).');
            return;
        }
        
        await History.add(width, height);
        
        widthInput.value = '';
        heightInput.value = '';
        setTimeout(() => widthInput.focus(), 50);
    });
    
    // Enter в поле "Ширина"
    widthInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (heightInput.value === '') {
                heightInput.focus();
            } else {
                addBtn.click();
            }
        }
    });
    
    // Enter в поле "Высота"
    heightInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addBtn.click();
        }
    });
    
    // Защита полей от блокировки
    [widthInput, heightInput].forEach(input => {
        input.addEventListener('click', function() {
            this.disabled = false;
            this.readOnly = false;
            this.removeAttribute('disabled');
            this.removeAttribute('readonly');
            this.focus();
        });
        input.addEventListener('focus', function() {
            this.disabled = false;
            this.readOnly = false;
        });
    });
    
    // Кнопки множителя
    document.querySelectorAll('[data-mult]').forEach(btn => {
        btn.addEventListener('click', function() {
            const mult = parseFloat(this.getAttribute('data-mult'));
            History.multiplyLast(mult);
        });
    });
    
    // Пользовательский множитель
    applyCustomMult.addEventListener('click', function() {
        const val = Utils.parseNumber(customMultInput.value);
        if (!isNaN(val) && val > 0) {
            History.multiplyLast(val);
            customMultInput.value = '';
        } else {
            Modal.showError('Введите положительное число.');
        }
    });
    
    // Enter в поле множителя
    customMultInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            applyCustomMult.click();
        }
    });
    
    // Кнопка очистки истории
    clearAllBtn.addEventListener('click', History.clearAll);
    
    // Подписка на очистку из меню
    if (window.electronAPI && typeof window.electronAPI.onClearHistory === 'function') {
        window.electronAPI.onClearHistory(() => {
            History.clearAll();
        });
    }
    
    // Финальная активация и фокус
    forceActivateInputs();
    setTimeout(() => widthInput.focus(), 100);
    
    function forceActivateInputs() {
        widthInput.disabled = false;
        heightInput.disabled = false;
        widthInput.readOnly = false;
        heightInput.readOnly = false;
        widthInput.removeAttribute('disabled');
        heightInput.removeAttribute('disabled');
        widthInput.removeAttribute('readonly');
        heightInput.removeAttribute('readonly');
    }
})();
