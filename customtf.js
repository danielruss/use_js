// https://gist.github.com/caisq/33ed021e0c7b9d0e728cb1dce399527d
class DansEnsemble extends tf.layers.Layer {
    constructor(config) {
        super(config);
        console.log(config)
    }

    build(inputShape) {
        this.w = this.addWeight('w', [inputShape.length], 'float32', tf.initializers.glorotUniform())
//        this.w = this.addWeight('w', [inputShape.length], 'float32', tf.initializers.constant({value:2}))
    }

    call(input) {
        console.log(".... in call ....")
        this.getWeights()[0].print()
        return tf.tidy(() => {
            let a = tf.cast( tf.stack(input,1), "float32" );
            a.print()
            let w = this.getWeights()[0];
            tf.matMul(w.reshape([1,-1]),a).print()
            return tf.matMul(w.reshape([1,-1]),a)
        });
    }

    computeOutputShape(inputShape) {
        console.log("... in compute output shape ... ",inputShape)
        return inputShape[0]
    }
    static get className() {
        return 'DansEnsemble';
    }
}
tf.serialization.registerClass(DansEnsemble);