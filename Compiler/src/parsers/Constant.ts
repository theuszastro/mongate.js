import { ParserPointer, Token } from '../utils/ParserPointer';
import { SyntaxError } from '../errors/SyntaxError';
import { Expression } from './Expression';
import { Identifier } from '../tokens';

export class Constant {
	private keywords: string[] = [];

	constructor(private pointer: ParserPointer, private expression: Expression) {
		this.keywords = Object.values(Identifier.keywords);
	}

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
			errObj['reason'] = this.keywords.includes(pointer.token.type)
				? 'this name is a keyword'
				: 'Expected a constant name';

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
