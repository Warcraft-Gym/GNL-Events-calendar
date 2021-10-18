import { calendar_v3 } from 'googleapis';
import { CalendarMatch } from './types/app.types';

const CALENDAR_ID = process.env.CALENDAR_ID || '';

export default async function calendarHandler(
	calendar: calendar_v3.Calendar,
	matches: CalendarMatch[]
): Promise<void> {
	const events = await getCalendarEvents(calendar);
	const updatedEvents = findEventsThatHaveBeenUpdated(events, matches);
	console.log(await updateCalendarEvents(updatedEvents));
	console.log(await createNewEvents(matches));
}
async function getCalendarEvents(calendar: calendar_v3.Calendar): Promise<CalendarMatch[]> {
	const calendarMatches = {} as CalendarMatch[];
	try {
		// TODO - query google api for calendar events
		const results = await calendar.events.list({
			calendarId: CALENDAR_ID,
			showDeleted: false,
			maxResults: 2500,
		});

		const events = results.data.items;

		const matchesFromCalendar = [] as CalendarMatch[];
		if (events) {
			events.forEach((event) => {
				const match = buildMatch(event);
				if (match) {
					matchesFromCalendar.push(match);
				} else {
					console.log(`Invalid match could not be built: \n${event}`);
				}
			});
		}

		return [] as CalendarMatch[];
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
function buildMatch(event: calendar_v3.Schema$Event): CalendarMatch | null {
	const match = {} as CalendarMatch;

	if (event && event.description && event.summary && event.start && event.start?.dateTime) {
		match.start = event.start.dateTime.replace(/ /g, ''); // RFC3339 -> ISO 8601

		const clanMatches = event.summary.match(/(?<=\().+?(?=\))/g);
		clanMatches && clanMatches[0] ? (match.clan1 = clanMatches[0]) : (match.clan1 = 'Clan1');
		clanMatches && clanMatches[1] ? (match.clan2 = clanMatches[1]) : (match.clan2 = 'Clan2');

		const matchTeam1 = event.summary.match(/.+?(?= \()/);
		const matchTeam2 = event.summary.match(/(?<=vs ).+?(?= \()/);
		matchTeam1 ? (match.team1 = matchTeam1[0]) : (match.team1 = 'Player1');
		matchTeam2 ? (match.team2 = matchTeam2[0]) : (match.team2 = 'Player2');

		const streamerMatch = event.description.match(/(?<= by ).*?(?=])/);
		streamerMatch ? (match.streamer = streamerMatch[0]) : (match.streamer = null);
		return match;
	}
	return null;
}
