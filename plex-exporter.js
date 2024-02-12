const TV_SHOW = 'tv';
const MOVIE = 'movie';

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

const updateList = () => {
	browser.storage.local.remove('titles');
	const elements = document.querySelectorAll('[class^=MetadataDetailsRow-titlesContainer]');
	let mediaType = getMediaType(elements[0]);
	let list = new Array();
	for (const el of elements) {
		if (mediaType === MOVIE) {
			insertMovie(list, el);
		}
		else if (mediaType === TV_SHOW) {
			insertTvShow(list, el);
		}
		
	}
	browser.storage.local.set({'titles':JSON.stringify(list)})
		.then(r=>{})
		.catch(err=>console.error(`Error: ${err}`));

	//Observer Stuff
	const targetNode = document.querySelector('[class^=DirectoryListPageContent-pageContentScroller] > div');
	const config = {childList:true};
	let prevLastElement = null;
	const callback = (mutationList, observer) => {
		for (const mutation of mutationList) {
			if (mutation.type === 'childList') {
				const cells = document.querySelectorAll("[class^=MetadataDetailsRow-titlesContainer]");

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
								.then(r=>{})
								.catch(err=>console.error(`Error: ${err}`));
						};
					}
				}
				prevLastElement = cells[cells.length-1];
			}
		}
	}
	const observer = new MutationObserver(callback);
	observer.observe(targetNode, config);
	return list;
}

const repositionTitles = () => {
	const css = '[class^=ListRow] {top:0 !important; left:0 !important}';
	document.getElementById('tempStyles').textContent = css;
	document.querySelector('[class^=DirectoryListPageContent-listContainer] > div:first-child').style.removeProperty('display');
	return updateList();
}

const revertTitles = () => {
	document.getElementById('tempStyles').textContent = '';
	document.querySelector('[class^=DirectoryListPageContent-listContainer] > div:first-child').style.display = 'contents';
	return updateList();
}

const initialUpdateList = () => {
	if (!document.getElementById('tempStyles')) {
		const head = document.head || document.getElementsByTagName('head')[0];
		const stylesheet = document.createElement('style');
		stylesheet.setAttribute('rel','stylesheet');
		stylesheet.setAttribute('id','tempStyles');
		document.getElementsByTagName('head')[0].append(stylesheet);
	}
	setTimeout(()=>{
		updateList();
	},1250);
}

const editTitleLayoutHandler = (data, sender) => {
	browser.storage.local.remove('titles');
	const list = (data.repositionTitles) ? repositionTitles() : revertTitles();
	browser.storage.local.set({'titles':JSON.stringify(list)})
		.then(r=>{})
		.catch(err=>console.error(`Error: ${err}`));
	return Promise.resolve(data.repositionTitles);
}

;(function init(){
	browser.runtime.onMessage.addListener(editTitleLayoutHandler);
	window.addEventListener('hashchange',initialUpdateList);
})();