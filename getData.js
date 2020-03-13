const parseString = require('xml2js').parseString;
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');


module.exports =  function() {

    const urlWave = {
        'Haifa': 'http://www.israports.co.il/SiteAssets/Waves/haifaw-ipa.html',
        'Ashdod': 'http://www.israports.co.il/SiteAssets/Waves/ashdodw-ipa.html'
    };
    const urlWind = 'https://ims.data.gov.il/sites/default/files/xml/imslasthour.xml';


    for (let city of ['Haifa', 'Ashdod']) {

        axios.get(urlWave[city])
            .then(function (response) {
                const $ = cheerio.load(response.data);
                let day = [];
                const MONTHS = {
                    'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06',
                    'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12'
                };
                $('font').each(function (i, elem) {
                    if ($(this).attr('size') === '+1') {
                        let tmpDate = $(this).text().split(' ');
                        tmpDate[1] = MONTHS[tmpDate[1]];
                        day.push(tmpDate.reverse().join('-'));
                    }
                });
                const station = $('title').text().split(' ').slice(-1).pop();
                // let table = [['Station', 'Time', 'Hmax', 'Hs', 'H1/3', 'Direction', 'Tav', 'Tz', 'Tp', 'Temperature']];
                // const lastDate = new Date(0);
                let table = JSON.parse(fs.readFileSync('data/waves'.concat(city, '.json')));
                const lastDate = new Date(table[table.length - 1][1]);
                $('table').each(function (i, elem) {
                    $('tr', this).each(function (j, elem) {
                        const row = $(this).text().trim().split(' ');
                        if (j === 0) {
                            return;
                        }
                        const date = new Date(day[i].concat('T', row[0], ':00Z'));
                        row[0] = date.toISOString();
                        row.splice(0, 0, station);
                        if (date.getTime() > lastDate.getTime()) {
                            table.push(row);
                        }
                    })
                });
                table.sort(function (a, b) {
                    return new Date(a[1]).getTime() - new Date(b[1]).getTime();
                });
                fs.writeFileSync('data/waves'.concat(city, '.json'), JSON.stringify(table));

            })
            .catch(function (err) {
                console.dir('Could not get data');
            });
    }


    for (let port of ['Hadera', 'Ashqelon']) {
        axios.get(urlWind)
            .then(response => {
                parseString(response.data, (err, result) => {
                    if (err) {
                    } else {
                        // this.events = result;
                        // let table = [['Station', 'Date', 'Time', 'RH', 'Rain', 'STDwd', 'TD', 'TDmax', 'TDmin', 'WD', 'WDmax', 'WS', 'WS1mm', 'WSmax', 'Ws10mm']];
                        // const lastDate = new Date(0);
                        let table = JSON.parse(fs.readFileSync('data/wind'.concat(port, '.json')));
                        const lastDate = new Date(table[table.length - 1][1]);
                        for (let elem of result.RealTimeData.Observation) {
                            if (elem.stn_name[0] === port.toLocaleUpperCase().concat(' PORT')) {
                                const date = new Date(elem.time_obs[0].concat('+02:00'));
                                let station = elem.stn_name[0].split(' ')[0];
                                station = station[0] + station.slice(1).toLowerCase();
                                const row = [station, date.toISOString(), elem.RH[0], elem.Rain[0], elem.STDwd[0], elem.TD[0], elem.TDmax[0]
                                    , elem.TDmin[0], elem.WD[0], elem.WDmax[0], elem.WS[0], elem.WS1mm[0], elem.WSmax[0], elem.Ws10mm[0]];
                                if (date.getTime() > lastDate.getTime()) {
                                    table.push(row);
                                }
                            }
                        }
                        table.sort(function (a, b) {
                            return new Date(a[1]).getTime() - new Date(b[1]).getTime();
                        });
                        fs.writeFileSync('data/wind'.concat(port, '.json'), JSON.stringify(table));
                    }
                });
            });
    }
};