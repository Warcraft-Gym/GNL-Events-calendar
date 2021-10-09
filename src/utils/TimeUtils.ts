export default class TimeUtils {
	public getEastCoastAdjustment(): number {
		if (this.isDST(new Date())) {
			return 4;
		}
		return 5;
	}

	private isDST(date: Date): boolean {
		const jan = new Date(date.getFullYear(), 0, 1).getTimezoneOffset();
		const jul = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
		return Math.max(jan, jul) != date.getTimezoneOffset();
	}
}
