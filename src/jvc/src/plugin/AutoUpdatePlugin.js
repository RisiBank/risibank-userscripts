import { scriptOptions } from '../ScriptOptions.js';
import { storage } from '../storage.js';
import { apiGet } from '../requests.js';
import { DeviceSeedPlugin } from './DeviceSeedPlugin.js';


export class AutoUpdatePlugin {

    static STORAGE_KEY_LAST_UPDATE = 'AutoUpdatePlugin_lastUpdate';
    static STORAGE_KEY_IGNORED_VERSION = 'AutoUpdatePlugin_ignoredVersion';

    static UPDATE_DELAY = 1000 * 60 * 15;

    static UPDATE_LINK = 'https://risibank.fr/downloads/userscript/jvc/jvc.user.js?from=userscript-jvc';

    constructor(model) {
        this.model = model;
        this.deviceSeedPlugin = this.model.getPlugin(DeviceSeedPlugin);
    }

    getCurrentScriptVersion() {
        try {
            return GM.info.script.version;
        } catch (error) {
            try {
                return GM_info.script.version;
            } catch (error) {
                return '0.0.0';
            }
        }
    }

    async isVersionIgnored(version) {
        const ignoredVersion = await storage.get(AutoUpdatePlugin.STORAGE_KEY_IGNORED_VERSION);
        if (! ignoredVersion) {
            return false;
        }
        return ignoredVersion === version;
    }

    async install() {
        // Skip if not in topics/forums
        if (! scriptOptions.getOption('autoUpdate')) {
            return;
        }
        // Time since last update
        const lastUpdate = await storage.get(AutoUpdatePlugin.STORAGE_KEY_LAST_UPDATE);
        if (! lastUpdate) {
            await storage.set(AutoUpdatePlugin.STORAGE_KEY_LAST_UPDATE, Date.now());
            return;
        }
        const timeSinceLastUpdate = Date.now() - lastUpdate;
        // Skip if less than 15min
        if (timeSinceLastUpdate < AutoUpdatePlugin.UPDATE_DELAY) {
            return;
        }
        // Check for update
        const currentVersion = this.getCurrentScriptVersion();
        const response = await apiGet(AutoUpdatePlugin.UPDATE_LINK + '&version=' + currentVersion + '&device=' + this.deviceSeedPlugin.deviceSeed + '&nocache=' + Date.now());
        const lines = response.responseText.split('\n');
        const versionLine = lines.find(line => line.match(/\/\/ @version (.*)/));
        const version = versionLine.match(/\/\/ @version (.*)/)[1].trim();
        // Update last check time
        await storage.set(AutoUpdatePlugin.STORAGE_KEY_LAST_UPDATE, Date.now());
        if (version === currentVersion) {
            return;
        }
        // Check if version is ignored
        if (await this.isVersionIgnored(version)) {
            return;
        }
        // Ask for confirmation
        if (! confirm(`Une nouvelle version du script 'RisiBank pour JVC' est disponible (${version}). Voulez-vous l'installer ?`)) {
            // Ignore version ?
            if (confirm('Souhaitez-vous ignorer cette mise à jour ?')) {
                await storage.set(AutoUpdatePlugin.STORAGE_KEY_IGNORED_VERSION, version);
            }
            return;
        }
        // Open
        document.location.href = AutoUpdatePlugin.UPDATE_LINK + '&nocache=' + Date.now();
    }
}
