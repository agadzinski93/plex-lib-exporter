const TV_SHOW = 'tv';
const MOVIE = 'movie';

const {GET_STORAGE,SET_STORAGE,REMOVE_STORAGE,CLOSE_POPUP,UPDATE_DOWNLOAD_BUTTON} = {
    GET_STORAGE:'GET_STORAGE',
    SET_STORAGE:'SET_STORAGE',
    REMOVE_STORAGE:'REMOVE_STORAGE',
	CLOSE_POPUP:'CLOSE_POPUP',
	UPDATE_DOWNLOAD_BUTTON:'UPDATE_DOWNLOAD_BUTTON'
}

let titlesList = new Array();
let observerAdded = false;
let tabId = null;
let chkStackTitlesChecked = false;
let pageChanged = false;

const insertTvShow = (list, entry) => {
	list.push(new Object({
		title:entry.children[0].children[0].textContent,
		year:(entry.children[1]?.children[0]?.textContent) ? entry.children[1].children[0].textContent : null,
		numOfSeasons:(entry.children[1]?.children[2]?.textContent) ? entry.children[1]?.children[2]?.textContent : null,
		avgEpisodeDuration:(entry.children[1]?.children[4]?.textContent) ? entry.children[1].children[4].textContent : null
	}));
}

const insertMovie = (list, entry) => {
	list.push(new Object({
		title:entry.children[0].children[0].textContent,
		year:(entry.children[1]?.children[0]?.textContent) ? entry.children[1].children[0].textContent : null,
		duration:(entry.children[1]?.children[2]?.textContent) ? entry.children[1].children[2].textContent : null
	}));
}

/**
 * @param {Array} list
 * @param {object} entry
 * @returns {boolean}
 */
const entryExists = (list, entry, mediaType) => {
	let found = false;
	let i = 0;
	let title,
		year;
	switch(mediaType) {
		case TV_SHOW:
			title = entry.children[0].children[0].textContent;
			year = (entry.children[1]?.children[0]?.textContent) ? entry.children[1].children[0].textContent : null;
			const numOfSeasons = (entry.children[1]?.children[2]?.textContent) ? entry.children[1]?.children[2]?.textContent : null;
			const avgEpisodeDuration = (entry.children[1]?.children[4]?.textContent) ? entry.children[1].children[4].textContent : null;
			while(i < list.length && !found) {
				if (title === list[i].title &&
					year === list[i].year &&
					numOfSeasons === list[i].numOfSeasons &&
					avgEpisodeDuration === list[i].avgEpisodeDuration) {
						found = true;
				}
				i++;
			}
			break;
		case MOVIE:
			title = entry.children[0].children[0].textContent;
			year = (entry.children[1]?.children[0]?.textContent) ? entry.children[1].children[0].textContent : null;
			const duration = (entry.children[1]?.children[2]?.textContent) ? entry.children[1].children[2].textContent : null;
			while(i < list.length && !found) {
				if (title === list[i].title &&
					year === list[i].year &&
					duration === list[i].duration) {
						found = true;
				}
				i++;
			}
			break;
		default:
	}
	return found;
}
/**
 * 
 * @param {object} entry 
 * @param {object} prevEntry 
 * @returns {boolean}
 */
const entriesMatch = (entry, prevEntry) => {
	if (!entry || !prevEntry) return false;
	return (entry.children[0].children[0].textContent === prevEntry.children[0].children[0].textContent);
}

const getMediaType = (entry) => {
	let output = "";
	if (entry.children[1].children[2].textContent.includes('min')) {
		output = MOVIE;
	}
	else if (entry.children[1].children[2].textContent.includes('season')) {
		output = TV_SHOW;
	}
	return output;
}

const addObserverMutation = () => {
	const targetNode = document.querySelector('[class^=DirectoryListPageContent-pageContentScroller] > div');
	const config = {childList:true};
	let prevLastElement = null;
	const callback = async (mutationList, observer) => {
		for (const mutation of mutationList) {
			if (mutation.type === 'childList') {
				try {
					const cells = document.querySelectorAll("[class^=MetadataDetailsRow-titlesContainer]");
					let mediaType = getMediaType(cells[0]);
					if (!entriesMatch(cells[cells.length-1],prevLastElement)) {
						for (const [index,cell] of cells.entries()) {
							if (!entryExists(titlesList,cell, mediaType)) {
								if (mediaType === MOVIE) {
									insertMovie(titlesList, cell);
								}
								else if (mediaType === TV_SHOW) {
									insertTvShow(titlesList, cell);
								}
							}
						}
					}
					prevLastElement = cells[cells.length-1];
				} catch(err) {
					console.error(`Error retrieving tab's storage: ${err.message}`);
				}
			}
		}
		try {
			await browser.runtime.sendMessage({type:SET_STORAGE,id:tabId,data:JSON.stringify(titlesList)});
			await browser.runtime.sendMessage({type:UPDATE_DOWNLOAD_BUTTON});
			
		} catch(err) {
			//Popup is not open. That's Okay!
		}
	}
	const observer = new MutationObserver(callback);
	observer.observe(targetNode, config);
}

