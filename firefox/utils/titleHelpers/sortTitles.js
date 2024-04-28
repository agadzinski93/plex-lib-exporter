import { GLOBAL_CONSTANTS } from "../../firefox/constants/constants.js";
const {ALBUM_SORT_OPTIONS} = GLOBAL_CONSTANTS;

/**
 * Sort two pieces of media by year
 * @param {object} a Title object (e.g. movie, tv show, album) that has a year property
 * @param {object} b Title object (e.g. movie, tv show, album) that has a year property
 * @returns 
 */
const compareByYear = (a,b) => {
    return a.year - b.year;
}
/**
 * Custom collation function designed to sort objects containing a title property
 * @param {object} a Title object (e.g. movie, tv show, album) that has a title property
 * @param {object} b Title object (e.g. movie, tv show, album) that has a title property
 * @returns 
 */
const compareByTitles = (a,b) => {
    return new Intl.Collator('en').compare(a.title,b.title);
}
/**
 * Sort an array of objects by title or year
 * @param {object[]} titles 
 * @returns {object[]}
 */
const sortTitles = (titles) => {
    let sortedTitles = titles;
    const sortBy = document.getElementById('sortBy');
    switch(sortBy.value) {
        case ALBUM_SORT_OPTIONS.TITLE:
            sortedTitles.sort(compareByTitles);
            break;
        case ALBUM_SORT_OPTIONS.YEAR:
            sortedTitles.sort(compareByYear);
            break;
        default:
    }
    return sortedTitles;
}

export {sortTitles};