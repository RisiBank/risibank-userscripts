function getGmXmlHttpRequest() {
    if (typeof GM !== 'undefined' && typeof GM.xmlHttpRequest !== 'undefined') {
        return GM.xmlHttpRequest;
    }
    if (typeof GM_xmlhttpRequest !== 'undefined') {
        return GM_xmlhttpRequest;
    }
    return fetch;
}


// A stuck request would otherwise never settle, and callers could never fall back.
const REQUEST_TIMEOUT_MS = 20 * 1000;


/**
 * Cross-origin request through the userscript manager. Rejects with the response on a non-2xx status.
 */
export function request(options) {
    return new Promise((resolve, reject) => {
        const xhr = getGmXmlHttpRequest();
        xhr({
            timeout: REQUEST_TIMEOUT_MS,
            ...options,
            ontimeout: () => {
                reject(new Error(`Timeout: ${options.url}`));
            },
            onload: response => {
                if (response.status < 200 || response.status >= 300) {
                    reject(response);
                } else {
                    resolve(response);
                }
            },
            onerror: error => {
                reject(error);
            }
        });
    });
}


export function apiGet(url) {
    return request({ url, method: 'GET' });
}


export function loadImage(url) {
    return request({ url, method: 'GET', responseType: 'blob' }).then(response => response.response);
}
