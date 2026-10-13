import { RISIBANK_URL } from './config.js';
import { apiGet, loadImage, request } from './requests.js';

// The webservice endpoint JVC itself uses: `envoi.json` would also pile every upload into the user's NoelShack page.
const NOELSHACK_UPLOAD_URL = 'https://www.noelshack.com/webservice/envoi.json';

// One upload per media, even if it is picked again while the first one runs.
const pending = new Map();
// Avoid re-uploading many times the same URL
const known = new Map();

/**
 * The NoelShack link to post for a media.
 *
 * JVC only shows NoelShack images as stickers. A media uploaded straight to RisiBank has no
 * NoelShack link yet, so the first user to post it uploads it to NoelShack from their browser
 * and reports the link. RisiBank checks it is the same picture and keeps it for everyone.
 */
export function getNoelshackLink(media) {
    const link = media.source_url ?? known.get(media.id);
    if (link) {
        return Promise.resolve(link);
    }
    if (!pending.has(media.id)) {
        const filling = fillInSource(media)
            .then(url => {
                known.set(media.id, url);
                return url;
            })
            .finally(() => pending.delete(media.id));
        pending.set(media.id, filling);
    }
    return pending.get(media.id);
}

/**
 * Whether getting the link needs an upload, so the caller can tell the user to wait.
 */
export function needsUpload(media) {
    return !media.source_url && !known.has(media.id);
}

async function fillInSource(media) {
    const mediaApi = `${RISIBANK_URL}/api/v1/medias/${media.id}`;

    // Someone may have posted it since the embed loaded it.
    const current = JSON.parse((await apiGet(mediaApi)).responseText);
    if (current.source_url) {
        return current.source_url;
    }

    // Lossless copy: NoelShack re-encodes uploads, and RisiBank compares pixels.
    const { url: fileUrl } = JSON.parse((await apiGet(`${mediaApi}/source-file`)).responseText);
    const file = await loadImage(fileUrl);
    const form = new FormData();
    form.append('domain', 'https://www.jeuxvideo.com');
    const extension = new URL(fileUrl).pathname.split('.').pop();
    form.append('fichier[]', file, `risibank-${media.id}.${extension}`);
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
