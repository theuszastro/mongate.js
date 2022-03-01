import { SyntaxError } from '../errors/SyntaxError';

import {
	DefaultToken,
	ObjectPropertyReadToken,
	ObjectToken,
	ParsedToken,
} from '../types/parsedToken';
import { Token } from '../types/token';

import { ParserPointer } from '../utils/ParserPointer';
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

	objectProperty(): ObjectPropertyReadToken | DefaultToken | undefined {
		const { pointer } = this;
		if (!pointer.token || !['ThisKeyword', 'Identifier'].includes(pointer.token.type)) return;

		const next = pointer.previewNext();
		if (next && next.type != 'Dot') return;

		const lineError = pointer.line;
		let name = pointer.take(pointer.token.type)!.value as string;

		for (;;) {
			if (!pointer.token || ['EndFile'].includes(pointer.token.type)) break;

			const type = pointer.take('Dot');
			if (!type) break;

			name += '.';

			const key = pointer.take('Identifier');
			if (!key)
				new SyntaxError(pointer, {
					lineError: pointer.line,
					reason: `Expected a property name`,
				});

			name += key!.value;
		}

		const assign = pointer.take('Assignment');
		if (!assign)
			return {
				type: 'ObjectPropertyRead',
				name,
				ctx: pointer.ctx(lineError),
			};

		const value = this.expression.expression(true);
		if (!value)
			new SyntaxError(pointer, {
				lineError,
				reason: `Expected a value`,
			});

		return {
			type: 'ObjectPropertyAssignment',
			name,
			value,
			ctx: pointer.ctx(lineError),
		} as DefaultToken;
	}

	object(): ObjectToken | undefined {
		const { pointer } = this;
		if (!pointer.token) return;

		const startLine = pointer.line;
		pointer.take('OpenCurly');

		const properties: ParsedToken[] = [];

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

			const value = this.expression.expression(true);
			if (!value) {
				new SyntaxError(this.pointer, {
					lineError,
					reason: 'Expected a value',
				});

				return;
			}

			if (!pointer.take('Comma')) {
				const property = this.readProperty();

				if (property)
					new SyntaxError(pointer, {
						lineError,
						reason: `Expected a ','`,
					});
			}

			properties.push({
				type: 'ObjectProperty',
				name: property as Token,
				value,
				ctx: pointer.ctx(lineError),
			});
		}

		pointer.take('CloseCurly');

		return {
			type: 'Object',
			properties,
			ctx: pointer.ctx(startLine),
		};
	}
}
