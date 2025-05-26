import { scriptOptions } from '../ScriptOptions';

/**
 * Removes the disclaimer message (anti-harassment prevention) from the message editor.
 */
export class RemoveDisclaimerPlugin {
    constructor(model) {
        this.model = model;
    }

    async install() {
        if (!scriptOptions.getOption('hideHarassmentPreventionBanner')) {
            return;
        }

        const topInfo = document.querySelector('.messageEditor__topInfo');
        if (!topInfo) {
            return;
        }

        topInfo.style.display = 'none';
    }
}
