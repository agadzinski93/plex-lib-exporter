import { GLOBAL_CONSTANTS } from '../constants/constants.js';
const {ALBUM_SORT_OPTIONS} = GLOBAL_CONSTANTS;

const INSERTIONS = {
    insertTvShow: (entry) => {
        TITLES_LIST.push(new Object({
            title:entry.children[0].children[0].textContent,
            year:(entry.children[1]?.children[0]?.textContent) ? entry.children[1].children[0].textContent : null,
            numOfSeasons:(entry.children[1]?.children[2]?.textContent) ? entry.children[1]?.children[2]?.textContent : null,
            avgEpisodeDuration:(entry.children[1]?.children[4]?.textContent) ? entry.children[1].children[4].textContent : null
        }));
    },
    insertMovie: (entry) => {
        TITLES_LIST.push(new Object({
            title:entry.children[0].children[0].textContent,
            year:(entry.children[1]?.children[0]?.textContent) ? entry.children[1].children[0].textContent : null,
            duration:(entry.children[1]?.children[2]?.textContent) ? entry.children[1].children[2].textContent : null
        }));
    },
    insertAlbum: (entry) => {
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
    },
    insertTrack: (entry) => {
        TITLES_LIST.push(new Object({
            title:entry.children[2].children[0].textContent,
            albumArtist:(entry.children[3]?.children[0]?.textContent) ? entry.children[3].children[0].textContent : null,
            album:(entry.children[4]?.children[0]?.textContent) ? entry.children[4].children[0].textContent : null,
            duration:(entry.children[5]?.children[0]?.textContent) ? entry.children[5].children[0].textContent : null
        }));
    }
}
export {INSERTIONS};