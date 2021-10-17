import { calendar_v3 } from 'googleapis';
import { CalendarMatch } from './types/app.types';

const CALENDAR_ID = process.env.CALENDAR_ID || '';

export default async function calendarHandler(
	calendar: calendar_v3.Calendar,
	matches: CalendarMatch[]
): Promise<void> {
	const events = await getCalendarEvents();
	const updatedEvents = findEventsThatHaveBeenUpdated(events, matches);
	console.log(await updateCalendarEvents(updatedEvents));
	console.log(await createNewEvents(matches));
}
function getCalendarEvents(): CalendarMatch[] {
	const calendarMatches = {} as CalendarMatch[];
	try {
		// TODO - query google api for calendar events
		// should perhaps record the google api calendar event id?
		return calendarMatches;
	} catch (err) {
		console.log(`failed to get calendar events due to error: ${err}`);
		return calendarMatches;
	}
}

function findEventsThatHaveBeenUpdated(
	events: CalendarMatch[],
	matches: CalendarMatch[]
): CalendarMatch[] {
	const updatedEvents = {} as CalendarMatch[];
	// TODO - filter through the events parameter against matches, any that don't match, add to updatedEvents
	// perhaps should note the google id for the event?
	return updatedEvents;
}

function updateCalendarEvents(updatedEvents: CalendarMatch[]): string {
	try {
		const count = 0;
		// TODO - foreach event, send request to google api to UPDATE the relevant calendar event
		// update by id seems easiest?
		return count ? `${count} events updated` : `all events up to date`;
	} catch (err) {
		return `failed to update existing calendar events due to error: ${err}`;
	}
}

function createNewEvents(matches: CalendarMatch[]): string {
	try {
		const count = 0;
		// TODO - foreach event, send request to google api to CREATE new calendar event
		return count ? `${count} new events created` : `no new events created`;
	} catch (err) {
		return `failed to create new calendar events due to error: ${err}`;
	}
}
