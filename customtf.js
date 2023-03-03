// https://gist.github.com/caisq/33ed021e0c7b9d0e728cb1dce399527d
class DansEnsemble extends tf.layers.Layer {
    constructor(config) {
        super(config);
        this.getActivation(config)
    }

    getActivation(config){
        if (config?.activation){
            console.log(config.activation)
            this.activation = tf.layers.activation({activation:config.activation[0]});
        }
    }

    build(inputShape) {
        this.kernel = this.addWeight('kernel', [inputShape.length], 'float32', tf.initializers.glorotUniform())
        this.bias = this.addWeight('bias', [1], 'float32', tf.initializers.glorotUniform())
    }

    call(input) {
        console.log(".... in call ....")
        return tf.tidy(() => {
            let a = tf.cast( tf.stack(input,1), "float32" );
            let w = this.getWeights()[0];
            let b = this.getWeights()[1];
            let output = tf.add( tf.matMul(w.reshape([1,-1]),a), b )
            if (this.activation){
                output = this.activation.apply(output)
            }
            return output
        });
    }

    computeOutputShape(inputShape) {
        return inputShape[0]
    }
    static get className() {
        return 'DansEnsemble';
    }
}
tf.serialization.registerClass(DansEnsemble);

