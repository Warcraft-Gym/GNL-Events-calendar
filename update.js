const cron = require('node-cron');
const index = require('./index.js');

const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0,15,30,45 * * * *'; // every 15 mins by default
 
cron.schedule(CRON_SCHEDULE, () => {
    let time = new Date()
    console.log(`Checking spreadsheet @ ${time.toUTCString()}`)
    
    try {
        index.run();
    }
    catch (err) {
        throw err;
    }
});