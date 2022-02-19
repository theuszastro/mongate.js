import { Pointer } from '../utils/Pointer';
import { SyntaxError } from '../utils/SyntaxError';

export class Number {
	private value: string = '';

	constructor(private pointer: Pointer) {}

	isNumber(char: string) {
		return /\d/.test(char);
	}

	number() {
		const { pointer } = this;

		if (!this.isNumber(pointer.char)) return null;

		this.value = '';

		while (this.isNumber(pointer.char) || pointer.char == 'e') {
			this.value += pointer.char;

			pointer.next();
		}

		if (this.value.length >= 1) {
			if (this.value.endsWith('e')) new SyntaxError();

			const isInvalid = isNaN(global.Number(this.value));
			if (isInvalid) new SyntaxError();

			return {
				type: 'Number',
				value: this.value,
				ctx: this.pointer.context(),
			};
		}

		return null;
	}
}
