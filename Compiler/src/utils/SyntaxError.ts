export class SyntaxError {
	constructor() {
		this.setup();
	}

	private setup() {
		console.log('random');

		process.exit(1);
	}
}
