import { GLOBAL_CONSTANTS } from "../../constants/constants.js";
import { 
    appendAlbumToCsv,
    appendAlbumToTxt,
    appendMovieToCsv,
    appendMovieToTxt,
    appendTrackToCsv,
    appendTrackToTxt,
    appendTvShowToCsv,
    appendTvShowToTxt
 } from "./appendTitles.js";
const {
    ALBUM_SORT_OPTIONS,
    FILE_TYPES,
    MEDIA_TYPE:MEDIA_FORMAT
} = GLOBAL_CONSTANTS;

/**
 * When prepping the download for the user, stringify the list of title objects, formatting the
 * string based on the media type (e.g. tv show/movie/album) and the output format (e.g. csv)
 * @param {object[]} titles Array of objects containing individual titles (e.g. movie, tv show)
 * @param {string} mediaType Albums, movie, Tracks, or tv (notice some are capitalized)
 * @param {string} sortAlbumsBy 
 * @param {string} fileType txt, csv, or json
 * @returns 
 */
const stringifyTitles = (titles, mediaType, sortAlbumsBy, fileType = FILE_TYPES.TXT_FILE) => {
    let output = "";
    const includeLineNumbers = document.getElementById('chkLineNumbers').checked;
    let i = 0;
    switch(fileType) {
        case FILE_TYPES.TXT_FILE:
            switch(mediaType) {
                case MEDIA_FORMAT.MOVIE:
                    output += (includeLineNumbers) ? `# Title Year Duration\n` : `Title Year Duration\n`;
                    if (includeLineNumbers) {
                        for (const title of titles) output += `${++i} ${appendMovieToTxt(title)}\n`;
                    }
                    else {
                        for (const title of titles) output += `${appendMovieToTxt(title)}\n`;
                    }
                    break;
                case MEDIA_FORMAT.TV_SHOW:
                    if (includeLineNumbers) {
                        output += `# Title Year Number of Seasons Episode Duration\n`;
                        for (const title of titles) output += `${++i} ${appendTvShowToTxt(title)}\n`;
                    }
                    else {
                        output += `Title Year Number of Seasons Episode Duration\n`;
                        for (const title of titles) output += `${appendTvShowToTxt(title)}\n`;
                    }
                    break;
                case MEDIA_FORMAT.ALBUM:
                    if ([ALBUM_SORT_OPTIONS.TITLE,ALBUM_SORT_OPTIONS.ALBUM_ARTIST].includes(sortAlbumsBy)) {
                        if (includeLineNumbers) {
                            output += `# Artist Album\n`;
                            for (const title of titles) output += `${++i} ${appendAlbumToTxt(title,sortAlbumsBy)}\n`;
                        }
                        else {
                            output += 'Artist Album\n';
                            for (const title of titles) output += `${appendAlbumToTxt(title,sortAlbumsBy)}\n`;
                        }
                    }
                    else {
                        if (includeLineNumbers) {
                            output += `# Artist Album ${sortAlbumsBy}\n`;
                            for (const title of titles) output += `${++i} ${appendAlbumToTxt(title,sortAlbumsBy,true)}\n`;
                        }
                        else {
                            output += `Artist Album ${sortAlbumsBy}\n`;
                            for (const title of titles) output += `${appendAlbumToTxt(title,sortAlbumsBy,true)}\n`;
                        }
                    }
                    break;
                case MEDIA_FORMAT.TRACK:
                   if (includeLineNumbers) {
                        output += `# Title Album Artist Album Duration\n`;
                        for (const title of titles) output += `${++i} ${appendTrackToTxt(title)}\n`;
                   }
                   else {
                    output += `Title Album Artist Album Duration\n`;
                    for (const title of titles) output += `${appendTrackToTxt(title)}\n`;
                   }
                    break;
                default:
            }
            break;
        case FILE_TYPES.CSV_FILE:
            switch(mediaType) {
                case MEDIA_FORMAT.MOVIE:
                    output += (includeLineNumbers) ? '"#","Title","Year","Duration"\n' : '"Title","Year","Duration"\n';
                    if (includeLineNumbers) {
                        for (const title of titles) output += `"${++i}",${appendMovieToCsv(title)}\n`;
                    }
                    else {
                        for (const title of titles) output += `${appendMovieToCsv(title)}\n`;
                    }
                    
                    break;
                case MEDIA_FORMAT.TV_SHOW:
                    output += (includeLineNumbers) ? '"#","Title","Year","Seasons","Episode Duration"\n' : '"Title","Year","Seasons","Episode Duration"\n';
                    if (includeLineNumbers) {
                        for (const title of titles) output += `"${++i}",${appendTvShowToCsv(title)}\n`;
                    }
                    else {
                        for (const title of titles) output += `${appendTvShowToCsv(title)}\n`;
                    }
                    break;
                case MEDIA_FORMAT.ALBUM:
                    if ([ALBUM_SORT_OPTIONS.TITLE,ALBUM_SORT_OPTIONS.ALBUM_ARTIST].includes(sortAlbumsBy)) {
                        if (includeLineNumbers) {
                            output += `"#","Artist","Album"\n`;
                            for (const title of titles) output += `"${++i}",${appendAlbumToCsv(title,sortAlbumsBy)}\n`;
                        }
                        else {
                            output += '"Artist","Album"\n';
                            for (const title of titles) output += `${appendAlbumToCsv(title,sortAlbumsBy)}\n`;
                        }
                    }
                    else {
                        if (includeLineNumbers) {
                            output += `"#","Artist","Album","${sortAlbumsBy}"\n`;
                            for (const title of titles) output += `"${++i}",${appendAlbumToCsv(title,sortAlbumsBy,true)}\n`;
                        }
                        else {
                            output += `"Artist","Album","${sortAlbumsBy}"\n`;
                            for (const title of titles) output += `${appendAlbumToCsv(title,sortAlbumsBy,true)}\n`;
                        }
                    }
                    break;
                case MEDIA_FORMAT.TRACK:
                    output += (includeLineNumbers) ? '"#","Title","Album Artist","Album","Duration"\n' : '"Title","Album Artist","Album","Duration"\n';
                    if (includeLineNumbers) {
                        for (const title of titles) output += `"${++i}",${appendTrackToCsv(title)}\n`;
                    }
                    else {
                        for (const title of titles) output += `${appendTrackToCsv(title)}\n`;
                    }
                    break;
                default:
            }
            break;
        case FILE_TYPES.JSON_FILE:
            if (includeLineNumbers) {
                for (let i = 0; i < titles.length; i++) {
                    titles[i].id = i+1;
                }
            }
            output += JSON.stringify(titles);
            break;
        default:
    }
    return output;
}

export {stringifyTitles};