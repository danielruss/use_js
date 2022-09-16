console.log('... load.js ...')

import * as math from 'https://cdn.skypack.dev/mathjs'
import * as papa from 'https://cdn.skypack.dev/papaparse'
console.log(math)
console.log(papa)

window.addEventListener("load", (event) => {
    let d1 = new YearMonth("2020-4")
    console.log(`d1: ${d1}`)
    console.log(`d1+8: ${d1.add(8)}`)
    console.log(`d1-3: ${d1.subract(3)}`)
    console.log(`d1-4: ${d1.subract(4)}`)
    console.log(`d1-9: ${d1.subract(9)}`)
});

function YearMonth(str) {
    let x = str.match(/^(\d+)\-(\d+)$/)
    this.month = parseInt(x[2]).toLocaleString(navigator.language, { minimumIntegerDigits: 2 })
    this.year = x[1]
}
YearMonth.prototype.isYearMonth = true
YearMonth.prototype.toString = function () {
    return `${this.year}-${this.month}`
}
// create an add function.  Note: YearMonth + integer = String
YearMonth.prototype.add = function (n) {
    let m = parseInt(this.month) + n
    let yr = parseInt(this.year) + ((m > 12) ? 1 : 0);
    // if month == 0, set it to 12
    let mon = (m % 12) || 12
    return new YearMonth(`${yr}-${mon}`).toString()
}
YearMonth.prototype.subract = function (n) {
    let m = parseInt(this.month) - n
    let yr = parseInt(this.year) - ((m > 0) ? 0 : 1);
    let mon = ((m + 12) % 12) || 12
    return new YearMonth(`${yr}-${mon}`).toString()
}
