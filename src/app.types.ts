import { OAuth2Client } from 'google-auth-library';

export interface RunApp {
	(oauth: OAuth2Client): void;
}
