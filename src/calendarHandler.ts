import { calendar_v3 } from 'googleapis';
import { CalendarMatch } from './types/app.types';
import TimeUtils from './utils/TimeUtils';

const CALENDAR_ID = process.env.CALENDAR_ID || '';
const SEASON = process.env.SEASON || '9';

export default async function calendarHandler(
	calendar: calendar_v3.Calendar,
	matches: CalendarMatch[]
): Promise<void> {
	const events = await getCalendarEvents(calendar);
	const spreadsheetSourcedEvents = convertMatchesToEvents(matches);
	const newEvents = spreadsheetSourcedEvents.filter((x) => !events.includes(x));
	// updatedEvents = handleChangedEvents(events, matches); // future feature
	// await updateCalendarEvents(updatedEvents);
	await createNewEvents(newEvents, calendar);
}
async function getCalendarEvents(
	calendar: calendar_v3.Calendar
): Promise<calendar_v3.Schema$Event[]> {
	const calendarMatches = [] as calendar_v3.Schema$Event[];
	try {
		const results = await calendar.events.list({
			calendarId: CALENDAR_ID,
			showDeleted: false,
			maxResults: 2500,
		});

		const events = results.data.items;
		if (events) {
			events.forEach((event) => {
				//const match = buildMatch(event);
				if (event.summary) {
					calendarMatches.push(event);
				} else {
					console.log(`Invalid match could not be built: \n${event}`);
				}
			});
		}
		// should perhaps record the google api calendar event id?
		return calendarMatches;
	} catch (err) {
		console.log(`failed to get calendar events due to error: ${err}`);
		return calendarMatches;
	}
}

async function createNewEvents(
	matches: calendar_v3.Schema$Event[],
	calendar: calendar_v3.Calendar
): Promise<string> {
	try {
		let count = 0;
		matches.forEach(async (match: calendar_v3.Schema$Event) => {
			await TimeUtils.sleep(400), createEventOnCalendar(match, calendar);
			count++;
		});
		return count ? `${count} new events created` : `no new events created`;
	} catch (err) {
		return `failed to create new calendar events due to error:\n${err}`;
	}
}
function createEventOnCalendar(match: calendar_v3.Schema$Event, calendar: calendar_v3.Calendar) {
	calendar.events.insert(
		{
			calendarId: CALENDAR_ID,
			requestBody: match,
		},
		function (err, event) {
			if (err) {
				console.log('There was an error contacting the Calendar service: ' + err);
				return;
			}
			console.log('Event created: ');
			console.log(event?.data?.summary);
		}
	);
}

function buildCalendarEvent(match: CalendarMatch): calendar_v3.Schema$Event {
	const event = {} as calendar_v3.Schema$Event;

	const end = new Date(match.start);
	end.setHours(end.getHours() + 1);

	event.summary = `${match.team1} (${match.clan1}) vs ${match.team2} (${match.clan2})`;
	if (match.streamer) {
		event.description = `A GNL Season ${SEASON} match cast by <i><a href="https://twitch.tv/${match.streamer}">${match.streamer}</a></i>`;
	} else {
		event.description = `A GNL Season ${SEASON} match`;
	}
	event.start = { dateTime: match.start };
	event.end = { dateTime: end.toISOString() };

	return event;
}
function convertMatchesToEvents(matches: CalendarMatch[]): calendar_v3.Schema$Event[] {
	const events = [] as calendar_v3.Schema$Event[];
	matches.forEach((match) => {
		events.push(buildCalendarEvent(match));
	});
	return events;
}

