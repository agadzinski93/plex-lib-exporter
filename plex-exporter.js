const TV_SHOW = 'tv';
const MOVIE = 'movie';

let observerAdded = false;

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

const clearStorage = async () => {
	await browser.storage.local.remove('titles');
}

const addObserverMutation = () => {
	const targetNode = document.querySelector('[class^=DirectoryListPageContent-pageContentScroller] > div');
	const config = {childList:true};
	let prevLastElement = null;
	const callback = (mutationList, observer) => {
		for (const mutation of mutationList) {
			if (mutation.type === 'childList') {
				browser.storage.local.get().then(({titles}) => {
					let list = JSON.parse(titles);
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
								browser.storage.local.set({'titles':JSON.stringify(list)})
									.then(r=>{
										browser.runtime.sendMessage({updateTitles:true},(response)=>{});
									})
									.catch(err=>console.error(`Error: ${err}`));
							}
						}
					}
					prevLastElement = cells[cells.length-1];
				}).catch(err=>{console.error(err.message)})
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
	return await browser.storage.local.get().then(({titles}) => {
		if (titles) list = JSON.parse(titles);
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
		return browser.storage.local.set({'titles':JSON.stringify(list)})
			.then(r=>{return list})
			.catch(err=>console.error(`Error: ${err}`));
	}).catch(err=>{})
}

const repositionTitles = () => {
	const css = '[class^=ListRow] {top:0 !important; left:0 !important}';
	document.getElementById('tempStyles').textContent = css;
	document.querySelector('[class^=DirectoryListPageContent-listContainer] > div:first-child').style.removeProperty('display');
}

const revertTitles = () => {
	document.getElementById('tempStyles').textContent = '';
	document.querySelector('[class^=DirectoryListPageContent-listContainer] > div:first-child').style.display = 'contents';
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

const messageHandler = async (data, sender) => {
	let response = null;
	switch(data.type) {
		case 'verifyDomain':
			const localhostIp = /127\.0\.0\.1/;
			const localhost = /localhost/;
			const plexUrl = /app\.plex\.tv\//;
			const url = location.href;
			console.log(url);
			if (localhostIp.test(url) || localhost.test(url) || plexUrl.test(url)) {
				response = true;
			}
			else {
				response = false;
			}
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
		default:
	}
	return Promise.resolve(response);
}

const init = async () => {
	observerAdded = false;
	clearStorage();
	createStylesheet();
	addObserverMutation();
	await updateList();
}

;(function init(){
	observerAdded = false;
	clearStorage();
	browser.runtime.onMessage.addListener(messageHandler);
	window.addEventListener('hashchange',init);
})();