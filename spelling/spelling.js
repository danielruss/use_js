import localforage from 'https://cdn.skypack.dev/localforage';


let hunspell_dictionary_url = "https://raw.githubusercontent.com/elastic/hunspell/master/dicts/en_US/en_US.dic"
let soccer_dictionary_url = "./soccer_en_US.dic"

export async function loadDictionary(dictionary_url) {

    //let dictionary_url = "https://cgit.freedesktop.org/libreoffice/dictionaries/tree/en"
    let utf8decoder = new TextDecoder("Windows-1252");
    let dict = new Set()
    const regex = new RegExp('^[a-z]');
    function addLine(line) {
        if (regex.test(line)) {
            dict.add(line.split("/", 1)[0])
            //console.log("adding line: ", line)
        }
    }


    await fetch(dictionary_url)
        .then(response => {
            let reader = response.body.getReader()
            let oldText = ""
            reader.read().then(
                function processText({ done, value }) {
                    console.log("... reading new block ... ",dictionary_url)

                    if (done) {
                        console.log("Stream complete ... ", value);
                        return done;
                    }


                    let txt = utf8decoder.decode(value)
                    let lines = txt.split("\n");

                    // add the unfinished line from the last chunk
                    // to the 1st line of the current chunk...
                    lines[0] = oldText + lines[0]
                    oldText = lines.pop();
                    lines.forEach((line) => addLine(line))

                    return reader.read().then(processText);
                })
        })
    return dict;
}

async function create_dictionary() {
    let p1 = loadDictionary(hunspell_dictionary_url)
    let p2 = loadDictionary(soccer_dictionary_url)
    return await Promise.all([p1,p2]).then( ([s1,s2]) => {console.log(...s2); return new Set([...s1,...s2])} )
}

console.log("in spelling ", localforage)
window.dict = await create_dictionary()