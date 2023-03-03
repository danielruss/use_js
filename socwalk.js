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
        this.XW_modelURL = "https://danielruss.github.io/SOCcer_USE/soc1980_2010_xw_estt/model.json"
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
            this.s1980_ohe = this.soc1980.reduce( (acc,cv,index,array) => {
                acc[cv.soc_code]=Array(array.length).fill(0);
                acc[cv.soc_code][index]=1;
                return acc
            },{})
        })
    }

    static async initialize(xw_model_url,use_model_url){
        let inst = new xw_soc1980_soc2010()
        inst.modelURL = xw_model_url || inst.XW_modelURL
        inst.load_model()
        return inst
    }

    async predict(jobTitle,jobTask,soc1980){
        let ptitle=this.use_model.embed(jobTitle)
        let ptask =this.use_model.embed(jobTask)

        // make sure the soc is a most-detailed soc1980, should warn the user....
        let s1980 = tf.tensor( [ this.s1980_ohe[soc1980] ?? Array(this.soc1980.length).fill(0) ])

        return await Promise.all([ptitle,ptask]).then( async ([title,task]) => {
            console.log(`JobTitle: ${jobTitle} ${title.shape},\nJobTask: ${jobTask} ${task.shape},\n soc1980: ${s1980.shape}`)
            let prediction = await this.xw_model.predict( {"job_title_inp":title,"job_task_inp":task,"soc1980_inp":s1980})
            title.dispose();
            task.dispose();
            s1980.dispose();
            prediction.print();
            return Array.from(prediction.dataSync());
        })
    }
}

