import { ParserPointer } from '../utils/ParserPointer';
import { SyntaxError } from '../errors/SyntaxError';
import { Expression } from './Expression';

export class Variable {
	constructor(private pointer: ParserPointer, private expression: Expression) {}

	variableAssignment() {
		const { pointer } = this;

		if (!pointer.token) return null;

		const name = pointer.take('Identifier');
		if (!name) return null;

		if (!pointer.take('Assignment')) return null;

		const value = this.expression.expression();
		if (!value)
			new SyntaxError(this.pointer, {
				startLine: pointer.line,
				lineError: pointer.line,
				reason: 'Expected a value',
				isParser: true,
			});

		return {
			type: 'VariableAssignment',
			name,
			value,
		};
	}

	variable() {
		const { pointer } = this;

		if (!pointer.token || !pointer.take('VariableKeyword')) return null;

		const name = pointer.take('Identifier');
		if (!name)
			new SyntaxError(this.pointer, {
				startLine: pointer.line,
				lineError: pointer.line,
				reason: 'Expected a variable name',
				isParser: true,
			});

		const assign = pointer.take('Assignment');
		if (!assign) {
			return {
				type: 'VariableDeclaration',
				name,
				value: 'undefined',
			};
		}

		const value = this.expression.expression();
		if (!value)
			new SyntaxError(this.pointer, {
				startLine: pointer.line,
				lineError: pointer.line,
				reason: 'Expected a variable value',
				isParser: true,
			});

		return {
			type: 'VariableDeclaration',
			name,
			value,
		};
	}
}
