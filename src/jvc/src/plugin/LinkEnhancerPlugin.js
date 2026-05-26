import { RISIBANK_URL, RISIBANK_URL_ESCAPED } from '../config.js';


export class LinkEnhancerPlugin {

    constructor(model) {
        this.model = model;
    }

    async install() {
        // Find all potential links to RisiBank images
        let links = Array.from(document.querySelectorAll('a.xXx'));
        const base = RISIBANK_URL_ESCAPED;
        // Normalize links pointing to different risibank resources to pointing to the full URL
        const replaceRegExps = {
            [`^${base}/cache/medias/([\\d/]+)/([\\d]+)/(\\w+)\\.(\\w+)$`]: `${RISIBANK_URL}/media/$2-media-$4`,
            [`^${base}/cache/stickers/d([\\d]+)/([\\d]+)-(\\w+)\\.(\\w+)$`]: `${RISIBANK_URL}/media/$2-media-$4`,
        };
        links = links.map(link => {
            for (const regexp in replaceRegExps) {
                const regexpObject = new RegExp(regexp);
                if (link.href.match(regexpObject)) {
                    link.href = link.href.replace(new RegExp(regexp), replaceRegExps[regexp]);
                }
            }
            return link;
        });
        // Filter out non-risibank links
        links = links.filter(link => !! link.href.match(`^${base}/media/(\\d+)-media-(\\w+)$`));
        // Replace text content by an image
        links.forEach(link => {
            const mediaId = parseInt(link.href.match('/(\\d+)-media')[1]);
            const mediaExt = link.href.match('-media-(\\w+)$')[1];
            const mediaUrl = this.model.getRisiBankImageUrl(mediaId, mediaExt);
            link.innerHTML = `
                <img class="message__urlImg" width="68" height="51" src="${mediaUrl}">
            `;
        });
    }
}
