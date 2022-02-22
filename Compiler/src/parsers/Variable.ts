import { ParserPointer, Token } from '../utils/ParserPointer';
import { SyntaxError } from '../errors/SyntaxError';
import { Expression } from './Expression';

export class Variable {
	constructor(private pointer: ParserPointer, private expression: Expression) {}

	variable() {
		const { pointer } = this;

		if (!pointer.token || !pointer.take('VariableKeyword')) return null;

		const name = pointer.take('Identifier');
		if (!name) new SyntaxError(this.pointer, 'Expected a variable name', 'parser');

		const assign = pointer.take('Assignment');
		if (!assign) {
			pointer.take('Semicolon');

			return {
				type: 'VariableDeclaration',
				name,
				value: 'undefined',
			};
		}

		const value = this.expression.expression();
		if (!value) new SyntaxError(this.pointer, 'Expected a variable value', 'parser');

		if (this.pointer.token?.type === 'Comma')
			new SyntaxError(this.pointer, 'Unexpected comma', 'parser');

		pointer.take('Semicolon');

		return {
			type: 'VariableDeclaration',
			name,
			value,
		};
	}
}
