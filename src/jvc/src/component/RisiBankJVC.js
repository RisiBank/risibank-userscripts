import { scriptOptions } from '../ScriptOptions.js';
import { AntiCensorPlugin } from '../plugin/AntiCensorPlugin.js';
import { AutoUpdatePlugin } from '../plugin/AutoUpdatePlugin.js';
import { BetterJVC } from '../plugin/BetterJVC.js';
import { DeviceSeedPlugin } from '../plugin/DeviceSeedPlugin.js';
import { ImageEnhancerPlugin } from '../plugin/ImageEnhancerPlugin.js';
import { ImageOptimizerPlugin } from '../plugin/ImageOptimizerPlugin.js';
import { JVCarePlugin } from '../plugin/JVCarePlugin.js';
import { LinkEnhancerPlugin } from '../plugin/LinkEnhancerPlugin.js';
import { MessageEditFormEnhancerPlugin } from '../plugin/MessageEditFormEnhancerPlugin.js';
import { RemoveDisclaimerPlugin } from '../plugin/RemoveDisclaimerPlugin.js';
import { YoutubePlugin } from '../plugin/YoutubePlugin.js';
import { OptionsPanel } from './OptionsPanel.js';

/**
 * Main class to control the RisiBank JVC userscript
 */

const embedIframeModes = ['iframe', 'iframe-bottom'];

export class RisiBankJVC {

    constructor() {

        // Build page type
        this.pageType = null;
        if (document.location.href.includes('www.jeuxvideo.com/messages-prives/')) {
            this.pageType = 'mp';
        } else if (document.location.hostname === 'www.jeuxvideo.com') {
            this.pageType = 'web';
        } else {
            this.pageType = 'mobile';
        }

        // Start view
        this.view = new RisiBankJVCView(this);

        // Build child components
        this.components = {
            // Options panel
            optionsPanel: new OptionsPanel(this),
        };

        // Start plugins
        this.plugins = [];
        // Link enhancer
        this.plugins.push(new RemoveDisclaimerPlugin(this));
        // Device seed
        this.plugins.push(new DeviceSeedPlugin(this));
        // Handles jvcare
        this.plugins.push(new JVCarePlugin(this));
        // Improves JVC stuff
        this.plugins.push(new BetterJVC(this));
        // Anti-Censor
        this.plugins.push(new AntiCensorPlugin(this));
        // Link enhancer
        this.plugins.push(new LinkEnhancerPlugin(this));
        // Image optimizer
        this.plugins.push(new ImageOptimizerPlugin(this));
        // Youtube
        this.plugins.push(new YoutubePlugin(this));
        // Update
        this.plugins.push(new AutoUpdatePlugin(this));
        // Misc
        this.plugins.push(new MessageEditFormEnhancerPlugin(this));
        // Image enhancer runs at the end because it's the heaviest plugin
        this.plugins.push(new ImageEnhancerPlugin(this));

        // Run all plugins onLoad()
        new Promise(async resolve => {
            for (const plugin of this.plugins) {
                await plugin.install();
            }
            resolve();
        })
            .catch(e => console.error(e));
    }

    getPlugin(construct) {
        return this.plugins.find(plugin => plugin instanceof construct);
    }

    reload() {
        this.view.init();
    }

    /**
     * @param {Number} Media id
     * @param {String} Media extension
     * @returns {String} Absolute url to the media image location
     */
    getRisiBankImageUrl(mediaId, extension) {
        return `https://risibank.fr/cache/medias/${Math.floor(mediaId / 1e6)}/${Math.floor(mediaId / 1e4)}/${Math.floor(mediaId / 1e2)}/${mediaId}/full.${extension}`;
    }

    /**
     * @returns {Boolean} Whether the icon should be shown as enabled or disabled
     */
    getRisiBankIconState() {
        if (scriptOptions.getOption('embedType') === 'overlay') {
            return true;
        }
        return scriptOptions.getOption('enabled');
    }
}

/**
 * Handles the view for a given web page. Supports:
 * - forum pages
 * - topic pages
 * - private messages
 * - topic pages (mobile version)
 */
class RisiBankJVCView {

    constructor(model) {

        this.model = model;

        this.init();
    }

