const { scriptOptions } = require('../ScriptOptions.js');


export class YoutubePlugin {

    constructor(model) {
        this.model = model;
    }

    async install() {
        if (! scriptOptions.getOption('embedYoutubeLinks')) {
            return;
        }
        // Find all potential links to RisiBank images
        let links = Array.from(document.querySelectorAll('.txt-msg a.xXx'));
        // Identify YT links
        links = links.map(link => {

            let mtc = null;
            let id = null,
                start = null;
            if (mtc = link.href.match(/^https:\/\/youtu.be\/([\w-]+)\?.*t=(\d+)/)) {
                id = mtc[1];
                start = parseInt(mtc[2]);
            } else if (mtc = link.href.match(/^https:\/\/youtu.be\/([\w-]+)/)) {
                id = mtc[1];
                start = 0;
            } else if (mtc = link.href.match(/^https:\/\/www.youtube.com\/watch\?v=([\w-]+).*\&t=(\d+)/)) {
                id = mtc[1];
                start = parseInt(mtc[2]);
            } else if (mtc = link.href.match(/^https:\/\/www.youtube.com\/watch\?t=(\d+).*\&v=([\w-]+)/)) {
                id = mtc[2];
                start = parseInt(mtc[1]);
            } else if (mtc = link.href.match(/^https:\/\/www.youtube.com\/watch\?v=([\w-]+)/)) {
                id = mtc[1];
                start = 0;
            }
            
            if (id) {
                link.setAttribute('data-yt-id', id);
                link.setAttribute('data-yt-start', start);
            }

            return link;
        });
        // Filter out non yt links
        links = links.filter(link => !! link.hasAttribute('data-yt-id'));
        // Replace by youtube iframes
        links.forEach(link => {
            const youtubeId = link.getAttribute('data-yt-id');
            const start = parseInt(link.getAttribute('data-yt-start'));
            const p = document.createElement('p');
            const html = `
                ${link.outerHTML}
                <iframe
                    width="560"
                    height="315"
                    style="max-width: 100%;"
                    src="https://www.youtube.com/embed/${youtubeId}?start=${start}"
                    title="YouTube video player"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen>
                </iframe>
            `;
            p.innerHTML = html;
            link.parentNode.replaceChild(p, link);
        });
    }
}
