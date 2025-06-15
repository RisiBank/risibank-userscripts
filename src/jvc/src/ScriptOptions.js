import { storage } from './storage';



class ScriptOptions {

    static STORAGE_KEY = 'risibank-options';

    /**
     * List all available options for the plugin
     * Do NOT put double quotes in label or descriptions as this content is NOT html escaped
     */
    static OPTIONS = [
        {
            name: 'enabled',
            type: 'boolean',
            label: 'État du plugin',
            description: `Activer/désactiver le plugin.`,
            default: () => true,
            hidden: true,
        },
        {
            name: 'theme',
            type: 'select',
            values: [
                { value: 'light', label: 'futuriste (light)' },
                { value: 'dark', label: 'futuriste (dark)' },
                { value: 'light-old', label: 'classique (light)' },
                { value: 'dark-old', label: 'classique (dark)' },
            ],
            label: 'Thème de l\'interface',
            description: `Choisir le thème de l'interface de RisiBank. Les thèmes sont les mêmes que sur le site`,
            default: () => 'light',
        },
        {
            name: 'defaultTab',
            type: 'select',
            values: [
                { value: 'search', label: 'recherche' },
                { value: 'fav', label: 'favoris' },
                { value: 'hot', label: 'tendance' },
                { value: 'top', label: 'populaire' },
                { value: 'new', label: 'récent' },
                { value: 'rand', label: 'hasard' },
            ],
            label: 'Onglet par défaut',
            description: `Choix de l'onglet à afficher par défaut dans l'interface RisiBank`,
            default: () => 'top',
        },
        {
            name: 'embedType',
            type: 'select',
            values: [
                { value: 'iframe', 'label': 'intégré (Haut)' },
                { value: 'iframe-bottom', 'label': 'intégré (Bas)' },
                { value: 'overlay', 'label': 'overlay' },
            ],
            label: 'Mode d\'intégration',
            description: `Choix du monde d'intégration de l'interface RisiBank`,
            default: () => 'iframe',
        },
        {
            name: 'embeddedContainerHeight',
            type: 'select',
            values: [
                { value: '105px', label: 'minuscule' },
                { value: '165px', label: 'petit' },
                { value: '225px', label: 'moyen' },
                { value: '285px', label: 'grand' },
            ],
            label: 'Hauteur fenêtre mode intégré',
            description: `Choisir la taille de la zone de contenu dans l\'interface RisiBank (mode intégré)`,
            default: () => '165px',
            activateIf: options => ['iframe', 'iframe-bottom'].includes(options.embedType),
        },
        {
            name: 'mediaSize',
            type: 'select',
            values: [
                { value: 'sm', label: 'petit' },
                { value: 'md', label: 'moyen' },
                { value: 'lg', label: 'grand' },
            ],
            label: 'Taille des images',
            description: `Choisir la taille des images dans l\'interface RisiBank`,
            default: () => 'sm',
        },
        {
            name: 'navbarSize',
            type: 'select',
            values: [
                { value: 'sm', label: 'petit' },
                { value: 'md', label: 'moyen' },
                { value: 'lg', label: 'grand' },
            ],
            label: 'Taille de la navbar',
            description: `Choisir la taille de la barre de navigation dans l\'interface RisiBank`,
            default: () => 'sm',
        },
        {
            name: 'redirectToRisiBank',
            type: 'boolean',
            label: 'Rediriger les stickers vers RisiBank',
            description: `Lors d'un clic sur un sticker noelshack, rediriger vers RisiBank si le sticker existe plutôt que noelshack`,
            default: () => true,
        },
        {
            name: 'addImageFavoriteButton',
            type: 'boolean',
            label: 'Afficher le bouton favoris',
            description: `Afficher le bouton favoris lors du survol des images`,
            default: () => true,
        },
        {
            name: 'addTransparency',
            type: 'boolean',
            label: 'Rendre les images transparentes',
            description: `Remplace les images noelshack par leur version complète (Consomme de la bande passante).`,
            default: () => true,
        },
        {
            name: 'animateGifs',
            type: 'boolean',
            label: 'Animer les GIFs',
            description: `Anime les GIFs (Consomme de la bande passante).`,
            default: () => true,
        },
        {
            name: 'autoReplaceDeletedImages',
            type: 'boolean',
            label: `Auto-fix des images supprimées`,
            description: `Remplacer automatiquement les images noelshack supprimées par leur version originale de RisiBank. Cette option ne sera appliquée que si vous avez activé l'option qui rend les images transparente ou anime les GIFs.`,
            values: [true, false],
            default: () => true,
            activateIf: options => options.addTransparency || options.animateGifs,
        },
        {
            name: 'embedYoutubeLinks',
            type: 'boolean',
            label: `Intégration des vidéos youtube`,
            description: `Lecteur intégré YouTube`,
            values: [true, false],
            default: () => true,
        },
        {
            name: 'antiCensorPlugin',
            type: 'boolean',
            label: 'Plugin anti-censure (textuel)',
            description: `Remplace automatiquement certains mots clefs sensibles d'une manière transparente pour ceux qui ont l'userscript`,
            default: () => true,
        },
        {
            name: 'autoUpdate',
            type: 'boolean',
            label: 'Mise à jour auto',
            description: `Vérifier automatiquement les mises à jour du script`,
            default: () => true,
        },
        {
            name: 'increaseMessageFormHeight',
            type: 'boolean',
            label: 'Augmenter taille zone message',
            description: `Augmente la taille par défaut de la zone de message`,
            default: () => false,
        },
        {
            name: 'hideHarassmentPreventionBanner',
            type: 'boolean',
            label: 'Retirer le bandeau anti-harcèlement',
            description: `Retirer le bandeau de prévention anti-harcèlement du formulaire de message`,
            default: () => true,
        },
        {
            name: 'hideDonateButton',
            type: 'boolean',
            label: 'Masquer bouton donation (🐀)',
            description: `Masquer le bouton donation`,
            default: () => false,
        },
    ];

