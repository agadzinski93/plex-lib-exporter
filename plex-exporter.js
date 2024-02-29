let ALBUM_SORT_OPTIONS;

let TITLES_LIST = new Array();
let MEDIA_TYPE = null;
let OBSERVER_ADDED = false;
let OBSERVER = null;
let tabId = null;
let chkStackTitlesChecked = false;
let PAGE_CHANGED = false;
let SORT_ALBUMS_BY = null;

;(async function main(){
	let src = browser.runtime.getURL("./constants/constants.js");
	const {
		ALBUM_SORT_OPTIONS,
		MESSAGE_OPTIONS,
		TAB_OPTIONS,
		MEDIA_TYPE : MEDIA_FORMAT,
		SELECTORS
	} = (await import(src)).GLOBAL_CONSTANTS;

	src = browser.runtime.getURL("./utils/titleHelpers/insertTitles.js");
	const {insertTvShow,insertMovie,insertAlbum,insertTrack} = await import(src);

	const setSortAlbumsBy = async () => {
		const sortOption = document.querySelector(SELECTORS.ALBUM_SORT_TEXT);
		const optionText = sortOption.textContent;
		if (Object.values(ALBUM_SORT_OPTIONS).includes(optionText.substring('By '.length))) {
			SORT_ALBUMS_BY = optionText.substring('By '.length);
		} 
		else {
			SORT_ALBUMS_BY = ALBUM_SORT_OPTIONS.TITLE
		}
		await browser.runtime.sendMessage({type:MESSAGE_OPTIONS.SET_SORT_ALBUMS_BY,sortBy:SORT_ALBUMS_BY});
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
			case MEDIA_FORMAT.TV_SHOW:
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
			case MEDIA_FORMAT.MOVIE:
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
			case MEDIA_FORMAT.ALBUM:
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
			case MEDIA_FORMAT.TRACK:
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

	const removeObserverMutation = () => {
		if (OBSERVER) OBSERVER.disconnect();
	}
	
	const addObserverMutation = () => {
		let targetNode = null;
		if (MEDIA_TYPE === MEDIA_FORMAT.TRACK) {
			targetNode = document.querySelector(SELECTORS.TRACK_CONTAINER);
		}
		else {
			targetNode = document.querySelector(SELECTORS.NON_TRACK_CONTAINER);
		}
		const config = {childList:true};
		const callback = async (mutationList, observer) => {
			let cell = null;
			for (const mutation of mutationList) {
				if (mutation.type === 'childList' && mutation.addedNodes.length === 1) {
					try {
						switch(MEDIA_TYPE) {
							case MEDIA_FORMAT.MOVIE:
								cell = mutation.addedNodes[0]?.children[2]?.children[0]?.children[1];
								if (cell) {
									if (!entryExists(cell)) insertMovie(cell);
								}
								break;
							case MEDIA_FORMAT.TV_SHOW:
								cell = mutation.addedNodes[0]?.children[2]?.children[0]?.children[1];
								if (cell) {
									if (!entryExists(cell)) insertTvShow(cell);
								}
								break;
							case MEDIA_FORMAT.ALBUM:
								cell = mutation.addedNodes[0];
								if (!entryExists(cell)) insertAlbum(cell);
								break;
							case MEDIA_FORMAT.TRACK:
								cell = mutation.addedNodes[0];
								if (!entryExists(cell)) insertTrack(cell);
								break;
							default:
						}
					} catch(err) {
						console.error(`Error retrieving tab's storage: ${err.message}`);
					}
				}
			}
			try {
				await browser.runtime.sendMessage({type:MESSAGE_OPTIONS.SET_STORAGE,id:tabId,data:JSON.stringify(TITLES_LIST)});
				await browser.runtime.sendMessage({type:MESSAGE_OPTIONS.UPDATE_DOWNLOAD_BUTTON});
				
			} catch(err) {
				//Popup is not open. That's Okay!
			}
		}
		OBSERVER = new MutationObserver(callback);
		OBSERVER.observe(targetNode, config);
	}
	
	const updateList = async () => {
		let output = null;
		let elements = null;
		try {
			switch (MEDIA_TYPE) {
				case MEDIA_FORMAT.MOVIE:
					elements =  document.querySelectorAll(SELECTORS.CELLS_MOVIE);
					for (const el of elements) {
						if (!entryExists(el)) insertMovie(el);
					}
					break;
				case MEDIA_FORMAT.TV_SHOW:
					elements =  document.querySelectorAll(SELECTORS.CELLS_TV_SHOW);
					for (const el of elements) {
						if (!entryExists(el)) insertTvShow(el);
					}
					break;
				case MEDIA_FORMAT.ALBUM:
					elements = document.querySelectorAll(SELECTORS.CELLS_ALBUM);
					await setSortAlbumsBy();
					for (const el of elements) {
						if (!entryExists(el)) insertAlbum(el);
					}
					break;
				case MEDIA_FORMAT.TRACK:
					elements = document.querySelectorAll(SELECTORS.CELLS_TRACK);
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
			await browser.runtime.sendMessage({type:MESSAGE_OPTIONS.SET_STORAGE,id:tabId,data:JSON.stringify(TITLES_LIST)});
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
		removeObserverMutation();
		chkStackTitlesChecked = true;
		let css;
		switch(MEDIA_TYPE) {
			case MEDIA_FORMAT.ALBUM:
				css = `${SELECTORS.CELLS_ALBUM} {top:0 !important; left:0 !important}`;
				break;
			default:
				css = '[class^=ListRow] {top:0 !important; left:0 !important}';
		}
		document.getElementById('tempStyles').textContent = css;
		document.querySelector('[class^=DirectoryListPageContent-listContainer] > div:first-child').style.removeProperty('display');
	}
	
	const revertTitles = () => {
		chkStackTitlesChecked = false;
		document.getElementById('tempStyles').textContent = '';
		document.querySelector('[class^=DirectoryListPageContent-listContainer] > div:first-child').style.display = 'contents';
		TITLES_LIST = new Array();
		
		//Set Timeout prevents unnecessary event firings
		setTimeout(()=>{
			addObserverMutation();
		},250);
	}
	
	const createStylesheet = () => {
		if (!document.getElementById('tempStyles')) {
			const stylesheet = document.createElement('style');
			stylesheet.setAttribute('rel','stylesheet');
			stylesheet.setAttribute('id','tempStyles');
			document.getElementsByTagName('head')[0].append(stylesheet);
		}
	}
	
	const clearStorage = async () => {
		try {
			if (tabId) await browser.runtime.sendMessage({type:MESSAGE_OPTIONS.REMOVE_STORAGE,id:tabId});
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
					MEDIA_TYPE = MEDIA_FORMAT.MOVIE;
					output.mediaType = MEDIA_TYPE;
				}
				else if (detailedItem?.children[1].children[2].textContent.includes('season')) {
					MEDIA_TYPE = MEDIA_FORMAT.TV_SHOW;
					output.mediaType = MEDIA_TYPE;
				}
				else {
					output.isScannablePage = false;
					output.msg = 'Plex Detected! Make sure you are viewing a library.';
				}
			}
			else {
				const filterType = document.querySelector('[class^=PageHeaderLeft-pageHeaderLeft] > button:nth-child(2)')?.textContent;
				if (filterType === MEDIA_FORMAT.ALBUM || filterType === MEDIA_FORMAT.TRACK) {
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
			case TAB_OPTIONS.SET_TAB_ID_IN_CONTENT_SCRIPT:
				if (!tabId) tabId = data.TAB_ID;
				response = tabId;
				break;
			case TAB_OPTIONS.UPDATE_LIST:
				if (!OBSERVER_ADDED) {
					OBSERVER_ADDED = true;
					addObserverMutation();
				}
				createStylesheet();
				await updateList(data.MEDIA_TYPE);
				break;
			case TAB_OPTIONS.UPDATE_STORAGE:
				response = await updateStorage();
				break;
			case TAB_OPTIONS.STACK_TITLES:
				await clearStorage();
				if (data.repositionTitles) {
					repositionTitles();
				}
				else {
					revertTitles();
				}
				const numOfTitles = getTotalTitles();
				if (numOfTitles) response = parseInt(numOfTitles);
				break;
			case TAB_OPTIONS.IS_CHECKED:
				response = chkStackTitlesChecked;
				break;
			case TAB_OPTIONS.CLOSE_POPUP:
				data.window.close();
				break;
			case TAB_OPTIONS.PAGE_CHANGED:
				if (PAGE_CHANGED) {
					response = PAGE_CHANGED;
					TITLES_LIST = new Array();
					PAGE_CHANGED = false;
				}
				break;
			case TAB_OPTIONS.IS_PLEX:
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

	PAGE_CHANGED = true;
	OBSERVER_ADDED = false;
	browser.runtime.onMessage.addListener(messageHandler);
	window.addEventListener('hashchange',init);
})();