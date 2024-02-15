const {GET_STORAGE,SET_STORAGE,REMOVE_STORAGE,CLOSE_POPUP,CLOSE_POPUP_FROM_CONTENT} = {
    GET_STORAGE:'GET_STORAGE',
    SET_STORAGE:'SET_STORAGE',
    REMOVE_STORAGE:'REMOVE_STORAGE',
    CLOSE_POPUP:'CLOSE_POPUP',
    CLOSE_POPUP_FROM_CONTENT:'CLOSE_POPUP_FROM_CONTENT'
}

const getStorage = async (id) => {
    return browser.storage.session.get().then((data)=>{
        return data[`${id}`];
    });
}
const setStorage = async (id, data) => {
    const obj = {};
    obj[`${id}`] = data;
    return await browser.storage.session.set(obj);
}
const removeStorage = async (id) => {
    return await browser.storage.session.remove(`${id}`);
}

const communicationHandler = async (data, sender) => {
    let output = false;
    try {
        switch(data.type){
            case GET_STORAGE:
                output = await getStorage(data.id);
                break;
            case SET_STORAGE:
                await setStorage(data.id,data.data);
                break;
            case REMOVE_STORAGE:
                await removeStorage(data.id);
                break;
            case CLOSE_POPUP_FROM_CONTENT:
                try {
                    await browser.runtime.sendMessage({type:CLOSE_POPUP});
                } catch(err) {
                    console.warn('Popup is not open');
                }
                break;
            default:
        }
    } catch(err) {
        console.error(`Error with Storage: ${err.message}`);
    }
    if (output) {
        return Promise.resolve(output);
    }
    else {
        return Promise.reject(output);
    }
}

;(function init(){
    browser.runtime.onMessage.addListener(communicationHandler);
})();