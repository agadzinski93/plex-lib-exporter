import { escapeDoubleQuotes } from "../sanitizers.js";

const APPEND_TITLES = {
    appendMovieToTxt: (entry) => {
        return `${entry.title} ${entry.year} ${entry.duration}`;
    },
    appendTvShowToTxt: (entry) => {
        return `${entry.title} ${entry.year} ${entry.numOfSeasons} ${entry.avgEpisodeDuration}`;
    },
    appendAlbumToTxt: (entry, thirdProperty = false) => {
        if (thirdProperty) {
            let property = SORT_ALBUMS_BY.replaceAll(' ','');
            property = property.charAt(0).toLowerCase() + property.slice(1);
            return `${entry.artist} ${entry.album} ${entry[`${property}`]}`;
        }
        else {
            return `${entry.artist} ${entry.album}`;
        }
    },
    appendTrackToTxt: (entry) => {
        return `${entry.title} ${entry.albumArtist} ${entry.album} ${entry.duration}`;
    },
    appendMovieToCsv: (entry) => {
        entry.title = escapeDoubleQuotes(entry.title);
        return `"${entry.title}","${entry.year}","${entry.duration}"`;
    },
    appendTvShowToCsv: (entry) => {
        entry.title = escapeDoubleQuotes(entry.title);
        return `"${entry.title}","${entry.year}","${entry.numOfSeasons}","${entry.avgEpisodeDuration}"`;
    },
    appendAlbumToCsv: (entry, thirdProperty = false) => {
        if (thirdProperty) {
            let property = SORT_ALBUMS_BY.replaceAll(' ','');
            property = property.charAt(0).toLowerCase() + property.slice(1);
            return `"${entry.artist}","${entry.album}","${entry[`${property}`]}"`;
        }
        else {
            return `"${entry.artist}","${entry.album}"`;
        }
    },
    appendTrackToCsv: (entry) => {
        entry.title = escapeDoubleQuotes(entry.title);
        return `"${entry.title}","${entry.albumArtist}","${entry.album}","${entry.duration}"`;
    }
}

export {APPEND_TITLES};