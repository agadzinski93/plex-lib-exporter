const getStorage = async (id) => {
    let output = "";
    try {
        const data = await browser.storage.session.get();
        if (data[`${id}`]) output = data[`${id}`];
    } catch(err) {
        console.error(`Error Getting Storage: ${err.message}`);
        output = null;
    }
    return output;
}
const setStorage = async (id, data) => {
    let success = false;
    try {
        const obj = {};
        obj[`${id}`] = (typeof data === 'string') ? data : JSON.stringify(data);
        await browser.storage.session.set(obj);
        success = true;
    } catch(err) {
        console.error(`Error Setting Storage: ${err.message}`);
    }
    return success;
}
const removeStorage = async (id) => {
    await browser.storage.session.remove(`${id}`);
}

export {getStorage,setStorage,removeStorage};