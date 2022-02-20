import { Pointer } from '../utils/Pointer';

export class Brackets {
	constructor(private pointer: Pointer) {}

	parenthesis() {
		const { pointer } = this;

		if (['(', ')'].includes(pointer.char)) {
			const char = pointer.char;

			pointer.next();

			return {
				type: char === '[' ? 'OpenParenthesis' : 'CloseParenthesis',
				ctx: pointer.context(),
			};
		}

		return null;
	}

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
