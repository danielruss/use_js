function parseCSVStream(file) {
    console.log("... parseCSV...")
    let nchuck=0
    Papa.parse(file, {
        chunk: function (results) {
            console.log(++nchuck)            
            console.log(results)
        }

    })
}

window.addEventListener("load", () => {

    let dropBox = document.body

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