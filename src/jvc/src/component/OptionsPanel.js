const { scriptOptions } = require('../ScriptOptions.js');



export class OptionsPanel {

    constructor(risibank) {
        this.risibank = risibank;

        this.view = new View(this);
    }

    open() {
        this.view.open();
    }

    close() {
        this.view.close();
    }
}


class View {

    constructor (model) {

        this.model = model;

        this.node = null;
        this.mount();
        this.controller = new Controller(this.model, this);
    }

    mount() {

        if (this.node) {
            this.node.remove();
        }

        this.node = document.createElement('div');
        this.node.classList.add('risibank-options-panel');
        this.node.style.display = 'none';
        this.node.style.position = 'fixed';
        this.node.style.top = '0';
        this.node.style.left = '0';
        this.node.style.width = '100%';
        this.node.style.height = '100%';
        this.node.style.zIndex = '10000000000';
        this.node.style.padding = '20px';
        this.node.style.textAlign = 'center';
        this.node.style.fontSize = '16px';
        this.node.style.overflowY = 'auto';
        document.body.appendChild(this.node);

        this.buildNodeHtml();
    }

    buildNodeHtml() {

        // Set background color from theme
        if (scriptOptions.getOption('theme').startsWith('dark')) {
            this.node.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
            this.node.style.color = '#cccccc';
        } else {
            this.node.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            this.node.style.color = 'black';
        }

        // Build HTML for the options form
        let html = '';
        html += `
        <table>
        `;
        for (const option of scriptOptions.allOptions) {
            if (option.hidden) {
                continue;
            }
            if (option.activateIf && ! option.activateIf(scriptOptions.options)) {
                continue;
            }
            html += `
                <tr style="height: 28px">
                    <td style="width: 20px;">
                        <a href="javascript:void(0)" onclick="return false" title="${option.description}" style="border: 1px solid; padding: 1px 5px; border-radius: 3px;">
                            ?
                        </a>
                    </td>
                    <td style="width: 350px; text-align: left; padding-left: 10px;" title="${option.description}">
                        ${option.label}
                    </td>
            `;
            if (option.type === 'boolean') {
                html += `
                    <td style="width: 130px;">
                        <input
                            type="checkbox"
                            class="input-on-off"
                            id="risibank-${option.name}"
                            data-risibank-option-name="${option.name}"
                            data-risibank-option-type="${option.type}"
                            ${scriptOptions.getOption(option.name) ? 'checked=""' : ''}
                        >
                        <label for="risibank-${option.name}" class="btn-on-off"></label>
                    </td>
                `;
            } else if(option.type === 'select') {
                html += `
                    <td style="width: 130px;">
                        <select
                            data-risibank-option-name="${option.name}"
                            data-risibank-option-type="${option.type}"
                            value="${scriptOptions.getOption(option.name)}"
                            style="height: 24px; font-size: 12px; width: 100%;"
                        >
                `
                for (const value of option.values) {
                    html += `
                            <option value="${value.value}" ${scriptOptions.getOption(option.name) === value.value ? 'selected="selected"' : ''}>${value.label}</option>
                    `;
                }
                html += `
                        </select>
                    </td>
                `;
            }
            html += `
                </tr>
            `;
        }
        html += `
        </table>
        `;

        this.node.innerHTML = `
        <div style="position: relative">
            <button class="risibank-options-panel-close" style="position: absolute; top: 0; left: 0; border: 1px solid white; padding: 6px 12px; border-radius: 4px;">Fermer</button>
            <h1 style="margin-bottom: 20px; padding-top: 40px;"><img src="https://risibank.fr/logo.png" height="28" width="28" style="margin-right: 8px; vertical-align: baseline;"> RisiBank JVC</h1>
            <div style="width: 100%; max-width: 500px; margin: 0 auto;">
                ${ html }
            </div>
        </div>
        `;
    }
    
    open() {
        this.node.style.display = '';
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.node.style.display = 'none';
        document.body.style.overflow = '';
    }
}


class Controller {

    constructor(model, view) {
        this.model = model;
        this.view = view;

        this.bindEvents();
    }

    bindEvents() {

        // Close button
        document.querySelectorAll('.risibank-options-panel-close').forEach(node => {
            node.addEventListener('click', () => {
                this.model.close();
            });
        });

        // Options form
        const optionsFormInputs = Array.from(document.querySelectorAll('.risibank-options-panel input, .risibank-options-panel select'));
        for (const optionsFormInput of optionsFormInputs) {
            optionsFormInput.addEventListener('change', async () => {
                const optionName = optionsFormInput.dataset.risibankOptionName;
                const optionType = optionsFormInput.dataset.risibankOptionType;
                if (optionType === 'boolean') {
                    await scriptOptions.saveOption(optionName, !! optionsFormInput.checked);
                } else if (optionType === 'select') {
                    await scriptOptions.saveOption(optionName, optionsFormInput.value);
                } else {
                    throw new Error('Unknown option type');
                }
                this.model.risibank.reload();
                this.view.buildNodeHtml();
                this.bindEvents();
            });
        }
    }
}