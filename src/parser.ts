import { calendar_v3, sheets_v4 } from 'googleapis';
import * as chrono from 'chrono-node';
import { CalendarMatch, Clan } from './app.types';
import TimeUtils from './utils/TimeUtils';
import {
	ValidateMatch,
	ValidateClans,
	ValidateStreamer,
} from './utils/Validations';

const timeUtils = new TimeUtils();
const TIMEZONE_ADJUSTMENT = timeUtils.getEastCoastAdjustment();
const TIMEZONE_STRING = timeUtils.whichTimeZone();
const WEEKS = process.env.WEEKS || 5;
const CALENDAR_ID = process.env.CALENDAR_ID || '';
const SHEET_ID = process.env.SHEET_ID_CURRENT || '';
const CELL_RANGES = process.env.CELL_RANGES || `D6:I14 D18:I26 D30:I38`;

export default async function parser(
	sheets: sheets_v4.Sheets,
	calendar: calendar_v3.Calendar
): Promise<void> {
	console.log('Scanning spreadsheet...');
	const allSpreadsheetMatches = await getAllSpreadsheetMatches(
		sheets,
		createClanWarStrings()
	);
	console.log(allSpreadsheetMatches);
}

async function getAllSpreadsheetMatches(
	sheets: sheets_v4.Sheets,
	cellRangesStrings: string[]
): Promise<CalendarMatch[]> {
	const allSpreadsheetMatches = [] as CalendarMatch[];
	for (const clanWarBlock in cellRangesStrings) {
		const clanWar = await requestClanWar(
			sheets,
			cellRangesStrings[clanWarBlock]
		);
		const clanWarData = parseClanWarData(clanWar);
		for (const match in clanWarData) {
			allSpreadsheetMatches.push(clanWarData[match]);
		}
	}
	return allSpreadsheetMatches;
}

async function requestClanWar(
	sheets: sheets_v4.Sheets,
	clanWarCells: string
): Promise<string[][]> {
	const clanWar = await sheets.spreadsheets.values.get({
		spreadsheetId: SHEET_ID,
		range: clanWarCells,
	});
	return clanWar.data.values as string[][];
}

function createClanWarStrings(): string[] {
	const clanWar = [] as string[];
	const cellRanges = CELL_RANGES.split(' ');

	// create 18 strings which correspond to the date and time cells for each match
	for (let i = 1; i <= WEEKS; i++) {
		for (let j = 0; j <= cellRanges.length - 1; j++) {
			clanWar.push(`Week ${i}!${cellRanges[j]}`);
		}
	}
	return clanWar;
}

function parseClanWarData(clanWar: string[][]): CalendarMatch[] {
	const cw = clanWar;
	const headers = cw.shift();
	const matches = [] as CalendarMatch[];
	const clans = getClans(headers);

	for (const match in cw) {
		if (ValidateMatch(cw[match])) {
			matches.push(buildMatch(cw[match], clans));
		}
	}
	return matches;
}

function getClans(headers: string[] | undefined): Clan[] {
	if (headers) {
		if (headers[4] && headers[7]) {
			return [{ abbrev: headers[4] }, { abbrev: headers[7] }];
		}
	}
	return [{ abbrev: '' }, { abbrev: '' }];
}
function buildMatch(clanMatch: string[], clans: Clan[]): CalendarMatch {
	// validate the input data and build a match object suitable for sending to calendar
	const match = {} as CalendarMatch;

	if (ValidateClans(clans)) {
		match.clan1 = clans[0].abbrev;
		match.clan2 = clans[1].abbrev;
	}
	if (ValidateStreamer(clanMatch)) {
		match.streamer = clanMatch[0];
	}

	match.team1 = clanMatch[4];
	match.team2 = clanMatch[7];
	match.start = parseStartTime(clanMatch);

	return match;
}

function parseStartTime(match: string[]): string {
	const concatDateTime = `${match[2]} ${match[3]}${TIMEZONE_STRING}`;
	try {
		const parsedDate = chrono.parseDate(concatDateTime);
		return parsedDate.toISOString();
	} catch {
		console.log(`could not parse: ${concatDateTime}`);
		return '';
	}
}
