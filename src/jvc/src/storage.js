



class Storage {

    constructor() {

        // Try to find something to store data into
        this.identify();
    }
    
    identify() {

        if (typeof GM_getValue !== 'undefined') {
            this.get = async (key, defaultValue) => GM_getValue(key, defaultValue);
            this.set = async (key, value) => GM_setValue(key, value);
            return;
        }

        if (typeof GM === 'object') {
            this.get = async (key, defaultValue) => GM.getValue(key, defaultValue);
            this.set = async (key, value) => GM.setValue(key, value);
            return;
        }

        if (typeof localStorage !== 'undefined') {
            this.get = async (key, defaultValue) => localStorage.getItem(key) || defaultValue;
            this.set = async (key, value) => localStorage.setItem(key, value);
            return;
        }

        if (typeof sessionStorage !== 'undefined') {
            this.get = async (key, defaultValue) => sessionStorage.getItem(key) || defaultValue;
            this.set = async (key, value) => sessionStorage.setItem(key, value);
            return;
        }

        this.get = async (key, defaultValue) => defaultValue;
        this.set = async (key, value) => {
            console.warn('Unable to store data in any storage');
        };
    }
}


export const storage = new Storage();
