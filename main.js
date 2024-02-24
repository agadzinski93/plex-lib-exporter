const TXT_FILE = 'txt';
const CSV_FILE = 'csv';
const JSON_FILE = 'json';
const TV_SHOW = 'tv';
const MOVIE = 'movie';
const ALBUM = 'Albums';
const TRACK = 'Tracks';
const SORT_ALPHABETIZED = 'Alphabetized';
const SORT_YEAR = 'Year';

const {GET_STORAGE,SET_STORAGE,REMOVE_STORAGE,CLOSE_POPUP,UPDATE_DOWNLOAD_BUTTON,IS_PLEX,
    SET_SORT_ALBUMS_BY} = {
    GET_STORAGE:'GET_STORAGE',
    SET_STORAGE:'SET_STORAGE',
    REMOVE_STORAGE:'REMOVE_STORAGE',
    CLOSE_POPUP:'CLOSE_POPUP',
    UPDATE_DOWNLOAD_BUTTON:'UPDATE_DOWNLOAD_BUTTON',
    IS_PLEX:'IS_PLEX',
    SET_SORT_ALBUMS_BY:'setSortAlbumsBy'
}

const ALBUM_SORT_OPTIONS = {
	TITLE:'Title',
	ALBUM_ARTIST:'Album Artist',
	YEAR:'Year',
	RELEASE_DATE:'Release Date',
	DATE_ADDED:'Date Added',
	DATE_PLAYED:'Date Played',
	PLAYES:'Plays'
}

let fetchAttempts = 0;
let fetchSuccess = false;
let previousListLength = null;
let tabId = null;
let MEDIA_TYPE = null;
let SORT_ALBUMS_BY = null;

document.createElementTree = function(element,classes = [],attributes = null, children = null, text = null){
    const el = document.createElement(element);
    if (Array.isArray(classes)) {
        for (let i = 0; i < classes.length; i++) {
            el.classList.add(classes[i]);
        }
    }
    if (attributes && typeof attributes === 'object') {
        for (const [k,v] of Object.entries(attributes)) {
            el.setAttribute(`${k}`,`${v}`);
        }
    }
    if (text) {
        el.innerHTML = text;
    }
    if (Array.isArray(children) && children.length > 0) {
        for (let i = 0; i < children.length; i++) {
            el.append(document.createElementTree(...children[i]));
        }
    }
    return el;
};

const updateDownloadButton = async () => {
    let output = false;
    const header = document.getElementById('header');
    try {
        const data = await getStorage(tabId);
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
        header.textContent = 'An error occurred.'
    }
    return output;
}

const waitForTilesToLoad = (delay, numOfTitles,checked) => new Promise((resolve, reject)=>{
    const header = document.getElementById('header');
	setTimeout(async ()=>{
		try {
            const data = await getStorage(tabId);
            let titles = JSON.parse(data);
            if (titles.length === numOfTitles || !checked) {
                await setStorage(tabId, titles);
                header.textContent = `${titles.length} item(s) found!`;
                document.getElementById('save').remove();
                document.getElementById('saveContainer').append(document.createElementTree('button',null,{id:'save'},null,'Save'));
                const handleDownload = downloadFileHandler(titles);
                document.getElementById('save').addEventListener('click',handleDownload);
                resolve(true);
            } else if (titles.length === 0) {
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

const handleStackingTitles = async (e) => {
    fetchAttempts = 0;
    fetchSuccess = false;
    const header = document.getElementById('header');
    const checked = e.target.checked;
    const numOfTitles = await browser.tabs.sendMessage(tabId,{type: 'stackTitles',repositionTitles:checked});
    let done = false;
    do {
        fetchAttempts++;
        try {
            done = await waitForTilesToLoad(250,numOfTitles,checked);
            if (!checked) done = true;
            //console.log(`Fetch #:${fetchAttempts} | Done: ${done} | Num of Titles: ${numOfTitles}`);
        } catch(err) {
            console.error(`Error Stacking Titles: ${err.message}`);
            header.textContent = `Error: Refresh the page and try again!`;
            done = true;
        }
    } while(!done && fetchAttempts < 25);
}

const chkStackTitlesChecked = async () => {
    let output = false;
    try {
        const tabs = await getCurrentWindowTabs();
        output = await browser.tabs.sendMessage(tabs[0].id,{type:'isChecked'});
    } catch(err) {
        console.error(`Error Verifying Stack Checkbox State`);
    }
    return output;
}

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
                ['option',null,null,null,TXT_FILE.toUpperCase()],
                ['option',null,null,null,CSV_FILE.toUpperCase()],
                ['option',null,null,null,JSON_FILE.toUpperCase()]
            ]],
            ['select',null,{id:'sortBy'},[
                ['option',null,null,null,'Sort by'],
                ['option',null,null,null,SORT_ALPHABETIZED],
                ['option',null,null,null,SORT_YEAR]
            ]],
        ]],
        ['div',['saveContainer'],{id:'saveContainer'},[
            ['button',null,{id:'save'},null,'Save']
        ]]
    ]));
    document.getElementById('chkStackTitles').addEventListener('click',handleStackingTitles);
    document.getElementById('chkStackTitles').checked = checked;
    if (document.getElementById('tempStyles')?.textContent) document.getElementById('chkStackTitles').checked = true;
}

