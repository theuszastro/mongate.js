import { ParserPointer, Token } from '../utils/ParserPointer';
import { SyntaxError } from '../errors/SyntaxError';
import { Expression } from './Expression';

export class Constant {
	constructor(private pointer: ParserPointer, private expression: Expression) {}

	constant() {
		const { pointer } = this;

		if (!pointer.token || !pointer.take('ConstantKeyword')) return null;

		let last = 'const';

		const name = pointer.take('Identifier');
		if (!name) new SyntaxError(this.pointer, 'const', 'Expected a constant name', 'parser');
		last += ` ${name?.value}`;

		const assign = pointer.take('Assignment');
		if (!assign) new SyntaxError(this.pointer, last, 'Expected a constant value', 'parser');
		last += `=`;

		const value = this.expression.expression();
		if (!value) new SyntaxError(this.pointer, last, 'Expected a variable value', 'parser');

		if (this.pointer.token?.type === 'Comma')
			new SyntaxError(this.pointer, ',', 'Unexpected comma', 'parser');

		return {
			type: 'ConstantDeclaration',
			name,
			value,
		};
	}
}
