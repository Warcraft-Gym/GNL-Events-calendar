var cron = require('node-cron');

const index = require('./index.js');
 
cron.schedule('0,15,30,45 * * * *', () => {
    console.log("Checking spreadsheet")
    index.run();
});