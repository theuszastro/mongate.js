import { ParserPointer, Token } from '../utils/ParserPointer';
import { SyntaxError } from '../errors/SyntaxError';

import { Array } from './Array';
import { _Object } from './Object';
import { RegExp } from './RegExp';
import { Number } from './Number';
import { String } from './String';

export class Expression {
	private array: Array;
	private object: _Object;
	private regexp: RegExp;
	private number: Number;
	private string: String;

	constructor(private pointer: ParserPointer) {
		this.array = new Array(pointer, this);
		this.object = new _Object(pointer, this);

		this.string = new String(pointer);
		this.regexp = new RegExp(pointer);
		this.number = new Number(pointer);
	}

	private parenBinaryExpression() {
		const { pointer } = this;

		pointer.take('OpenParen');

		const startLine = pointer.line;

		const binary = this.expression();
		const allowedExpr = ['Number', 'Identifier', 'ParenBinaryExpression', 'BinaryExpression'];

		if (!binary || !allowedExpr.includes(binary.type)) {
			new SyntaxError(pointer, {
				startLine: pointer.line,
				lineError: pointer.line,
				reason: 'Expected a right paren expression',
				isParser: true,
			});
		}

		const close = pointer.take('CloseParen');
		if (!close)
			new SyntaxError(pointer, {
				startLine,
				lineError: pointer.line,
				reason: "Expected a ')'",
				isParser: true,
			});

		return {
			...binary,
			type: 'ParenBinaryExpression',
		};
	}

	private binaryExpression(left: Token) {
		const { pointer } = this;

		const operator = pointer.take('Operator');
		const allowedExpr = ['Number', 'Identifier', 'ParenBinaryExpression', 'BinaryExpression'];

		const right = this.expression();
		if (!right || !allowedExpr.includes((right as Token).type))
			new SyntaxError(pointer, {
				startLine: pointer.line,
				lineError: pointer.line,
				reason: 'Expected a right expression',
				isParser: true,
			});

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

		return {
			type: 'ReturnExpression',
			value: value ? (value as Token) : 'undefined',
		};
	}

	private value() {
		const { pointer } = this;
		if (!pointer.token) return null;

		let { token } = pointer;

		switch (token.type) {
			case 'SingleQuote':
			case 'DoubleQuote':
				return this.string.string();

			case 'OpenCurly':
				return this.object.object();

			case 'OpenSquare':
				return this.array.array();

			case 'OpenParen':
				return this.parenBinaryExpression();

			case 'NullExpr':
			case 'UndefinedExpr':
				const _token = token;

				pointer.next();

				return _token;

			case 'Number':
				token = this.number.number() as Token;

			case 'Identifier':
				const left = token;

				pointer.next();

				if (pointer.token?.type === 'Operator') {
					return this.binaryExpression(left);
				}

				return left;

			case 'Operator':
				if (token.value === '/') {
					return this.regexp.regexp();
				}

			default:
				return null;
		}
	}

	private allExprs() {
		const { pointer } = this;
		if (!pointer.token) return null;

		let { token } = pointer;

		switch (token.type) {
			case 'ReturnKeyword':
				return this.returnExpression();

			default:
				return this.value();
		}
	}

	expression(isValue = false): Token | null {
		return isValue ? this.value() : this.allExprs();
	}
}
