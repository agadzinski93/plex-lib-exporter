const escapeDoubleQuotes = (str) => {
    return str.replaceAll('"','""');
}

export {escapeDoubleQuotes};