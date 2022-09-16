
const numberRegex = /\|__\|(?:(?:__\|))(?:([^|]+)\|(?!__))?/
function replaceNumber(full, params) {
    console.log(`full match: ${full}\nparams: ${params}`)
}

const radioRegex = //


function renderMarkdown(markdown) {
    console.log(markdown)
    // replace |__|__| with type=number 
    markdown = markdown.replace(numberRegex, replaceNumber)

    return markdown
}