import { scriptOptions } from '../ScriptOptions';
import { installStyles } from '../style';


export class BetterJVC {

    constructor(model) {
        this.model = model;
    }

    async install() {
        let css = [];
        // Hide ads
        css.push('.js-ad-placeholder { display: none !important; }');
        // Increase message form height
        if (scriptOptions.getOption('increaseMessageFormHeight')) {
            css.push(`
                .messageEditor__edit { height: 18rem !important; }
            `);
        }
        // Install computed styles
        await installStyles(css.join("\n"));
    }
}