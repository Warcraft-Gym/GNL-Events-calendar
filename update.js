var cron = require('node-cron');

const index = require('./index.js');
 
cron.schedule('0,20,15,30,45 * * * *', () => {

    let time = new Date()
    console.log("Checking spreadsheet @ " + time.getTime() + " on " + time.getDate())
    index.run();
});