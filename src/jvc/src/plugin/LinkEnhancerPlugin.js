

export class LinkEnhancerPlugin {

    constructor(model) {
        this.model = model;
    }

    async install() {
        // Find all potential links to RisiBank images
        let links = Array.from(document.querySelectorAll('a.xXx'));
        // Normalize links pointing to different risibank resources to pointing to the full URL
        const replaceRegExps = {
            '^https://risibank.fr/cache/medias/([\\d/]+)/([\\d]+)/(\\w+)\\.(\\w+)$': 'https://risibank.fr/media/$2-media-$4',
            '^https://risibank.fr/cache/stickers/d([\\d]+)/([\\d]+)-(\\w+)\\.(\\w+)$': 'https://risibank.fr/media/$2-media-$4',
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
        links = links.filter(link => !! link.href.match('^https://risibank.fr/media/(\\d+)-media-(\\w+)$'));
        // Replace text content by an image
        links.forEach(link => {
            const mediaId = parseInt(link.href.match('/(\\d+)-media')[1]);
            const mediaExt = link.href.match('-media-(\\w+)$')[1];
            const mediaUrl = this.model.getRisiBankImageUrl(mediaId, mediaExt);
            link.innerHTML = `
                <img class="img-shack" width="68" height="51" src="${mediaUrl}">
            `;
        });
    }
}
