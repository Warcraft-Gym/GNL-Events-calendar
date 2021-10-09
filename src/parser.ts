import { calendar_v3, sheets_v4 } from 'googleapis';
import TimeUtils from './utils/TimeUtils';

const TIMEZONE_ADJUSTMENT = new TimeUtils().getEastCoastAdjustment();
const WEEKS = process.env.WEEKS;
const CALENDAR_ID = process.env.CALENDAR_ID;
const SHEET_ID = process.env.SHEET_ID_CURRENT;

export default function parser(
	sheets: sheets_v4.Sheets,
	calendar: calendar_v3.Calendar
): void {
	console.log('success');
}
