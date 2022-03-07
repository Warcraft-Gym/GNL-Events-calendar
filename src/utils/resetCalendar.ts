import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import { calendar_v3, google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { ExecuteWithAuth } from '../types/app.types';

const TOKEN_PATH = process.env.TOKEN_PATH || './credentials/token.json';
const CREDENTIALS_PATH = process.env.CREDENTIALS_PATH || './credentials/credentials.json';

export default function Nuke(): void {
	// Load client secrets from a local file.
	fs.readFile(CREDENTIALS_PATH, (err, content) => {
		if (err) return console.log('Error loading client secret file:', err);
		// Authorize a client with credentials, then call the Google Sheets API.
		authorize(JSON.parse(content.toString()), resetCalendar);
	});

	/**
	 * Create an OAuth2 client with the given credentials, and then execute the
	 * given callback function.
	 * @param {Object} credentials The authorization client credentials.
	 * @param {function} callback The callback to call with the authorized client.
	 */
	function authorize(credentials: any, callback: ExecuteWithAuth) {
		const { client_secret, client_id, redirect_uris } = credentials.installed;
		const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

		// Check if we have previously stored a token.
		fs.readFile(TOKEN_PATH, (err, token) => {
			if (err) return 'Existing token not found or cannot be read, run once before using nuke';
			oAuth2Client.setCredentials(JSON.parse(token.toString()));
			callback(oAuth2Client);
		});
	}

	async function resetCalendar(auth: OAuth2Client): Promise<void> {
		const calendar = google.calendar({ version: 'v3', auth });

		console.log('Nuking the calendar');

		const results = await calendar.events.list({
			calendarId: process.env.CALENDAR_ID,
			showDeleted: false,
			maxResults: 2500,
		});

		const allEvents = results.data.items;

		if (allEvents == undefined) {
			console.log('Could not nuke the calendar, No events were found');
			return;
		}

		console.log('Number of events being deleted: ' + allEvents.length);

		for (const element in allEvents) {
			await sleep(400);

			const thisEvent = allEvents[element];

			calendar.events.delete(
				{
					calendarId: process.env.CALENDAR_ID,
					eventId: thisEvent.id as string,
				},
				() => (err: string, event: calendar_v3.Schema$Event) => {
					if (err) {
						console.log('There was an error contacting the Calendar service: ' + err);
						return;
					}
					console.log(`${event.location} deleted`);
				}
			);
		}

		function sleep(ms: number) {
			return new Promise((resolve) => {
				setTimeout(resolve, ms);
			});
		}
	}
}
