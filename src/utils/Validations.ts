import { Clan } from '../app.types';

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
