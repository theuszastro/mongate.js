import { ParserPointer, Token } from '../utils/ParserPointer';
import { SyntaxError } from '../errors/SyntaxError';
import { Expression } from './Expression';
import { Identifier } from '../tokens';

export class Variable {
	private keywords: string[] = [];

	constructor(private pointer: ParserPointer, private expression: Expression) {
		this.keywords = Object.values(Identifier.keywords);
	}

	variableAssignment() {
		const { pointer } = this;

		if (!pointer.token) return null;

		const name = pointer.take('Identifier');
		if (!name) return null;

		let isWithOperator = false;
		let operator: Token | null = null;

		if (!pointer.take('Assignment')) {
			const op = pointer.take('Operator', true, false);
			if (!op) return null;

			const op1 = pointer.take('Operator');

			if (op1) {
				const operators = ['+', '-'];

				if (
					!operators.includes(op.value as string) ||
					!operators.includes(op1.value as string)
				) {
					new SyntaxError(pointer, {
						lineError: pointer.line,
						reason: `Unexpected token '${op1.value}'`,
					});
				}

				const value = `${op1.value}${op.value}`;

				return {
					type: value === '++' ? 'VariableIncrement' : 'VariableDecrement',
					value,
				};
			}

			const assign = pointer.take('Assignment');
			if (!assign) return null;

			isWithOperator = true;
			operator = op;
		}

		const value = this.expression.expression(true);
		if (!value)
			new SyntaxError(this.pointer, {
				lineError: pointer.line,

				reason: 'Expected a variable value',
			});

		return {
			type: isWithOperator ? 'VariableAssignmentWithOperator' : 'VariableAssignment',
			name,
			value,
			operator,
		};
	}

	variable() {
		const { pointer } = this;

		if (!pointer.token || !pointer.take('VariableKeyword')) return null;

		const errObj = {
			lineError: pointer.line,
			reason: '',
		};

		let isMultiple = false;
		const variables: Token['variables'] = [];

		for (;;) {
			if (!pointer.token || pointer.take('EndFile')) break;

			const name = pointer.take('Identifier');
			if (!name) {
				errObj['reason'] = this.keywords.includes(pointer.token.type)
					? 'this name is a keyword'
					: 'Expected a variable name';

				new SyntaxError(this.pointer, errObj);
			}

			const assign = pointer.take('Assignment');
			if (!assign) {
				variables.push({
					name: name as Token,
					value: 'undefined',
				});
			} else {
				const value = this.expression.expression(true);
				if (!value) {
					errObj['reason'] = 'Expected a variable value';

					new SyntaxError(this.pointer, errObj);
				}

				variables.push({
					name: name as Token,
					value: value as Token,
				});
			}

			if (pointer.token.type === 'Comma') {
				const next = pointer.previewNext();

				if (!next || next.type != 'Identifier') {
					errObj['reason'] = 'Expected a variable name';

					new SyntaxError(this.pointer, errObj);
				}

				pointer.take('Comma');

				isMultiple = true;

				continue;
			}

			break;
		}

		if (isMultiple) {
			return {
				type: `MultipleVariableDeclaration`,
				variables,
			};
		}

		return {
			type: `VariableDeclaration`,
			name: variables[0].name,
			value: variables[0].value,
		};
	}
}
