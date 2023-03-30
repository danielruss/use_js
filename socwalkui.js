import Papa from 'https://cdn.skypack.dev/papaparse-min';
import { xw_soc1980_soc2010 } from './socwalk.js';

console.log("in socwalkui....")

let soc1980_xw = {};




(async function () {
    console.log("....")
    soc1980_xw = await xw_soc1980_soc2010.initialize()
    window.soc1980_xw = soc1980_xw;
}())

// https://stackoverflow.com/a/70351533
Array.prototype.sortIndices = function (compare) {
    const arr = this
    const indices = new Array(arr.length).fill(0).map((_, i) => i)

    return indices.sort((a, b) => compare(arr[a], arr[b]))
}

function handleFile(event) {
    if (event.target.files.length > 0) {
        let xw = undefined;

        // select the soc1980 or the noc10
        switch (event.target.id) {
            case 'soc1980_file':
                console.log(soc1980_xw)
                xw = soc1980_xw;
                break;
            default:
                return
        }

        if (!xw) return;
        console.log(`analyzing ${event.target.files[0].name} type: ${event.target.files[0].type}`)
        switch (event.target.files[0].type) {
            case 'application/json':
                handleJSON(event.target.files[0], xw);
                break;
            case 'text/csv':
                handleCSV(event.target.files[0], xw);
                break;
            default:
                console.log(`${event.target.files[0].type} is not supported`)
        }
    }

}

async function handleCSV(file, crosswalk) {

    let num_rows = 0;
    let max_rows = -1;
    let pb = document.getElementById("socxwpb")
    let label = document.getElementById("label1")
    console.log(" ... counting rows ...")

    Papa.parse(file, {
        header: true,
        step: function () {
            num_rows++;
        },
        complete: function () {
            pb.classList.remove("d-none")
            pb.value = 0
            max_rows = (max_rows > 0) ? max_rows : num_rows;
            pb.max = max_rows
            console.log(max_rows)
        }
    })


    let row_number = 0;
    let finished_jobs = 0
    let predictions = [];
    let resultsTable = document.getElementById("resultsTable").tBodies[0]
    Papa.parse(file, {
        header: true,
        beforeFirstChunk: function () {
            resultsTable.innerText = ""
            pb.value = 0;
            label.innerText = ` analyzed (0/${max_rows})`
        },
        /*
        step: function(results,parser){
            if (Object.keys(results.data).length>1 && row_number<max_rows){
                parser.pause()
                let job_description=results.data;
                row_number++;
                crosswalk.predict(job_description.JobTitle,job_description.JobTask,job_description.soc1980)
                .then((prediction) => {
                    let indx = prediction.sortIndices((a, b) => b - a)
                    let codes = indx.map( index=>soc1980_xw.soc2010_codes[index].code  )
                    let score = indx.map( index => prediction[index] )
                    codes.length=10;
                    score.length=10;
                    predictions.push(
                        {
                            Id: job_description.Id,
                            JobTitle: job_description.JobTitle,
                            JobTask: job_description.JobTask,
                            soc1980: job_description.soc1980,
                            soc2010: codes,
                            score: score
                        }
                    )
                    finished_jobs++;
                    if (finished_jobs % 50 == 0) {
                        pb.value=row_number;
                        label.innerText= ` analyzed (${finished_jobs}/${max_rows})`
                        console.log(results,finished_jobs,max_rows,num_rows)
                    }
                    if (finished_jobs>=max_rows){
                        console.log("... all done ... ",finished_jobs)
                        pb.value=finished_jobs;
                        label.innerText= ` analyzed (${finished_jobs}/${max_rows})`
                        downloadPredictions(predictions)
                    }
                })
                parser.resume()
            }
            

            
        }, */
        chunkSize: 1024,
        chunk: function (results, parser) {
            parser.pause()
            let last = results.data.pop();
            if (last?.Id) {
                results.data.push(last)
            }
            console.log(`... working on chunk ${++row_number} ${results.data.length}`)

            let jobId = results.data.map(x => x.Id)
            let jobTitle = results.data.map(x => x.JobTitle)
            let jobTask = results.data.map(x => x.JobTask)
            let s1980 = results.data.map(x => x.soc1980)
            /*
                        let tmp = jobId.map(id=>({Id:id,JobTitle:"test"}))
                        predictions.push(...tmp)
                        */
            let allcodes = document.getElementById("all400").Checked;
            crosswalk.predict(jobId, jobTitle, jobTask, s1980)
                .then(res => {
                    //console.log("res ===> \n", res);

                    let chunk_res = [];
                    if (allcodes) {
                        chunk_res = results.Id.map((id, index) =>
                        ({
                            Id: id, JobTitle: res.JobTitle[index], JobTask: res.JobTask[index],
                            soc1980: res.soc1980[index], predictions: res.prediction[index],
                            soc2010: soc1980_xw.soc2010_codes.slice(0, -1)
                        }))
                    } else {
                        chunk_res = res.Id.map((id, index) => {
                            // for each job in the chunk, fill the job metadata in the job_result
                            let job_result = {
                                Id: id, JobTitle: res.JobTitle[index], JobTask: res.JobTask[index],soc1980:res.soc1980[index],
                                soc2010: [], score: []
                            };

                            // sort the predictions and add to them to the job result
                            let indx = res.prediction[index].sortIndices((a, b) => b - a)
                            //console.log(indx,"\t",soc1980_xw.soc2010_codes[indx[0]].code,":  ",res.prediction[index][indx[0]])
                            for (let i = 0; i < 10; i++) {
                                job_result.soc2010.push(soc1980_xw.soc2010_codes[indx[i]].code)
                                job_result.score.push(res.prediction[index][indx[i]])
                            }
                            //console.log(job_result)
                            return job_result
                        })
                    }

                    predictions.push(...chunk_res);
                    finished_jobs += chunk_res.length
                    pb.value = finished_jobs;
                    label.innerText = ` analyzed (${finished_jobs}/${max_rows})`
                    parser.resume()
                })


        },
        complete: function () {
            console.log("...complete called...")
            downloadPredictions(predictions)
        },
        complete1: function (results) {
            // the last results is undefined...
            results.data.pop()

            let jobTitle = results.data.map(x => x.JobTitle)
            let jobTask = results.data.map(x => x.JobTask)
            let s1980 = results.data.map(x => x.soc1980)

            jobTitle.forEach((x, indx) => {
                if (!x) console.log(indx, x, jobTask[indx], s1980[indx])
            })

            // this tends to CRASH my laptop
            //crosswalk.predict(jobTitle,jobTask,s1980)
            //.then(predictions => console.log("... all done ..."))
        }
    })
}

