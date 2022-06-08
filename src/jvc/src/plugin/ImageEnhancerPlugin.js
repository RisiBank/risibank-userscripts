const { scriptOptions } = require('../ScriptOptions.js');
const { loadImage } = require('../requests.js');
const { ImageOptimizerPlugin } = require('./ImageOptimizerPlugin.js');



export class ImageEnhancerPlugin {

    constructor(model) {
        this.model = model;
        this.imageOptimizer = this.model.getPlugin(ImageOptimizerPlugin);
    }

    async install() {
        // Find all potential NS images
        let images = Array.from(document.querySelectorAll('img.img-shack'));
        // Normalize images (replaces noelshack links with the direct link to the image)
        const replaceRegExps = {
            '^https://www.noelshack.com/(2022|2021|2020|2019)-(\\d+)-(\\d+)-([\\w\\[\\]\\._-]+)$': 'https://image.noelshack.com/fichiers/$1/$2/$3/$4',
            '^https://www.noelshack.com/(\\d+)-(\\d+)-(\\d+)-([\\w\\[\\]\\._-]+)$': 'https://image.noelshack.com/fichiers/$1/$2/$3-$4',
            //'^https://image.noelshack.com/minis/([\\d/]+)/([\\w\\[\\]\\._-]+)\\.(\\w+)$':  'https://image.noelshack.com/fichiers/$1/$2.$3',
        };
        images = images.map(image => {
            for (const regexp in replaceRegExps) {
                const regexpObject = new RegExp(regexp);
                if (image.alt.match(regexpObject)) {
                    image.alt = image.alt.replace(new RegExp(regexp), replaceRegExps[regexp]);
                }
            }
            return image;
        });
        // Filter non-noelshack images
        images = images.filter(image => !! image.alt.match('^https://image.noelshack.com/fichiers/([\\d/]+)/([\\w\\[\\]\\._-]+)$'));
        // Current image id
        let currentImageId = 0;
        // Replace image src, eventually
        for (let image of images) {
            // For some reason, the image reference changes after the first modifications
            // Create a unique ID for this image
            const id = ++ currentImageId;
            image.setAttribute('risibank-id', id);
            // Is the media known by the image optimizer?
            const cachedMedia = this.imageOptimizer.cached[image.alt];
            // Change the link associated to this image to redirect to RisiBank
            if (scriptOptions.getOption('redirectToRisiBank')) {
                if (cachedMedia) {
                    image.parentElement.href = `https://risibank.fr/media/${cachedMedia.id}-${cachedMedia.slug}`;
                } else {
                    image.parentElement.href = 'https://risibank.fr/api/v1/medias/by-source?type=jvc&url=' + image.alt
                }
            }
            // Save original src attribute
            image.setAttribute('risibank-original-src', image.src);
            // Decide whether we need to replace the image src
            let replaceByFull = false;
            // Animate GIFs (GIFs have their src pointing to a fixed image, but the img alt attribute points to the real GIF)
            if (image.alt.match(/\.gif$/)) {
                replaceByFull = scriptOptions.getOption('animateGifs');
            } else {
                replaceByFull = scriptOptions.getOption('addTransparency');
            }
            // If nothing to do, skip
            if (! replaceByFull) {
                this.addImageButtons(image);
                continue;
            }
            // If media was cached, replace the image by the cached version using the image src so we benefit from browser's cache
            if (cachedMedia) {
                image.src = cachedMedia.thumb;
                this.addImageButtons(image);
                continue;
            }
            // Replace the image src by the full version
            this.replaceImageByFull(id, image.alt);
        };
    }

    waitForImageToComplete(image) {
        if (image.complete) {
            if (image.naturalHeight !== 0) {
                return Promise.resolve(image);
            } else {
                return Promise.reject(image);
            }
        }
        return new Promise((resolve, reject) => {
            image.addEventListener('load', () => {
                if (image.naturalHeight !== 0) {
                    resolve(image);
                } else {
                    reject(image);
                }
            });
            image.addEventListener('error', () => {
                reject(image);
            });
        });
    }

    async replaceImageByFull(id, newSrc) {

        const cancel = image => {
            image.src = 'https://risibank.fr/cache/medias/0/5/512/51206/thumb.png';
            image.parentElement.insertAdjacentHTML('beforeend', `[Média supprimé]`);
        };

        const restore = image => {
            image.src = image.getAttribute('risibank-original-src');
        };

        // For some reason, the image reference changes after the first modifications
        let image = document.querySelector(`img[risibank-id="${id}"]`);
        
        // 1] Wait for origin image to load
        let originalImageOk = false;
        try {
            await this.waitForImageToComplete(image);
            originalImageOk = true;
        } catch (error) {

            // If we don't care about fixing the image, we can stop here
            if (! scriptOptions.getOption('autoReplaceDeletedImages')) {
                cancel(image);
                return;
            }
        }

        // 2] Replace image with full version
        try {
            // If original image failed, we assume loading the full version will fail too
            if (! originalImageOk) {
                throw new Error('original image failed');
            }
            // Update image src with the new SRC
            image.style.objectFit = 'contain';
            image.src = newSrc;
            // Wait for new image to load
            await this.waitForImageToComplete(image);
            this.addImageButtons(image);

        } catch (error) {

            // 3] (Full failed)
            if (! scriptOptions.getOption('autoReplaceDeletedImages')) {
                // If we don't care about fixing the image, we can stop here
                originalImageOk ? restore(image) : cancel(image);
                return;
            }

            // 4] Try to get the RisiBank version
            try {
                const blob = await loadImage('https://risibank.fr/api/v1/medias/by-source?type=jvc&redirect_to=image&url=' + newSrc);
                image = this.replaceImageByBlob(id, blob);
                this.addImageButtons(image);
            } catch (error) {
                // Show back the minified version or cancel
                originalImageOk ? restore(image) : cancel(image);
                return;
            }
        }
    }

    replaceImageByBlob(id, blob) {
        const url = URL.createObjectURL(blob);
        const image = document.querySelector(`img[risibank-id="${id}"]`); // For some reason, the image reference changes after the first modifications
        image.setAttribute('src', url);
        // Return modified image
        return image;
    }

    addImageButtons(image) {
        if (! scriptOptions.getOption('addImageFavoriteButton')) {
            return;
        }
        // Add buttons
        image.parentElement.style.position = 'relative';
        image.parentElement.classList.add('risibank-image-enhancer-link');
        image.parentElement.insertAdjacentHTML('beforeend', `
            <div class="risibank-image-enhancer-buttons">
                <button class="add" title="Ajouter à mes favoris">
                    ⭐
                </button>
            </div>
        `);
        // Bind buttons
        image.parentElement.querySelector('.add').addEventListener('click', event => {
            window.open('https://risibank.fr/api/v1/medias/by-source?type=jvc&redirect_to=web-add&url=' + image.alt, '_blank');
            event.preventDefault();
            event.stopPropagation();
        });
    }
}
