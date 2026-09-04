(async function() {
    const widthInput = document.getElementById('widthInput');
    const heightInput = document.getElementById('heightInput');
    const addBtn = document.getElementById('addBtn');
    const totalDisplay = document.getElementById('totalDisplay');
    const historyList = document.getElementById('historyList');
    const itemsCount = document.getElementById('itemsCount');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const multiplierSection = document.getElementById('multiplierSection');
    const lastItemInfo = document.getElementById('lastItemInfo');
    const customMultInput = document.getElementById('customMultInput');
    const applyCustomMult = document.getElementById('applyCustomMult');

    // ===== КАСТОМНОЕ МОДАЛЬНОЕ ОКНО =====
    const modal = document.getElementById('customModal');
    const modalMessage = document.getElementById('modalMessage');
    const modalButton = document.getElementById('modalButton');

    // Функция показа кастомного окна
    function showModal(message) {
        return new Promise((resolve) => {
            modalMessage.textContent = message;
            modal.style.display = 'flex';
            
            // Фокусируемся на кнопке модального окна
            setTimeout(() => modalButton.focus(), 50);
            
            // Обработчик кнопки
            const handler = () => {
                modal.style.display = 'none';
                modalButton.removeEventListener('click', handler);
                modalButton.removeEventListener('keydown', keyHandler);
                resolve();
            };
            
            // Обработчик клавиши Enter
            const keyHandler = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handler();
                }
            };
            
            modalButton.addEventListener('click', handler);
            modalButton.addEventListener('keydown', keyHandler);
            
            // Закрытие по клику вне окна
            const overlayHandler = (e) => {
                if (e.target === modal) {
                    handler();
                }
            };
            modal.addEventListener('click', overlayHandler);
            
            // Сохраняем ссылки для очистки
            modal._cleanup = () => {
                modal.removeEventListener('click', overlayHandler);
            };
        });
    }

    // Функция показа ошибки
    async function showError(message) {
        await showModal('❌ ' + message);
        // После закрытия модального окна активируем поля
        forceActivateInputs();
    }

    // Жёсткая активация полей ввода
    function forceActivateInputs() {
        // Снимаем все блокировки
        widthInput.disabled = false;
        heightInput.disabled = false;
        widthInput.readOnly = false;
        heightInput.readOnly = false;
        widthInput.removeAttribute('disabled');
        heightInput.removeAttribute('disabled');
        widthInput.removeAttribute('readonly');
        heightInput.removeAttribute('readonly');
        
        // Ставим фокус с задержкой
        setTimeout(() => {
            if (widthInput.value === '') {
                widthInput.focus();
                widthInput.click();
            } else if (heightInput.value === '') {
                heightInput.focus();
                heightInput.click();
            } else {
                widthInput.focus();
                widthInput.click();
            }
        }, 50);
    }

    // ===== ОСНОВНАЯ ЛОГИКА =====

    let history = [];

    async function loadData() {
        try {
            const data = await window.electronAPI.loadData();
            history = data || [];
            render();
        } catch (error) {
            console.error('Error loading data:', error);
            history = [];
            render();
        }
    }

    async function saveData() {
        try {
            await window.electronAPI.saveData(history);
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    function calcAreaInM2(widthMM, heightMM) {
        const areaMM2 = widthMM * heightMM;
        return Math.round((areaMM2 / 1000000) * 100) / 100;
    }

    function getTotalArea() {
        let sum = 0;
        for (let item of history) {
            sum += item.area;
        }
        return Math.round(sum * 100) / 100;
    }

    function getLastItem() {
        if (history.length === 0) return null;
        return history[history.length - 1];
    }

    function updateLastItemInfo() {
        const last = getLastItem();
        if (last) {
            const w = Math.round(last.width);
            const h = Math.round(last.height);
            let infoText = `${w}×${h} мм = ${last.area.toFixed(2)} м²`;
            if (last.isMultiplied && last.multiplier) {
                infoText = `${w}×${h} мм × ${last.multiplier} = ${last.area.toFixed(2)} м²`;
            }
            lastItemInfo.textContent = infoText;
            multiplierSection.classList.add('visible');
        } else {
            lastItemInfo.textContent = '—';
            multiplierSection.classList.remove('visible');
        }
    }

    function render() {
        const total = getTotalArea();
        totalDisplay.innerHTML = `${total} <small>м²</small>`;

        itemsCount.textContent = history.length;

        if (history.length === 0) {
            historyList.innerHTML = `<li class="empty-state">📭 История пуста</li>`;
            updateLastItemInfo();
            forceActivateInputs();
            return;
        }

        let html = '';
        const reversed = [...history].reverse();
        for (let item of reversed) {
            const date = new Date(item.timestamp);
            const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            const w = Math.round(item.width);
            const h = Math.round(item.height);
            const area = item.area.toFixed(2);
            
            let dimsText = `${w} × ${h} мм`;
            if (item.isMultiplied && item.multiplier) {
                dimsText += ` <span class="multiplier-badge">×${item.multiplier}</span>`;
            }
            
            html += `
                <li data-id="${item.id}">
                    <div class="item-info">
                        <div class="item-dims">${dimsText}</div>
                        <div class="item-time">${timeStr}</div>
                    </div>
                    <div class="item-actions">
                        <span class="area-badge">${area} м²</span>
                        <button class="del-btn" data-id="${item.id}">✕</button>
                    </div>
                </li>
            `;
        }
        historyList.innerHTML = html;

        historyList.querySelectorAll('.del-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = this.getAttribute('data-id');
                if (id) deleteItemById(id);
            });
        });

        updateLastItemInfo();
        forceActivateInputs();
    }

    async function addRecord() {
        const width = parseFloat(widthInput.value);
        const height = parseFloat(heightInput.value);

        if (widthInput.value.trim() === '' || heightInput.value.trim() === '') {
            await showError('Введите ширину и высоту');
            return;
        }

        if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
            await showError('Введите положительные числа (в миллиметрах).');
            return;
        }

        const area = calcAreaInM2(width, height);

        const newItem = {
            id: Date.now() + Math.random().toString(36).substr(2, 4),
            width: width,
            height: height,
            area: area,
            timestamp: Date.now(),
            isMultiplied: false
        };

        history.push(newItem);
        await saveData();
        render();

        widthInput.value = '';
        heightInput.value = '';
        setTimeout(() => widthInput.focus(), 50);
    }

    function multiplyLast(multiplier) {
        if (history.length === 0) {
            showError('Сначала добавьте хотя бы один элемент.');
            return;
        }

        if (isNaN(multiplier) || multiplier <= 0) {
            showError('Множитель должен быть положительным числом.');
            return;
        }

        const lastIndex = history.length - 1;
        const last = history[lastIndex];
        if (!last) return;

        const newArea = Math.round((last.area * multiplier) * 100) / 100;
        
        history[lastIndex] = {
            id: last.id,
            width: last.width,
            height: last.height,
            area: newArea,
            multiplier: multiplier,
            timestamp: Date.now(),
            isMultiplied: true,
            originalArea: last.originalArea || last.area
        };

        saveData();
        render();
        
        const w = Math.round(last.width);
        const h = Math.round(last.height);
        lastItemInfo.textContent = `✅ ${w}×${h} мм × ${multiplier} = ${newArea.toFixed(4)} м²`;
        
        setTimeout(() => {
            updateLastItemInfo();
        }, 1500);
    }

    async function deleteItemById(id) {
        const index = history.findIndex(item => item.id === id);
        if (index !== -1) {
            history.splice(index, 1);
            await saveData();
            render();
        }
    }

    async function clearAll() {
        if (history.length === 0) return;
        history = [];
        await saveData();
        render();
        setTimeout(() => widthInput.focus(), 50);
    }

    // ===== ОБРАБОТЧИКИ =====
    
    addBtn.addEventListener('click', function(e) {
        e.preventDefault();
        addRecord();
    });

    widthInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (heightInput.value === '') {
                heightInput.focus();
            } else {
                addRecord();
            }
        }
    });

    heightInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addRecord();
        }
    });

    // Постоянная защита полей
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

    document.querySelectorAll('[data-mult]').forEach(btn => {
        btn.addEventListener('click', function() {
            const mult = parseFloat(this.getAttribute('data-mult'));
            multiplyLast(mult);
        });
    });

    applyCustomMult.addEventListener('click', function() {
        const val = parseFloat(customMultInput.value);
        if (!isNaN(val) && val > 0) {
            multiplyLast(val);
            customMultInput.value = '';
        } else {
            showError('Введите положительное число.');
        }
    });

    customMultInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            applyCustomMult.click();
        }
    });

    clearAllBtn.addEventListener('click', clearAll);

    if (window.electronAPI && typeof window.electronAPI.onClearHistory === 'function') {
        window.electronAPI.onClearHistory(() => {
            clearAll();
        });
    }

    // ===== ЗАПУСК =====
    await loadData();
    forceActivateInputs();
    setTimeout(() => widthInput.focus(), 100);
})();
