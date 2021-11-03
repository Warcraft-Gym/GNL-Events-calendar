import { calendar_v3 } from 'googleapis';
import { Match, CalendarUpdateDto } from './types/app.types';
import TimeUtils from './utils/TimeUtils';
import * as Validations from './utils/Validations';

const CALENDAR_ID = process.env.CALENDAR_ID || '';

export default async function calendarHandler(calendar: calendar_v3.Calendar, matches: Match[]): Promise<void> {
	console.log('Scanning calendar...');
	const eventsFromCalendar = await getCalendarEvents(calendar);
	const calendarUpdates = checkCalendarAgainstSpreadsheet(eventsFromCalendar, matches);
	await createNewEvents(calendarUpdates.newEvents, calendar);
	/* comment out below to only add */
	const eventsThatRequireUpdate = filterForEventsThatHaveChanged(calendarUpdates.existingEvents, eventsFromCalendar);
	await updateEvents(eventsThatRequireUpdate, calendar, eventsFromCalendar);
}
async function getCalendarEvents(calendar: calendar_v3.Calendar): Promise<calendar_v3.Schema$Event[]> {
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
	const existingEvents = [] as calendar_v3.Schema$Event[];
	const newEvents = [] as calendar_v3.Schema$Event[];
	_spreadsheetEvents.forEach((match) => {
		if (_calendarEvents.filter((x) => x.location == match.idLoc).length === 0) {
			newEvents.push(buildCalendarEvent(match));
		} else {
			existingEvents.push(buildCalendarEvent(match));
		}
	});
	return { existingEvents: existingEvents, newEvents: newEvents };
}

async function createNewEvents(matches: calendar_v3.Schema$Event[], calendar: calendar_v3.Calendar): Promise<void> {
	try {
		let count = 0;
		for (const match of matches) {
			await TimeUtils.sleep(400), createEventOnCalendar(match, calendar);
			count++;
		}
		console.log(count ? `${count} new events created` : `no new events created`);
	} catch (err) {
		console.log(`failed to create new calendar events due to error:\n${err}\n`);
		throw err;
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
			console.log(`Event created: ${event?.data?.summary}`);
		}
	);
}

function buildCalendarEvent(match: Match): calendar_v3.Schema$Event {
	const event = {} as calendar_v3.Schema$Event;

	const end = new Date(match.start);
	end.setHours(end.getHours() + 1);

	event.summary = `${match.team1} (${match.clan1}) vs ${match.team2} (${match.clan2})`;
	if (match.streamer) {
		event.description = `<a href="https://twitch.tv/${match.streamer}">${match.streamer}</a>`;
	} else {
		event.description = `No caster yet`;
	}
	event.start = { dateTime: match.start };
	event.end = { dateTime: end.toISOString() };
	event.location = match.idLoc;

	return event;
}

function filterForEventsThatHaveChanged(
	_existingEvents: calendar_v3.Schema$Event[],
	_eventsFromCalendar: calendar_v3.Schema$Event[]
): calendar_v3.Schema$Event[] {
	const eventsToUpdate = [] as calendar_v3.Schema$Event[];
	_eventsFromCalendar.forEach((event) => {
		if (Validations.ValidateEventIsDifferent(event, _existingEvents)) {
			eventsToUpdate.push(event);
		}
	});
	return eventsToUpdate;
}
async function updateEvents(
	_eventsToUpdate: calendar_v3.Schema$Event[],
	_calendar: calendar_v3.Calendar,
	_eventsFromCalendar: calendar_v3.Schema$Event[]
): Promise<void> {
	console.log(`Updating ${_eventsToUpdate.length} events`);
	for (const event in _eventsToUpdate) {
		const eventId = _eventsFromCalendar.find((x) => x.location == _eventsToUpdate[event].location)?.id;
		if (eventId != undefined) {
			_calendar.events.update(
				{
					calendarId: CALENDAR_ID,
					eventId: eventId,
					requestBody: _eventsToUpdate[event],
				},
				function (err, event) {
					if (err) {
						console.log('There was an error contacting the Calendar service: ' + err);
						return;
					}
					console.log(`Event updated: ${event?.data.summary}`);
				}
			);
		}
	}
}
