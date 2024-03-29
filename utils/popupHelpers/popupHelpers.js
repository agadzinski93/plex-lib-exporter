import { GLOBAL_CONSTANTS } from "../../constants/constants.js";
import { sortTitles } from "../titleHelpers/sortTitles.js";
import { stringifyTitles } from "../titleHelpers/stringifyTitles.js";
import { getStorage,setStorage,removeStorage } from "../storage.js";
import { getCurrentWindowTabs, setTabId, TAB_ID } from "./tabHelpers.js";

const {
    ALBUM_SORT_OPTIONS,
    FILE_TYPES,
    TAB_OPTIONS
} = GLOBAL_CONSTANTS;

let fetchAttempts = 0;
let MEDIA_TYPE = null;
let SORT_ALBUMS_BY = null;

const createDownloadButton = async () => {
    const checked = await chkStackTitlesChecked();
    document.querySelector('main').append(document.createElementTree('div',['textAlignCenter'],{id:'successContainer'},[
        ['div',['chkContainer'],null,[
            ['input',null,{id:'chkStackTitles',type:'checkbox',value:'Stack Titles'},null,null],
            ['label',null,{for:'chkStackTitles'},null,'Stack Titles (avoids the need to scroll)'],
        ]],
        ['div',['chkContainer'],null,[
            ['input',null,{id:'chkLineNumbers',type:'checkbox',value:'Line Numbers'},null,null],
            ['label',null,{for:'chkLineNumbers'},null,'Include Line Numbers']
        ]],
        ['div',['selectAndSubmit'],{id:'selectAndSubmit'},[
            ['select',null,{id:'fileType'},[
                ['option',null,null,null,FILE_TYPES.TXT_FILE.toUpperCase()],
                ['option',null,null,null,FILE_TYPES.CSV_FILE.toUpperCase()],
                ['option',null,null,null,FILE_TYPES.JSON_FILE.toUpperCase()]
            ]],
            ['select',null,{id:'sortBy'},[
                ['option',null,null,null,'Sort by'],
                ['option',null,null,null,ALBUM_SORT_OPTIONS.TITLE],
                ['option',null,null,null,ALBUM_SORT_OPTIONS.YEAR]
            ]],
        ]],
        ['div',['saveContainer'],{id:'saveContainer'},[
            ['button',null,{id:'save'},null,'Save']
        ]]
    ]));
    document.getElementById('chkStackTitles').addEventListener('change',handleStackingTitles);
    document.getElementById('chkStackTitles').checked = checked;
    if (document.getElementById('tempStyles')?.textContent) document.getElementById('chkStackTitles').checked = true;
}

const chkStackTitlesChecked = async () => {
    let output = false;
    try {
        const tabs = await getCurrentWindowTabs();
        output = await browser.tabs.sendMessage(tabs[0].id,{type:TAB_OPTIONS.IS_CHECKED});
    } catch(err) {
        console.error(`Error Verifying Stack Checkbox State`);
    }
    return output;
}

const downloadFileHandler = (titles) => async (e) => {
    const fileType = document.getElementById('fileType').value.toLowerCase();
    const sortedTitles = sortTitles(titles);
    const data = new Blob([stringifyTitles(sortedTitles,MEDIA_TYPE,SORT_ALBUMS_BY,fileType)],{type:'text/plain', endings:'native'});
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(data);
    anchor.download = `${MEDIA_TYPE}.${fileType}`;
    URL.revokeObjectURL(data);
    anchor.click();
}

const getTitles = async (mediaType) => {
    MEDIA_TYPE = mediaType;
    const header = document.getElementById('header');
    try {
        const data = await getStorage(TAB_ID);
        const successContainer = document.getElementById('successContainer')
        if (successContainer) successContainer.remove();
        let titles = (data) ? JSON.parse(data): new Array();
        if (titles.length > 0) {
            header.textContent = `${titles.length} item(s) found!`;
            await createDownloadButton();
            const handleDownload = downloadFileHandler(titles);
            document.getElementById('save').addEventListener('click',handleDownload);
        } else {
            header.textContent = 'No items found.'
        }
    } catch(err) {
        header.textContent = `Error: ${err.message}`;
    }
}

const handleStackingTitles = async (e) => {
    document.getElementById('chkStackTitles').disabled = true;
    const header = document.getElementById('header');
    header.textContent = 'Loading...'
    const checked = e.target.checked;
    const MAX_ATTEMPTS = 30;
    fetchAttempts = 0;
    const numOfTitles = await browser.tabs.sendMessage(TAB_ID,{type:TAB_OPTIONS.STACK_TITLES,repositionTitles:checked});
    let done = false;
    do {
        fetchAttempts++;
        try {
            done = await waitForTilesToLoad(250,{numOfTitles,checked,fetchAttempts});
            if (!checked) done = true;
        } catch(err) {
            console.error(`Error Stacking Titles: ${err.message}`);
            header.textContent = `Error: Refresh the page and try again!`;
            done = true;
        }
    } while(!done && fetchAttempts < MAX_ATTEMPTS);
    await updateDownloadButton();
    document.getElementById('chkStackTitles').disabled = false;
}

