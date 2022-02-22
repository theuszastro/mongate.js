import { ParserPointer, Token } from '../utils/ParserPointer';
import { SyntaxError } from '../errors/SyntaxError';
import { Expression } from './Expression';

export class Constant {
	constructor(private pointer: ParserPointer, private expression: Expression) {}

	constant() {
		const { pointer } = this;

		if (!pointer.token || !pointer.take('ConstantKeyword')) return null;

		const name = pointer.take('Identifier');
		if (!name) new SyntaxError(this.pointer, 'Expected a constant name', 'parser');

		const assign = pointer.take('Assignment');
		if (!assign) new SyntaxError(this.pointer, 'Expected a constant value', 'parser');

		const value = this.expression.expression();
		if (!value) new SyntaxError(this.pointer, 'Expected a variable value', 'parser');

		if (pointer.take('Comma')) new SyntaxError(this.pointer, 'Unexpected comma', 'parser');

		pointer.take('Semicolon');

		return {
			type: 'ConstantDeclaration',
			name,
			value,
		};
	}
}
