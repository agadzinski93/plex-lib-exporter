import { GLOBAL_CONSTANTS } from "./constants/constants.js";
import { addDomHelpers } from "./utils/domHelpers.js";
import { getStorage,setStorage,removeStorage } from "./utils/storage.js";
import { updateDownloadButton, setSortAlbumsBy, verifyDomain } from "./utils/popupHelpers/popupHelpers.js";
addDomHelpers();

const { MESSAGE_OPTIONS } = GLOBAL_CONSTANTS;

const communicationHandler = async (data, sender) => {
    let output = false;
    try {
        switch(data.type){
            case MESSAGE_OPTIONS.GET_STORAGE:
                output = await getStorage(data.id);
                break;
            case MESSAGE_OPTIONS.SET_STORAGE:
                output = await setStorage(data.id,data.data);
                break;
            case MESSAGE_OPTIONS.REMOVE_STORAGE:
                await removeStorage(data.id);
                break;
            case MESSAGE_OPTIONS.CLOSE_POPUP:
                window.close();
                break;
            case MESSAGE_OPTIONS.UPDATE_DOWNLOAD_BUTTON:
                output = await updateDownloadButton();
                break;
            case MESSAGE_OPTIONS.SET_SORT_ALBUMS_BY:
                setSortAlbumsBy(data.sortBy);
                output = data.sortBy;
                break;
            default:
        }
    } catch(err) {
        console.error(`Error with Storage: ${err.message}`);
    }
    if (output || typeof output === 'string') {
        //Works with Popup Closed...
        return Promise.resolve(output);
    }
    else {
        return Promise.reject(output);
    }
}
;(async function main(){
    browser.runtime.onMessage.addListener(communicationHandler);
    setTimeout(async ()=>{
        try {
            await verifyDomain();
        } catch(err) {
            console.error(`Popup Init Error: ${err.message}`);
        }
    },250); 
})();