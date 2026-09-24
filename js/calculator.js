// ===== КАЛЬКУЛЯТОР ВЫРАЖЕНИЙ (левая колонка, внизу) =====
// Поле для выражений вида 2.5*3+10. Кнопка 🧮 в истории дописывает
// площадь записи в поле ввода. Свой парсер вместо eval:
// в index.html строгий CSP (script-src 'self'), eval заблокирован.
window.Calculator = (function() {
    let input = null;
    let resultEl = null;
    let equalsBtn = null;
    let clearBtn = null;

    function init() {
        input = document.getElementById('calcInput');
        resultEl = document.getElementById('calcResult');
        equalsBtn = document.getElementById('calcEquals');
        clearBtn = document.getElementById('calcClear');
        if (!input || !resultEl) return;

        input.addEventListener('input', updatePreview);
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                calculate(true);
            }
        });
        if (equalsBtn) {
            equalsBtn.addEventListener('click', function() {
                calculate(true);
            });
        }
        if (clearBtn) {
            clearBtn.addEventListener('click', clear);
        }
        // Кнопочный пад под строкой ввода: только вставляет символы в поле,
        // считает всё тот же evaluate (без eval — требование CSP).
        const pad = document.querySelector('.calc-pad');
        if (pad) {
            pad.addEventListener('click', function(e) {
                const btn = e.target.closest('button');
                if (!btn || !pad.contains(btn)) return;
                const action = btn.dataset.action;
                if (action === 'clear') { clear(); return; }
                if (action === 'back') { backspace(); return; }
                if (action === 'equals') { calculate(true); return; }
                if (typeof btn.dataset.insert === 'string') insertText(btn.dataset.insert);
            });
        }
        updatePreview();
    }

    // Оценка выражения: рекурсивный спуск, без eval.
    // Грамматика: expr := term (('+'|'-') term)*,
    // term := factor (('*'|'/') factor)*,
    // factor := ('+'|'-') factor | primary ('%')*,
    // primary := '(' expr ')' | number.
    // Постфиксный % делит на 100: 50% = 0.5, (1+2)% = 0.03.
    function evaluate(raw) {
        const s = String(raw).replace(/,/g, '.').replace(/\s+/g, '');
        if (s === '') throw new Error('empty');
        if (!/^[0-9+\-*/().%]*$/.test(s)) throw new Error('chars');
        if (s.length > 200) throw new Error('too long');

        let pos = 0;

        function peek() {
            return s[pos];
        }

        function parseExpression() {
            let value = parseTerm();
            while (peek() === '+' || peek() === '-') {
                const op = s[pos++];
                const rhs = parseTerm();
                value = op === '+' ? value + rhs : value - rhs;
            }
            return value;
        }

        function parseTerm() {
            let value = parseFactor();
            while (peek() === '*' || peek() === '/') {
                const op = s[pos++];
                const rhs = parseFactor();
                if (op === '*') {
                    value = value * rhs;
                } else {
                    if (rhs === 0) throw new Error('div0');
                    value = value / rhs;
                }
            }
            return value;
        }

        function parseFactor() {
            const ch = peek();
            if (ch === '+' || ch === '-') {
                pos++;
                const value = parseFactor();
                return ch === '+' ? value : -value;
            }
            let value;
            if (ch === '(') {
                pos++;
                value = parseExpression();
                if (peek() !== ')') throw new Error('paren');
                pos++;
            } else {
                const match = /^[0-9]*\.?[0-9]+/.exec(s.slice(pos));
                if (!match) throw new Error('number');
                pos += match[0].length;
                value = parseFloat(match[0]);
                if (!isFinite(value)) throw new Error('number');
            }
            while (peek() === '%') {
                pos++;
                value = value / 100;
            }
            return value;
        }

        const value = parseExpression();
        if (pos !== s.length) throw new Error('trailing');
        if (typeof value !== 'number' || !isFinite(value)) throw new Error('result');
        return value;
    }

    // Убираем шум float-арифметики (0.1+0.2) округлением до 6 знаков
    function formatResult(value) {
        const rounded = Math.round(value * 1000000) / 1000000;
        return String(rounded === 0 ? 0 : rounded);
    }

    function updatePreview() {
        const text = input.value.trim();
        if (text === '') {
            resultEl.textContent = '—';
            return;
        }
        try {
            resultEl.textContent = '= ' + formatResult(evaluate(text));
        } catch (e) {
            resultEl.textContent = '—';
        }
    }

    async function calculate(explicit) {
        const text = input.value.trim();
        if (text === '') {
            resultEl.textContent = '—';
            if (explicit && window.Modal) await Modal.showError('Введите выражение.');
            return;
        }
        try {
            const result = formatResult(evaluate(text));
            resultEl.textContent = '= ' + result;
            if (explicit) {
                // Подставляем результат обратно — удобно для цепочки преобразований
                input.value = result;
                input.focus();
            }
        } catch (e) {
            resultEl.textContent = 'Ошибка';
            if (explicit && window.Modal) {
                await Modal.showError('Не удалось посчитать: проверьте выражение.');
            }
        }
    }

    function clear() {
        input.value = '';
        updatePreview();
        input.focus();
    }

    // Вставить текст в позицию курсора (кнопки пада). Превью обновляется.
    function insertText(text) {
        if (!input) return;
        const str = String(text);
        if (str === '') return;
        input.focus();
        let start = (typeof input.selectionStart === 'number') ? input.selectionStart : input.value.length;
        let end = (typeof input.selectionEnd === 'number') ? input.selectionEnd : input.value.length;
        if (start === 0 && end === 0 && input.value.length > 0) {
            start = end = input.value.length;
        }
        input.value = input.value.slice(0, start) + str + input.value.slice(end);
        const caret = start + str.length;
        try {
            input.setSelectionRange(caret, caret);
        } catch (e) { /* noop */ }
        updatePreview();
    }

    // Стереть как Backspace: выделение — целиком, иначе символ слева от курсора.
    function backspace() {
        if (!input) return;
        input.focus();
        let start = (typeof input.selectionStart === 'number') ? input.selectionStart : input.value.length;
        let end = (typeof input.selectionEnd === 'number') ? input.selectionEnd : input.value.length;
        if (start === 0 && end === 0) return;
        if (start === end) {
            if (start === 0) return;
            input.value = input.value.slice(0, start - 1) + input.value.slice(end);
            start = start - 1;
        } else {
            input.value = input.value.slice(0, start) + input.value.slice(end);
        }
        try {
            input.setSelectionRange(start, start);
        } catch (e) { /* noop */ }
        updatePreview();
    }

    // Дописать число в позицию курсора (перенос площади из истории).
    // Полное значение, а не округлённое — точность не теряется.
    function appendValue(value) {
        if (!input) return;
        const num = Number(value);
        if (!isFinite(num)) return;
        const text = formatResult(num);
        input.focus();
        let start = (typeof input.selectionStart === 'number') ? input.selectionStart : input.value.length;
        let end = (typeof input.selectionEnd === 'number') ? input.selectionEnd : input.value.length;
        // Режим «дописать»: курсор 0:0 в непустом поле (фокуса не было) — в конец
        if (start === 0 && end === 0 && input.value.length > 0) {
            start = end = input.value.length;
        }
        input.value = input.value.slice(0, start) + text + input.value.slice(end);
        const caret = start + text.length;
        try {
            input.setSelectionRange(caret, caret);
        } catch (e) { /* noop */ }
        updatePreview();
        input.scrollIntoView({ block: 'nearest' });
    }

    return {
        init,
        appendValue,
        insertText,
        backspace,
        calculate,
        clear
    };
})();
