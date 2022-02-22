import { takeCoverage } from 'v8';
import { SyntaxError } from '../errors/SyntaxError';
import { ParserPointer, Token } from '../utils/ParserPointer';
import { Expression } from './Expression';

export class _Object {
	constructor(private pointer: ParserPointer, private expression: Expression) {}

	object() {
		const { pointer } = this;
		if (!pointer.token) return null;

		pointer.take('OpenCurly');

		const properties: Token[] = [];
		const values: Token[] = [];

		while (pointer.token.type != 'CloseCurly') {
			const startLine = pointer.line;

			const property = pointer.take('Identifier');
			if (!property) break;

			properties.push(property as Token);

			const next = pointer.previewNext();
			const colon = pointer.take('Colon');
			if (!colon) {
				if (next?.type === 'Comma' || next?.type === 'CloseCurly') {
					continue;
				}

				break;
			}

			const value = this.expression.expression();
			if (!value)
				new SyntaxError(this.pointer, {
					startLine,
					lineError: pointer.line,
					reason: 'Expected a value',
					isParser: true,
				});

			const comma = pointer.take('Comma');
			if (!comma) {
				if (pointer.token.type === 'Identifier') {
					new SyntaxError(this.pointer, {
						startLine,
						lineError: startLine,
						reason: 'Expected a comma',
						isParser: true,
					});
				}
			}

			values.push(value as Token);
		}

		pointer.take('CloseCurly');

		return {
			type: 'Object',
			properties,
			values,
		};
	}
}
