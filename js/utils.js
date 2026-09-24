// ===== УТИЛИТЫ =====

// Экранирование HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Парсинг числа (точка или запятая)
function parseNumber(value) {
    if (!value) return NaN;
    const cleaned = String(value).replace(/,/g, '.').trim();
    return parseFloat(cleaned);
}

// Форматирование времени
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

// Генерация уникального id записи
function generateId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

// Экспорт в глобальный объект
window.Utils = {
    escapeHtml,
    parseNumber,
    formatTime,
    generateId
};
