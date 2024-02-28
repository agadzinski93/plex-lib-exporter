const GLOBAL_CONSTANTS = {
    MESSAGE_OPTIONS: {
        CLOSE_POPUP:'CLOSE_POPUP',
        GET_STORAGE:'GET_STORAGE',
        REMOVE_STORAGE:'REMOVE_STORAGE',
        SET_SORT_ALBUMS_BY:'SET_SORT_ALBUMS_BY',
        SET_STORAGE:'SET_STORAGE',
        UPDATE_DOWNLOAD_BUTTON:'UPDATE_DOWNLOAD_BUTTON'
    },
    TAB_OPTIONS: {
        CLOSE_POPUP:'CLOSE_POPUP',
        IS_CHECKED:'IS_CHECKED',
        IS_PLEX:'IS_PLEX',
        PAGE_CHANGED:'PAGE_CHANGED',
        STACK_TITLES:'STACK_TITLES',
        SET_TAB_ID_IN_CONTENT_SCRIPT:'SET_TAB_ID_IN_CONTENT_SCRIPT',
        UPDATE_LIST:'UPDATE_LIST',
        UPDATE_STORAGE:'UPDATE_STORAGE'
    },
    ALBUM_SORT_OPTIONS: {
        ALBUM_ARTIST:'Album Artist',
        DATE_ADDED:'Date Added',
        DATE_PLAYED:'Date Played',
        PLAYS:'Plays',
        TITLE:'Title',
        YEAR:'Year',
        RELEASE_DATE:'Release Date'
    },
    MEDIA_TYPE: {
        ALBUM:'Albums',
        MOVIE:'movie',
        TRACK:'Tracks',
        TV_SHOW:'tv'
    },
    FILE_TYPES: {
        CSV_FILE:'csv',
        JSON_FILE:'json',
        TXT_FILE:'txt'
    },
    SELECTORS: {
        ALBUM_SORT_TEXT:'[class^=PageHeaderLeft-pageHeaderLeft] > button:nth-child(3)',
        TRACK_CONTAINER:'[class^=DirectoryListPageContent-pageContentScroller] > div:nth-child(2)',
        NON_TRACK_CONTAINER:'[class^=DirectoryListPageContent-pageContentScroller] > div',
        CELLS_ALBUM:'[data-testid=cellItem]',
        CELLS_MOVIE:'[class^=MetadataDetailsRow-titlesContainer]',
        CELLS_TRACK:'[class^=DirectoryListPageContent-pageContentScroller] [class^=ListRow-]',
        CELLS_TV_SHOW:'[class^=MetadataDetailsRow-titlesContainer]'

    }
}

export {GLOBAL_CONSTANTS};