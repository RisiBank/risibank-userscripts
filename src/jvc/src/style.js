import { waitForFunction } from './utils.js';


const css = `
<style type="text/css">
    /* Hide empty ad banner */
    .js-ad-placeholder { display: none !important; }

    /* Stop message flash */
    /*
    #forum-main-col .bloc-message-forum-anchor:target+.bloc-message-forum:not(.seen) {
        background-color: transparent !important;
    }
    */
    
    /* Fix message column size: Fix min-width too large on desktop version from 1480px to 1200px */
    @media (min-width: 1200px) {
        .layout {
            --grid-template-columns: 1fr 49rem 24.5rem 1fr;
        }
    }

    /* Image enhancer */
    .risibank-image-enhancer-buttons {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 20px;
        display: none;
    }
    .risibank-image-enhancer-link:hover .risibank-image-enhancer-buttons {
        display: flex;
    }
    .risibank-image-enhancer-buttons button {
        flex-grow: 1;
        font-size: 10px;
        border: none;
    }
    .risibank-image-enhancer-buttons button.copy-source {
        background-color: #8860d0;
    }
    .risibank-image-enhancer-buttons button.copy-source:hover {
        background-color: #7452b1;
    }
    .risibank-image-enhancer-buttons button.add {
        background-color: #5680e9;
    }
    .risibank-image-enhancer-buttons button.add:hover {
        background-color: #496dc6;
    }
</style>
`;

export const installStyles = async (css) => {

    try {

        // GM_addStyle does not exist in latest GreaseMonkey versions
        GM_addStyle(css);
    
    } catch (error) {

        const head = await waitForFunction(() => document.querySelector('head'), 5 * 1000);

        if (! head) {
            console.error('RisiBank: Unable to load styles');
        }

        const style = document.createElement('style');
        style.appendChild(document.createTextNode(css));
        head.appendChild(style);
    }
};

export const installDefaultStyles = async () => {
    await installStyles(css);
};
