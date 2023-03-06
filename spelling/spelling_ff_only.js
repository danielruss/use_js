import localforage from 'https://cdn.skypack.dev/localforage';

// load dictionaries an store in localforage if needed
async function loadDictionary() {
    let dict = await localforage.getItem("en_US.dict")
    if (dict) {
        console.log("... pulling from cache ...")
        return new Set(JSON.parse(dict))
    }
    console.log("... reloading ...")
    return reloadDictionary()
}

async function reloadDictionary() {
    let dict=new Set()
    const regex = new RegExp('^[a-z]');
    function addLine(line) {
        if (regex.test(line)) {
            dict.add(line.split("/", 1)[0])
        } else {
            //console.log("tossing line: ", line)
        }
    }

    //let dictionary_url = "https://cgit.freedesktop.org/libreoffice/dictionaries/tree/en"
    let dictionary_url = "https://raw.githubusercontent.com/elastic/hunspell/master/dicts/en_US/en_US.dic"
    let utf8decoder = new TextDecoder("Windows-1252");

    const response = await fetch(dictionary_url);
    let oldText = ""
    // Iterate response.body (a ReadableStream) asynchronously
    for await (const chunk of response.body) {
        let txt = utf8decoder.decode(chunk)
        let lines = txt.split("\n");

        // add the unfinished line from the last chunk
        // to the 1st line of the current chunk...
        lines[0] = oldText + lines[0]
        oldText = lines.pop();
        lines.forEach((line) => addLine(line))
    }

    // just to be safe...
    if (oldText.length > 0) {
        addLine(oldText)
    }
    await localforage.setItem("en_US.dict",JSON.stringify([...dict]))
    return dict;
}

console.log("in spelling ", localforage)
window.dict=await loadDictionary()