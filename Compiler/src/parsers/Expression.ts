import { ParserPointer, Token } from '../utils/ParserPointer';
import { SyntaxError } from '../errors/SyntaxError';

import { Array } from './Array';

export class Expression {
	private array: Array;

	constructor(private pointer: ParserPointer) {
		this.array = new Array(pointer, this);
	}

	private BinaryExpression(left: Token) {
		const { pointer } = this;

		const operator = pointer.take('Operator');

		const right = this.expression();
		if (!right) new SyntaxError(pointer, 'Expected a right expression', 'parser');

		return {
			type: 'BinaryExpression',
			left,
			operator: operator as Token,
			right: right as Token,
		};
	}

	private returnExpression() {
		const { pointer } = this;

		if (!pointer.token) return null;

		pointer.take('ReturnKeyword');
		const value = this.expression();

		pointer.take('Semicolon');
		pointer.take('NewLine');

		return {
			type: 'ReturnExpression',
			value: value ? (value as Token) : 'undefined',
		};
	}

	expression(): Token | null {
		const { pointer } = this;
		const { token } = pointer;

		if (!token) return null;

		switch (token.type) {
			case 'ReturnKeyword':
				return this.returnExpression();

			case 'OpenSquare':
				return null;

			case 'Identifier':
			case 'Number':
				const left = token;
				pointer.next();

				if (pointer.token?.type === 'Operator') {
					return this.BinaryExpression(left);
				}

				return left;

			case 'String':
			case 'Boolean':
			case 'RegExp':
				const _token = token;

				pointer.next();

				return _token;
		}

		return null;
	}
}
