const { installDefaultStyles } = require('./src/style.js');
const { scriptOptions } = require('./src/ScriptOptions.js');
const { RisiBankJVC } = require('./src/component/RisiBankJVC.js');
const { waitForFunction } = require('./src/utils.js');


async function init () {

    await scriptOptions.load();

    // Add styles
    await installDefaultStyles();

    window.addEventListener('load', async event => {

        // Wait for the body element to be available
        await waitForFunction(() => document.body);

        // Start add-on
        new RisiBankJVC();
    }, false);
}

init()
    .then(() => console.log('RisiBankJVC is ready'));
