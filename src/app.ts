import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import readline from 'readline';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { ExecuteWithAuth } from './types/app.types';
import Parser from './parser';

const TOKEN_PATH = process.env.TOKEN_PATH || './credentials/token.json';
const CREDENTIALS_PATH = process.env.CREDENTIALS_PATH || './credentials/credentials.json';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/calendar'];

export default function run(): void {
	fs.readFile(CREDENTIALS_PATH, (err, content) => {
		if (err) return console.log('Error loading client secret file: ', err);
		authorize(JSON.parse(content.toString()), RunApp);
	});

	function authorize(credentials: any, callback: ExecuteWithAuth) {
		const { client_secret, client_id, redirect_uris } = credentials.installed;
		const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
		// check for existing token
		fs.readFile(TOKEN_PATH, (err, token) => {
			if (err) return getNewToken(oAuth2Client, callback);
			oAuth2Client.setCredentials(JSON.parse(token.toString()));
			callback(oAuth2Client);
		});
	}

	function getNewToken(oAuth2Client: OAuth2Client, callback: ExecuteWithAuth) {
		const authUrl = oAuth2Client.generateAuthUrl({
			access_type: 'offline',
			scope: SCOPES,
		});

		console.log('Authorize this app by visiting this url:', authUrl);
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		rl.question('Enter the code from that page here: ', (code) => {
			rl.close();
			oAuth2Client.getToken(code, (err: unknown, token: any): void => {
				if (err) return console.error('Error while trying to retrieve access token', err);
				oAuth2Client.setCredentials(token);

				fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
					if (err) return console.error(err);
					console.log('Token stored to', TOKEN_PATH);
				});
				callback(oAuth2Client);
			});
		});
	}

	async function RunApp(auth: OAuth2Client): Promise<void> {
		const sheets = google.sheets({ version: 'v4', auth });
		const calendar = google.calendar({ version: 'v3', auth });

		Parser(sheets, calendar);
	}
}
