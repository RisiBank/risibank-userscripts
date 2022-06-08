

export class JVCarePlugin {
    

    /**
     * Replaces JVCare links from JeuxVideo.com
     * @see http://kiwec.net/scripts/topiclive.user.js
     */
    static jvCare(theClass) {
        const base16 = '0A12B34C56D78E9F';
        let lien = '';
        const s = theClass.split(' ')[1];
        for (let i = 0; i < s.length; i += 2) {
            lien += String.fromCharCode(base16.indexOf(s.charAt(i)) * 16 + base16.indexOf(s.charAt(i + 1)));
        }
        return lien;
    }

    /**
     * Replace all JVCare links in the current page, immediately
     */
    static replaceAllJvCare() {
        const spans = document.querySelectorAll('.text-enrichi-forum span.JvCare');
        for (const span of spans) {
            const link = document.createElement('a');
            link.innerHTML = span.innerHTML;
            const href = JVCarePlugin.jvCare(span.className);
            link.className = 'xXx';
            link.alt = href;
            link.href = href;
            link.target = '_blank';
            span.parentNode.replaceChild(link, span);
        }
    }

    constructor(model) {
        this.model = model;
    }

    async install() {
        JVCarePlugin.replaceAllJvCare();
    }
}
