console.log("in socwalk...")

class Universal_Sentence_Encoder {
    constructor() {
        console.log('constructor called')
        this.loaded=false;
    }

    async load_model(){
        this.loaded = false
        use.load().then(use_model => {
            this.use_model = use_model;
            console.log("... Model loaded ...")
            this.loaded = true
        })
    }

    static async initialize(modelURL){
        let inst = new u2()
        await inst.load_model()        
        return inst
    }
}


export class xw_soc1980_soc2010 extends Universal_Sentence_Encoder {
    constructor() {
        super()
        this.xw_loaded = false;
        this.XW_modelURL = "https://danielruss.github.io/SOCcer_USE/ensemble2_stt_20230307.model/model.json"
        this.soc1980={};
        this.s1980_ohe={};
    }

    async load_model(){
        this.loaded=false;
        this.xw_loaded=false;
        use.load().then( (use_model) =>{
            this.use_model = use_model;
            this.loaded = true;
            return tf.loadGraphModel(this.XW_modelURL)
        }).then( (xw_model) => {
            this.xw_model = xw_model;
            this.xw_loaded = true;
            return fetch("https://danielruss.github.io/codingsystems/soc1980_extended.json")
        }).then(blob => blob.json() )
        .then(json =>{
            let nci_codes = ['9800', '9994', '9954', '9996', '9953', '9590', '9530', '9992',  '9911', '9520', '9952', '9998', '9510', '9999', '9951']
            this.soc1980 = json.filter(code => code.Level=="unit" && !nci_codes.includes(code.soc1980_code))
            this.soc1980_codes = this.soc1980.map(code => code.soc1980_code)
            this.s1980_ohe = this.soc1980.reduce( (acc,cv,index,array) => {
                acc[cv.soc1980_code]=Array(array.length).fill(0);
                acc[cv.soc1980_code][index]=1;
                return acc
            },[])
            return fetch("https://danielruss.github.io/codingsystems/soc_2010_6digit.json")
        }).then(blob => blob.json() )
        .then(json =>{
            this.soc2010_codes = json
        })
    }
    

    static async initialize(xw_model_url,use_model_url){
        let inst = new xw_soc1980_soc2010()
        inst.modelURL = xw_model_url || inst.XW_modelURL
        inst.load_model()
        return inst
    }

    async predict(jobId,jobTitle,jobTask,soc1980){
        if (jobTask.length != jobTitle.length || jobTitle.length!=soc1980.length){
            throw new Error(`all lengths not equal ${jobTask.length} job tasks, ${jobTitle.length} jobtitles, and ${soc1980.length} soc1980 codes`)
        }

        if (!Array.isArray(jobTitle)) jobTitle=[ jobTitle ]
        if (!Array.isArray(jobTask)) jobTask=[ jobTask ]
        if (!Array.isArray(soc1980)) soc1980 = [ soc1980 ]

        let ptitle=this.use_model.embed(jobTitle)
        let ptask =this.use_model.embed(jobTask)


        // make sure the soc is a most-detailed soc1980, should warn the user....
        let s1980 = soc1980.map( s => this.s1980_ohe[soc1980] ?? Array(this.soc1980.length).fill(0) )
        s1980=tf.tensor( s1980,[s1980.length,s1980[0].length],"int32" )

        return await Promise.all([ptitle,ptask]).then( async ([title,task]) => {
            // convert the arrays to a dataset...
            // take [title], [task], [soc1980] and make
            // [ {title,task,soc1980} ...]

/*
            const dataset = tf.data.array( 
                title.reduce( (pv,cv,index) => pv.push({
                        job_title_inp: cv,
                        task: task[index],
                        soc1980_4d_inp: s1980[index]}), [])).batch(1);
*/            

            let prediction = await this.xw_model.predict( {job_title_inp:title,task:task,soc1980_4d_inp:s1980} )

            title.dispose();
            task.dispose();
            s1980.dispose();
            return {Id:jobId,JobTitle:jobTitle,JobTask:jobTask,soc1980:soc1980,prediction:prediction.arraySync()};
        })

    }
}

