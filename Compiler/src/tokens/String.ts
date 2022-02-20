import { Pointer } from '../utils/Pointer';
import { SyntaxError } from '../errors/SyntaxError';

export class String {
	private value = '';

	constructor(private pointer: Pointer) {}

	isString(char: string) {
		return ['"', "'"].includes(char);
	}

	string() {
		const { pointer } = this;
		if (!this.isString(pointer.char)) return null;

		const delimiter = pointer.char;

		this.value = '';
		this.pointer.next();

		while (!this.isString(pointer.char)) {
			if (pointer.char == '\n' || !pointer.char)
				new SyntaxError(
					this.pointer,
					`${delimiter}${this.value}`,
					'this string is not closed'
				);

			this.value += pointer.char;

			pointer.next();
		}

		pointer.next();

		return {
			type: 'String',
			value: this.value,
			ctx: this.pointer.context(),
		};
	}
}
