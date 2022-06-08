

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
