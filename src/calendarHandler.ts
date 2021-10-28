import { calendar_v3 } from 'googleapis';
import { Match, CalendarUpdateDto } from './types/app.types';
import TimeUtils from './utils/TimeUtils';

const CALENDAR_ID = process.env.CALENDAR_ID || '';
const SEASON = process.env.SEASON || '9';

export default async function calendarHandler(
	calendar: calendar_v3.Calendar,
	matches: Match[]
): Promise<void> {
	const eventsFromCalendar = await getCalendarEvents(calendar);
	const calendarUpdates = checkCalendarAgainstSpreadsheet(eventsFromCalendar, matches);
	//const eventsFromSpreadsheet = convertMatchesToEvents(matches);
	// updatedEvents = handleChangedEvents(events, matches); // future feature
	// await updateCalendarEvents(updatedEvents);
	//await createNewEvents(calendarUpdates, calendar);
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

function checkCalendarAgainstSpreadsheet(
	_calendarEvents: calendar_v3.Schema$Event[],
	_spreadsheetEvents: Match[]
): CalendarUpdateDto {
	const eventsToUpdate = [] as calendar_v3.Schema$Event[];
	const newEvents = [] as calendar_v3.Schema$Event[];

	// need to add new events
	_spreadsheetEvents.forEach((ssEvent) => {
		const matchId = getMatchId(ssEvent);
		console.log(matchId);
		const result = _calendarEvents.filter(
			(calEvent) =>
				calEvent.summary?.match(`${ssEvent.team1}`) &&
				calEvent.summary?.match(`${ssEvent.team2}`)
		);
		console.log(`Matches:`);
		result.forEach((element) => {
			console.log(element.summary);
			console.log(ssEvent.team1);
			console.log(ssEvent.team2);
			newEvents.push(buildCalendarEvent(ssEvent));
		});
	});
	console.log(newEvents);
	return { eventsToUpdate: eventsToUpdate, newEvents: newEvents };
}

async function createNewEvents(
	matches: CalendarUpdateDto,
	calendar: calendar_v3.Calendar
): Promise<string> {
	try {
		let count = 0;
		matches.newEvents.forEach(async (match: calendar_v3.Schema$Event) => {
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

function buildCalendarEvent(match: Match): calendar_v3.Schema$Event {
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
function convertMatchesToEvents(matches: Match[]): calendar_v3.Schema$Event[] {
	const events = [] as calendar_v3.Schema$Event[];
	matches.forEach((match) => {
		events.push(buildCalendarEvent(match));
	});
	return events;
}
function getMatchId(match: Match): string {
	return match.team1.replace(/[^A-Za-z0-9]/g, '') + match.team2.replace(/[^A-Za-z0-9]/g, '');
}
