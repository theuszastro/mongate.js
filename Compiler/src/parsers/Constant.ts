import { ParserPointer } from '../utils/ParserPointer';
import { SyntaxError } from '../errors/SyntaxError';

import { Expression } from './Expression';
import { Identifier } from '../tokens';

import { VariablesType, VariableToken } from '../types/parsedToken';

export class Constant {
	private keywords: string[] = [];

	constructor(private pointer: ParserPointer, private expression: Expression) {
		this.keywords = Object.values(Identifier.keywords);
	}

	constant(): VariableToken | undefined {
		const { pointer } = this;

		if (!pointer.token || !pointer.take('ConstantKeyword')) return;

		const errObj = {
			lineError: pointer.line,
			reason: '',
		};

		const variables: VariablesType[] = [];
		let isMultiple = false;

		for (;;) {
			const [name, assign] = pointer.takeMultiple(['Identifier', 'Assignment']);
			if (!name) {
				errObj['reason'] = this.keywords.includes(pointer.token.type)
					? 'this name is a keyword'
					: 'Expected a constant name';

				new SyntaxError(pointer, errObj);

				return;
			} else if (!assign) {
				errObj['reason'] = `Expected a '='`;

				new SyntaxError(pointer, errObj);

				return;
			}

			const value = this.expression.expression(true);
			if (!value) {
				errObj['reason'] = 'Expected a variable value';

				new SyntaxError(pointer, errObj);

				return;
			}

			variables.push({ name, value });

			if (pointer.token.type == 'Comma') {
				const next = pointer.previewNext();

				if (!next || next.type != 'Identifier') {
					errObj['reason'] = 'Expected a variable name';

					new SyntaxError(pointer, errObj);
				}

				pointer.take('Comma');

				isMultiple = true;

				continue;
			}

			break;
		}

		return {
			type: 'ConstantDeclaration',
			ctx: pointer.ctx(errObj.lineError),
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
