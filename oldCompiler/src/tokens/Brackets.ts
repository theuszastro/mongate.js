import { Token } from '../types/token';
import { Pointer } from '../utils/Pointer';

export class Brackets {
	constructor(private pointer: Pointer) {}

	curly(): Token | undefined {
		const { pointer } = this;

		if (['{', '}'].includes(pointer.char)) {
			const char = pointer.char;

			pointer.next();

			return {
				type: char === '{' ? 'OpenCurly' : 'CloseCurly',
				value: char,
				ctx: pointer.context(),
			};
		}
	}

	parenthesis(): Token | undefined {
		const { pointer } = this;

		if (['(', ')'].includes(pointer.char)) {
			const char = pointer.char;

			pointer.next();

			return {
				type: char === '(' ? 'OpenParen' : 'CloseParen',
				value: char,
				ctx: pointer.context(),
			};
		}
	}

	square(): Token | undefined {
		const { pointer } = this;

		if (['[', ']'].includes(pointer.char)) {
			const char = pointer.char;

			pointer.next();

			return {
				type: char === '[' ? 'OpenSquare' : 'CloseSquare',
				value: char,
				ctx: pointer.context(),
			};
		}
	}
}
