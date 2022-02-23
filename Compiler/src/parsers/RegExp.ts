import { SyntaxError } from '../errors/SyntaxError';
import { ParserPointer, Token } from '../utils/ParserPointer';
import { Others } from './Others';

export class RegExp {
	private value = '';
	private flags = '';

	private others: Others;
	private allowedFlags = ['g', 'i', 'm', 'u', 'y'];

	constructor(private pointer: ParserPointer) {
		this.others = new Others(pointer);
	}

	regexp() {
		const { pointer, others } = this;

		if (!pointer.token) return null;

		const operator = pointer.take('Operator');
		if (!operator || operator.value != '/') return null;

		const startLine = pointer.line;

		for (;;) {
			if (!pointer.token || pointer.token.type == 'EndFile') break;

			const expr = others.others();

			if (expr) {
				this.value += expr.value;

				pointer.next(true, false);

				continue;
			}

			const token = pointer.token;
			if (token.type == 'Operator' && token.value == '/') break;

			this.value += token.value;

			pointer.next(true, false);
		}

		const next = pointer.previewNext(true, false);
		pointer.take('Operator');

		if (next) {
			if (next.type != 'Whitespace' && next.type === 'Identifier') {
				const flags = pointer.take('Identifier') as Token;

				for (let flag of (flags.value as string).split('')) {
					if (this.allowedFlags.includes(flag)) {
						this.flags += flag;

						continue;
					}

					new SyntaxError(pointer, {
						startLine,
						lineError: pointer.line,
						reason: `RegExp invalid flag '${flag}'`,
						isParser: true,
					});
				}
			}
		}

		try {
			new global.RegExp(this.value, this.flags);
		} catch (e) {
			new SyntaxError(pointer, {
				startLine,
				lineError: pointer.line,
				reason: `Invalid regular expression`,
				isParser: true,
			});
		}

		return {
			type: 'RegExp',
			value: this.value,
			flags: this.flags,
		};
	}
}
