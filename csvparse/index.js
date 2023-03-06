
console.log("...in index.js...")

let indxTbl=null;

function makeIndex() {
    let lblElement = document.getElementById("inIDB")
    let s = ""
    indxTbl.iterate((v, k, i) => {
    });
}

function parseCSVStream(file) {

    indxTbl.setItem(file.name, Date())

    console.log(file.name)
    let dtaStore = localforage.createInstance({
        name: "csvparse",
        storeName: file.name
    })


    let indx = 0;
    Papa.parse(file, {
        header: true,
        step: async function (row) {
            dtaStore.setItem(indx.toString(16).padStart(5, "0"), row.data)
            //setTimeout(()=>{console.log(`${++indx} Row:`, row.data)},2000)
            console.log(`ding ding - ${row.data}`)
            await new Promise( (resolve,reject) => {
                setTimeout( ()=>{
                    console.log(console.log(`${++indx} Row:`, row.data));
                    resolve(row.data)
                } , 2000)
            } )
        },
    })
}



window.addEventListener("load", () => {
    indxTbl = localforage.createInstance({
        name: "csvparse",
        storeName: "index"
    });

    let dropBox = document.querySelector(".dropbox")
    console.log(dropBox)

    dropBox.addEventListener("dragover", (event) => {
        event.preventDefault();
        event.stopPropagation();
    });

    dropBox.addEventListener("drop", (event) => {
        event.preventDefault()
        console.log(event)
        if (event.dataTransfer.files) {
            [...event.dataTransfer.files].forEach((file, i) => {
                if (file.type != "text/csv")
                    console.log(`file[${i}].name = ${file.name}  type=${file.type}`)
                parseCSVStream(file)
            })
        }
    });

    dropBox.addEventListener("dragEnter", (event) => console.log("drag enter"))

});