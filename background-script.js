const handleIconChange = async () => {
    try {
        const tabs = await browser.tabs.query({active:true,currentWindow:true});
        const url = tabs[0].url;
        const allowableDomains = [
            /127\.0\.0\.1/,
            /localhost/,
            /app\.plex\.tv\//
        ];
        if (allowableDomains.some(reg=>reg.test(url))) {
            browser.action.setIcon({
                path:{
                    32: "/assets/icon-32.png",
                    48: "/assets/icon-48.png",
                    64: "/assets/icon-64.png",
                    96: "/assets/icon-96.png"
                }
            });
        }
        else {
            browser.action.setIcon({
                path:{
                    32: "/assets/icon-disabled-32.png",
                    48: "/assets/icon-disabled-48.png",
                    96: "/assets/icon-disabled-96.png"
                }
            });
        }
    } catch(err) {
        console.error(`Error handling icon: ${err.message}`);
    }
}

(function main() {
    //Update icon when user switches tabs
    browser.tabs.onActivated.addListener(handleIconChange);

    //Update icon when user navigates to a new URL in tab
    browser.tabs.onUpdated.addListener(handleIconChange);

    //Update icon as soon as extension loads
    handleIconChange();
})();