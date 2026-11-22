import { RISIBANK_URL } from './config.js';
import { apiGet, loadImage, request } from './requests.js';

// The webservice endpoint JVC itself uses: `envoi.json` would also pile every upload into the user's NoelShack page.
const NOELSHACK_UPLOAD_URL = 'https://www.noelshack.com/webservice/envoi.json';
// Long enough for NoelShack to answer, short enough not to hold the post up when it doesn't.
const ALIVE_CHECK_TIMEOUT_MS = 2000;

// One lookup per media, even if it is picked again while the first one runs.
const pending = new Map();
// Links already settled this session, so picking a sticker again is instant.
const known = new Map();

/**
 * The NoelShack link to post for a media.
 *
 * JVC only shows NoelShack images as stickers. A media uploaded straight to RisiBank has no NoelShack
 * link yet, and NoelShack drops some files over time. In both cases the first user to post the media
 * uploads it to NoelShack from their browser and reports the link: RisiBank checks it is the same
 * picture (and, for a replacement, that the old file is really gone) and keeps it for everyone.
 *
 * `onUpload(reason)` is called when an upload starts, with 'missing' or 'dead', so the caller can say why it waits.
 */
export function getNoelshackLink(media, onUpload = () => {}) {
    if (known.has(media.id)) {
        return Promise.resolve(known.get(media.id));
    }
    if (!pending.has(media.id)) {
        const resolving = resolveLink(media, onUpload)
            .then(url => {
                known.set(media.id, url);
                return url;
            })
            .finally(() => pending.delete(media.id));
        pending.set(media.id, resolving);
    }
    return pending.get(media.id);
}

async function resolveLink(media, onUpload) {
    if (!media.source_url) {
        onUpload('missing');
        return fillInSource(media, null);
    }
    if (!(await isGone(media.source_url))) {
        return media.source_url;
    }
    onUpload('dead');
    return fillInSource(media, media.source_url);
}

/**
 * Whether NoelShack says the file no longer exists. No answer, or any other status, counts as still there.
 */
async function isGone(url) {
    try {
        await request({ url, method: 'HEAD', timeout: ALIVE_CHECK_TIMEOUT_MS });
        return false;
    } catch (error) {
        return [404, 410].includes(error?.status);
    }
}

async function fillInSource(media, deadUrl) {
    const mediaApi = `${RISIBANK_URL}/api/v1/medias/${media.id}`;

    // Someone may have posted or fixed it since the embed loaded it.
    const current = JSON.parse((await apiGet(mediaApi)).responseText);
    if (current.source_url && current.source_url !== deadUrl) {
        return current.source_url;
    }

    // Lossless copy: NoelShack re-encodes uploads, and RisiBank compares pixels. RisiBank enlarges it when NoelShack would find it too small.
    const { url: fileUrl } = JSON.parse((await apiGet(`${mediaApi}/source-file`)).responseText);
    const file = await loadImage(fileUrl);
    const form = new FormData();
    form.append('domain', 'https://www.jeuxvideo.com');
    const extension = new URL(fileUrl).pathname.split('.').pop();
    // Random name: a "risibank" pattern would let NoelShack find and bulk-delete every upload.
    form.append('fichier[]', file, `${Math.random().toString(36).slice(2, 10)}.${extension}`);
    // Anonymous: without the user's NoelShack cookies, nothing lands on their NoelShack page.
    const upload = JSON.parse(
        (await request({ url: NOELSHACK_UPLOAD_URL, method: 'POST', data: form, anonymous: true })).responseText,
    );
    if (!upload.url) {
        throw new NoelshackRefusal([].concat(upload.erreurs ?? []).join(' '));
    }

    try {
        const response = await request({
            url: `${mediaApi}/source`,
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            data: JSON.stringify({ type: 'jvc', url: upload.url }),
        });
        return JSON.parse(response.responseText).url;
    } catch (error) {
        // Someone else filled the source in first: theirs is the link to post.
        if (error?.status === 409) {
            const current = JSON.parse((await apiGet(mediaApi)).responseText);
            if (current.source_url) {
                return current.source_url;
            }
        }
        throw error;
    }
}

class NoelshackRefusal extends Error {}

/**
 * Short French reason for a failed upload, shown to the user.
 */
export function describeUploadError(error) {
    if (error instanceof NoelshackRefusal) {
        return `NoelShack a refusé l'image${error.message ? ` (${error.message})` : ''}`;
    }
    if (error?.status === 429) {
        return 'Trop d\'envois, réessaie dans une minute';
    }
    if (error?.status === 422) {
        return 'NoelShack a modifié l\'image';
    }
    return 'NoelShack ou RisiBank ne répond pas';
}
