const addDomHelpers = () => {
    document.createElementTree = function(element,classes = [],attributes = null, children = null, text = null){
        const el = document.createElement(element);
        if (Array.isArray(classes)) {
            for (let i = 0; i < classes.length; i++) {
                el.classList.add(classes[i]);
            }
        }
        if (attributes && typeof attributes === 'object') {
            for (const [k,v] of Object.entries(attributes)) {
                el.setAttribute(`${k}`,`${v}`);
            }
        }
        if (text) {
            el.innerHTML = text;
        }
        if (Array.isArray(children) && children.length > 0) {
            for (let i = 0; i < children.length; i++) {
                el.append(document.createElementTree(...children[i]));
            }
        }
        return el;
    };
}

export {addDomHelpers}