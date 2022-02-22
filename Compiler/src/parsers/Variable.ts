import { ParserPointer } from '../utils/ParserPointer';
import { SyntaxError } from '../errors/SyntaxError';
import { Expression } from './Expression';

export class Variable {
	constructor(private pointer: ParserPointer, private expression: Expression) {}

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
