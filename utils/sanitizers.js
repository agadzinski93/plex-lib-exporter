/**
 * Adds additional double quote that is needed when quotes are used in CSV files
 * @param {string} str 
 * @returns {string}
 */
const escapeDoubleQuotes = (str) => {
    return str.replaceAll('"','""');
}

export {escapeDoubleQuotes};