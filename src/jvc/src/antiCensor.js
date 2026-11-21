import { JVC_BANNED_WORDS } from './jvcBannedWords.js';

// Zero-width joiner: invisible, and JVC accepts it, unlike U+200B or lookalike letters it refuses before sending.
const ZWJ = '‍';
const ACCENTS = { a: 'aàâä', c: 'cç', e: 'eéèêë', i: 'iîï', o: 'oôö', u: 'uùûü' };

function toPattern(word) {
    return [...word.normalize('NFD').replace(/\p{M}/gu, '')]
        .map(char => {
            if (char === ' ') {
                return '\\s+';
            }
            return ACCENTS[char] ? `[${ACCENTS[char]}]` : char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        })
        .join('');
}

// Longest first, so "putain de" wins over "putain". Letters or digits on either side mean the word is part of a longer one.
const BANNED = new RegExp(
    `(?<![\\p{L}\\p{N}])(?:${[...JVC_BANNED_WORDS].sort((a, b) => b.length - a.length).map(toPattern).join('|')})(?![\\p{L}\\p{N}])`,
    'giu',
);

/**
 * Hide one banned word from the bot: a zero-width joiner between two of its letters, at 1 or 2 random places,
 * so the result differs from one message to the next. The word reads the same for everyone.
 */
function hideWord(word) {
    const chars = [...word];
    const slots = chars.map((_, i) => i).filter(i => i > 0 && /\p{L}/u.test(chars[i - 1]) && /\p{L}/u.test(chars[i]));
    const picked = new Set();
    const wanted = Math.min(slots.length, 1 + Math.floor(Math.random() * 2));
    while (picked.size < wanted) {
        picked.add(slots[Math.floor(Math.random() * slots.length)]);
    }
    return chars.map((char, i) => (picked.has(i) ? ZWJ + char : char)).join('');
}

// A character inside a link would break it (a sticker's noelshack URL included).
const LINK = /(https?:\/\/\S+)/i;

/**
 * The text to post: every banned word hidden from JVC's bot, links left untouched. A word already hidden doesn't match again.
 */
export function protect(text) {
    return text
        .split(LINK)
        .map(part => (LINK.test(part) ? part : part.replace(BANNED, hideWord)))
        .join('');
}