    /**
     * Mount or re-mount the UI attached to this component
     */
    mount() {
        // Remove all previously added elements
        const toClean = Array.from(document.querySelectorAll('.risibank-cleanup'));
        for (const toCleanEl of toClean) {
            toCleanEl.remove();
        }

        if (scriptOptions.getOption('embedType') === 'iframe-bottom') {
            this.afterIntegrationSelector = '.messageEditor__buttonEdit';
        } else {
            this.afterIntegrationSelector = '.messageEditor__edit';
        }
        this.textAreaSelector = '.messageEditor__edit';

        // Globals
        this.iframeContainerId = 'risibank-container';

        // Prepare the location where the RisiBank embed will be integrated
        // Only add the iframe container if integration mode is iframe
        if (embedIframeModes.includes(scriptOptions.getOption('embedType')) && scriptOptions.getOption('enabled')) {
            try {
                const afterIntegrationEl = document.querySelector(this.afterIntegrationSelector);
                const div = document.createElement('div');
                div.id = this.iframeContainerId;
                div.classList.add('risibank-cleanup');
                div.style.height = scriptOptions.getOption('embeddedContainerHeight');
                if (scriptOptions.getOption('embedType') === 'iframe-bottom') {
                    afterIntegrationEl.parentElement.appendChild(div);
                } else {
                    afterIntegrationEl.parentElement.insertBefore(div, afterIntegrationEl);
                }
            } catch (error) {
                console.warn('Unable to prepare location for the RisiBank embed', error);
            }
        }

        // Prepare the location for the RisiBank settings button
        try {
            const container = document.querySelector('.messageEditor__buttonEdit > .buttonsEditor');
            const div = document.createElement('div');
            div.classList.add('risibank-cleanup');
            div.classList.add('buttonsEditor__group');
            div.innerHTML = `
                <button class="buttonsEditor__button risibank-toggle" style="${this.model.getRisiBankIconState() ? '' : 'filter: grayscale(1);'}" type="button" title="Activer/désactiver le plugin RisiBank">
                    <img src="https://risibank.fr/logo.png" width="14" height="14" style="vertical-align: baseline;">
                </button>
                <button class="buttonsEditor__button risibank-open-options" type="button" title="Ouvrir les options du plugin" style="padding-top: 0;">
                    ⚙
                </button>
            `;
            if (! scriptOptions.getOption('hideDonateButton')) {
                div.innerHTML += `
                    <button class="buttonsEditor__button" onclick="window.open('https://www.buymeacoffee.com/risibank')" type="button" title="Cette extension a changé ta vie ? Change celle de celui qui a crée cette extension en lui offrant un café" style="padding-top: 0;">
                        ☕
                    </button>
                `;
            }
            container.insertBefore(div, container.querySelector('.buttonsEditor__groupPreview'));
        } catch (error) {
            console.warn('Unable to prepare the location for the RisiBank settings', error);
        }
    }

    /**
     * Initialize the RisiBank plugin at the prepared location
     */
    init() {

        // Mount itsefl
        this.mount();

        // Start embed if iframe mode
        if (embedIframeModes.includes(scriptOptions.getOption('embedType')) && scriptOptions.getOption('enabled')) {
            this.startEmbed();
        }

        this.controller = new RisiBankJVCController(this.model, this);
    }

    /**
     * Emulate setting the value in a React input element.
     * @param {HTMLTextAreaElement | HTMLInput} element 
     * @param {string} value
     */
    setReactInputValue(element, value) {
        const valueSetter = Object.getOwnPropertyDescriptor(element.__proto__, 'value')?.set;
        const prototype = Object.getPrototypeOf(element);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    
        if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
            prototypeValueSetter.call(element, value);
        } else if (valueSetter) {
            valueSetter.call(element, value);
        } else {
            element.value = value;
        }
    
        element.dispatchEvent(new Event('input', { bubbles: true }));
    }

    /**
     * Add the source_url of a media to a React text area
     */
    addImageLinkToTextArea({ media }) {
        const formElement = document.querySelector(this.textAreaSelector);
        const link = media.source_url;

        // Get cursor position
        const cursorIndex = formElement.selectionStart;

        // Decide whether to append and prepend spaces
        const preprendSpace = formElement.value[cursorIndex - 1] && !formElement.value[cursorIndex - 1].match(/\s/);
        const appendSpace = typeof formElement.value[cursorIndex] === 'undefined' || !formElement.value[cursorIndex].match(/\s/);

        // Build text to add
        const added = `${preprendSpace ? ' ' : ''}${link}${appendSpace ? ' ' : ''}`;

        // Insert link where cursor is
        this.setReactInputValue(formElement,
            formElement.value.substring(0, formElement.selectionStart) +
            added +
            formElement.value.substring(formElement.selectionStart)
        );

        // Re-focus the text area
        formElement.focus();
    }

    startEmbed() {
        if (! document.querySelector(`#${this.iframeContainerId}`)) {
            return;
        }
        RisiBank.activate({
            type: 'iframe',
            container: '#' + this.iframeContainerId,
            theme: scriptOptions.getOption('theme'),
            defaultTab: scriptOptions.getOption('defaultTab'),
            mediaSize: scriptOptions.getOption('mediaSize'),
            navbarSize: scriptOptions.getOption('navbarSize'),
            onSelectMedia: this.addImageLinkToTextArea.bind(this),
        });
    }

    startOverlay() {
        RisiBank.activate({
            type: 'overlay',
            theme: scriptOptions.getOption('theme'),
            defaultTab: scriptOptions.getOption('defaultTab'),
            mediaSize: scriptOptions.getOption('mediaSize'),
            navbarSize: scriptOptions.getOption('navbarSize'),
            onSelectMedia: this.addImageLinkToTextArea.bind(this),
        });
    }
}


/**
 * Handles interactions with the view
 */
class RisiBankJVCController {

    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.bind();
    }

    bind() {

        // RisiBank button to toggle plugin
        const toggleRisiBankButtons = Array.from(document.querySelectorAll('.risibank-toggle'));
        for (const toggleRisiBankButton of toggleRisiBankButtons) {
            if (embedIframeModes.includes(scriptOptions.getOption('embedType'))) {
                toggleRisiBankButton.addEventListener('click', async () => {
                    await scriptOptions.saveOption('enabled', ! (scriptOptions.getOption('enabled')));
                    this.view.init();
                });
            } else {
                toggleRisiBankButton.addEventListener('click', async () => {
                    this.view.startOverlay();
                });
            }
        }

        // RisiBank button to open options
        const openRisiBankOptionsButtons = Array.from(document.querySelectorAll('.risibank-open-options'));
        for (const openRisiBankOptionsButton of openRisiBankOptionsButtons) {
            openRisiBankOptionsButton.addEventListener('click', () => {
                this.model.components.optionsPanel.open();
            });
        }
    }
}