const escapeDoubleQuotes = (str) => {
    return str.replaceAll('"','""');
}

const appendMovieToTxt = (entry) => {
    return `${entry.title} ${entry.year} ${entry.duration}`;
}
const appendTvShowToTxt = (entry) => {
    return `${entry.title} ${entry.year} ${entry.numOfSeasons} ${entry.avgEpisodeDuration}`;
}
const appendAlbumToTxt = (entry, thirdProperty = false) => {
    if (thirdProperty) {
        let property = SORT_ALBUMS_BY.replaceAll(' ','');
		property = property.charAt(0).toLowerCase() + property.slice(1);
        return `${entry.artist} ${entry.album} ${entry[`${property}`]}`;
    }
    else {
        return `${entry.artist} ${entry.album}`;
    }
}
const appendTrackToTxt = (entry) => {
    return `${entry.title} ${entry.albumArtist} ${entry.album} ${entry.duration}`;
}
const appendMovieToCsv = (entry) => {
    entry.title = escapeDoubleQuotes(entry.title);
    return `"${entry.title}","${entry.year}","${entry.duration}"`;
}
const appendTvShowToCsv = (entry) => {
    entry.title = escapeDoubleQuotes(entry.title);
    return `"${entry.title}","${entry.year}","${entry.numOfSeasons}","${entry.avgEpisodeDuration}"`;
}
const appendAlbumToCsv = (entry, thirdProperty = false) => {
    if (thirdProperty) {
        let property = SORT_ALBUMS_BY.replaceAll(' ','');
		property = property.charAt(0).toLowerCase() + property.slice(1);
        return `"${entry.artist}","${entry.album}","${entry[`${property}`]}"`;
    }
    else {
        return `"${entry.artist}","${entry.album}"`;
    }
}
const appendTrackToCsv = (entry) => {
    entry.title = escapeDoubleQuotes(entry.title);
    return `"${entry.title}","${entry.albumArtist}","${entry.album}","${entry.duration}"`;
}
const compareByYear = (a,b) => {
    return a.year - b.year;
}
const compareByTitles = (a,b) => {
    return new Intl.Collator('en').compare(a.title,b.title);
}
const sortTitles = (titles) => {
    let sortedTitles = titles;
    const sortBy = document.getElementById('sortBy');
    switch(sortBy.value) {
        case SORT_ALPHABETIZED:
            sortedTitles.sort(compareByTitles);
            break;
        case SORT_YEAR:
            sortedTitles.sort(compareByYear);
            break;
        default:
    }
    return sortedTitles;
}