    constructor() {

        this.allOptions = ScriptOptions.OPTIONS;
        this.options = null;
    }

    async load() {

        // Load default options
        const options = {};
        for (const option of ScriptOptions.OPTIONS) {
            options[option.name] = option.default();
        }
    
        // Get options from storage
        try {
            const storageOptions = JSON.parse(await storage.get(ScriptOptions.STORAGE_KEY, '{}'));
            if (! storageOptions) {
                throw new Error('No options found');
            }
            for (const key in storageOptions) {
                const value = storageOptions[key];
    
                const option = ScriptOptions.OPTIONS.find(o => o.name === key);
                // Options does not exist
                if (! option) {
                    continue;
                }
                // Option is invalid
                if (! this.checkOptionValue(option, value)) {
                    continue;
                }
                // Save value
                options[key] = value;
            }
    
        } catch (error) {
            console.warn(error);
        }
    
        // Try to save options
        try {
            await storage.set(ScriptOptions.STORAGE_KEY, JSON.stringify(options));
        } catch (error) {
            console.warn(error);
        }
    
        this.options = options;
    };

    checkOptionValue(option, value) {
        if (option.type === 'select') {
            return option.values.map(v => v.value).includes(value);
        } else if (option.type === 'boolean') {
            return typeof value === 'boolean';
        }
        return false;
    };

    getOption(name) {
        return this.options[name];
    }

    async saveOption(name, value) {
        // Load option object
        await this.load();
        // Update value
        const option = ScriptOptions.OPTIONS.find(o => o.name === name);
        if (! option) {
            throw new Error('This option does not exist');
        }
        if (! this.checkOptionValue(option, value)) {
            throw new Error('This value is not valid');
        }
        this.options[name] = value;
        // Save options
        await storage.set(ScriptOptions.STORAGE_KEY, JSON.stringify(this.options));
    }
}


export const scriptOptions = new ScriptOptions();
