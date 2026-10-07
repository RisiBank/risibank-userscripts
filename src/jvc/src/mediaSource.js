import { RISIBANK_URL } from './config.js';
import { apiGet, loadImage, request } from './requests.js';

const NOELSHACK_UPLOAD_URL = 'https://www.noelshack.com/envoi.json';

// One upload per media, even if it is picked again while the first one runs.
const pending = new Map();

/**
 * The NoelShack link to post for a media.
 *
 * JVC only shows NoelShack images as stickers. A media uploaded straight to RisiBank has no
 * NoelShack link yet, so the first user to post it uploads it to NoelShack from their browser
 * and reports the link. RisiBank checks it is the same picture and keeps it for everyone.
 */
export function getNoelshackLink(media) {
    if (media.source_url) {
        return Promise.resolve(media.source_url);
    }
    if (!pending.has(media.id)) {
        pending.set(media.id, fillInSource(media).finally(() => pending.delete(media.id)));
    }
    return pending.get(media.id);
}

/**
 * Whether getting the link needs an upload, so the caller can tell the user to wait.
 */
export function needsUpload(media) {
    return !media.source_url;
}

async function fillInSource(media) {
    const mediaApi = `${RISIBANK_URL}/api/v1/medias/${media.id}`;

    // Lossless copy: NoelShack re-encodes uploads, and RisiBank compares pixels.
    const { url: fileUrl } = JSON.parse((await apiGet(`${mediaApi}/source-file`)).responseText);
    const file = await loadImage(fileUrl);
    const form = new FormData();
    form.append('fichier[]', file, `risibank-${media.id}.${fileUrl.split('.').pop()}`);
    const upload = JSON.parse((await request({ url: NOELSHACK_UPLOAD_URL, method: 'POST', data: form })).responseText);
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
