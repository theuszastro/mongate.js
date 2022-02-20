import { Pointer } from '../utils/Pointer';

export class Comments {
	private value = '';

	constructor(private pointer: Pointer) {}

	comments() {
		const { pointer } = this;

		if (!['/', '#'].includes(pointer.char)) return null;

		const char = pointer.char;
		pointer.next();

		if (char === '/') {
			if (pointer.char != '/') return null;

			pointer.next();
		}

		this.value = '';

		while (pointer.char !== '\n') {
			if (!pointer.char) break;

			this.value += pointer.char;

			pointer.next();
		}

		return {
			type: 'Comment',
			value: this.value.trim(),
			ctx: pointer.context(),
		};
	}
}
