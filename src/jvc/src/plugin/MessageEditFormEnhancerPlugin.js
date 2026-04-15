const { RisiBank } = require('risibank-web-api');
const { scriptOptions } = require('../ScriptOptions.js');
const { wait, waitForFunction } = require('../utils.js');


export class MessageEditFormEnhancerPlugin {

    constructor(model) {
        this.model = model;
    }

    async install() {
        document.addEventListener('click', event => {
            if (event.target.closest('button.messageUser__action[title="Modifier le message"]')) {
                this.activateForm();
            }
        }, true);
    }

    async activateForm() {
        // If RisiBank is disabled, do nothing
        if (! this.model.getRisiBankIconState()) {
            return;
        }
        // JVC re-renders the card when clicking edit, so we poll the live DOM for the form
        // Wait for form to appear, then let React finish rendering before injecting
        const form = await waitForFunction(() => document.querySelector('.messageEditForm'), 5 * 1000);
        if (! form) {
            return;
        }
        await wait(500);
        const toolbarDiv = document.querySelector('.messageEditForm .buttonsEditor');
        if (! toolbarDiv) {
            return;
        }
        // Add RisiBank button
        const div = document.createElement('div');
        div.classList.add('buttonsEditor__group');
        div.innerHTML = `
            <button class="buttonsEditor__button risibank-form-edit-toggle" style="${this.model.getRisiBankIconState() ? '' : 'filter: grayscale(1);'}" type="button" title="Ouvrir l'overlay RisiBank">
                <img src="https://risibank.fr/logo.png" width="14" height="14" style="vertical-align: baseline;">
            </button>
        `;
        toolbarDiv.insertBefore(div, toolbarDiv.querySelector('.buttonsEditor__groupPreview'));
        // Listen to click event
        const currentForm = document.querySelector('.messageEditForm');
        const editButton = currentForm.querySelector('.risibank-form-edit-toggle');
        editButton.addEventListener('click', () => {
            const textarea = currentForm.querySelector('textarea');
            this.openRisiBank(textarea);
        });
    }

    openRisiBank(textarea) {
        const view = this.model.view;
        RisiBank.activate({
            type: 'overlay',
            theme: scriptOptions.getOption('theme'),
            defaultTab: scriptOptions.getOption('defaultTab'),
            mediaSize: scriptOptions.getOption('mediaSize'),
            navbarSize: scriptOptions.getOption('navbarSize'),
            showNSFW: scriptOptions.getOption('showNSFW'),
            onSelectMedia: ({ media }) => {
                const link = media.source_url + (scriptOptions.getOption('appendStickerHash') ? '#sticker' : '');
                const cursorIndex = textarea.selectionStart;
                const preprendSpace = textarea.value[cursorIndex - 1] && !textarea.value[cursorIndex - 1].match(/\s/);
                const appendSpace = typeof textarea.value[cursorIndex] === 'undefined' || !textarea.value[cursorIndex].match(/\s/);
                const added = `${preprendSpace ? ' ' : ''}${link}${appendSpace ? ' ' : ''}`;
                view.setReactInputValue(textarea,
                    textarea.value.substring(0, textarea.selectionStart) +
                    added +
                    textarea.value.substring(textarea.selectionStart)
                );
                textarea.focus();
            },
        });
    }
}
