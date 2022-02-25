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
			lineError: pointer.line,
			reason: '',
		};

		const variables: Token['variables'] = [];
		let isMultiple = false;

		for (;;) {
			if (!pointer.token || pointer.take('EndFile')) break;

			const name = pointer.take('Identifier');
			if (!name) {
				errObj['reason'] = this.keywords.includes(pointer.token.type)
					? 'this name is a keyword'
					: 'Expected a constant name';

				new SyntaxError(this.pointer, errObj);
			}

			const assign = pointer.take('Assignment');
			if (!assign) {
				errObj['reason'] = `Expected a '='`;

				new SyntaxError(this.pointer, errObj);
			}

			const value = this.expression.expression(true);
			if (!value) {
				errObj['reason'] = 'Expected a variable value';

				new SyntaxError(this.pointer, errObj);
			}

			variables.push({
				name: name as Token,
				value: value as Token,
			});

			if (pointer.token.type == 'Comma') {
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
				type: 'MultipleConstantDeclaration',
				variables,
			};
		}

		return {
			type: 'ConstantDeclaration',
			name: variables[0].name,
			value: variables[0].value,
		};
	}
}
