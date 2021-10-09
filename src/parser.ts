import { calendar_v3, sheets_v4 } from 'googleapis';
import TimeUtils from './utils/TimeUtils';

const TIMEZONE_ADJUSTMENT = new TimeUtils().getEastCoastAdjustment();
const WEEKS = process.env.WEEKS || 5;
const CALENDAR_ID = process.env.CALENDAR_ID || '';
const SHEET_ID = process.env.SHEET_ID_CURRENT || '';
const CELL_RANGES = process.env.CELL_RANGES || `D6:I14 D18:I26 D30:I38`;

export default async function parser(
	sheets: sheets_v4.Sheets,
	calendar: calendar_v3.Calendar
): Promise<void> {
	console.log('Scanning spreadsheet...');
	console.log(CELL_RANGES?.split(' '));
	await getAllSpreadsheetMatches(sheets, await createClanWarStrings());
}

async function getAllSpreadsheetMatches(
	sheets: sheets_v4.Sheets,
	clanWarStrings: string[]
): Promise<void> {
	console.log(clanWarStrings);
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
