import { OAuth2Client } from 'google-auth-library';
import { calendar_v3 } from 'googleapis';

export interface RunApp {
	(oauth: OAuth2Client): void;
}

export interface Match {
	start: string; // iso format
	team1: string;
	team2: string;
	idLoc: string;
	clan1?: string | null;
	clan2?: string | null;
	streamer?: string | null;
}
export interface Player {
	name: string;
}

export interface Clan {
	//name: string;
	abbrev: string;
}

export interface CalendarUpdateDto {
	eventsToUpdate: calendar_v3.Schema$Event[];
	newEvents: calendar_v3.Schema$Event[];
}