function downloadPredictions(predictions) {
    console.log(".... preparing download ....")
    //    let dl = predictions.map(pred => {
    //        pred.soc2010.length=10;
    //        pred.score.length=10;
    //        return pred;
    //   })
    downloadJSONObject(predictions)
}

function addRow(element, results) {
    let indx = results.prediction.sortIndices((a, b) => b - a)
    let rowData = {
        Id: results.input.Id,
        JobTitle: results.input.JobTitle,
        JobTask: results.input.JobTask,
        soc1980: results.input.soc1980,
        soc2010: [],
        score: []
    }
    let rowElement = element.insertRow()
    let cellElement = rowElement.insertCell(); cellElement.innerText = rowData.Id;
    cellElement = rowElement.insertCell(); cellElement.innerText = rowData.JobTitle;
    cellElement = rowElement.insertCell(); cellElement.innerText = rowData.JobTask;
    cellElement = rowElement.insertCell(); cellElement.innerText = rowData.soc1980;

    for (let i = 0; i < 10; i++) {
        rowData.soc2010.push(soc1980_xw.soc2010_codes[indx[i]].code)
        rowData.score.push(results.prediction[indx[i]])

        cellElement = rowElement.insertCell(); cellElement.innerText = soc1980_xw.soc2010_codes[indx[i]].code; cellElement.classList.add("text-nowrap")
        cellElement = rowElement.insertCell(); cellElement.innerText = results.prediction[indx[i]].toFixed(4);
    }
    rowElement.dataset.data = JSON.stringify(rowData)
}


async function handleJSON(file, crosswalk) {
    let reader = new FileReader()
    let predictions = []
    reader.addEventListener("load", async (event) => {
        let dta = JSON.parse(reader.result)
        console.table(dta.slice(0, 30))
        predictions = await Promise.all(dta.slice(0, 20).map(
            async (x) =>
                crosswalk.predict(x.JobTitle, x.JobTask, x.soc1980)
                    .then((prediction) => {
                        return {
                            "Id": x.Id,
                            "prediction": prediction
                        }
                    })
        ));
        console.table(predictions)
    })
    reader.readAsText(file)
}

function downloadJSONObject(obj) {
    const fileName = `${window.crypto.randomUUID()}.json`
    const str = JSON.stringify(obj)
    const blob = new Blob([str], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName;
    a.click()
    URL.revokeObjectURL(url)
}

function s1980jsonDL(event) {
    let resultsTable = document.getElementById("resultsTable").tBodies[0]
    if (resultsTable.children.length > 0) {
        let dta = Array.from(resultsTable.children).map(row => row.dataset.data)
        downloadJSONObject(dta)
        return;
    }
    console.log('... no results ...')
}
window.addEventListener("load", () => {
    document.getElementById("soc1980_file").addEventListener("change", handleFile)
    document.getElementById("s1980jsonDL").addEventListener("click", (event) => s1980jsonDL(event))

    /*
        document.getElementById("soc1980xwButton").addEventListener("click", ()=>{
            value = document.getElementById("soc1980_file").value
            console.log(`value: ${value}`)
            if (value.trim().length>0){
                console.log(`=== run ${value}`)
            }
        })
    */
})