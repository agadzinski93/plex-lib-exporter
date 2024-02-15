const TXT_FILE = 'txt';
const CSV_FILE = 'csv';
const JSON_FILE = 'json';
const TV_SHOW = 'tv';
const MOVIE = 'movie';

const {GET_STORAGE,SET_STORAGE} = {
    GET_STORAGE:'GET_STORAGE',
    SET_STORAGE:'SET_STORAGE',
    REMOVE_STORAGE:'REMOVE_STORAGE'
}

let fetchAttempts = 0;
let fetchSuccess = false;
let previousListLength = null;
let tabId = null;

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

const updateDownloadButton = () => {
    browser.runtime.sendMessage({type:GET_STORAGE,id:tabId},(data)=>{
        let titles = JSON.parse(data);
        if (titles.length > 0) {
            header.textContent = `${titles.length} item(s) found!`;
            document.getElementById('save').remove();
            document.getElementById('selectAndSubmit').append(document.createElementTree('button',null,{id:'save'},null,'Save'));
            const handleDownload = downloadFileHandler(titles);
            document.getElementById('save').addEventListener('click',handleDownload);
        } else {
            header.textContent = 'No items found.'
        }
    });
}

const handleStackingTitles = (e) => {
    const header = document.getElementById('header');
    const checked = e.target.checked;
    if (fetchAttempts < 10) {
        browser.tabs.sendMessage(tabId,{type: 'stackTitles',repositionTitles:checked},(response)=>{
            browser.runtime.sendMessage({type:GET_STORAGE,id:tabId},(data)=>{
                let titles = JSON.parse(data);
                if (titles.length > 0) {
                    header.textContent = `${titles.length} item(s) found!`;
                    document.getElementById('save').remove();
                    document.getElementById('selectAndSubmit').append(document.createElementTree('button',null,{id:'save'},null,'Save'));
                    const handleDownload = downloadFileHandler(titles);
                    document.getElementById('save').addEventListener('click',handleDownload);
                } else {
                    header.textContent = 'No items found.'
                }
                if ((!checked) || typeof previousListLength === 'number' && titles.length === previousListLength) {
                    fetchSuccess = true;
                    previousListLength = null;
                }
                else {
                    fetchAttempts++;
                    previousListLength = titles.length;
                    if (!fetchSuccess) {
                        setTimeout(()=>{
                            handleStackingTitles(e);
                        },250);
                    }
                }
            },(err)=>{
                fetchAttempts++;
                if (!fetchSuccess) {
                    setTimeout(()=>{
                        handleStackingTitles(e);
                    },250);
                }
            });
        });
    }
    else if (fetchAttempts === 10 && !fetchSuccess) {
        header.textContent = `Error: Refresh the page and try again!`;
    }
}

const chkStackTitlesChecked = async () => {
    let output = false;
    try {
        const tabs = await getCurrentWindowTabs();
        output = await browser.tabs.sendMessage(tabs[0].id,{type:'isChecked'});
    } catch(err) {
        console.error(`Error Verifying Stack Checkbox State`);
    }
    console.log(output);
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

const getMediaType = (entry) => {
    let output = MOVIE;
    if (entry.hasOwnProperty('numOfSeasons')) {
        output = TV_SHOW;
    }
    return output;
}

const appendMovieToTxt = (entry) => {
    return `${entry.title} ${entry.year} ${entry.duration}`;
}
const appendTvShowToTxt = (entry) => {
    return `${entry.title} ${entry.year} ${entry.numOfSeasons} ${entry.avgEpisodeDuration}`;
}
const appendMovieToCsv = (entry) => {
    entry.title = escapeDoubleQuotes(entry.title);
    return `"${entry.title}","${entry.year}","${entry.duration}"`;
}
const appendTvShowToCsv = (entry) => {
    entry.title = escapeDoubleQuotes(entry.title);
    return `"${entry.title}","${entry.year}","${entry.numOfSeasons}","${entry.avgEpisodeDuration}"`;
}

/*
    Add options for: sorting by title/year
*/

const stringifyTitles = (titles, fileType = TXT_FILE) => {
    let output = "";
    const includeLineNumbers = document.getElementById('chkLineNumbers').checked;
    const mediaType = getMediaType(titles[0]);
    let i = 0;
    switch(fileType) {
        case TXT_FILE:
            switch(mediaType) {
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
                default:
            }
            break;
        case CSV_FILE:
            switch(mediaType) {
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
    const data = new Blob([stringifyTitles(titles,fileType)],{type:'text/plain', endings:'native'});
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(data);
    anchor.download = `titles.${fileType}`;
    URL.revokeObjectURL(data);
    anchor.click();
}

const getTitles = async () => {
    const header = document.getElementById('header');
    try {
        const data = await browser.runtime.sendMessage({type:GET_STORAGE,id:tabId});
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

const load = () => {
    browser.tabs.query({active:true,currentWindow:true},(tabs)=>{
        browser.tabs.sendMessage(tabId,{type:'updateList'},(response)=>{
            setTimeout(async ()=>{
                await getTitles();
                browser.runtime.onMessage.addListener(updateDownloadButton);
            },250);
        });
    });
}

const verifyDomain = async () => {
    await browser.tabs.query({active:true,currentWindow:true},async (tabs)=>{
        await browser.tabs.sendMessage(tabs[0].id,{type:'verifyDomain'},(response)=>{
            if (response) {
                load();
            }
            else {
                document.getElementById('header').textContent = `Unsupported URL. Make sure you're on localhost, 127.0.0.1, or app.plex.tv`;
            }
        });
    });
}

const getCurrentWindowTabs = () => {
    return browser.tabs.query({currentWindow:true, active:true});
}

const setTabId = () => {
    getCurrentWindowTabs().then((tabs)=>{
        tabId = tabs[0].id;
        browser.tabs.sendMessage(tabId,{type:'setTabIdInContent',tabId},(response)=>{
            tabId = response;
        });
    })
}

const setCloseHandler = (data,sender) => {
    switch(data.type) {
        case 'CLOSE_POPUP':
            window.close();
            break;
        default:
    }
}

;(function main(){
    setTimeout(()=>{
        try {
            verifyDomain();
            browser.runtime.onMessage.addListener(setCloseHandler);
            if (document.readyState !== 'loading') {
                setTabId();
            }
            else {
                document.addEventListener('DOMContentLoaded',setTabId);
            }
        } catch(err) {
            console.error(`Popup Error: ${err.message}`);
        }
    },250); 
})();