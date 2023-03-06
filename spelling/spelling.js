import localforage from 'https://cdn.skypack.dev/localforage';

let hunspell_dictionary_url = "https://raw.githubusercontent.com/elastic/hunspell/master/dicts/en_US/en_US.dic"
let soccer_dictionary_url = "./soccer_en_US.dic"

export async function loadDictionary(dictionary_url) {
    let utf8decoder = new TextDecoder("Windows-1252");
    let dict = new Set()
    const regex = new RegExp('^[a-z]');
    function addLine(line) {
        if (regex.test(line)) {
            dict.add(line.split("/", 1)[0])
        }
    }

    let oldText = ""
    let lineCount = 0;
    let blockCount = 0;
    let stream = (await fetch(dictionary_url)).body
    const reader = stream.getReader();

    for (let block = await reader.read(); !block.done; block = await reader.read()) {
        blockCount++;

        let txt = oldText + utf8decoder.decode(block.value)
        let lines = txt.split("\n");
        oldText = lines.pop();
        lines.forEach((line) => addLine(line))

        lineCount += lines.length
    }
    return dict
}

async function create_dictionary() {
    let p1 = loadDictionary(hunspell_dictionary_url)
    let p2 = loadDictionary(soccer_dictionary_url);
    return await Promise.all([p1,p2]).then( ([s1,s2])=> new Set([...s1,...s2]) );
}


console.log("in spelling ", localforage)
window.dict = await create_dictionary()
window.create_dictionary = create_dictionary
console.log(dict.has("endodontist"))
console.log(dict.has('zygote'))