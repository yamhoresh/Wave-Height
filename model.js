const tf = require('@tensorflow/tfjs');
const fs = require('fs');


async function train() {

    const table = JSON.parse(fs.readFileSync('data/wavesHaifa.json'));
    const [data, maxData, meanData] = preprocess(table);
    const ys = data.gather(3, 1).slice(2);
    const xs = data.slice([0, 0], [table.length - 3]);
    // const a = tf.data.array(table);
    // await a.forEachAsync(e => console.log(e));


    const model = tf.sequential();
    model.add(tf.layers.dense({units: 100, activation: 'relu', inputShape: [8]}));
    model.add(tf.layers.dense({units: 1, activation: 'linear'}));
    model.compile({optimizer: 'sgd', loss: 'meanSquaredError'});
    // const layerTest = tf.layers.gru({units: 8, returnSequences: false});


    await model.fit(xs, ys, {
            epochs: 100,
            // callbacks: {
            //     onEpochEnd: (epoch, log) => console.log(`Epoch ${epoch}: loss = ${log.loss}`)
            // }
        }
    );
    return model;
}

function prediction(model) {

    const table = JSON.parse(fs.readFileSync('data/wavesHaifa.json'));
    const [data, maxData, meanData] = preprocess(table);
    let xs = data.gather(table.length - 2).reshape([1, -1]);
    let pred = model.predict(xs);
    pred = pred.mul(maxData.gather(3)).add(meanData.gather(3));
    return pred.arraySync()[0][0];
}

function preprocess(table) {
    let tens = null;
    for (let elem of table.slice(1)) {
        elem = elem.slice(2).map(Number);
        elem[3] = Math.cos(elem[3] / 180 * Math.PI);
        if (tens === null) {
            tens = tf.tensor(elem);
        } else {
            tens = tens.concat(tf.tensor(elem));
        }
    }
    tens = tens.reshape([table.length - 1, -1]);
    const meanData = tens.mean(0);
    tens = tens.sub(meanData);
    const maxData = tens.max(0);
    tens = tens.div(maxData);
    return [tens, meanData, maxData];
}

// train().then(res => predict(res));

exports.train = train;
exports.prediction = prediction;