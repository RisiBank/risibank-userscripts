const { storage } = require('../storage.js');


/**
 * Used to track the number of devices using the JVC userscript
 */
export class DeviceSeedPlugin {

    static STORAGE_KEY = 'DeviceSeedPlugin_deviceSeed';

    constructor(model) {

        this.model = model;
        this.deviceSeed = null;
    }

    async install() {
        try {
            this.deviceSeed = await storage.get(DeviceSeedPlugin.STORAGE_KEY, 'undefined');
            // If the device seed is undefined, generate a new one
            if (this.deviceSeed === 'undefined') {
                this.deviceSeed = crypto.randomUUID();
                await storage.set(DeviceSeedPlugin.STORAGE_KEY, this.deviceSeed);
            }
        } catch (error) {
            console.error(error);
        }
    }
}
