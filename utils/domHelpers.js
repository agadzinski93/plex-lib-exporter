/**
 * Append the createElementTree() function on the global document object
 */
const addDomHelpers = () => {
    /**
     * Create an element with attributes and recursively append more elements as children
     * @param {HTMLElement} element HTML Element to create with document.createElement()
     * @param {Array} classes Array of strings representing classes to give element
     * @param {Object} attributes Object of properties and values to give element (e.g. {href:'url'})
     * @param {Array} children Array of additional elements to append to element using same args structure as this func (array of arrays)
     * @param {string} text innerHTML text (this will allow HTML entities)
     * @returns 
     */
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
            el.textContent = text;
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