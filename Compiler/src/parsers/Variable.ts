import { ParserPointer } from '../utils/ParserPointer';
import { SyntaxError } from '../errors/SyntaxError';

import { Identifier } from '../tokens';
import { Token } from '../types/token';
import {
	DefaultToken,
	VariableAssignment,
	VariablesType,
	VariableToken,
} from '../types/parsedToken';

export class Variable {
	private keywords: string[] = [];

	constructor(private pointer: ParserPointer, private stmt: Function) {
		this.keywords = Object.values(Identifier.keywords);
	}

	variableAssignment(): VariableAssignment | undefined {
		const { pointer } = this;

		const next = pointer.previewNext();

		if (!pointer.token || !next || (next.type != 'Assignment' && next.type != 'Operator'))
			return;

		const [name, assignment] = pointer.takeMultiple(['Identifier', 'Assignment']);
		if (!name) return;

		let operator: Token | undefined;

		if (!assignment) {
			const [op, op1] = pointer.takeMultiple(['Operator', 'Operator']);

			if (!op) return;
			if (op1) {
				const operators = ['+', '-'];

				if (
					!operators.includes(op.value as string) ||
					!operators.includes(op1.value as string) ||
					op.value != op1.value
				) {
					new SyntaxError(pointer, {
						lineError: pointer.line,
						reason: `Unexpected token '${op.value}${op1.value}'`,
					});
				}

				const value = `${op1.value}${op.value}`;

				return {
					type: value === '++' ? 'VariableIncrement' : 'VariableDecrement',
					name,
					value,
					operator,
				};
			}

			const assign = pointer.take('Assignment');
			if (!assign) return;

			operator = op;
		}

		const value = this.stmt(true);
		if (!value)
			new SyntaxError(pointer, {
				lineError: pointer.line,

				reason: 'Expected a variable value',
			});

		return {
			type: 'VariableAssignment',
			name,
			value,
			operator,
		};
	}

	variable(): VariableToken | undefined {
		const { pointer } = this;

		if (!pointer.token || !pointer.take('VariableKeyword')) return;

		const errObj = {
			lineError: pointer.line,
			reason: '',
		};

		let isMultiple = false;
		const variables: VariablesType[] = [];

		for (;;) {
			const [name, assign] = pointer.takeMultiple(['Identifier', 'Assignment']);

			if (!name) {
				errObj['reason'] = this.keywords.includes(pointer.token.type)
					? 'this name is a keyword'
					: 'Expected a variable name';

				new SyntaxError(pointer, errObj);

				return;
			}

			if (!assign) {
				variables.push({ name, value: 'undefined' });
			} else {
				const value = this.stmt(true);
				if (!value) {
					errObj['reason'] = 'Expected a variable value';

					new SyntaxError(pointer, errObj);

					return;
				}

				variables.push({ name, value });
			}

			if (pointer.take('Comma')) {
				if (!pointer.token || pointer.token.type != 'Identifier') {
					errObj['reason'] = 'Expected a variable name';

					new SyntaxError(pointer, errObj);
				}

				isMultiple = true;

				continue;
			}

			break;
		}

		return {
			type: `VariableDeclaration`,
			...(isMultiple
				? {
						variables,
				  }
				: {
						name: variables[0].name,
						value: variables[0].value,
				  }),
		};
	}
}
