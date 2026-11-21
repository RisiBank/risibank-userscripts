import { scriptOptions } from '../ScriptOptions.js';
import { getSelectors } from '../utils.js';
import { protect } from '../antiCensor.js';
import { RisiBank } from 'risibank-web-api';


export class AntiCensorPlugin {

    // Before 1.9, banned words were sent as other words plus U+200B (which JVC now refuses). Kept to read old messages back.
    static legacyAssociations = Object.fromEntries(
        decodeURIComponent(window.atob('YWJydXRpJTNCc290JTJDYWh1cmklM0JhYnJpY290JTJDYXJhYmUlM0JmZXVpbGxhZ2UlMkNhdHRhcmQlQzMlQTklM0JtYWxpbiUyQ2F2YWxldXIlM0Jnb3VybWFuZCUyQ2F2b3J0aW4lM0JtYXhpbWlsaWVuJTJDYmFidG91JTNCbW9uc2lldXIlMjBsYWl0JTJDYmFpc2UlM0JzaWZmbG90ZSUyQ2JldXJldHRlJTNCcGFpbiUyMGF1JTIwbGFpdCUyQ2JpdGUlM0JoYXJpY290JTJDYmxhY2tlZCUzQmFzc29tYnJpciUyQ2JvdWdub3VsJTNCY2Fzc291bGV0JTJDYm91Z25vdWxlJTNCdHJhdmFpbGxldXIlMjBzb2NpYWwlMkNjaGlicmUlM0JzdHlsbyUyQ2NoaWVuJTNCZG9nZ28lMkNjb3VpbGxlJTNCZ2Vub3V4JTJDY29ubmFyZCUzQm1hbHBvbGklMkNkZW1ldXIlQzMlQTklM0J0ciVDMyVBOHMlMjBtYWxpbiUyQ2QlQzMlQTliaWxlJTNCbGVudCUyQ2Rlc2NvJTNCbm9uJTIwJUMzJUE5dHVkaWFudCUyQ2VuY3VsZSUzQiVDMyVBOXRvbm5lJTJDZW5jdWwlQzMlQTklM0IlQzMlQTl0b25uJUMzJUE5JTJDZmRwJTNCZmlscyUyQ2YlQzMlQTltaW5pc3RlJTNCbm9lbGlzdGUlMkNmb3V0cmUlM0JmYWlyZSUyQ2d1ZXVsZSUzQmJvdWNoZSUyQ2dsYW5kJTNCY2glQzMlQUFuZSUyQ2p1aWYlM0Jwb21waWVyJTJDbSVDMyVBOHJlJTNCZyVDMyVBOW5pdHJpY2UlMkNtZXJkZSUzQmJvdXNlJTJDbXVzdWxtYW4lM0JyZXN0YXVyYXRldXIlMkNtdXp6JTNCc2VydmV1ciUyQ25pcXVlJTNCYWltZSUyQ3AlQzMlQTlkJUMzJUE5JTNCaGV1cmV1eCUyQ3Bpc3NlJTNCc3Vic3RhbmNlJTIwamF1bmUlMkNwdXRhaW4lMjBkZSUzQnNhY3IlQzMlQTklMkNwdXRhaW4lM0JzYXByaXN0aSUyQ3B1dGUlM0JoYXBwaXN0ZSUyQ3BkJTNCaHVtYWluJTIwYmllbiUyMGVkdXF1JUMzJUE5JTJDcmFjZSUzQmNvbW11bmF1dCVDMyVBOSUyQ3IlQzMlQTlzaWR1JTNCcmVzdGUlMkNzYWxhdWQlM0JnYXJuZW1lbnQlMkNzYWxvcGUlM0JoYXBvZWxpc3RlJTJDc3VjZXVyJTNCZ291cm1ldCUyQ3Ryb3UlMjBkdSUyMGN1bCUzQm1pcyVDMyVBOXJhYmxlJTJDdHJpc28lM0JkeW5hJTJDdHJpc29taXF1ZSUzQmR5bmFtaXF1ZSUyQ3Zpb2wlM0JzYWNyZSUyMGJsZXUlMkN3ZWJlZGlhJTNCYWxsc2FmZSUyQ3lvdXBpbiUzQmpvbGklMjBwaWY='))
            .split(',')
            .map(e => e.split(';'))
            .map(([word, replacement]) => [replacement + '​', word])
    );

    constructor(model) {
        this.model = model;
    }

    async install() {
        // JVC's bot only watches the forums, so private messages are left as typed.
        if (this.model.pageType === 'mp') {
            return;
        }
        this.decodeLegacyMessages();
        if (scriptOptions.getOption('antiCensorPlugin')) {
            this.protectOnSend();
        }
    }

    decodeLegacyMessages() {
        const elements = document.querySelectorAll('.text-enrichi-forum p, .bloc-contenu p, .text-enrichi-fmobile p');
        for (const element of elements) {
            let html = element.innerHTML;
            if (!html.includes('​')) {
                continue;
            }
            for (const [replacement, word] of Object.entries(AntiCensorPlugin.legacyAssociations)) {
                html = html.replaceAll(replacement, word);
            }
            element.innerHTML = html;
        }
    }

    protectOnSend() {
        const { submitButtonSelector, contentSelector } = getSelectors(this.model.pageType) ?? {};
        const sendMessageButton = submitButtonSelector && document.querySelector(submitButtonSelector);
        if (!sendMessageButton) {
            return;
        }
        // Capture phase, so the text is protected before JVC's own click handler reads it.
        sendMessageButton.addEventListener('click', () => {
            const messageInput = document.querySelector(contentSelector);
            if (messageInput) {
                // Through the native setter plus an input event, so the editor's own state gets the new text too.
                RisiBank.Actions.setInputValue(messageInput, protect(messageInput.value));
            }
        }, true);
    }
}
