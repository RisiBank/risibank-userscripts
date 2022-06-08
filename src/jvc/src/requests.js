

function getGmXmlHttpRequest() {
    if (typeof GM !== 'undefined' && typeof GM.xmlHttpRequest !== 'undefined') {
        return GM.xmlHttpRequest;
    }
    if (typeof GM_xmlhttpRequest !== 'undefined') {
        return GM_xmlhttpRequest;
    }
    return fetch;
}





export function apiGet(url) {
    return new Promise((resolve, reject) => {
        const xhr = getGmXmlHttpRequest();
        xhr({
            url,
            method: 'GET',
            onload: response => {
                if (response.status < 200 || response.status >= 300) {
                    reject(response.statusText);
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


export function loadImage(url) {
    return new Promise((resolve, reject) => {
        const xhr = getGmXmlHttpRequest();
        xhr({
            url,
            method: 'GET',
            responseType: 'blob',
            onload: response => {
                if (response.status < 200 || response.status >= 300) {
                    reject(response.statusText);
                } else {
                    resolve(response.response);
                }
            },
            onerror: error => {
                reject(error);
            }
        });
    });
}
