const HIDE_AFTER_MS = 4000;

let element = null;
let hideTimer = null;

/**
 * One status message at the bottom of the page. A new message replaces the current one.
 * @param {string} text
 * @param {'info'|'success'|'error'} type info stays until replaced; success and error fade out.
 */
export function showToast(text, type = 'info') {
    if (!element) {
        element = document.createElement('div');
        document.body.appendChild(element);
    }
    clearTimeout(hideTimer);
    element.textContent = text;
    element.className = `risibank-toast risibank-toast-${type}`;
    if (type !== 'info') {
        hideTimer = setTimeout(() => element.classList.add('risibank-toast-hidden'), HIDE_AFTER_MS);
    }
}
