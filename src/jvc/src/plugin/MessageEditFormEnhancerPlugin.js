const { RisiBank } = require('risibank-web-api');
const { scriptOptions } = require('../ScriptOptions.js');
const { waitForFunction } = require('../utils.js');


export class MessageEditFormEnhancerPlugin {

    constructor(model) {
        this.model = model;
    }

    async install() {
        
        const editButtons = Array.from(document.querySelectorAll('.bloc-options-msg .picto-msg-crayon'));
        for (const editButton of editButtons) {
            editButton.addEventListener('click', this.activateForm.bind(this));
        }
    }

    /**
     * 
     * @param {*} event 
     */
    async activateForm(event) {
        // If RisiBank is disabled, do nothing
        if (! this.model.getRisiBankIconState()) {
            return;
        }
        // Add RisiBank button
        const container = event.path[3];
        const toolbarDiv = await waitForFunction(() => container.querySelector('.jv-editor-toolbar'), 2 * 1000);
        const div = document.createElement('div');
        div.classList.add('btn-group');
        div.innerHTML = `
            <button class="btn btn-jv-editor-toolbar risibank-form-edit-toggle" style="${this.model.getRisiBankIconState() ? '' : 'filter: grayscale(1);'}" type="button" title="Ouvrir l'overlay RisiBank">
                <img src="https://risibank.fr/logo.png" width="14" height="14" style="vertical-align: text-top">
            </button>
        `;
        toolbarDiv.appendChild(div);
        // Listen to click event
        const editButton = container.querySelector('.risibank-form-edit-toggle');
        editButton.addEventListener('click', event => this.openRisiBank(container));
    }

    /**
     * {HTMLDivElement} container
     */
    openRisiBank(container) {
        RisiBank.activate({
            type: 'overlay',
            theme: scriptOptions.getOption('theme'),
            defaultTab: scriptOptions.getOption('defaultTab'),
            mediaSize: 'lg',
            navbarSize: 'lg',
            onSelectMedia: RisiBank.Actions.addSourceImageLink(container.querySelector('textarea')),
        });
    }
}
