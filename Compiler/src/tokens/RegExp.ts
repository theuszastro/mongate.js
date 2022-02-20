import { throws } from 'assert';
import { Pointer } from '../utils/Pointer';
import { SyntaxError } from '../errors/SyntaxError';
import { Colon } from './Colon';
import { Comments } from './Comments';
import { Identifier } from './Identifier';
import { Operator } from './Operator';
import { Whitespace } from './Whitespace';

export class RegExp {
	private value = '';
	private tokens = {
		'^': 'circumflex',
		'\\': 'BackSlash',
		'$': 'DollarSign',
	} as { [key: string]: string };

	constructor(
		private pointer: Pointer,
		private operator: Operator,
		private comment: Comments,
		private identifier: Identifier,
		private colon: Colon
	) {}

	regexpTokens() {
		const { pointer } = this;

		const token = this.tokens[pointer.char];
		if (!token) return null;

		pointer.next();

		return {
			type: token,
			ctx: pointer.context(),
		};
	}

	regexp() {
		const { operator, pointer, comment, identifier, colon } = this;
		if (pointer.char != '/') return null;

		const memorized = pointer.memorize();
		pointer.next();

		if (pointer.char === '/') {
			pointer.restore(memorized);

			return comment.comments();
		}

		this.value = '';

		while (pointer.char !== '/') {
			if (!pointer.char) {
				pointer.restore(memorized);

				return operator.operator();
			}

			this.value += pointer.char;

			pointer.next();
		}

		pointer.next();

		const allowedFlags = ['g', 'i', 'm', 'u', 'y'];
		const flags: string[] = [];

		let error = false;

		for (;;) {
			if (!pointer.char || !identifier.isLetter() || colon.semicolon()) {
				if (/\s/.test(pointer.char)) {
					error = true;
				} else {
					break;
				}
			}

			if (allowedFlags.includes(pointer.char) && !flags.includes(pointer.char)) {
				flags.push(pointer.char);
			}

			pointer.next();
		}

		if (error) new SyntaxError(pointer, flags.join(''), 'Unexpected identifier');

		return {
			type: 'RegExp',
			value: this.value,
			flags: flags.join(''),
			ctx: pointer.context(),
		};
	}
}