const stringifyTitles = (titles, fileType = TXT_FILE) => {
    let output = "";
    const includeLineNumbers = document.getElementById('chkLineNumbers').checked;
    let i = 0;
    switch(fileType) {
        case TXT_FILE:
            switch(MEDIA_TYPE) {
                case MOVIE:
                    output += (includeLineNumbers) ? `# Title Year Duration\n` : `Title Year Duration\n`;
                    if (includeLineNumbers) {
                        for (const title of titles) output += `${++i} ${appendMovieToTxt(title)}\n`;
                    }
                    else {
                        for (const title of titles) output += `${appendMovieToTxt(title)}\n`;
                    }
                    break;
                case TV_SHOW:
                    if (includeLineNumbers) {
                        output += `# Title Year Number of Seasons Episode Duration\n`;
                        for (const title of titles) output += `${++i} ${appendTvShowToTxt(title)}\n`;
                    }
                    else {
                        output += `Title Year Number of Seasons Episode Duration\n`;
                        for (const title of titles) output += `${appendTvShowToTxt(title)}\n`;
                    }
                    break;
                case ALBUM:
                    if ([ALBUM_SORT_OPTIONS.TITLE,ALBUM_SORT_OPTIONS.ALBUM_ARTIST].includes(SORT_ALBUMS_BY)) {
                        if (includeLineNumbers) {
                            output += `# Artist Album\n`;
                            for (const title of titles) output += `${++i} ${appendAlbumToTxt(title)}\n`;
                        }
                        else {
                            output += 'Artist Album\n';
                            for (const title of titles) output += `${appendAlbumToTxt(title,true)}\n`;
                        }
                    }
                    else {
                        if (includeLineNumbers) {
                            output += `# Artist Album ${SORT_ALBUMS_BY}\n`;
                            for (const title of titles) output += `${++i} ${appendAlbumToTxt(title,true)}\n`;
                        }
                        else {
                            output += `Artist Album ${SORT_ALBUMS_BY}\n`;
                            for (const title of titles) output += `${appendAlbumToTxt(title,true)}\n`;
                        }
                    }
                    break;
                case TRACK:
                   if (includeLineNumbers) {
                        output += `# Title Album Artist Album Duration\n`;
                        for (const title of titles) output += `${++i} ${appendTrackToTxt(title)}\n`;
                   }
                   else {
                    output += `Title Album Artist Album Duration\n`;
                    for (const title of titles) output += `${appendTrackToTxt(title)}\n`;
                   }
                    break;
                default:
            }
            break;
        case CSV_FILE:
            switch(MEDIA_TYPE) {
                case MOVIE:
                    output += (includeLineNumbers) ? '"#","Title","Year","Duration"\n' : '"Title","Year","Duration"\n';
                    if (includeLineNumbers) {
                        for (const title of titles) output += `"${++i}",${appendMovieToCsv(title)}\n`;
                    }
                    else {
                        for (const title of titles) output += `${appendMovieToCsv(title)}\n`;
                    }
                    
                    break;
                case TV_SHOW:
                    output += (includeLineNumbers) ? '"#","Title","Year","Seasons","Episode Duration"\n' : '"Title","Year","Seasons","Episode Duration"\n';
                    if (includeLineNumbers) {
                        for (const title of titles) output += `"${++i}",${appendTvShowToCsv(title)}\n`;
                    }
                    else {
                        for (const title of titles) output += `${appendTvShowToCsv(title)}\n`;
                    }
                    break;
                case ALBUM:
                    if ([ALBUM_SORT_OPTIONS.TITLE,ALBUM_SORT_OPTIONS.ALBUM_ARTIST].includes(SORT_ALBUMS_BY)) {
                        if (includeLineNumbers) {
                            output += `"#","Artist","Album"\n`;
                            for (const title of titles) output += `"${++i}",${appendAlbumToCsv(title)}\n`;
                        }
                        else {
                            output += '"Artist","Album"\n';
                            for (const title of titles) output += `${appendAlbumToCsv(title)}\n`;
                        }
                    }
                    else {
                        if (includeLineNumbers) {
                            output += `"#","Artist","Album","${SORT_ALBUMS_BY}"\n`;
                            for (const title of titles) output += `"${++i}",${appendAlbumToCsv(title,true)}\n`;
                        }
                        else {
                            output += `"Artist","Album","${SORT_ALBUMS_BY}"\n`;
                            for (const title of titles) output += `${appendAlbumToCsv(title,true)}\n`;
                        }
                    }
                    break;
                case TRACK:
                    output += (includeLineNumbers) ? '"#","Title","Album Artist","Album","Track"\n' : '"Title","Album Artist","Album","Track"\n';
                    if (includeLineNumbers) {
                        for (const title of titles) output += `"${++i}",${appendTrackToCsv(title)}\n`;
                    }
                    else {
                        for (const title of titles) output += `${appendTrackToCsv(title)}\n`;
                    }
                    break;
                default:
            }
            break;
        case JSON_FILE:
            if (includeLineNumbers) {
                for (let i = 0; i < titles.length; i++) {
                    titles[i].id = i+1;
                }
            }
            output += JSON.stringify(titles);
            break;
        default:
    }
    return output;
}

