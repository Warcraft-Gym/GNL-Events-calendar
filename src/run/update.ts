import cron from 'node-cron';
import app from '../app';
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0,15,30,45 * * * *'; // every 15 mins by default

cron.schedule(CRON_SCHEDULE, () => {
	console.log(`Checking spreadsheet @ ${new Date().toUTCString()}`);
	app();
});
