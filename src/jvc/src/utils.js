

export const wait = delayMs => new Promise(resolve => setTimeout(resolve, delayMs));


export const waitForFunction = async (fn, timeout) => {
    const POOL_TIMEOUT = timeout || (2 * 1000);
    const POOL_DELAY = 50;
    const POOL_COUNT = POOL_TIMEOUT / POOL_DELAY;
    let result = fn();
    let index = 0;
    while (! result && index < POOL_COUNT) {
        result = fn();
        await wait(POOL_DELAY);
        ++ index;
    }
    return result;
};

export function getSelectors(pageType) {
    let submitButtonSelector;
    let contentSelector;
    if (pageType === 'web') {
        submitButtonSelector = '.btn.btn-poster-msg';
        contentSelector = '#message_topic';
    } else if (pageType === 'mp') {
        submitButtonSelector = '.btn.btn-poster-msg';
        contentSelector = '#message';
    } else if (pageType === 'mobile') {
        submitButtonSelector = '.sub-form-fmobile';
        contentSelector = '.area-form-fmobile';
    } else {
        return null;
    }
    return { submitButtonSelector, contentSelector };
}
