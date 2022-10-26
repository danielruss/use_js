
console.log(" ... in logic.js ...")


function init(rootElement) {
    if (!rootElement || !(rootElement instanceof HTMLElement)) {
        console.error("Root element is not defined... using the document")
        rootElement = document
    }

    // add callbacks to handle "other w/textbox"
    rootElement.querySelectorAll('.row > input[type="checkbox"]+label+input[type="text"]').forEach(other => handleOther(other))
    rootElement.querySelectorAll('.row > input[type="radio"]+label+input[type="text"]').forEach(other => handleOther(other))
    function handleOther(other) {
        let cb = other.parentElement.firstElementChild;
        other.style.display = (cb.checked) ? "initial" : "none";
        other.dataset.hideOnEmpty = "true";
        other.addEventListener("hide", (event) => {
            console.log("... received hide event....")
            other.dataset.lastvalue = other.value
            other.value = ""
            other.style.display = "none"
            console.log(`saved ${other.dataset.lastvalue} as last value`)
        })
        other.addEventListener("show",(event)=>{
            console.log("... received show event....")
            if (other.dataset?.lastvalue) other.value = other.dataset.lastvalue
            other.dataset.lastvalue = ""
            other.style.display = "initial"
            other.focus()
        })

        // for radioButtons, we need to catch if ANY of the RB are clicked and clear the
        // the other button (note: this alway clears)
        if (cb.type == "radio") {
            rootElement.querySelectorAll(`[type="radio"][name="${cb.name}"]`).forEach(radio => {
                if (radio.id != cb.id) {
                    radio.addEventListener("change", () => other.dispatchEvent(new Event("hide")))
                } else {
                    radio.addEventListener("change", () => other.dispatchEvent(new Event("show")))
                }
            });
        } else {
            cb.addEventListener("change", (event) => {
                if (cb.checked) {
                    other.dispatchEvent(new Event("show"))
                } else {
                    other.dispatchEvent(new Event("hide"))
                }
            })
        }



        other.addEventListener("keyup", (event) => {
            cb.checked = other.value.trim().length > 0
        })
        other.addEventListener("blur", (event) => {
            cb.checked = other.value.trim().length > 0
            other.style.display = (cb.checked) ? "initial" : "none"
        })
    }

    // add callback for radio/combobox and check for resets
    rootElement.querySelectorAll('input[type="checkbox"],input[type="radio"]').forEach(ele => {
        ele.addEventListener("click", radioOrCheckboxClicked)
        if (ele.dataset?.reset) {
            addReset(ele)
        }
    });

    // add callbacks for next/previous
    rootElement.querySelectorAll("[data-button-type]").forEach((button) => button.addEventListener("click", changeQuestion))

    // callback to add State/Country Autocomplete
    function addOptionsToDataList(listId, options) {
        let listElement = rootElement.getElementById(listId)
        if (!listElement) {
            console.error(`listElement with id: ${listId} does not exist`)
            return
        }
        options.forEach(opt => listElement.insertAdjacentHTML("beforeend", `<option value="${opt}">`))
    }
    addOptionsToDataList("CountryList", ["USA", "Canada", "Mexico"])
    addOptionsToDataList("StateList", ["Alabama", "Alaska", "Arizona", "Arkansas", "American Samoa", "California",
        "Colorado", "Connecticut", "Delaware", "District of Columbia", "Florida", "Georgia", "Guam", "Hawaii", "Idaho",
        "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
        "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
        "New York", "North Carolina", "North Dakota", "Northern Mariana Islands", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
        "Puerto Rico", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Trust Territories",
        "Utah", "Vermont", "Virginia", "Virgin Islands", "Washington", "West Virginia", "Wisconsin", "Wyoming"])
}

// back or previous was clicked
function changeQuestion(event) {
    let currentQuestion = event.target.closest(".question")
    // if somehow we get here with incorrectly... just return
    if (event.target.dataset.buttonType == "previous") previousPage(currentQuestion)
    if (event.target.dataset.buttonType == "next") nextPage(currentQuestion)
}

function previousPage(currentQuestion) {
    console.log(` go back from the current question: ${currentQuestion.id}`)
}

function nextPage(currentQuestion) {
    console.log(` go forward from the current question: ${currentQuestion.id}`)
    // save data to LF/OTHER
    // check for No Response
    //currentQuestion.querySelectorAll("input,textarea")
}

function radioOrCheckboxClicked(event) {
    let element = event.target;
    console.log("Radio or Checkbox clicked")
    if (element.dataset?.resetValue) {
        reset(element)
    }
}

function addReset(element) {
    if (!element?.name) return
    let currentQuestion = element.closest(".question")

    currentQuestion.querySelectorAll(`[name=${element.name}]`).forEach((ele) => {
        ele.dataset.resetValue = (ele.dataset?.resetValue) ? `${ele.dataset.resetValue},${element.value}` : element.value
        console.log(`${element.id} <-> ${ele.id}`)
    });

}

// either we need to reset all the values
// or rest the reset values.
function reset(element) {
    function clearValue(e) {
        if (['radio', 'checkbox'].includes(e.type)) {
            e.checked = false
        } else {
            e.dispatchEvent(new Event("hide"))
            e.value = ""
        }
    }

    if (!element.dataset.resetValue) return

    let currentQuestion = element.closest(".question")
    let resetValues = element.dataset.resetValue.split(",")
    let resetElement = resetValues.includes(element.value)

    if (resetElement) {
        // we are a reset element, clear all other values...
        currentQuestion.querySelectorAll(`[name=${element.name}]`).forEach((ele) => {
            console.log("reset all other choices....")
            if (ele.value != element.value) clearValue(ele)
        })
    } else {
        // there are reset nodes, clear them...
        currentQuestion.querySelectorAll(`[name=${element.name}]`).forEach((ele) => {
            console.log("reset all resetValues...")
            if (resetValues.includes(ele.value)) clearValue(ele)
        })
    }
}
