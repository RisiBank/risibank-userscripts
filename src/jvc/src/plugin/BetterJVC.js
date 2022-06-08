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
                .area-form-fmobile { height: 18rem !important; }
                .area-editor { height: 16rem !important; }
            `);
        }
        // Install computed styles
        await installStyles(css.join("\n"));
    }
}