const updateDownloadButton = async () => {
    let output = false;
    const header = document.getElementById('header');
    try {
        const data = await getStorage(TAB_ID);
        let titles = JSON.parse(data);
        if (titles.length > 0) {
            header.textContent = `${titles.length} item(s) found!`;
            document.getElementById('save').remove();
            document.getElementById('saveContainer').append(document.createElementTree('button',null,{id:'save'},null,'Save'));
            const handleDownload = downloadFileHandler(titles);
            document.getElementById('save').addEventListener('click',handleDownload);
        } else {
            header.textContent = 'No items found.'
        }
        output = true;
    } catch(err) {
        header.textContent = 'An error occurred.';
    }
    return output;
}

const waitForTilesToLoad = (delay, {numOfTitles,checked, fetchAttempts}) => new Promise((resolve, reject)=>{
    const header = document.getElementById('header');
	setTimeout(async ()=>{
		try {
            await browser.tabs.sendMessage(TAB_ID,{type:TAB_OPTIONS.UPDATE_LIST,MEDIA_TYPE});
            await browser.tabs.sendMessage(TAB_ID,{type:TAB_OPTIONS.UPDATE_STORAGE});
            const data = await getStorage(TAB_ID);
            let titles = (data) && JSON.parse(data);
            if (data && (titles.length === numOfTitles || !checked)) {
                await setStorage(TAB_ID, titles);
                await updateDownloadButton();
                resolve(true);
            } else if (titles.length === 0 && fetchAttempts > 1) {
                header.textContent = 'No items found.'
                resolve(true);
            } else {
                resolve(false);
            }
        } catch(err) {
            reject(err);
        }
	},delay);
});

const setSortAlbumsBy = (sortAlbumsBy) => {
    SORT_ALBUMS_BY = sortAlbumsBy;
}

const load = async () => {
    try {
        if (!TAB_ID) {
            const tabs = await browser.tabs.query({currentWindow:true,active:true});
            TAB_ID = tabs[0].id
        }
        await browser.tabs.sendMessage(TAB_ID,{type:TAB_OPTIONS.UPDATE_LIST,MEDIA_TYPE});
        await browser.tabs.sendMessage(TAB_ID,{type:TAB_OPTIONS.UPDATE_STORAGE});
        setTimeout(async ()=>{
            await getTitles(MEDIA_TYPE, SORT_ALBUMS_BY);
            await updateDownloadButton(SORT_ALBUMS_BY);
        },250);
    } catch(err) {
        console.error(`Error Loading Popup: ${err.message}`);
    }
}

const pageChanged = async () => {
    return await browser.tabs.sendMessage(TAB_ID,{type:TAB_OPTIONS.PAGE_CHANGED});
}
const displayMessage = (msg) => {
    document.getElementById('header').textContent = msg;
}
const isPagePlex = (result) => {
    let output = true;
    if (!result.isPlex || !result.isScannablePage) {
        displayMessage(result.msg);
        output = false;
    }
    else {
        MEDIA_TYPE = result.mediaType;
    }
    return output;
}
const verifyTabIsPlex = async () => {
    let output = null;
    try {
        output = await browser.tabs.sendMessage(TAB_ID,{type:TAB_OPTIONS.IS_PLEX});
    } catch(err) {
        console.error(`Error verifying tab is plex: ${err.message}`);
    }
    return output;
}

const verifyDomain = async () => {
    try {
        const tabs = await browser.tabs.query({active:true,currentWindow:true});
        const url = tabs[0].url;
        const allowableDomains = [
            /127\.0\.0\.1/,
            /localhost/,
            /app\.plex\.tv\//
        ];
        if (allowableDomains.some(reg=>reg.test(url))) {
            await setTabId();
            if (isPagePlex(await verifyTabIsPlex())) {
                if (await pageChanged()) {
                    removeStorage(TAB_ID);
                }
                await load();
            }
        }
        else {
            document.getElementById('header').textContent = `Unsupported URL. Make sure you're on localhost, 127.0.0.1, or app.plex.tv`;
        }
    } catch(err) {
        console.error(`Error verifying domain: ${err.message}`);
    }
}

export {downloadFileHandler, updateDownloadButton, getTitles, verifyDomain, setSortAlbumsBy};