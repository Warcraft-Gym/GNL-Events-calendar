export default class SheetsValidator {
	public ValidateClanWarSize(clanWarStrings: string[]): boolean {
		if (clanWarStrings.length != 18) {
			return false;
		}
		return true;
	}
}
