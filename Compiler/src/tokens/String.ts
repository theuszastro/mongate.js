import { Pointer } from '../utils/Pointer';
import { SyntaxError } from '../utils/SyntaxError';

export class String {
	private value: string = '';

	constructor(private pointer: Pointer) {}

	isString(char: string) {
		return ['"', "'"].includes(char);
	}

	string() {
		const { pointer } = this;
		if (!this.isString(pointer.char)) return null;

		this.value = '';

		this.pointer.next();

		while (!this.isString(pointer.char)) {
			if (pointer.char == '\n' || !pointer.char) new SyntaxError();

			this.value += pointer.char;

			pointer.next();
		}

		if (this.value.length >= 1) {
			return {
				type: 'String',
				value: this.value,
				ctx: this.pointer.context(),
			};
		}

		return null;
	}
}
