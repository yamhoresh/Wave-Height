const fs = require('fs');
const express = require('express');
const cron = require('node-cron');
const getData = require('./getData');
const tfModel = require('./model.js');
let lastUpdate = new Date();
let model;
let waveHeight = 1.00;

const app = express();
app.use(express.static('public'));

app.get('/', function (req, res) {

    // res.set('Content-Type', 'text/html');
    let htmlText = fs.readFileSync('public/index_split.html').toString();
    htmlText = htmlText.split('##text-insert##');
    const dateStr = [lastUpdate.getHours(), ':', lastUpdate.getMinutes(), ', ', lastUpdate.toDateString()].join('');
    res.send([htmlText[0].toString(), waveHeight, htmlText[1].toString(), dateStr, htmlText[2]].join(''));


});

const server = app.listen(8081, async function () {
    const host = server.address().address;
    const port = server.address().port;

    model = await tfModel.train();
    getData();
    waveHeight = tfModel.prediction(model).toPrecision(2);
    lastUpdate = new Date();

    cron.schedule('* */12 * * *', async () => {
        console.log('Re-training the model');
        model = await tfModel.train();
    });
    cron.schedule('*/30 * * * *', () => {
        console.log('Running prediction on new data');
        getData();
        waveHeight = tfModel.prediction(model).toPrecision(2);
        lastUpdate = new Date();
    });
    console.log("Example app listening at http://0.0.0.0:%s", port);
    // console.log("Example app listening at http://%s:%s", host, port);
});