const updateList = async () => {
	let output = null;
	const elements = document.querySelectorAll('[class^=MetadataDetailsRow-titlesContainer]');
	let mediaType = getMediaType(elements[0]);
	try {
		for (const el of elements) {
			if (!entryExists(titlesList,el,mediaType)) {
				if (mediaType === MOVIE) {
					insertMovie(titlesList, el);
				}
				else if (mediaType === TV_SHOW) {
					insertTvShow(titlesList, el);
				}
			}
		}
		output = titlesList;
	} catch(err) {
		console.error(`Error retrieving tab's storage: ${err.message}`);
	}
	return output;
}

const updateStorage = async () => {
	let output = false;
	try {
		await browser.runtime.sendMessage({type:SET_STORAGE,id:tabId,data:JSON.stringify(titlesList)});
		output = true;
	} catch(err) {
		console.error(`Error Updating Storage: ${err.message}`);
	}
	return output;
}

const getTotalTitles = () => {
	return document.querySelector('[class^=PageHeaderLeft-pageHeaderLeft] > span[class^=PageHeaderBadge-badge]')?.textContent;
}

const repositionTitles = () => {
	chkStackTitlesChecked = true;
	const css = '[class^=ListRow] {top:0 !important; left:0 !important}';
	document.getElementById('tempStyles').textContent = css;
	document.querySelector('[class^=DirectoryListPageContent-listContainer] > div:first-child').style.removeProperty('display');
}

const revertTitles = () => {
	chkStackTitlesChecked = false;
	document.getElementById('tempStyles').textContent = '';
	document.querySelector('[class^=DirectoryListPageContent-listContainer] > div:first-child').style.display = 'contents';
	titlesList = new Array();
}

const createStylesheet = () => {
	if (!document.getElementById('tempStyles')) {
		const stylesheet = document.createElement('style');
		stylesheet.setAttribute('rel','stylesheet');
		stylesheet.setAttribute('id','tempStyles');
		document.getElementsByTagName('head')[0].append(stylesheet);
	}
}

const awaitUpdate = delay => new Promise((resolve, reject)=>{
	setTimeout(async ()=>{
		const res = await updateList();
		await updateStorage();
		if (Array.isArray(res)) {
			resolve(true);
		}
		else {
			reject(false);
		}
	},delay);
});

const clearStorage = async () => {
	try {
		if (tabId) await browser.runtime.sendMessage({type:REMOVE_STORAGE,id:tabId});
	} catch(err) {
		//Popup Not Loaded
	}
}

const messageHandler = async (data, sender) => {
	let response = null;
	switch(data.type) {
		case 'setTabIdInContent':
			if (!tabId) tabId = data.tabId;
			response = tabId;
			break;
		case 'updateList':
			if (!observerAdded) {
				observerAdded = true;
				addObserverMutation();
			}
			createStylesheet();
			await updateList();
			break;
		case 'updateStorage':
			response = await updateStorage();
			break;
		case 'stackTitles':
			await clearStorage();
			if (data.repositionTitles) {
				repositionTitles();
			}
			else {
				revertTitles();
			}
			const numOfTitles = getTotalTitles();
			if (numOfTitles) response = parseInt(numOfTitles);
			await awaitUpdate(250);
			break;
		case 'isChecked':
			response = chkStackTitlesChecked;
			break;
		case 'CLOSE_POPUP':
            data.window.close();
            break;
		case 'PAGE_CHANGED':
			if (pageChanged) {
				response = pageChanged;
				titlesList = new Array();
				pageChanged = false;
			}
			break;
		default:
	}
	return Promise.resolve(response);
}

const init = async () => {
	pageChanged = true;
	setTimeout(async()=>{
		observerAdded = false;
		createStylesheet();
		addObserverMutation();
		await updateList();
	},500);
}

;(function main(){
	pageChanged = true;
	observerAdded = false;
	browser.runtime.onMessage.addListener(messageHandler);
	window.addEventListener('hashchange',init);
})();