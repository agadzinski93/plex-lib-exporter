import { GLOBAL_CONSTANTS } from "../../constants/constants.js";
const {ALBUM_SORT_OPTIONS} = GLOBAL_CONSTANTS;

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