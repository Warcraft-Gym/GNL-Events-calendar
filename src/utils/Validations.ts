import { Clan } from '../types/app.types';
import { calendar_v3 } from 'googleapis';

export function ValidateMatch(match: string[]): boolean {
	if (match) {
		if (match[2] && match[3] && match[4] && match[7]) {
			return true;
		}
	}
	return false;
}

export function ValidateClans(clans: Clan[]): boolean {
	if (clans) {
		if (clans[0] && clans[1]) {
			if (clans[0].abbrev && clans[1].abbrev) {
				return true;
			}
		}
	}
	return false;
}

export function ValidateStreamer(match: string[]): boolean {
	if (match && match[0]) {
		return true;
	}
	return false;
}

export function ValidateEventIsDifferent(
	_event: calendar_v3.Schema$Event,
	existingEvents: calendar_v3.Schema$Event[]
): boolean {
	const matchingEvent = existingEvents.find((event) => event.location === _event.location);
	if (
		// good god this is ugly
		matchingEvent != undefined &&
		(!(_event.description === matchingEvent.description) ||
			(_event.start &&
				_event.start.dateTime &&
				matchingEvent.start &&
				matchingEvent.start.dateTime &&
				!(Date.parse(_event.start?.dateTime) === Date.parse(matchingEvent.start?.dateTime))) ||
			!(_event.summary === matchingEvent.summary))
	) {
		return true;
	}
	return false;
}
