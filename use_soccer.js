function sortIndex(array){
    return( Array.from(Array(array.length).keys())
    .sort((a, b) => array[a] > array[b] ? -1 : (array[b] > array[a]) | 0) )
}
Array.prototype.select_elements = function(indices){
    if ( !Array.isArray(indices) ) throw 'indices is not an array'
    let results = [];
    return indices.map( x => this[x] )
}

class Soccer_USE {
    constructor(){
        this.loaded = false;
        let modelURL = "https://tfhub.dev/tensorflow/tfjs-model/universal-sentence-encoder-lite/1/default/4"
        use.load().then((use_model)=>{
            this.use_model=use_model
            modelURL= "https://danielruss.github.io/SOCcer_USE/soccer_use_tfjs/model.json"
            return tf.loadLayersModel(modelURL)
        }).then( (soccer_model) => {
            this.soccer_use = soccer_model
            tf.tidy( ()=>{
                const title = tf.ones([1,512])
                const task = tf.ones([1,512])
                this.soccer_use.predict([title,task])
            } )
        }).then( ()=>this.loaded=true )
        fetch("https://danielruss.github.io/codingsystems/soc_2010_6digit.json")
            .then( (response) => response.json() )
            .then( (data) =>  this.soc2010=data)
    }

    async predict(jobTitle,jobTask,n=10){
        if (!this.loaded) return(null)

        console.log(`job title: ${jobTitle}\njob task: ${jobTask}`)
        let ptitle=this.use_model.embed(jobTitle)
        let ptask =this.use_model.embed(jobTask)
        return await Promise.all([ptitle,ptask]).then( ([title,task]) => {
            let t1=this.soccer_use.predict([title,task]);
            task.dispose();
            title.dispose();
            return t1 
        }).then( (t1)=> {
            let socRes=Array.from(t1.dataSync());
            t1.dispose();
            let indices=sortIndex(socRes).splice(0,n)
            let scores=socRes.select_elements(indices)
            let socs = this.soc2010.select_elements(indices)
            socRes = scores.map((score,rank)=>({"soc2010":socs[rank],"score":score}))
            return socRes
        })
        
    }
}


const soccer_use = new Soccer_USE()
function is_loaded(){
    return soccer_use.loaded
}

