// ===== ОБЩАЯ ВАЛИДАЦИЯ ЗАПИСЕЙ (main + renderer) =====
// UMD: в main подключается через require('./shared/validate'),
// в renderer — через <script src="shared/validate.js"> как window.Validate.
// Правила согласованы с InputFilter: максимум 10 цифр целой части + 4 после запятой.
(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else {
        root.Validate = factory();
    }
}(typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : globalThis, function () {
    'use strict';

    var MAX_VALUE = 9999999999.9999;

    function isFiniteNumber(value) {
        return typeof value === 'number' && Number.isFinite(value);
    }

    function isValidDimension(value) {
        return isFiniteNumber(value) && value > 0 && value <= MAX_VALUE;
    }

    function isValidTimestamp(value) {
        return isFiniteNumber(value) && value > 0;
    }

    // Строгая проверка обязательных полей. Опциональные поля запись не бракуют,
    // они чистятся в normalizeRecord().
    function isValidRecord(item) {
        if (!item || typeof item !== 'object') return false;
        if (typeof item.id !== 'string' || item.id.length === 0 || item.id.length > 100) return false;
        if (!isValidDimension(item.width)) return false;
        if (!isValidDimension(item.height)) return false;
        if (!isValidTimestamp(item.timestamp)) return false;
        return true;
    }

    function generateId() {
        try {
            if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
                return crypto.randomUUID();
            }
        } catch (e) { /* noop */ }
        return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    }

    // Приводит сырую запись к каноническому виду, возвращает null если битая.
    function normalizeRecord(item, now) {
        if (!item || typeof item !== 'object') return null;
        if (!isValidDimension(item.width)) return null;
        if (!isValidDimension(item.height)) return null;

        var ts = isValidTimestamp(item.timestamp) ? item.timestamp : (now || Date.now());
        var id = (item.id !== undefined && item.id !== null) ? String(item.id) : generateId();
        if (id.length === 0 || id.length > 100) id = generateId();

        var out = {
            id: id,
            width: item.width,
            height: item.height,
            timestamp: ts,
            isMultiplied: false
        };

        var mult = item.multiplier;
        if (isFiniteNumber(mult) && mult > 0 && mult <= MAX_VALUE) {
            if (item.isMultiplied) {
                out.multiplier = mult;
                out.isMultiplied = true;
            }
        }

        if (typeof item.note === 'string' && item.note.length > 0) {
            out.note = item.note.slice(0, 500);
        }

        if (item.updatedAt !== undefined && item.updatedAt !== null) {
            if (isValidTimestamp(item.updatedAt)) out.updatedAt = item.updatedAt;
        }

        return out;
    }

    function sanitizeHistory(data) {
        if (!Array.isArray(data)) return [];
        var out = [];
        for (var i = 0; i < data.length; i++) {
            var n = normalizeRecord(data[i]);
            if (n !== null && isValidRecord(n)) out.push(n);
        }
        return out;
    }

    return {
        MAX_VALUE: MAX_VALUE,
        isValidRecord: isValidRecord,
        normalizeRecord: normalizeRecord,
        sanitizeHistory: sanitizeHistory,
        generateId: generateId
    };
}));
