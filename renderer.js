(async function() {
    // ===== DOM ЭЛЕМЕНТЫ =====
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
    const themeToggle = document.getElementById('themeToggle');

    // Элементы модального окна редактирования
    const editModal = document.getElementById('editModal');
    const editWidth = document.getElementById('editWidth');
    const editHeight = document.getElementById('editHeight');
    const editMultiplier = document.getElementById('editMultiplier');
    const editPreview = document.getElementById('editPreview');
    const editCancelBtn = document.getElementById('editCancelBtn');
    const editSaveBtn = document.getElementById('editSaveBtn');
    const editNote = document.getElementById('editNote');

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

    // ===== УПРАВЛЕНИЕ ТЕМОЙ =====
    
    // Обновление иконки кнопки
    function updateThemeIcon(theme) {
        if (theme === 'dark') {
            themeToggle.textContent = '☀️';
            themeToggle.title = 'Переключить на светлую тему';
        } else {
            themeToggle.textContent = '🌙';
            themeToggle.title = 'Переключить на тёмную тему';
        }
    }

    // Загрузка сохранённой темы
    function loadTheme() {
        try {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme) {
                document.documentElement.setAttribute('data-theme', savedTheme);
                updateThemeIcon(savedTheme);
            } else {
                // Проверяем системную тему
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                    updateThemeIcon('dark');
                }
            }
        } catch (e) {
            console.log('Theme loading error:', e);
        }
    }

    // Переключение темы
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
        
        // Анимация вращения иконки
        themeToggle.classList.add('changing');
        setTimeout(() => {
            themeToggle.classList.remove('changing');
        }, 500);
    }

    // Слушаем изменение системной темы
    if (window.matchMedia) {
        const darkModeMedia = window.matchMedia('(prefers-color-scheme: dark)');
        darkModeMedia.addEventListener('change', (e) => {
            // Меняем только если пользователь явно не выбрал тему
            if (!localStorage.getItem('theme')) {
                const theme = e.matches ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', theme);
                updateThemeIcon(theme);
            }
        });
    }

    // Добавляем обработчик для кнопки темы
    themeToggle.addEventListener('click', toggleTheme);

    // ===== ПЕРЕКЛЮЧАТЕЛЬ ТОЧНОСТИ =====
    const precisionBtns = document.querySelectorAll('.precision-btn');
    let currentPrecision = 2; // Точность по умолчанию (2, 3 или 4)

    // Установка точности
    function setPrecision(precision) {
        currentPrecision = precision;
        localStorage.setItem('precision', precision);
        
        // Обновляем активную кнопку
        precisionBtns.forEach(btn => {
            if (parseInt(btn.dataset.precision) === precision) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Просто перерисовываем — точные значения уже сохранены
        render();
    }

    // Загрузка сохранённой точности
    function loadPrecision() {
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

    // Обработчики кнопок точности
    precisionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const precision = parseInt(this.dataset.precision);
            setPrecision(precision);
        });
    });

    // ===== ОСНОВНАЯ ЛОГИКА =====

    let history = [];
    let newItemIds = new Set(); // ID записей, которые нужно анимировать
    let editingId = null; // ID записи, которую редактируем
    let isRendering = false; // Защита от параллельных рендеров

    // Загрузка данных из файла
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

    // Сохранение данных в файл
    async function saveData() {
        try {
            await window.electronAPI.saveData(history);
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    // ===== СКЕЛЕТОН ЗАГРУЗКИ =====
    
    // Показать скелетон
    function showSkeleton() {
        document.body.classList.add('loading');
    }

    // Скрыть скелетон
    function hideSkeleton() {
        document.body.classList.remove('loading');
    }

    // Точная площадь в м² (без округления)
    function getRawArea(item) {
        return (item.width * item.height) / 1000000;
    }

    // Площадь с учётом множителя (точная, без округления)
    function getDisplayArea(item) {
        const raw = getRawArea(item);
        const multiplier = (item.isMultiplied && item.multiplier) ? item.multiplier : 1;
        return raw * multiplier;
    }

    // Общая площадь (точная сумма всех площадей с множителями)
    function getTotalArea() {
        let sum = 0;
        for (let item of history) {
            sum += getDisplayArea(item);
        }
        return sum;
    }

    // Получение последнего элемента
    function getLastItem() {
        if (history.length === 0) return null;
        return history[history.length - 1];
    }

    // Обновление информации о последнем элементе
    function updateLastItemInfo() {
        const last = getLastItem();
        if (last) {
            const w = Math.round(last.width);
            const h = Math.round(last.height);
            const displayArea = getDisplayArea(last).toFixed(currentPrecision);
            
            let infoText = `${w}×${h} мм = ${displayArea} м²`;
            if (last.isMultiplied && last.multiplier) {
                infoText = `${w}×${h} мм × ${last.multiplier} = ${displayArea} м²`;
            }
            lastItemInfo.textContent = infoText;
            multiplierSection.classList.add('visible');
        } else {
            lastItemInfo.textContent = '—';
            multiplierSection.classList.remove('visible');
        }
    }

    // Экранирование HTML-символов (защита от XSS)
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Отрисовка интерфейса
    function render() {
        // Защита от параллельных вызовов
        if (isRendering) return;
        isRendering = true;
        
        try {
            const total = getTotalArea();
            totalDisplay.innerHTML = `${total.toFixed(currentPrecision)} <small>м²</small>`;

            itemsCount.textContent = history.length;
            
            // Анимация обновления
            totalDisplay.classList.remove('updated');
            void totalDisplay.offsetWidth;
            totalDisplay.classList.add('updated');

            if (history.length === 0) {
                historyList.innerHTML = `<li class="empty-state">📭 История пуста</li>`;
                updateLastItemInfo();
                return;
            }

            let html = '';
            const reversed = [...history].reverse();
            for (let item of reversed) {
                const date = new Date(item.timestamp);
                const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                const w = Math.round(item.width);
                const h = Math.round(item.height);
                const displayArea = getDisplayArea(item).toFixed(currentPrecision);
                
                let dimsText = `${w} × ${h} мм`;
                if (item.isMultiplied && item.multiplier) {
                    dimsText += ` <span class="multiplier-badge">×${item.multiplier}</span>`;
                }
                
                const isNew = newItemIds.has(item.id);
                const noteHtml = item.note 
                    ? `<div class="item-note">📝 ${escapeHtml(item.note)}</div>` 
                    : '';
                
                html += `
                    <li data-id="${item.id}" class="${isNew ? 'new' : ''}">
                        <div class="item-info">
                            <div class="item-dims">${dimsText}</div>
                            <div class="item-time">${timeStr}</div>
                            ${noteHtml}
                        </div>
                        <div class="item-actions">
                            <span class="area-badge">${displayArea} м²</span>
                            <button class="dup-btn" data-id="${item.id}" title="Дублировать">📋</button>
                            <button class="del-btn" data-id="${item.id}" title="Удалить">✕</button>
                        </div>
                    </li>
                `;
            }
            historyList.innerHTML = html;

            // Привязываем обработчики ко всем записям
            historyList.querySelectorAll('li[data-id]').forEach(li => {
                attachItemHandlers(li);
            });

            // Очищаем список новых — анимация проиграется один раз
            newItemIds.clear();

            updateLastItemInfo();
        } finally {
            isRendering = false;
        }
    }

    // Добавление новой записи
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

        // Сохраняем только размеры — площадь считается при отображении
        const newItem = {
            id: Date.now() + Math.random().toString(36).substr(2, 4),
            width: width,
            height: height,
            timestamp: Date.now(),
            isMultiplied: false
        };

        history.push(newItem);
        newItemIds.add(newItem.id); // ← помечаем как новую
        await saveData();
        render();

        widthInput.value = '';
        heightInput.value = '';
        setTimeout(() => widthInput.focus(), 50);
    }

    // Умножение последнего элемента
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

        // Сохраняем только множитель — размеры уже есть
        history[lastIndex] = {
            id: last.id,
            width: last.width,
            height: last.height,
            multiplier: multiplier,
            timestamp: Date.now(),
            isMultiplied: true
        };

        saveData();
        render();
        
        const w = Math.round(last.width);
        const h = Math.round(last.height);
        const raw = (last.width * last.height) / 1000000;
        const displayArea = (raw * multiplier).toFixed(currentPrecision);
        lastItemInfo.textContent = `✅ ${w}×${h} мм × ${multiplier} = ${displayArea} м²`;
        
        setTimeout(() => {
            updateLastItemInfo();
        }, 1500);
    }

    // Удаление записи по ID (с надёжной анимацией)
    async function deleteItemById(id) {
        const index = history.findIndex(item => item.id === id);
        if (index === -1) return;

        const li = historyList.querySelector(`li[data-id="${id}"]`);
        
        if (!li) {
            // Если элемента нет в DOM — удаляем сразу
            history.splice(index, 1);
            newItemIds.delete(id);
            await saveData();
            render();
            return;
        }

        // Защита от повторного клика
        if (li.dataset.removing === 'true') return;
        li.dataset.removing = 'true';

        // Запускаем анимацию
        li.classList.add('removing');

        // Функция завершения удаления
        const finishDelete = async () => {
            // Проверяем, что запись ещё в истории
            const currentIndex = history.findIndex(item => item.id === id);
            if (currentIndex !== -1) {
                history.splice(currentIndex, 1);
                newItemIds.delete(id);
                await saveData();
            }
            
            // Удаляем элемент из DOM
            if (li.parentNode) {
                li.remove();
            }
            
            // Обновляем счётчики
            updateTotals();
            updateLastItemInfo();
            
            // Если история опустела — показываем пустое состояние
            if (history.length === 0) {
                historyList.innerHTML = `<li class="empty-state">📭 История пуста</li>`;
            }
        };

        // Ждём окончания анимации через animationend
        let animationEnded = false;
        const onAnimationEnd = (e) => {
            // Игнорируем всплывающие события от дочерних элементов
            if (e.target !== li) return;
            animationEnded = true;
            li.removeEventListener('animationend', onAnimationEnd);
            finishDelete();
        };
        li.addEventListener('animationend', onAnimationEnd);

        // Запасной таймер на случай, если animationend не сработает
        setTimeout(() => {
            if (!animationEnded) {
                li.removeEventListener('animationend', onAnimationEnd);
                finishDelete();
            }
        }, 500);
    }

    // Обновление только суммы и счётчика (без перерисовки списка)
    function updateTotals() {
        const total = getTotalArea();
        totalDisplay.innerHTML = `${total.toFixed(currentPrecision)} <small>м²</small>`;
        itemsCount.textContent = history.length;
        
        // Анимация обновления значения
        totalDisplay.classList.remove('updated');
        void totalDisplay.offsetWidth; // Триггер перерисовки
        totalDisplay.classList.add('updated');
        
        // Анимация счётчика
        itemsCount.classList.remove('updated');
        void itemsCount.offsetWidth;
        itemsCount.classList.add('updated');
    }

    // Дублирование записи по ID (с анимацией появления)
    async function duplicateItemById(id) {
        const index = history.findIndex(item => item.id === id);
        if (index === -1) return;
        
        const original = history[index];
        
        const duplicate = {
            id: Date.now() + Math.random().toString(36).substr(2, 4),
            width: original.width,
            height: original.height,
            multiplier: original.multiplier || 1,
            isMultiplied: original.isMultiplied || false,
            note: original.note || '', // копируем заметку
            timestamp: Date.now()
        };
        
        history.splice(index + 1, 0, duplicate);
        newItemIds.add(duplicate.id); // помечаем как новую
        
        await saveData();
        
        // Создаём новый DOM-элемент и вставляем после оригинала
        const originalLi = historyList.querySelector(`li[data-id="${id}"]`);
        if (originalLi) {
            const newLi = createHistoryItem(duplicate);
            newLi.classList.add('new'); // добавляем класс анимации
            originalLi.after(newLi);
            
            // Привязываем обработчики
            attachItemHandlers(newLi);
            
            // Обновляем счётчики
            updateTotals();
            updateLastItemInfo();
            
            // Очищаем флаг новой записи
            newItemIds.delete(duplicate.id);
        } else {
            render();
        }
        
        const w = Math.round(original.width);
        const h = Math.round(original.height);
        lastItemInfo.textContent = `📋 Скопировано: ${w}×${h} мм`;
        setTimeout(() => {
            updateLastItemInfo();
        }, 1500);
    }

    // Создание DOM-элемента для записи
    function createHistoryItem(item) {
        const date = new Date(item.timestamp);
        const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const w = Math.round(item.width);
        const h = Math.round(item.height);
        const displayArea = getDisplayArea(item).toFixed(currentPrecision);
        
        let dimsText = `${w} × ${h} мм`;
        if (item.isMultiplied && item.multiplier) {
            dimsText += ` <span class="multiplier-badge">×${item.multiplier}</span>`;
        }
        
        const noteHtml = item.note 
            ? `<div class="item-note">📝 ${escapeHtml(item.note)}</div>` 
            : '';
        
        const li = document.createElement('li');
        li.dataset.id = item.id;
        li.innerHTML = `
            <div class="item-info">
                <div class="item-dims">${dimsText}</div>
                <div class="item-time">${timeStr}</div>
                ${noteHtml}
            </div>
            <div class="item-actions">
                <span class="area-badge">${displayArea} м²</span>
                <button class="dup-btn" data-id="${item.id}" title="Дублировать">📋</button>
                <button class="del-btn" data-id="${item.id}" title="Удалить">✕</button>
            </div>
        `;
        return li;
    }

    // Привязка обработчиков к элементу записи
    function attachItemHandlers(li) {
        const delBtn = li.querySelector('.del-btn');
        const dupBtn = li.querySelector('.dup-btn');
        const id = li.getAttribute('data-id');
        
        if (delBtn) {
            delBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                
                // Защита от повторного клика
                if (this.dataset.clicked === 'true') return;
                this.dataset.clicked = 'true';
                
                this.classList.add('clicked');
                
                // Небольшая задержка для анимации кнопки
                setTimeout(() => {
                    deleteItemById(id);
                }, 150);
            });
        }
        
        if (dupBtn) {
            dupBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                duplicateItemById(id);
            });
        }

        // Клик по самой записи — редактирование
        li.addEventListener('click', function(e) {
            // Игнорируем клики по кнопкам
            if (e.target.closest('button')) return;
            openEditModal(id);
        });
    }

    // ===== РЕДАКТИРОВАНИЕ ЗАПИСЕЙ =====

    // Открытие модального окна редактирования
    function openEditModal(id) {
        const item = history.find(i => i.id === id);
        if (!item) return;

        editingId = id;

        // Заполняем поля
        editWidth.value = item.width;
        editHeight.value = item.height;
        editMultiplier.value = item.multiplier || 1;
        editNote.value = item.note || '';

        // Обновляем превью
        updateEditPreview();

        // Показываем модальное окно
        editModal.style.display = 'flex';

        // Фокус на первое поле
        setTimeout(() => {
            editWidth.focus();
            editWidth.select();
        }, 50);
    }

    // Обновление превью площади в модальном окне
    function updateEditPreview() {
        const w = parseFloat(editWidth.value) || 0;
        const h = parseFloat(editHeight.value) || 0;
        const m = parseFloat(editMultiplier.value) || 1;
        
        const area = (w * h / 1000000) * m;
        editPreview.textContent = `${area.toFixed(currentPrecision)} м²`;
    }

    // Сохранение изменений
    async function saveEdit() {
        if (editingId === null) return;

        const w = parseFloat(editWidth.value);
        const h = parseFloat(editHeight.value);
        const m = parseFloat(editMultiplier.value);
        const note = editNote.value.trim();

        // Валидация
        if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
            await showError('Введите положительные числа для ширины и высоты.');
            return;
        }

        if (isNaN(m) || m <= 0) {
            await showError('Множитель должен быть положительным числом.');
            return;
        }

        const index = history.findIndex(i => i.id === editingId);
        if (index === -1) return;

        // Обновляем запись
        history[index].width = w;
        history[index].height = h;
        
        // Если множитель не 1 — сохраняем его, иначе убираем
        if (m !== 1) {
            history[index].multiplier = m;
            history[index].isMultiplied = true;
        } else {
            delete history[index].multiplier;
            history[index].isMultiplied = false;
        }

        // Сохраняем заметку (если не пустая)
        if (note) {
            history[index].note = note;
        } else {
            delete history[index].note;
        }

        // Обновляем время
        history[index].timestamp = Date.now();

        await saveData();
        render();

        closeEditModal();
    }

    // Закрытие модального окна редактирования
    function closeEditModal() {
        editModal.style.display = 'none';
        editingId = null;
    }

    // Обработчики для модального окна
    editWidth.addEventListener('input', updateEditPreview);
    editHeight.addEventListener('input', updateEditPreview);
    editMultiplier.addEventListener('input', updateEditPreview);

    editCancelBtn.addEventListener('click', closeEditModal);
    editSaveBtn.addEventListener('click', saveEdit);

    // Enter — сохранить (только в input, не в textarea), Esc — отмена
    [editWidth, editHeight, editMultiplier].forEach(input => {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                closeEditModal();
            }
        });
    });

    // Для textarea — только Esc закрывает (Enter переносит строку)
    editNote.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            closeEditModal();
        }
        // Ctrl+Enter — сохранить
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            saveEdit();
        }
    });

    // Закрытие по клику вне окна
    editModal.addEventListener('click', function(e) {
        if (e.target === editModal) {
            closeEditModal();
        }
    });

    // Очистка всей истории (с анимацией)
    async function clearAll() {
        if (history.length === 0) return;

        const items = historyList.querySelectorAll('li');
        
        if (items.length > 0) {
            // Запускаем анимацию для всех записей
            items.forEach((li, index) => {
                setTimeout(() => {
                    li.classList.add('removing-all');
                }, index * 30); // Поочерёдное исчезновение
            });

            // Ждём окончания всех анимаций
            const totalTime = items.length * 30 + 300;
            
            setTimeout(async () => {
                history = [];
                await saveData();
                render();
                setTimeout(() => widthInput.focus(), 50);
            }, totalTime);
        } else {
            history = [];
            await saveData();
            render();
            setTimeout(() => widthInput.focus(), 50);
        }
    }

    // ОБРАБОТЧИКИ СОБЫТИЙ
    
    // Кнопка "Добавить"
    addBtn.addEventListener('click', function(e) {
        e.preventDefault();
        addRecord();
    });

    // Нажатие Enter в поле "Ширина"
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

    // Нажатие Enter в поле "Высота"
    heightInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addRecord();
        }
    });

    // Постоянная защита полей от блокировки
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

    // Кнопки множителя (×2, ×3, ×4, ×5)
    document.querySelectorAll('[data-mult]').forEach(btn => {
        btn.addEventListener('click', function() {
            const mult = parseFloat(this.getAttribute('data-mult'));
            multiplyLast(mult);
        });
    });

    // Применение пользовательского множителя
    applyCustomMult.addEventListener('click', function() {
        const val = parseFloat(customMultInput.value);
        if (!isNaN(val) && val > 0) {
            multiplyLast(val);
            customMultInput.value = '';
        } else {
            showError('Введите положительное число.');
        }
    });

    // Нажатие Enter в поле пользовательского множителя
    customMultInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            applyCustomMult.click();
        }
    });

    // Кнопка очистки истории
    clearAllBtn.addEventListener('click', clearAll);

    // Подписка на событие очистки из меню (если есть)
    if (window.electronAPI && typeof window.electronAPI.onClearHistory === 'function') {
        window.electronAPI.onClearHistory(() => {
            clearAll();
        });
    }

    // ===== ЗАПУСК =====
    showSkeleton();    // Показываем скелетон
    loadTheme();       // Загружаем тему
    loadPrecision();   // Загружаем точность
    
    // Небольшая задержка, чтобы скелетон был виден даже при мгновенной загрузке
    // (убирает "мигание" при быстрой загрузке)
    const minSkeletonTime = new Promise(resolve => setTimeout(resolve, 400));
    
    await Promise.all([
        loadData(),      // Загружаем данные
        minSkeletonTime  // Ждём минимум 400ms
    ]);
    
    hideSkeleton();    // Скрываем скелетон
    forceActivateInputs();
    setTimeout(() => widthInput.focus(), 100);
})();
