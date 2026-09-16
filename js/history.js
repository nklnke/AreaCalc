// ===== ИСТОРИЯ ЗАПИСЕЙ =====
window.History = (function() {
    let historyList = null;
    let totalDisplay = null;
    let itemsCount = null;
    let multiplierSection = null;
    let lastItemInfo = null;
    let newItemIds = new Set();
    let isRendering = false;
    
    function init() {
        historyList = document.getElementById('historyList');
        totalDisplay = document.getElementById('totalDisplay');
        itemsCount = document.getElementById('itemsCount');
        multiplierSection = document.getElementById('multiplierSection');
        lastItemInfo = document.getElementById('lastItemInfo');
    }
    
    // Точная площадь в м²
    function getRawArea(item) {
        return (item.width * item.height) / 1000000;
    }
    
    // Площадь с учётом множителя
    function getDisplayArea(item) {
        const raw = getRawArea(item);
        const multiplier = (item.isMultiplied && item.multiplier) ? item.multiplier : 1;
        return raw * multiplier;
    }
    
    // Общая площадь
    function getTotalArea() {
        let sum = 0;
        for (let item of Data.get()) {
            sum += getDisplayArea(item);
        }
        return sum;
    }
    
    // Последний элемент
    function getLastItem() {
        const history = Data.get();
        if (history.length === 0) return null;
        return history[history.length - 1];
    }
    
    // Обновление информации о последнем
    function updateLastItemInfo() {
        const last = getLastItem();
        const precision = Precision.get();
        
        // Блок множителя ВСЕГДА видим
        multiplierSection.classList.add('visible');
        
        if (last) {
            const w = Math.round(last.width);
            const h = Math.round(last.height);
            const displayArea = getDisplayArea(last).toFixed(precision);
            
            let infoText = `${w}×${h} мм = ${displayArea} м²`;
            if (last.isMultiplied && last.multiplier) {
                infoText = `${w}×${h} мм × ${last.multiplier} = ${displayArea} м²`;
            }
            lastItemInfo.textContent = infoText;
            
            // Активируем блок
            multiplierSection.classList.remove('disabled');
        } else {
            lastItemInfo.textContent = 'Сначала добавьте запись';
            
            // Приглушаем блок
            multiplierSection.classList.add('disabled');
        }
    }
    
    // Отрисовка
    function render() {
        if (isRendering) return;
        isRendering = true;
        
        try {
            const history = Data.get();
            const precision = Precision.get();
            const total = getTotalArea();
            
            totalDisplay.innerHTML = `${total.toFixed(precision)} <small>м²</small>`;
            itemsCount.textContent = history.length;
            
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
                const timeStr = Utils.formatTime(item.timestamp);
                const w = Math.round(item.width);
                const h = Math.round(item.height);
                const displayArea = getDisplayArea(item).toFixed(precision);
                
                let dimsText = `${w} × ${h} мм`;
                if (item.isMultiplied && item.multiplier) {
                    dimsText += ` <span class="multiplier-badge">×${item.multiplier}</span>`;
                }
                
                const noteHtml = item.note 
                    ? `<div class="item-note">📝 ${Utils.escapeHtml(item.note)}</div>` 
                    : '';
                
                const isNew = newItemIds.has(item.id);
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
            
            historyList.querySelectorAll('li[data-id]').forEach(li => {
                attachHandlers(li);
            });
            
            newItemIds.clear();
            updateLastItemInfo();
        } finally {
            isRendering = false;
        }
    }
    
    // Привязка обработчиков
    function attachHandlers(li) {
        const delBtn = li.querySelector('.del-btn');
        const dupBtn = li.querySelector('.dup-btn');
        const id = li.getAttribute('data-id');
        
        if (delBtn) {
            delBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (this.dataset.clicked === 'true') return;
                this.dataset.clicked = 'true';
                this.classList.add('clicked');
                setTimeout(() => deleteById(id), 150);
            });
        }
        
        if (dupBtn) {
            dupBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                duplicate(id);
            });
        }
        
        li.addEventListener('click', function(e) {
            if (e.target.closest('button')) return;
            if (window.Edit) Edit.open(id);
        });
    }
    
    // Добавление записи
    async function add(width, height) {
        const newItem = {
            id: Date.now() + Math.random().toString(36).substr(2, 4),
            width: width,
            height: height,
            timestamp: Date.now(),
            isMultiplied: false
        };
        
        Data.add(newItem);
        newItemIds.add(newItem.id);
        await Data.save();
        render();
        
        return newItem;
    }
    
    // Умножение последнего
    async function multiplyLast(multiplier) {
        const history = Data.get();
        if (history.length === 0) {
            await Modal.showError('Сначала добавьте хотя бы один элемент.');
            return;
        }
        
        if (isNaN(multiplier) || multiplier <= 0) {
            await Modal.showError('Множитель должен быть положительным числом.');
            return;
        }
        
        const lastIndex = history.length - 1;
        const last = history[lastIndex];
        
        history[lastIndex] = {
            id: last.id,
            width: last.width,
            height: last.height,
            multiplier: multiplier,
            timestamp: Date.now(),
            isMultiplied: true,
            note: last.note || ''
        };
        
        await Data.save();
        render();
        
        const w = Math.round(last.width);
        const h = Math.round(last.height);
        const precision = Precision.get();
        const raw = (last.width * last.height) / 1000000;
        const displayArea = (raw * multiplier).toFixed(precision);
        lastItemInfo.textContent = `✅ ${w}×${h} мм × ${multiplier} = ${displayArea} м²`;
        
        setTimeout(updateLastItemInfo, 1500);
    }
    
    // Удаление
    async function deleteById(id) {
        const li = historyList.querySelector(`li[data-id="${id}"]`);
        
        if (!li) {
            Data.removeById(id);
            newItemIds.delete(id);
            await Data.save();
            render();
            return;
        }
        
        if (li.dataset.removing === 'true') return;
        li.dataset.removing = 'true';
        li.classList.add('removing');
        
        const finishDelete = async () => {
            Data.removeById(id);
            newItemIds.delete(id);
            await Data.save();
            
            if (li.parentNode) li.remove();
            
            updateTotals();
            updateLastItemInfo();
            
            if (Data.get().length === 0) {
                historyList.innerHTML = `<li class="empty-state">📭 История пуста</li>`;
            }
        };
        
        let animationEnded = false;
        const onAnimationEnd = (e) => {
            if (e.target !== li) return;
            animationEnded = true;
            li.removeEventListener('animationend', onAnimationEnd);
            finishDelete();
        };
        li.addEventListener('animationend', onAnimationEnd);
        
        setTimeout(() => {
            if (!animationEnded) {
                li.removeEventListener('animationend', onAnimationEnd);
                finishDelete();
            }
        }, 500);
    }
    
    // Дублирование
    async function duplicate(id) {
        const history = Data.get();
        const index = history.findIndex(item => item.id === id);
        if (index === -1) return;
        
        const original = history[index];
        
        const duplicateItem = {
            id: Date.now() + Math.random().toString(36).substr(2, 4),
            width: original.width,
            height: original.height,
            multiplier: original.multiplier || 1,
            isMultiplied: original.isMultiplied || false,
            note: original.note || '',
            timestamp: Date.now()
        };
        
        history.splice(index + 1, 0, duplicateItem);
        newItemIds.add(duplicateItem.id);
        
        await Data.save();
        
        const originalLi = historyList.querySelector(`li[data-id="${id}"]`);
        if (originalLi) {
            const newLi = createItem(duplicateItem);
            newLi.classList.add('new');
            originalLi.after(newLi);
            attachHandlers(newLi);
            updateTotals();
            updateLastItemInfo();
            newItemIds.delete(duplicateItem.id);
        } else {
            render();
        }
        
        const w = Math.round(original.width);
        const h = Math.round(original.height);
        lastItemInfo.textContent = `📋 Скопировано: ${w}×${h} мм`;
        setTimeout(updateLastItemInfo, 1500);
    }
    
    // Создание элемента
    function createItem(item) {
        const precision = Precision.get();
        const timeStr = Utils.formatTime(item.timestamp);
        const w = Math.round(item.width);
        const h = Math.round(item.height);
        const displayArea = getDisplayArea(item).toFixed(precision);
        
        let dimsText = `${w} × ${h} мм`;
        if (item.isMultiplied && item.multiplier) {
            dimsText += ` <span class="multiplier-badge">×${item.multiplier}</span>`;
        }
        
        const noteHtml = item.note 
            ? `<div class="item-note">📝 ${Utils.escapeHtml(item.note)}</div>` 
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
    
    // Обновление только суммы и счётчика
    function updateTotals() {
        const precision = Precision.get();
        const total = getTotalArea();
        totalDisplay.innerHTML = `${total.toFixed(precision)} <small>м²</small>`;
        itemsCount.textContent = Data.get().length;
        
        totalDisplay.classList.remove('updated');
        void totalDisplay.offsetWidth;
        totalDisplay.classList.add('updated');
        
        itemsCount.classList.remove('updated');
        void itemsCount.offsetWidth;
        itemsCount.classList.add('updated');
    }
    
    // Очистка всей истории
    async function clearAll() {
        if (Data.get().length === 0) return;
        
        const items = historyList.querySelectorAll('li');
        
        if (items.length > 0) {
            items.forEach((li, index) => {
                setTimeout(() => {
                    li.classList.add('removing-all');
                }, index * 30);
            });
            
            const totalTime = items.length * 30 + 300;
            
            setTimeout(async () => {
                Data.clear();
                await Data.save();
                render();
            }, totalTime);
        } else {
            Data.clear();
            await Data.save();
            render();
        }
    }
    
    return {
        init,
        render,
        add,
        multiplyLast,
        deleteById,
        duplicate,
        clearAll,
        getDisplayArea,
        getRawArea,
        updateLastItemInfo
    };
})();
