const { storage } = require('../storage.js');
const { apiGet } = require('../requests.js');
import { wait } from '../utils.js';


export class ImageOptimizerPlugin {

    static STORAGE_KEY_LAST_UPDATE = 'ImageOptimizerPlugin_lastUpdate';
    static STORAGE_KEY_DATA = 'ImageOptimizerPlugin_data';

    static UPDATE_DELAY = 1000 * 60 * 60;

    constructor(model) {
        this.model = model;
        this.cached = {};
    }

    async install() {

        // Immediately load previously stored data, if any is there
        try {
            this.cached = JSON.parse(await storage.get(ImageOptimizerPlugin.STORAGE_KEY_DATA, '{}'));
        } catch (error) {
            console.error(error);
            this.cached = {};
        }
        
        this.updateIfNecessary()
            .then(() => { })
            .catch(error => console.error(error));
    }

    async updateIfNecessary() {
        // Time since last update
        const lastUpdate = await storage.get(ImageOptimizerPlugin.STORAGE_KEY_LAST_UPDATE, '0');
        await storage.set(ImageOptimizerPlugin.STORAGE_KEY_LAST_UPDATE, Date.now());
        // Skip if last update too soon
        const timeSinceLastUpdate = Date.now() - lastUpdate;
        if (timeSinceLastUpdate < ImageOptimizerPlugin.UPDATE_DELAY) {
            return;
        }
        // Update image list
        const medias = [];
        const pages = Array.from({ length: 20 }).map((_, i) => i + 1);
        for (const page of pages) {
            for (const type of ['hot']) {
                const data = JSON.parse((await apiGet(`https://risibank.fr/api/v1/medias/${type}?page=${page}`)).responseText);
                medias.push(...data);
                await wait(500);
            }
        }
        // Save cached entries
        const cached = {};
        for (const media of medias) {
            cached[media.source_url] = {
                id: media.id,
                slug: media.slug,
                thumb: media.cache_url.replace('/full.', '/thumb.'),
            };
        }
        await storage.set(ImageOptimizerPlugin.STORAGE_KEY_DATA, JSON.stringify(cached));
    }
}
