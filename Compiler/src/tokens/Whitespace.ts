import { Pointer } from '../utils/Pointer';

export class Whitespace {
	private size: number = 1;

	constructor(private pointer: Pointer) {}

	private isWhitespace() {
		return /\s/.test(this.pointer.char);
	}

	whitespace() {
		if (!this.isWhitespace()) return null;

		this.size = 1;

		this.pointer.next();

		while (this.isWhitespace()) {
			this.size++;

			this.pointer.next();
		}

		return {
			type: 'Whitespace',
			size: this.size,
			ctx: this.pointer.context(),
		};
	}
}
