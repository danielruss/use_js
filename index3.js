console.log("... in index3.js ...")

function displayError(errorMsg) {
    document.getElementById("errorMessage").innerText = errorMsg
}
function clearRes(){
    displayError("")
    let nrows = document.getElementById("nrows")
    nrows.value=10

    soccer_results=[]
    row=0;
    table_start=0;
    update_table()
}

async function parseFile(file) {
    console.log(`parsing ${file.name}`)
    let progressBar = document.getElementById("progressElement")
    progressBar.value = 0
    progressBar.max = 0
    Papa.parse(file, {
        beforeFirstChunk: check,
        skipEmptyLines: false,
        step: parseRow,
        header: true,
        complete: finishedParsing,
        completedRow: 0,
        lforage: localforage.createInstance({ name: file.name, storeName: 'results' })
    })
}

let row = 0;
let soccer_results = []
let table_start = 0;

function check(results, parser) {
    row = 0
    soccer_results = []
/*     firstLine = results.split('\n')[0]
    console.log("=====>",parser)
    if (!firstLine.includes("JobTitle") || !firstLine.includes("JobTask") || !firstLine.includes("Id")) {
        let reason = "Columns must include Id,JobTitle, and JobTask";
        displayError(reason)
        return { action: "abort", reason: reason }
    } */

}

function update_table() {
    let n = parseInt( document.getElementById("nrows").value )
    console.log(n)
    let resDiv = document.getElementById("resultsDiv")
    if (soccer_results.length>0){
        resDiv.style.display="inherit"
    }else{
        resDiv.style.display="none"
        return
    }

    table_start = Math.max(0,table_start)
    let minrow = Math.min(table_start, soccer_results.length)
    let maxrow = Math.min(table_start + n, soccer_results.length)
    document.getElementById("prevrows").disabled = (table_start==0)
    document.getElementById("nextrows").disabled = (table_start+n >= soccer_results.length)
    console.log("updating table total rows: ", soccer_results.length, table_start, n, table_start+n)
    console.log(`from ${minrow} - ${maxrow}`)

    let headElement = document.getElementById("soccerResultsHead")
    headElement.innerText=""

    let bodyElement = document.getElementById("soccerResultsBody")
    bodyElement.innerText = ""
    if (maxrow > minrow) {
        build_table_head(soccer_results[0],headElement)
        for (let indx = minrow; indx < maxrow; indx++) {
            build_table_row(soccer_results[indx], bodyElement)
        }
    }
}


function build_table_head(result, headElement) {
    let rowElement = document.createElement("tr")
    // metadata...
    let metadata = ["Id", "JobTitle", "JobTask"]
    metadata.forEach(md =>
        rowElement.insertAdjacentElement("beforeend", build_table_data(md))
    )
    result.results.forEach((sr, indx) => {
        rowElement.insertAdjacentElement("beforeend", build_table_data(`soc2010_${indx+1}`))
        rowElement.insertAdjacentElement("beforeend", build_table_data(`score_${indx+1}`))
    })

    headElement.insertAdjacentElement("beforeend", rowElement)
}
function build_table_row(result, bodyElement) {
    let rowElement = document.createElement("tr")
    // metadata...
    let metadata = ["Id", "JobTitle", "JobTask"]
    metadata.forEach(md =>
        rowElement.insertAdjacentElement("beforeend", build_table_data(result.input[md]))
    )
    result.results.forEach(sr => {
        rowElement.insertAdjacentElement("beforeend", build_table_data(sr.soc2010.code))
        rowElement.insertAdjacentElement("beforeend", build_table_data(sr.score.toFixed(3)))
    })

    bodyElement.insertAdjacentElement("beforeend", rowElement)
}
function build_table_data(value){
    let cellElement = document.createElement("td")
    cellElement.innerText=value
    return cellElement
}

function parseRow(results, parser) {
    if (row==0){
        if ( !['Id', 'JobTitle', 'JobTask'].every(item => item in results.data ) ){
            let reason = "Columns must include Id,JobTitle, and JobTask";
            displayError(reason)
            parser.abort();
            return
        }
    }
    let currentRow = row++
    let progressBar = document.getElementById("progressElement")
    progressBar.max = row
    soccer_use.predict(results.data.JobTitle, results.data.JobTask, n = 10).then( (res) => {
        console.log(currentRow, results.data.Id, res)
        config = parser.streamer._config
        lforage = config.lforage
        lforage.setItem(results.data.Id, { input: results.data, results: res })
        soccer_results.push({ input: results.data, results: res })
        progressBar.value = (++config.completedRow / row) * 100
        progressBar.max = 100
        if (config.completedRow == row) {
            console.log(" === ALL Done ===")
            update_table()
        }
    })
}

function finishedParsing(results, parser) {
    console.log(" rows parsed ")
}
window.addEventListener("load", () => {
    const dropTarget = document.getElementById("drop")
    dropTarget.addEventListener("dragenter", (event) => {
        event.preventDefault()
        event.target.classList.add("over")
        console.log("enter: ", event)
    })
    dropTarget.addEventListener("dragleave", (event) => {
        event.preventDefault()
        event.target.classList.remove("over")
        console.log("exit: ", event)
    })
    dropTarget.addEventListener("dragover", (event) => {
        event.preventDefault()
    })
    dropTarget.addEventListener("drop", (event) => {
        event.preventDefault()
        clearRes()
        event.target.classList.remove("over")
        if (event.dataTransfer.files) {
            [...event.dataTransfer.files].forEach((file, indx) => {
                if (file.type == "text/csv") {
                    parseFile(file)
                } else {
                    console.log(`not parsing ${file.name} `, file)
                }
            })
        }
    })
    document.addEventListener("soccerready", (event) => {
        console.log(event)
        dropTarget.innerText = (event.detail.ready) ? "Drop File Here" : "Model loading.  Please wait"
    });

    document.getElementById("fireEventButton").addEventListener("click", () => {
        console.log(soccer_use.loaded)
        document.dispatchEvent(new CustomEvent("soccerready", { detail: { ready: soccer_use.loaded } }));
    })
    document.getElementById("fireEventButton").click()

    document.getElementById("prevrows").addEventListener("click",()=>{
        table_start -= parseInt( document.getElementById("nrows").value )
        update_table()
    })
    document.getElementById("nextrows").addEventListener("click",()=>{
        table_start += parseInt( document.getElementById("nrows").value )
        update_table()
    })
    document.getElementById("nrows").addEventListener("change",()=>{
        update_table()
    })
    update_table()
});