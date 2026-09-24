// ===== ЭКСПОРТ/ИМПОРТ ДАННЫХ =====
window.Export = (function() {
    let exportBtn = null;
    let importBtn = null;
    let importFileInput = null;
    let exportMenu = null;
    let exportCancelBtn = null;
    
    function init() {
        exportBtn = document.getElementById('exportBtn');
        importBtn = document.getElementById('importBtn');
        importFileInput = document.getElementById('importFileInput');
        exportMenu = document.getElementById('exportMenu');
        exportCancelBtn = document.getElementById('exportCancelBtn');
        
        // Открытие меню экспорта
        exportBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            openExportMenu();
        });
        
        // Импорт
        importBtn.addEventListener('click', function() {
            importFileInput.click();
        });
        
        importFileInput.addEventListener('change', handleImport);
        
        // Пункты меню экспорта
        document.querySelectorAll('.export-menu-item').forEach(item => {
            item.addEventListener('click', function() {
                const format = this.dataset.format;
                closeExportMenu();
                
                // Небольшая задержка, чтобы меню успело закрыться
                setTimeout(() => {
                    if (format === 'csv') exportCSV();
                    if (format === 'json') exportJSON();
                }, 150);
            });
        });
        
        // Кнопка отмены
        exportCancelBtn.addEventListener('click', closeExportMenu);
        
        // Закрытие по клику вне окна
        exportMenu.addEventListener('click', function(e) {
            if (e.target === exportMenu) {
                closeExportMenu();
            }
        });
        
        // Esc закрывает
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && exportMenu.style.display === 'flex') {
                closeExportMenu();
            }
        });
    }
    
    function openExportMenu() {
        exportMenu.style.display = 'flex';
    }
    
    function closeExportMenu() {
        exportMenu.style.display = 'none';
    }
    
    // ===== ЭКСПОРТ CSV =====
    
    function exportCSV() {
        const history = Data.get();
        
        if (history.length === 0) {
            Modal.showError('История пуста — нечего экспортировать.');
            return;
        }
        
        const precision = Precision.get();
        
        // Заголовки
        const headers = [
            'Ширина (мм)',
            'Высота (мм)',
            'Множитель',
            'Площадь (м²)',
            'Заметка',
            'Дата'
        ];
        
        // Строки
        const rows = history.map(item => {
            const area = History.getDisplayArea(item);
            const date = new Date(item.timestamp);
            const dateStr = date.toLocaleString('ru-RU');
            const multiplier = (item.isMultiplied && item.multiplier) ? item.multiplier : 1;
            const note = item.note || '';
            
            return [
                item.width,
                item.height,
                multiplier,
                area.toFixed(precision),
                escapeCSV(note),
                dateStr
            ].join(';');
        });
        
        // Собираем CSV
        const csv = [headers.join(';'), ...rows].join('\n');
        
        // BOM для правильного отображения кириллицы в Excel
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        
        downloadFile(blob, `areacalc_${getDateStr()}.csv`);
    }
    
    // ===== ЭКСПОРТ JSON =====
    
    function exportJSON() {
        const history = Data.get();
        
        if (history.length === 0) {
            Modal.showError('История пуста — нечего экспортировать.');
            return;
        }
        
        const data = {
            version: '2.1.0',
            exportDate: new Date().toISOString(),
            count: history.length,
            history: history
        };
        
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
        
        downloadFile(blob, `areacalc_backup_${getDateStr()}.json`);
    }
    
    // ===== ИМПОРТ JSON =====
    
    function handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            try {
                const content = e.target.result;
                const data = JSON.parse(content);
                
                // Поддержка двух форматов:
                // 1. { version, exportDate, history: [...] }  — экспортный
                // 2. [...]                                    — рабочий
                let importedHistory = [];
                
                if (Array.isArray(data)) {
                    importedHistory = data;
                } else if (data.history && Array.isArray(data.history)) {
                    importedHistory = data.history;
                } else {
                    throw new Error('Неверный формат файла');
                }
                
                // Валидация + нормализация записей через общий модуль:
                // shared/validate.js (window.Validate) — тот же канон, что в main.js.
                // Старые бэкапы могут иметь числовой id — приводим к строке.
                const now = Date.now();
                if (window.Validate) {
                    importedHistory = importedHistory
                        .map(item => window.Validate.normalizeRecord(item, now))
                        .filter(item => item !== null);
                } else {
                    importedHistory = importedHistory
                        .filter(item => {
                            return item &&
                                   typeof item.width === 'number' &&
                                   typeof item.height === 'number' &&
                                   item.width > 0 &&
                                   item.height > 0;
                        })
                        .map(item => ({
                            id: (item.id !== undefined && item.id !== null) ? String(item.id) : Utils.generateId(),
                            width: item.width,
                            height: item.height,
                            multiplier: item.multiplier,
                            isMultiplied: !!item.isMultiplied,
                            note: typeof item.note === 'string' ? item.note : '',
                            timestamp: typeof item.timestamp === 'number' ? item.timestamp : Date.now()
                        }));
                }
                
                if (importedHistory.length === 0) {
                    Modal.showError('В файле нет корректных записей.');
                    return;
                }
                
                const currentHistory = Data.get();
                
                if (currentHistory.length === 0) {
                    // Если истории нет — просто загружаем
                    Data.set(importedHistory);
                    await Data.save();
                    History.render();
                    await Modal.show(`✅ Импортировано записей: ${importedHistory.length}`);
                } else {
                    // Если есть — предлагаем выбор
                    const choice = await showImportChoice(importedHistory.length, currentHistory.length);
                    
                    if (choice === 'replace') {
                        Data.set(importedHistory);
                        await Data.save();
                        History.render();
                        await Modal.show(`✅ Заменено. Импортировано записей: ${importedHistory.length}`);
                    } else if (choice === 'append') {
                        // Добавляем с новыми ID, чтобы не было конфликтов
                        // (копируем, чтобы не мутировать распарсенный массив)
                        const toAppend = importedHistory.map(item => ({
                            ...item,
                            id: Utils.generateId()
                        }));

                        const newHistory = [...currentHistory, ...toAppend];
                        Data.set(newHistory);
                        await Data.save();
                        History.render();
                        await Modal.show(`✅ Добавлено записей: ${importedHistory.length}`);
                    }
                    // choice === 'cancel' — ничего не делаем
                }
            } catch (error) {
                console.error('Import error:', error);
                Modal.showError('Ошибка при чтении файла: ' + error.message);
            }
            
            // Сбрасываем input, чтобы можно было импортировать тот же файл повторно
            importFileInput.value = '';
        };
        
        reader.readAsText(file, 'utf-8');
    }
    
    // ===== Диалог выбора при импорте =====
    
    function showImportChoice(importCount, currentCount) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.style.display = 'flex';
            
            overlay.innerHTML = `
                <div class="import-choice-content">
                    <div class="import-choice-header">
                        <span class="import-choice-icon">📥</span>
                        <div class="import-choice-title">Импорт данных</div>
                        <div class="import-choice-info">
                            В файле <strong>${importCount}</strong> ${pluralizeRecords(importCount)}.<br>
                            В текущей истории <strong>${currentCount}</strong>.
                        </div>
                    </div>
                    <div class="import-choice-actions">
                        <button class="import-choice-btn replace" data-choice="replace">
                            <span class="choice-icon">🔄</span>
                            <div class="choice-info">
                                <div class="choice-title">Заменить текущую историю</div>
                                <div class="choice-desc">Старые записи будут удалены</div>
                            </div>
                        </button>
                        <button class="import-choice-btn append" data-choice="append">
                            <span class="choice-icon">➕</span>
                            <div class="choice-info">
                                <div class="choice-title">Добавить к текущей</div>
                                <div class="choice-desc">Записи добавятся в конец списка</div>
                            </div>
                        </button>
                        <button class="import-choice-btn cancel" data-choice="cancel">
                            <span class="choice-icon">✕</span>
                            <div class="choice-info">
                                <div class="choice-title">Отмена</div>
                                <div class="choice-desc">Ничего не изменится</div>
                            </div>
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(overlay);
            
            overlay.querySelectorAll('[data-choice]').forEach(btn => {
                btn.addEventListener('click', function() {
                    const choice = this.dataset.choice;
                    overlay.remove();
                    resolve(choice);
                });
            });
            
            overlay.addEventListener('click', function(e) {
                if (e.target === overlay) {
                    overlay.remove();
                    resolve('cancel');
                }
            });
        });
    }
    
    // ===== Утилиты =====
    
    function escapeCSV(text) {
        if (text === null || text === undefined) return '';
        const str = String(text);
        // Если содержит ; " \n — оборачиваем в кавычки и удваиваем кавычки
        if (str.includes(';') || str.includes('"') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    }
    
    function downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    
    function getDateStr() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}_${hours}-${minutes}`;
    }
    
    function pluralizeRecords(count) {
        const mod10 = count % 10;
        const mod100 = count % 100;
        
        if (mod100 >= 11 && mod100 <= 14) return 'записей';
        if (mod10 === 1) return 'запись';
        if (mod10 >= 2 && mod10 <= 4) return 'записи';
        return 'записей';
    }
    
    return {
        init,
        exportCSV,
        exportJSON
    };
})();
