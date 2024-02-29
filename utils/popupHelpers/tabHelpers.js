import { GLOBAL_CONSTANTS } from "../../constants/constants.js";
const {TAB_OPTIONS} = GLOBAL_CONSTANTS;

let TAB_ID = null;

const getCurrentWindowTabs = async () => {
    return await browser.tabs.query({currentWindow:true, active:true});
}

const setTabId = async () => {
    try {
        const tabs = await getCurrentWindowTabs();
        TAB_ID = tabs[0].id;
        TAB_ID = await browser.tabs.sendMessage(TAB_ID,{type:TAB_OPTIONS.SET_TAB_ID_IN_CONTENT_SCRIPT,TAB_ID});

    } catch(err) {
        console.error(`Error Getting/Setting Tab ID: ${err.message}`);
    }
}

export {getCurrentWindowTabs,setTabId, TAB_ID};