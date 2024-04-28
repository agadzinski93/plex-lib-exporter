import { escapeDoubleQuotes } from "../sanitizers.js";

/**
 * Append movie data to output TXT file
 * @param {object} entry Movie object containing a title, year, and duration
 * @returns {string}
 */
const appendMovieToTxt = (entry) => {
    return `${entry.title} ${entry.year} ${entry.duration}`;
}
/**
 * Append tv show to output TXT file
 * @param {object} entry TV Show object containing title, year, numOfSeasons, and avgEpisodeDuration
 * @returns {string}
 */
const appendTvShowToTxt = (entry) => {
    return `${entry.title} ${entry.year} ${entry.numOfSeasons} ${entry.avgEpisodeDuration}`;
}
/**
 * Append album to output TXT file
 * @param {object} entry Album object containing the artist, album, and an optional third property such as year
 * @param {string?} SORT_ALBUMS_BY If third property, this value will be used as a column in output TXT file
 * @param {string?} thirdProperty Optional third property for output TXT file
 * @returns {string}
 */
const appendAlbumToTxt = (entry, SORT_ALBUMS_BY, thirdProperty = false) => {
    if (thirdProperty) {
        let property = SORT_ALBUMS_BY.replaceAll(' ','');
        property = property.charAt(0).toLowerCase() + property.slice(1);
        return `${entry.artist} ${entry.album} ${entry[`${property}`]}`;
    }
    else {
        return `${entry.artist} ${entry.album}`;
    }
}
/**
 * Append track to output TXT file
 * @param {object} entry Track object containing title, albumArtist, album, and duration
 * @returns {string}
 */
const appendTrackToTxt = (entry) => {
    return `${entry.title} ${entry.albumArtist} ${entry.album} ${entry.duration}`;
}
/**
 * Append movie data to output CSV file
 * @param {object} entry Movie object containing a title, year, and duration
 * @returns {string}
 */
const appendMovieToCsv = (entry) => {
    entry.title = escapeDoubleQuotes(entry.title);
    return `"${entry.title}","${entry.year}","${entry.duration}"`;
}
/**
 * Append tv show to output CSV file
 * @param {object} entry TV Show object containing title, year, numOfSeasons, and avgEpisodeDuration
 * @returns {string}
 */
const appendTvShowToCsv = (entry) => {
    entry.title = escapeDoubleQuotes(entry.title);
    return `"${entry.title}","${entry.year}","${entry.numOfSeasons}","${entry.avgEpisodeDuration}"`;
}
/**
 * Append album to output CSV file
 * @param {object} entry Album object containing the artist, album, and an optional third property such as year
 * @param {string?} SORT_ALBUMS_BY If third property, this value will be used as a column in output CSV file
 * @param {string?} thirdProperty Optional third property for output CSV file
 * @returns {string}
 */
const appendAlbumToCsv = (entry, SORT_ALBUMS_BY, thirdProperty = false) => {
    if (thirdProperty) {
        let property = SORT_ALBUMS_BY.replaceAll(' ','');
        property = property.charAt(0).toLowerCase() + property.slice(1);
        return `"${entry.artist}","${entry.album}","${entry[`${property}`]}"`;
    }
    else {
        return `"${entry.artist}","${entry.album}"`;
    }
}
/**
 * Append track to output CSV file
 * @param {object} entry Track object containing title, albumArtist, album, and duration
 * @returns {string}
 */
const appendTrackToCsv = (entry) => {
    entry.title = escapeDoubleQuotes(entry.title);
    return `"${entry.title}","${entry.albumArtist}","${entry.album}","${entry.duration}"`;
}

export {
    appendMovieToTxt,
    appendTvShowToTxt,
    appendAlbumToTxt,
    appendTrackToTxt,
    appendMovieToCsv,
    appendTvShowToCsv,
    appendAlbumToCsv,
    appendTrackToCsv
};