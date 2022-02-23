import { ParserPointer, Token } from '../utils/ParserPointer';
import { SyntaxError } from '../errors/SyntaxError';
import { Expression } from './Expression';

export class Array {
	constructor(private pointer: ParserPointer, private expression: Expression) {}

	array() {
		const { pointer } = this;

		if (!pointer.token || !pointer.take('OpenSquare')) return null;

		const startLine = pointer.line;
		const values: Token[] = [];

		if (pointer.token.type != 'CloseSquare') {
			while (pointer.token.type != 'CloseSquare') {
				if (!pointer.token || pointer.token.type == 'EndFile') break;

				const value = this.expression.expression();
				if (!value) break;

				values.push(value as Token);

				if (pointer.token.type == 'Comma') {
					pointer.take('Comma');
				} else if (pointer.token.type != 'CloseSquare') {
					new SyntaxError(this.pointer, {
						lineError: pointer.line,
						startLine,
						reason: `Expected a comma`,
						isParser: true,
					});
				}
			}
		}

		const close = pointer.take('CloseSquare');
		if (!close) {
			new SyntaxError(this.pointer, {
				lineError: pointer.line,
				startLine,
				reason: `Expected a ']'`,
				isParser: true,
			});
		}

		return {
			type: 'Array',
			values,
		};
	}
}
