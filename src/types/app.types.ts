import { OAuth2Client } from 'google-auth-library';

export interface RunApp {
	(oauth: OAuth2Client): void;
}

export interface CalendarMatch {
	start: string; // iso format
	team1: string;
	team2: string;
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
