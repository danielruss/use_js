import Papa from 'https://cdn.skypack.dev/papaparse-min';
import {xw_soc1980_soc2010} from './socwalk.js';

console.log("in socwalkui....")

let soc1980_xw = {};


( async function(){
    console.log("....")
    soc1980_xw = await xw_soc1980_soc2010.initialize()
    window.soc1980_xw = soc1980_xw;
}() )

function handleFile(event){
    if (event.target.files.length > 0){
        let xw = undefined;

        // select the soc1980 or the noc10
        switch(event.target.id) {
            case 'soc1980_file':
                console.log(soc1980_xw)
                xw = soc1980_xw;
                break;
            default:
                return
        }

        if (!xw) return;
        console.log(`analyzing ${event.target.files[0].name} type: ${event.target.files[0].type}`)
        switch(event.target.files[0].type) {
            case 'application/json':
                handleJSON(event.target.files[0],xw);
                break;
            case 'text/csv':
                handleCSV(event.target.files[0],xw);
                break;
            default: 
                console.log(`${event.target.files[0].type} is not supported`)
        }
    }

}

async function handleCSV(file,crosswalk){
    let row_number=0
    let predictions = [];
    Papa.parse(file,{
        header: true,
        step: function(results){
            if (Object.keys(results.data).length>1 && row_number<4){
                let job_description=results.data;
                row_number++;
                console.log(results,row_number)
                crosswalk.predict(job_description.JobTitle,job_description.JobTask,job_description.soc1980)
                .then(prediction => predictions.push( {
                    "Id":results.data.Id,
                    "prediction": prediction
                }))
            }
        },
        complete: function(results){
            console.log(`all done: `,results)
            console.log(predictions)
        }
    })
    return predictions;
}

async function handleJSON(file,crosswalk){
    let reader = new FileReader()
    let predictions = []
    reader.addEventListener("load",async (event)=>{
        let dta = JSON.parse(reader.result)
        console.table(dta.slice(0,30))
        predictions=await Promise.all( dta.slice(0,20).map(
            async (x)=> 
                crosswalk.predict(x.JobTitle,x.JobTask,x.soc1980)
                .then((prediction) => {
                    return {
                        "Id":x.Id,
                        "prediction":prediction
                    }
                })
        ));
        console.log(predictions)
    })
    reader.readAsText(file)
    console.log(file)

}

window.addEventListener("load",()=>{
    document.getElementById("soc1980_file").addEventListener("change",handleFile)
    document.getElementById("soc1980xwButton").addEventListener("click", ()=>{
        value = document.getElementById("soc1980_file").value
        console.log(`value: ${value}`)
        if (value.trim().length>0){
            console.log(`=== run ${value}`)
        }
    })
})