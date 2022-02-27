import { SyntaxError } from '../errors/SyntaxError';
import { TypeToken } from '../types/parsedToken';
import { ParserPointer } from '../utils/ParserPointer';

export class Number {
	constructor(private pointer: ParserPointer) {}

	number(): TypeToken | undefined {
		const { pointer } = this;
		if (!pointer.token || !['Number'].includes(pointer.token.type)) return;

		let value = '';

		for (;;) {
			const next = pointer.previewNext(true, false);
			if (!next || (next.type == 'Identifier' && next.value != 'e')) break;

			if (value.endsWith('.')) {
				if (['Dot', 'Identifier'].includes(pointer.token.type)) {
					new SyntaxError(pointer, {
						lineError: pointer.line,
						reason: `Unexpected token '${pointer.token.value}'`,
					});
				}
			}

			value += pointer.token.value;

			if (!['Number', 'Identifier', 'Dot'].includes(next.type)) break;

			pointer.take(pointer.token.type);
		}

		if (value.endsWith('e'))
			new SyntaxError(this.pointer, {
				lineError: pointer.line,
				reason: `Unexpected 'e'`,
			});

		if (value.endsWith('.')) {
			value += '00';
		}

		return {
			type: 'Number',
			value,
		};
	}
}
