const TV_SHOW = 'tv';
const MOVIE = 'movie';

const {GET_STORAGE,SET_STORAGE,REMOVE_STORAGE,CLOSE_POPUP_FROM_CONTENT} = {
    GET_STORAGE:'GET_STORAGE',
    SET_STORAGE:'SET_STORAGE',
    REMOVE_STORAGE:'REMOVE_STORAGE',
	CLOSE_POPUP_FROM_CONTENT:'CLOSE_POPUP_FROM_CONTENT'
}

let observerAdded = false;
let tabId = null;
let chkStackTitlesChecked = false;

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
	const callback = (mutationList, observer) => {
		for (const mutation of mutationList) {
			if (mutation.type === 'childList') {
				//Send Message to Popup
				browser.runtime.sendMessage({type:GET_STORAGE,id:tabId},(data)=>{
					let list = JSON.parse(data);
					const cells = document.querySelectorAll("[class^=MetadataDetailsRow-titlesContainer]");
					let mediaType = getMediaType(cells[0]);
					if (!entriesMatch(cells[cells.length-1],prevLastElement)) {
						for (const cell of cells) {
							if (!entryExists(list,cell, mediaType)) {
								if (mediaType === MOVIE) {
									insertMovie(list, cell);
								}
								else if (mediaType === TV_SHOW) {
									insertTvShow(list, cell);
								}
								browser.runtime.sendMessage({type:SET_STORAGE,id:tabId,data:JSON.stringify(list)},(response)=>{

								});
							}
						}
					}
					prevLastElement = cells[cells.length-1];
				});
			}
		}
	}
	const observer = new MutationObserver(callback);
	observer.observe(targetNode, config);
}

const updateList = async () => {
	let list = Array();
	const elements = document.querySelectorAll('[class^=MetadataDetailsRow-titlesContainer]');
	let mediaType = getMediaType(elements[0]);
	await browser.runtime.sendMessage({type:GET_STORAGE,id:tabId},async (data)=>{
		if (data) list = JSON.parse(data);
		for (const el of elements) {
			if (!entryExists(list,el,mediaType)) {
				if (mediaType === MOVIE) {
					insertMovie(list, el);
				}
				else if (mediaType === TV_SHOW) {
					insertTvShow(list, el);
				}
			}
		}
		await browser.runtime.sendMessage({type:SET_STORAGE,id:tabId,data:JSON.stringify(list)},(response)=>{
			return list;
		});
	});
}

const repositionTitles = () => {
	const css = '[class^=ListRow] {top:0 !important; left:0 !important}';
	document.getElementById('tempStyles').textContent = css;
	document.querySelector('[class^=DirectoryListPageContent-listContainer] > div:first-child').style.removeProperty('display');
	chkStackTitlesChecked = true;
}

const revertTitles = () => {
	document.getElementById('tempStyles').textContent = '';
	document.querySelector('[class^=DirectoryListPageContent-listContainer] > div:first-child').style.display = 'contents';
	chkStackTitlesChecked = false;
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
		case 'verifyDomain':
			const localhostIp = /127\.0\.0\.1/;
			const localhost = /localhost/;
			const plexUrl = /app\.plex\.tv\//;
			const url = location.href;
			if (localhostIp.test(url) || localhost.test(url) || plexUrl.test(url)) {
				response = true;
			}
			else {
				response = false;
			}
			break;
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
		case 'stackTitles':
			await clearStorage();
			if (data.repositionTitles) {
				repositionTitles();
			}
			else {
				revertTitles();
			}
			await awaitUpdate(250);
			break;
		case 'isChecked':
			response = chkStackTitlesChecked;
			break;
		default:
	}
	return Promise.resolve(response);
}

const closePopup = async () => {
	try {
		await browser.runtime.sendMessage({type:CLOSE_POPUP_FROM_CONTENT});
	} catch(err) {
		//Popup is not open
	}
}

const init = async () => {
	closePopup();
	observerAdded = false;
	clearStorage();
	createStylesheet();
	addObserverMutation();
	await updateList();
}

;(async function init(){
	await closePopup();
	observerAdded = false;
	browser.runtime.onMessage.addListener(messageHandler);
	window.addEventListener('hashchange',init);
	clearStorage();
})();