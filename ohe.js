let s1980 = await (await fetch("https://danielruss.github.io/codingsystems/soc1980_most_detailed.json")).json()
let s1980x = await (await fetch("https://danielruss.github.io/codingsystems/soc1980_extended.json")).json()

let nci_codes = ['9800', '9994', '9954', '9996', '9953', '9590', '9530', '9992',  '9911', '9520', '9952', '9998', '9510', '9999', '9951']
s1980x = s1980x.filter(code => code.Level=="unit" && !nci_codes.includes(code.soc1980_code))
console.log(s1980x)

let s1980_one = s1980.reduce( (acc,cv,index,array) => {
    acc[cv.soc_code]=Array(array.length).fill(0)
    acc[cv.soc_code][index]=1;
    return acc
},{})

function s1980_dec(ohe_value){
    let indx = ohe_value.indexOf(1)
    return indx!=-1?s1980[indx].soc_code:null
}