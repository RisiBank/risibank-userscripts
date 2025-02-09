import { scriptOptions } from '../ScriptOptions.js';
import { getSelectors } from '../utils.js';


export class AntiCensorPlugin {

    static addInvisibleCharacter(content) {
        return content + '\u200B';
    }

    static associations = Object.fromEntries(
        decodeURIComponent(window.atob('YWJydXRpJTNCc290JTJDYWh1cmklM0JhYnJpY290JTJDYXJhYmUlM0JmZXVpbGxhZ2UlMkNhdHRhcmQlQzMlQTklM0JtYWxpbiUyQ2F2YWxldXIlM0Jnb3VybWFuZCUyQ2F2b3J0aW4lM0JtYXhpbWlsaWVuJTJDYmFidG91JTNCbW9uc2lldXIlMjBsYWl0JTJDYmFpc2UlM0JzaWZmbG90ZSUyQ2JldXJldHRlJTNCcGFpbiUyMGF1JTIwbGFpdCUyQ2JpdGUlM0JoYXJpY290JTJDYmxhY2tlZCUzQmFzc29tYnJpciUyQ2JvdWdub3VsJTNCY2Fzc291bGV0JTJDYm91Z25vdWxlJTNCdHJhdmFpbGxldXIlMjBzb2NpYWwlMkNjaGlicmUlM0JzdHlsbyUyQ2NoaWVuJTNCZG9nZ28lMkNjb3VpbGxlJTNCZ2Vub3V4JTJDY29ubmFyZCUzQm1hbHBvbGklMkNkZW1ldXIlQzMlQTklM0J0ciVDMyVBOHMlMjBtYWxpbiUyQ2QlQzMlQTliaWxlJTNCbGVudCUyQ2Rlc2NvJTNCbm9uJTIwJUMzJUE5dHVkaWFudCUyQ2VuY3VsZSUzQiVDMyVBOXRvbm5lJTJDZW5jdWwlQzMlQTklM0IlQzMlQTl0b25uJUMzJUE5JTJDZmRwJTNCZmlscyUyQ2YlQzMlQTltaW5pc3RlJTNCbm9lbGlzdGUlMkNmb3V0cmUlM0JmYWlyZSUyQ2d1ZXVsZSUzQmJvdWNoZSUyQ2dsYW5kJTNCY2glQzMlQUFuZSUyQ2p1aWYlM0Jwb21waWVyJTJDbSVDMyVBOHJlJTNCZyVDMyVBOW5pdHJpY2UlMkNtZXJkZSUzQmJvdXNlJTJDbXVzdWxtYW4lM0JyZXN0YXVyYXRldXIlMkNtdXp6JTNCc2VydmV1ciUyQ25pcXVlJTNCYWltZSUyQ3AlQzMlQTlkJUMzJUE5JTNCaGV1cmV1eCUyQ3Bpc3NlJTNCc3Vic3RhbmNlJTIwamF1bmUlMkNwdXRhaW4lMjBkZSUzQnNhY3IlQzMlQTklMkNwdXRhaW4lM0JzYXByaXN0aSUyQ3B1dGUlM0JoYXBwaXN0ZSUyQ3BkJTNCaHVtYWluJTIwYmllbiUyMGVkdXF1JUMzJUE5JTJDcmFjZSUzQmNvbW11bmF1dCVDMyVBOSUyQ3IlQzMlQTlzaWR1JTNCcmVzdGUlMkNzYWxhdWQlM0JnYXJuZW1lbnQlMkNzYWxvcGUlM0JoYXBvZWxpc3RlJTJDc3VjZXVyJTNCZ291cm1ldCUyQ3Ryb3UlMjBkdSUyMGN1bCUzQm1pcyVDMyVBOXJhYmxlJTJDdHJpc28lM0JkeW5hJTJDdHJpc29taXF1ZSUzQmR5bmFtaXF1ZSUyQ3Zpb2wlM0JzYWNyZSUyMGJsZXUlMkN3ZWJlZGlhJTNCYWxsc2FmZSUyQ3lvdXBpbiUzQmpvbGklMjBwaWY='))
            .split(',')
            .map(e => e.split(';'))
            .map(([from, to]) => [from, AntiCensorPlugin.addInvisibleCharacter(to)])
    );

    constructor(model) {
        this.model = model;
    }

    async install() {
        // Skip if not in topics/forums
        if (['web', 'mobile'].includes(this.model.pageType)) {
            return;
        }
        // Replace all elements back to their original content
        const elements = document.querySelectorAll('.bloc-contenu p, .text-enrichi-fmobile p');
        for (const element of elements) {
            let innerHTML = element.innerHTML;
            let changed = false;
            for (const key in AntiCensorPlugin.associations) {
                const value = AntiCensorPlugin.associations[key];
                const [from, to] = [value, key];
                const regex = new RegExp(from, 'g');
                if (innerHTML.match(regex)) {
                    innerHTML = innerHTML.replace(regex, to);
                    changed = true;
                }
            }
            if (changed) {
                element.innerHTML = innerHTML;
            }
        }
        // When sending the message, censor all bad words
        if (scriptOptions.getOption('antiCensorPlugin')) {
            const { submitButtonSelector, contentSelector } = getSelectors(this.model.pageType);
            if (!submitButtonSelector || !contentSelector) {
                return;
            }
            const sendMessageButton = document.querySelector(submitButtonSelector);
            if (!sendMessageButton) {
                return;
            }
            sendMessageButton.addEventListener('click', () => {
                const messageInput = document.querySelector(contentSelector);
                for (const key in AntiCensorPlugin.associations) {
                    const value = AntiCensorPlugin.associations[key];
                    const [from, to] = [key, value];
                    const regex = new RegExp(from, 'gi');
                    messageInput.value = messageInput.value.replace(regex, to);
                }
            });
        }
    }
}
