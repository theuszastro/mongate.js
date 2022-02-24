import { takeCoverage } from 'v8';
import { SyntaxError } from '../errors/SyntaxError';
import { ParserPointer, Token } from '../utils/ParserPointer';
import { Expression } from './Expression';

export class _Object {
	constructor(private pointer: ParserPointer, private expression: Expression) {}

	private readProperty() {
		const { pointer } = this;
		if (!pointer.token) return null;

		const name = pointer.take('Identifier');
		if (name) return name;

		const expr = this.expression.expression(true);
		if (!expr || expr.type != 'String') return null;

		return expr;
	}

	private readValue() {
		const { pointer } = this;
		if (!pointer.token) return null;

		return this.expression.expression(true);
	}

	object() {
		const { pointer } = this;
		if (!pointer.token) return null;

		pointer.take('OpenCurly');

		const properties: Token[] = [];

		while (pointer.token.type != 'CloseCurly') {
			const lineError = pointer.line;

			const property = this.readProperty();
			if (!property) break;

			const colon = pointer.take('Colon');
			if (!colon) {
				if (pointer.token?.type === 'Comma' || pointer.token?.type === 'CloseCurly') {
					pointer.take('Comma');

					continue;
				}

				new SyntaxError(pointer, {
					lineError,
					reason: `Expected a ':'`,
				});
			}

			const value = this.readValue();
			if (!value)
				new SyntaxError(this.pointer, {
					lineError,
					reason: 'Expected a value',
				});

			if (!pointer.take('Comma')) {
				const property = this.readProperty();
				if (property) {
					new SyntaxError(pointer, {
						lineError,
						reason: `Expected a ','`,
					});
				}
			}

			properties.push({
				type: 'ObjectProperty',
				name: property as Token,
				value: value as Token,
			} as Token);
		}

		pointer.take('CloseCurly');

		return {
			type: 'Object',
			properties,
		};
	}
}
