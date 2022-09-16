class loop {
    constructor() {
        this.questions = []
        this.loopId = ""
        this.iteration = 0
        this.maximumIterations = 1
        this.qtype = "loop"
    }

    get classname() {
        return this.qtype
    }
    push(q) {
        this.questions.push(q)
    }


}

class question {
    constructor(markdown) {
        this.markdown = markdown
        this.qtype = "question"
    }
}
question.prototype.valueOf = function () {
    return this.markdown
}

function makeIterator(arr, name) {
    let maxIndx = arr.length
    let child_iterator = null;
    let indx = 0;

    return {
        next() {
            if (indx >= maxIndx) {
                return { value: null, done: true }
            }

            // are we already in a loop?
            if (child_iterator) {
                let value = child_iterator.next()
                if (!value.done) return value
                child_iterator = null
            }

            // are we starting a loop?
            if (arr[indx].qtype == "loop") {
                child_iterator = makeIterator(arr[indx].questions, name + '_1')
                indx++;
                // should return the first child of the
                // loop OR if the loop is empty the 
                // next element in the array.
                return this.next()
            }

            results = { value: arr[indx], done: false }
            indx++;
            return results;
        }
    }
}

function parse(markdown) {
    // questions start at [A-Z and
    // end the next question, <loop, or the end of string.

    regex = /\[[A-Z_]|<\/?loop|<\/?grid|$/g
    let breaks = [...markdown.matchAll(regex)]
    console.log(breaks)
    let questions = breaks.map((value, index, arr) => {
        if (index == arr.length - 1) return ""
        return markdown.slice(value.index, arr[index + 1].index)
    });
    questions.pop()
    questions = questions.reduce((old_value, new_value) => {
        if (new_value.startsWith("<loop")) {
            old_value.loop = new loop();
            old_value.push(old_value.loop);
            return old_value;
        }
        if (new_value.startsWith("</loop")) {
            delete old_value.loop;
            return old_value;
        }

        let arr = (old_value.loop) ? old_value.loop : old_value;
        arr.push(new question(new_value));


        return old_value;
    }, [])

    return questions
}