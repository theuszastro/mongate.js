import { ParserPointer } from '../utils/ParserPointer';
import { SyntaxError } from '../errors/SyntaxError';
import { Expression } from './Expression';
import { Token } from '../types/token';
import { ParsedToken } from '../types/parsedToken';

export class Array {
	constructor(private pointer: ParserPointer, private expression: Expression) {}

	array(): ParsedToken | undefined {
		const { pointer } = this;

		if (!pointer.token || !pointer.take('OpenSquare')) return;

		const values: ParsedToken[] = [];

		for (;;) {
			if (!pointer.token || ['CloseSquare', 'EndFile'].includes(pointer.token.type)) break;

			let value = this.expression.expression(true);
			if (!value) {
				value = {
					type: 'UndefinedExpr',
					value: 'undefined',
				} as ParsedToken;
			}

			values.push(value);

			if (!pointer.take('Comma') && pointer.token.type != 'CloseSquare') {
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
			}
		}

		const close = pointer.take('CloseSquare');
		if (!close)
			new SyntaxError(this.pointer, {
				lineError: pointer.line,
				reason: `Expected a ']'`,
			});

		return {
			type: 'Array',
			values,
		};
	}
}