const downloadFileHandler = (titles) => async (e) => {
    const fileType = document.getElementById('fileType').value.toLowerCase();
    const sortedTitles = sortTitles(titles);
    const data = new Blob([stringifyTitles(sortedTitles,fileType)],{type:'text/plain', endings:'native'});
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(data);
    anchor.download = `${MEDIA_TYPE}.${fileType}`;
    URL.revokeObjectURL(data);
    anchor.click();
}

const getTitles = async () => {
    const header = document.getElementById('header');
    try {
        const data = await getStorage(tabId);
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

const load = async () => {
    try {
        if (!tabId) {
            const tabs = await browser.tabs.query({currentWindow:true,active:true});
            tabId = tabs[0].id
        }
        await browser.tabs.sendMessage(tabId,{type:'updateList',MEDIA_TYPE});
        await browser.tabs.sendMessage(tabId,{type:'updateStorage'});
        setTimeout(async ()=>{
            await getTitles();
            await updateDownloadButton();
        },250);
    } catch(err) {
        console.error(`Error Loading Popup: ${err.message}`);
    }
}

const getCurrentWindowTabs = async () => {
    return await browser.tabs.query({currentWindow:true, active:true});
}

const setTabId = async () => {
    try {
        const tabs = await getCurrentWindowTabs();
        tabId = tabs[0].id;
        tabId = await browser.tabs.sendMessage(tabId,{type:'setTabIdInContent',tabId});
    } catch(err) {
        console.error(`Error Getting/Setting Tab ID: ${err.message}`);
    }
}

const pageChanged = async () => {
    return await browser.tabs.sendMessage(tabId,{type:'PAGE_CHANGED'});
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
        output = await browser.tabs.sendMessage(tabId,{type:IS_PLEX});
    } catch(err) {
        console.error(`Error verifying tab is plex: ${err.message}`);
    }
    return output;
}

const verifyDomain = async () => {
    let response = false;
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
                response = true;
                if (await pageChanged()) {
                    removeStorage(tabId);
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

const getStorage = async (id) => {
    let output = "";
    try {
        const data = await browser.storage.session.get();
        if (data[`${id}`]) output = data[`${id}`];
    } catch(err) {
        console.error(`Background Error Getting Storage: ${err.message}`);
        output = null;
    }
    return output;
}
const setStorage = async (id, data) => {
    let success = false;
    try {
        const obj = {};
        obj[`${id}`] = data;
        await browser.storage.session.set(obj);
        success = true;
    } catch(err) {
        console.error(`Background Error Setting Storage: ${err.message}`);
    }
    return success;
}
const removeStorage = async (id) => {
    await browser.storage.session.remove(`${id}`);
}

const communicationHandler = async (data, sender) => {
    let output = false;
    try {
        switch(data.type){
            case GET_STORAGE:
                output = await getStorage(data.id);
                break;
            case SET_STORAGE:
                output = await setStorage(data.id,data.data);
                break;
            case REMOVE_STORAGE:
                await removeStorage(data.id);
                break;
            case CLOSE_POPUP:
                window.close();
                break;
            case UPDATE_DOWNLOAD_BUTTON:
                output = await updateDownloadButton();
                break;
            case SET_SORT_ALBUMS_BY:
                SORT_ALBUMS_BY = data.sortBy;
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