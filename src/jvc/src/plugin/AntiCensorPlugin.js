import { scriptOptions } from '../ScriptOptions.js';
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
        // On the document rather than the buttons: JVChat replaces the send button, and edit forms come and go.
        // Capture phase, so the text is protected before the button's own handler reads it.
        document.addEventListener('click', event => {
            const button = event.target.closest?.(SEND_BUTTONS);
            if (button) {
                protectField(findMessageField(button));
            }
        }, true);
        // JVChat also posts on Enter.
        document.addEventListener('keydown', event => {
            if (event.key === 'Enter' && !event.shiftKey && event.target.matches?.('textarea.jvchat-textarea')) {
                protectField(event.target);
            }
        }, true);
    }
}


// Post and edit buttons: JVC (topics, edits), and JVChat's own (it clones JVC's, which keeps .postMessage).
const SEND_BUTTONS = 'button.postMessage, #jvchat-post, .jvchat-edition-submit, .messageEditForm button[type="submit"]';

function findMessageField(button) {
    return button.closest('.jvchat-edition, .messageEditForm')?.querySelector('textarea')
        ?? document.querySelector('#message_reponse, #message_topic, .messageEditor__edit');
}

function protectField(field) {
    if (!field) {
        return;
    }
    const before = field.value;
    const after = protect(before);
    if (after === before) {
        return;
    }
    const caret = caretAfter(before, after, field.selectionStart ?? before.length);
    // Through the native setter plus an input event, so the editor's own state gets the new text too.
    RisiBank.Actions.setInputValue(field, after);
    field.setSelectionRange?.(caret, caret);
}

// protect() only inserts characters: walk both texts so the caret stays where the user was typing.
function caretAfter(before, after, caret) {
    let i = 0;
    let j = 0;
    while (i < caret && j < after.length) {
        if (after[j] === before[i]) {
            i++;
        }
        j++;
    }
    return j;
}
