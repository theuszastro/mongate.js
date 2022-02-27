import { SyntaxError } from '../errors/SyntaxError';
import { RegexToken } from '../types/parsedToken';
import { Token } from '../types/token';

import { ParserPointer } from '../utils/ParserPointer';
import { Others } from './Others';

export class RegExp {
	private value = '';
	private flags = '';

	private others: Others;
	private allowedFlags = ['g', 'i', 'm', 'u', 'y'];

	constructor(private pointer: ParserPointer) {
		this.others = new Others(pointer);
	}

	regexp(): RegexToken | undefined {
		const { pointer, others } = this;

		const operator = pointer.take('Operator');
		if (!pointer.token || !operator || operator.value != '/') return;

		for (;;) {
			if (!pointer.token || pointer.token.type == 'EndFile') break;

			const token = pointer.token;
			const expr = others.others();

			if (token.type == 'Operator' && token.value == '/') break;

			this.value += expr ? expr.value : token.value;

			pointer.next(false, false);
		}

		pointer.take('Operator', true, false);

		if (pointer.token) {
			if (pointer.token.type != 'Whitespace' && pointer.token.type === 'Identifier') {
				const flags = pointer.take('Identifier') as Token;

				for (let flag of (flags.value as string).split('')) {
					if (this.allowedFlags.includes(flag)) {
						this.flags += flag;

						continue;
					}

					new SyntaxError(pointer, {
						lineError: pointer.line,
						reason: `RegExp invalid flag '${flag}'`,
					});
				}
			}
		}

		try {
			new global.RegExp(this.value, this.flags);
		} catch (e) {
			new SyntaxError(pointer, {
				lineError: pointer.line,
				reason: `Invalid regular expression`,
			});
		}

		return {
			type: 'RegExp',
			value: this.value,
			flags: this.flags,
		};
	}
}
