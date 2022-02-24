import { ParserPointer } from '../utils/ParserPointer';
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
		if (!pointer.take('Assignment')) return null;

		const value = this.expression.expression();
		if (!value || value.type == 'ReturnExpression')
			new SyntaxError(this.pointer, {
				startLine: pointer.line,
				lineError: pointer.line,
				isParser: true,
				reason:
					value && value.type == 'ReturnExpression'
						? 'Expected a valid variable value'
						: 'Expected a variable value',
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
				reason: this.keywords.includes(pointer.token.type)
					? 'this name is a keyword'
					: 'Expected a variable name',
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

		const value = this.expression.expression(true);
		if (!value)
			new SyntaxError(this.pointer, {
				startLine: pointer.line,
				lineError: pointer.line,
				isParser: true,
				reason: 'Expected a valid variable value',
			});

		return {
			type: 'VariableDeclaration',
			name,
			value,
		};
	}
}
