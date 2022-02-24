import { ParserPointer, Token } from '../utils/ParserPointer';
import { SyntaxError } from '../errors/SyntaxError';
import { Expression } from './Expression';

export class Array {
	constructor(private pointer: ParserPointer, private expression: Expression) {}

	array() {
		const { pointer } = this;

		if (!pointer.token || !pointer.take('OpenSquare')) return null;

		const values: Token[] = [];

		if (pointer.token.type != 'CloseSquare') {
			for (;;) {
				if (!pointer.token || ['CloseSquare', 'EndFile'].includes(pointer.token.type))
					break;

				let value = this.expression.expression();
				if (!value) {
					value = {
						type: 'UndefinedExpr',
						value: 'undefined',
					};
				}

				values.push(value as Token);

				if (!pointer.take('Comma')) {
					if (pointer.token.type == 'CloseSquare') continue;

					const lineError = pointer.line - 1;

					const value = this.expression.expression(true);
					if (!value)
						new SyntaxError(this.pointer, {
							lineError: pointer.line,
							reason: `Expected a ']'`,
						});

					new SyntaxError(this.pointer, {
						lineError,
						reason: `Expected a ','`,
					});

					continue;
				}
			}
		}

		const close = pointer.take('CloseSquare');
		if (!close) {
			new SyntaxError(this.pointer, {
				lineError: pointer.line,
				reason: `Expected a ']'`,
			});
		}

		return {
			type: 'Array',
			values,
		};
	}
}
