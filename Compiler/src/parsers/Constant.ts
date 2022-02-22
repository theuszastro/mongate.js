import { ParserPointer, Token } from '../utils/ParserPointer';
import { SyntaxError } from '../errors/SyntaxError';
import { Expression } from './Expression';

export class Constant {
	constructor(private pointer: ParserPointer, private expression: Expression) {}

	constant() {
		const { pointer } = this;

		if (!pointer.token || !pointer.take('ConstantKeyword')) return null;

		const errObj = {
			startLine: pointer.line,
			lineError: pointer.line,
			isParser: true,
			reason: '',
		};

		const name = pointer.take('Identifier');
		if (!name) {
			errObj['reason'] = 'Expected a constant name';

			new SyntaxError(this.pointer, errObj);
		}

		const assign = pointer.take('Assignment');
		if (!assign) {
			errObj['reason'] = 'Expected a constant value';

			new SyntaxError(this.pointer, errObj);
		}

		const value = this.expression.expression();
		if (!value) {
			errObj['reason'] = 'Expected a variable value';

			new SyntaxError(this.pointer, errObj);
		}

		return {
			type: 'ConstantDeclaration',
			name,
			value,
		};
	}
}
