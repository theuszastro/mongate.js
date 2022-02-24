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
			for (;;) {
				if (!pointer.token || pointer.token.type == 'EndFile') break;

				let value = this.expression.expression();
				if (!value) {
					value = {
						type: 'UndefinedExpr',
						value: 'undefined',
					};
				}

				values.push(value as Token);

				if (pointer.token.type == 'CloseSquare') break;

				const next = pointer.previewNext();

				if (!pointer.take('Comma')) {
					console.log(pointer.token);
					console.log(next);

					if (next && next.type != 'CloseSquare') {
						new SyntaxError(this.pointer, {
							lineError: pointer.line,
							startLine,
							reason: `Expected a ',' or ']'`,
							isParser: true,
						});
					}

					continue;
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
