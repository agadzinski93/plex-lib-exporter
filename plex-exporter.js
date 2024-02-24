const TV_SHOW = 'tv';
const MOVIE = 'movie';
const ALBUM = 'Albums';
const TRACK = 'Tracks';

const {GET_STORAGE,SET_STORAGE,REMOVE_STORAGE,CLOSE_POPUP,UPDATE_DOWNLOAD_BUTTON,IS_PLEX} = {
    GET_STORAGE:'GET_STORAGE',
    SET_STORAGE:'SET_STORAGE',
    REMOVE_STORAGE:'REMOVE_STORAGE',
	CLOSE_POPUP:'CLOSE_POPUP',
	UPDATE_DOWNLOAD_BUTTON:'UPDATE_DOWNLOAD_BUTTON',
	IS_PLEX:'IS_PLEX'
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

let TITLES_LIST = new Array();
let MEDIA_TYPE = null;
let OBSERVER_ADDED = false;
let tabId = null;
let chkStackTitlesChecked = false;
let PAGE_CHANGED = false;
let SORT_ALBUMS_BY = null;

const insertTvShow = (entry) => {
	TITLES_LIST.push(new Object({
		title:entry.children[0].children[0].textContent,
		year:(entry.children[1]?.children[0]?.textContent) ? entry.children[1].children[0].textContent : null,
		numOfSeasons:(entry.children[1]?.children[2]?.textContent) ? entry.children[1]?.children[2]?.textContent : null,
		avgEpisodeDuration:(entry.children[1]?.children[4]?.textContent) ? entry.children[1].children[4].textContent : null
	}));
}

const insertMovie = (entry) => {
	TITLES_LIST.push(new Object({
		title:entry.children[0].children[0].textContent,
		year:(entry.children[1]?.children[0]?.textContent) ? entry.children[1].children[0].textContent : null,
		duration:(entry.children[1]?.children[2]?.textContent) ? entry.children[1].children[2].textContent : null
	}));
}

const insertAlbum = (entry) => {
	if ([ALBUM_SORT_OPTIONS.TITLE,ALBUM_SORT_OPTIONS.ALBUM_ARTIST].includes(SORT_ALBUMS_BY)) {
		TITLES_LIST.push(new Object({
			artist:entry.children[1].getAttribute('title'),
			album:(entry.children[2]?.getAttribute('title')) ? entry.children[2].getAttribute('title') : null
		}));
	}
	else {
		let property = SORT_ALBUMS_BY.replaceAll(' ','');
		property = property.charAt(0).toLowerCase() + property.slice(1);
		TITLES_LIST.push(new Object({
			artist:entry.children[1].getAttribute('title'),
			album:(entry.children[2]?.getAttribute('title')) ? entry.children[2].getAttribute('title') : null,
			[property]:(entry.children[3]?.textContent) ? entry.children[3].textContent : null
		}));
	}
}

const insertTrack = (entry) => {
	TITLES_LIST.push(new Object({
		title:entry.children[2].children[0].textContent,
		albumArtist:(entry.children[3]?.children[0]?.textContent) ? entry.children[3].children[0].textContent : null,
		album:(entry.children[4]?.children[0]?.textContent) ? entry.children[4].children[0].textContent : null,
		duration:(entry.children[5]?.children[0]?.textContent) ? entry.children[5].children[0].textContent : null
	}));
}

const setSortAlbumsBy = async () => {
	const sortOption = document.querySelector('[class^=PageHeaderLeft-pageHeaderLeft] > button:nth-child(3)');
	const optionText = sortOption.textContent;
	if (Object.values(ALBUM_SORT_OPTIONS).includes(optionText.substring('By '.length))) {
		SORT_ALBUMS_BY = optionText.substring('By '.length);
	} 
	else {
		SORT_ALBUMS_BY = ALBUM_SORT_OPTIONS.TITLE
	}
	await browser.runtime.sendMessage({type:'setSortAlbumsBy',sortBy:SORT_ALBUMS_BY});
}

/**
 * @param {Array} list
 * @param {object} entry
 * @returns {boolean}
 */
const entryExists = (entry) => {
	let found = false;
	let i = 0;
	let title,
		year,
		duration,
		album;
	switch(MEDIA_TYPE) {
		case TV_SHOW:
			title = entry.children[0].children[0].textContent;
			year = (entry.children[1]?.children[0]?.textContent) ? entry.children[1].children[0].textContent : null;
			const numOfSeasons = (entry.children[1]?.children[2]?.textContent) ? entry.children[1]?.children[2]?.textContent : null;
			const avgEpisodeDuration = (entry.children[1]?.children[4]?.textContent) ? entry.children[1].children[4].textContent : null;
			while(i < TITLES_LIST.length && !found) {
				if (title === TITLES_LIST[i].title &&
					year === TITLES_LIST[i].year &&
					numOfSeasons === TITLES_LIST[i].numOfSeasons &&
					avgEpisodeDuration === TITLES_LIST[i].avgEpisodeDuration) {
						found = true;
				}
				i++;
			}
			break;
		case MOVIE:
			title = entry.children[0].children[0].textContent;
			year = (entry.children[1]?.children[0]?.textContent) ? entry.children[1].children[0].textContent : null;
			duration = (entry.children[1]?.children[2]?.textContent) ? entry.children[1].children[2].textContent : null;
			while(i < TITLES_LIST.length && !found) {
				if (title === TITLES_LIST[i].title &&
					year === TITLES_LIST[i].year &&
					duration === TITLES_LIST[i].duration) {
						found = true;
				}
				i++;
			}
			break;
		case ALBUM:
			let artist = entry.children[1].getAttribute('title');
			album = entry.children[2].getAttribute('title');
			while (i < TITLES_LIST.length && !found) {
				if (artist === TITLES_LIST[i].artist &&
					album === TITLES_LIST[i].album) {
						found = true;
					}
					i++
			}
			break;
		case TRACK:
			title = entry.children[2].children[0].textContent;
			let albumArtist = entry.children[3]?.children[0]?.textContent;
			album = entry.children[4]?.children[0]?.textContent;
			duration = entry.children[5]?.children[0]?.textContent;
			while (i < TITLES_LIST.length && !found) {
				if (title === TITLES_LIST[i].title &&
					albumArtist === TITLES_LIST[i].albumArtist &&
					album === TITLES_LIST[i].album &&
					duration === TITLES_LIST[i].duration) {
						found = true;
					}
					i++
			}
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
	if (MEDIA_TYPE === TRACK) {
		return (entry.children[2].children[0].textContent === prevEntry.children[2].children[0].textContent);
	}
	else {
		return (entry.children[0].children[0].textContent === prevEntry.children[0].children[0].textContent);
	}
}

const addObserverMutation = () => {
	let targetNode = null;
	if (MEDIA_TYPE === TRACK) {
		targetNode = document.querySelector('[class^=DirectoryListPageContent-pageContentScroller] > div:nth-child(2)');
	}
	else {
		targetNode = document.querySelector('[class^=DirectoryListPageContent-pageContentScroller] > div');
	}
	const config = {childList:true};
	let prevLastElement = null;
	const callback = async (mutationList, observer) => {
		for (const mutation of mutationList) {
			if (mutation.type === 'childList') {
				try {
					let cells = null;
					switch(MEDIA_TYPE) {
						case MOVIE:
							cells = document.querySelectorAll("[class^=MetadataDetailsRow-titlesContainer]");
							if (!entriesMatch(cells[cells.length-1],prevLastElement)) {
								for (const [index,cell] of cells.entries()) {
									if (!entryExists(cell)) insertMovie(cell);
								}
							}
							break;
						case TV_SHOW:
							cells = document.querySelectorAll("[class^=MetadataDetailsRow-titlesContainer]");
							if (!entriesMatch(cells[cells.length-1],prevLastElement)) {
								for (const cell of cells) {
									if (!entryExists(cell)) insertTvShow(cell);
								}
							}
							break;
						case ALBUM:
							cells = document.querySelectorAll('[data-testid=cellItem]');
							if (!entriesMatch(cells[cells.length-1],prevLastElement)) {
								for (const cell of cells) {
									if (!entryExists(cell)) insertAlbum(cell);
								}
							}
							break;
						case TRACK:
							cells = document.querySelectorAll('[class^=DirectoryListPageContent-pageContentScroller] [class^=ListRow-]');
							if (!entriesMatch(cells[cells.length-1],prevLastElement)) {
								for (const cell of cells) {
									if (!entryExists(cell)) insertTrack(cell);
								}
							}
							break;
						default:
					}
					prevLastElement = cells[cells.length-1];
				} catch(err) {
					console.error(`Error retrieving tab's storage: ${err.message}`);
				}
			}
		}
		try {
			await browser.runtime.sendMessage({type:SET_STORAGE,id:tabId,data:JSON.stringify(TITLES_LIST)});
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
	let elements = null;
	try {
		switch (MEDIA_TYPE) {
			case MOVIE:
				elements =  document.querySelectorAll('[class^=MetadataDetailsRow-titlesContainer]');
				for (const el of elements) {
					if (!entryExists(el)) insertMovie(el);
				}
				break;
			case TV_SHOW:
				elements =  document.querySelectorAll('[class^=MetadataDetailsRow-titlesContainer]');
				for (const el of elements) {
					if (!entryExists(el)) insertTvShow(el);
				}
				break;
			case ALBUM:
				elements = document.querySelectorAll('[data-testid=cellItem]');
				await setSortAlbumsBy();
				for (const el of elements) {
					if (!entryExists(el)) insertAlbum(el);
				}
				break;
			case TRACK:
				elements = document.querySelectorAll('[class^=DirectoryListPageContent-pageContentScroller] [class^=ListRow-]');
				for (const el of elements) {
					if (!entryExists(el)) insertTrack(el);
				}
				break;
		}
		output = TITLES_LIST;
	} catch(err) {
		console.error(`Error retrieving tab's storage: ${err.message}`);
	}
	return output;
}

const updateStorage = async () => {
	let output = false;
	try {
		await browser.runtime.sendMessage({type:SET_STORAGE,id:tabId,data:JSON.stringify(TITLES_LIST)});
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
	TITLES_LIST = new Array();
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

const onScannablePlexPage = () => {
	let output = {
		isPlex:true,
		isScannablePage:true,
		mediaType:null,
		msg:null
	};
	if (!document.getElementById('plex')) {
		output.isPlex = false;
		output.isScannablePage = false;
		output.msg = 'Plex not detected.';
	}
	if (output.isPlex && document.querySelector('[class^=DirectoryListPageContent-listContainer] > div:first-child')) {
		const detailedItem = document.querySelector('[class^=MetadataDetailsRow-titlesContainer]');
		if (detailedItem) {
			if (detailedItem?.children[1]?.children[2]?.textContent.includes('min')) {
				MEDIA_TYPE = MOVIE;
				output.mediaType = MEDIA_TYPE;
			}
			else if (detailedItem?.children[1].children[2].textContent.includes('season')) {
				MEDIA_TYPE = TV_SHOW;
				output.mediaType = MEDIA_TYPE;
			}
			else {
				output.isScannablePage = false;
				output.msg = 'Plex Detected! Make sure you are viewing a library.';
			}
		}
		else {
			const filterType = document.querySelector('[class^=PageHeaderLeft-pageHeaderLeft] > button:nth-child(2)')?.textContent;
			if (filterType === ALBUM || filterType === TRACK) {
				MEDIA_TYPE = filterType;
				output.mediaType = MEDIA_TYPE;
			}
			else {
				output.isScannablePage = false;
				output.msg = 'Plex library detected! Make sure you are in \'details\' view. If viewing an album, be sure the items are listed by \'album\' or \'tracks\' and not artist in the upper left.';
			}
		}
	}
	else {
		output.isScannablePage = false;
		output.msg = 'Plex Detected! Make sure you are viewing a library.';
	}
	return output;
}

const messageHandler = async (data, sender) => {
	let response = null;
	switch(data.type) {
		case 'setTabIdInContent':
			if (!tabId) tabId = data.tabId;
			response = tabId;
			break;
		case 'updateList':
			if (!OBSERVER_ADDED) {
				OBSERVER_ADDED = true;
				addObserverMutation();
			}
			createStylesheet();
			await updateList(data.mediaType);
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
			if (PAGE_CHANGED) {
				response = PAGE_CHANGED;
				TITLES_LIST = new Array();
				PAGE_CHANGED = false;
			}
			break;
		case IS_PLEX:
			response = onScannablePlexPage();
			break;
		default:
	}
	return Promise.resolve(response);
}

const init = async () => {
	PAGE_CHANGED = true;
	setTimeout(async()=>{
		OBSERVER_ADDED = false;
		createStylesheet();
	},500);
}

;(function main(){
	PAGE_CHANGED = true;
	OBSERVER_ADDED = false;
	browser.runtime.onMessage.addListener(messageHandler);
	window.addEventListener('hashchange',init);
})();