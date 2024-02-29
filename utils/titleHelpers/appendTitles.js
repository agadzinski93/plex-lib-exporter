import { escapeDoubleQuotes } from "../sanitizers.js";

const appendMovieToTxt = (entry) => {
    return `${entry.title} ${entry.year} ${entry.duration}`;
}
const appendTvShowToTxt = (entry) => {
    return `${entry.title} ${entry.year} ${entry.numOfSeasons} ${entry.avgEpisodeDuration}`;
}
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
const appendTrackToTxt = (entry) => {
    return `${entry.title} ${entry.albumArtist} ${entry.album} ${entry.duration}`;
}
const appendMovieToCsv = (entry) => {
    entry.title = escapeDoubleQuotes(entry.title);
    return `"${entry.title}","${entry.year}","${entry.duration}"`;
}
const appendTvShowToCsv = (entry) => {
    entry.title = escapeDoubleQuotes(entry.title);
    return `"${entry.title}","${entry.year}","${entry.numOfSeasons}","${entry.avgEpisodeDuration}"`;
}
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