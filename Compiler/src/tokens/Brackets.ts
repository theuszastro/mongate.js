import { Pointer } from '../utils/Pointer';

export class Brackets {
	constructor(private pointer: Pointer) {}

	square() {
		const { pointer } = this;

		if (['[', ']'].includes(pointer.char)) {
			const char = pointer.char;

			pointer.next();

			return {
				type: char === '[' ? 'OpenSquareBracket' : 'CloseSquareBracket',
				ctx: pointer.context(),
			};
		}

		return null;
	}
}
