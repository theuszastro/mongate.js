import { ParserPointer } from '../utils/ParserPointer';
import { SyntaxError } from '../errors/SyntaxError';

import { Others } from './Others';
import { TypeToken } from '../types/parsedToken';

export class String {
	public others: Others;

	constructor(private pointer: ParserPointer) {
		this.others = new Others(pointer);
	}

	string(): TypeToken | undefined {
		const { pointer, others } = this;

		const token = pointer.token;
		if (!token || !['DoubleQuote', 'SingleQuote'].includes(token.type)) return;

		let value = '';

		const lineError = pointer.line;
		const delimiter = token;

		pointer.take(delimiter.type, false, false, false);

		for (;;) {
			if (!pointer.token || ['EndFile', 'NewLine'].includes(pointer.token.type)) break;

			const expr = others.others();
			if (expr && expr.type === 'SpaceCaracter') {
				value += expr.value;

				continue;
			}

			if (pointer.token?.type === delimiter.type) break;

			value += pointer.token?.value;

			pointer.next(false, false, false);
		}

		const closeDelimiter = pointer.take(delimiter.type);
		if (!closeDelimiter)
			new SyntaxError(pointer, {
				lineError,
				reason: `Expected a '${delimiter.value}'`,
			});

		return {
			type: 'String',
			value,
			ctx: pointer.ctx(lineError),
		};
	}
}
