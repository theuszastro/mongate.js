import { ParserPointer } from '../utils/ParserPointer';
import { SyntaxError } from '../errors/SyntaxError';

import { Array } from './Array';
import { _Object } from './Object';
import { RegExp } from './RegExp';
import { Number } from './Number';
import { String } from './String';
import { Token } from '../types/token';
import { BinaryExpressionToken, ParsedToken, TypeToken } from '../types/parsedToken';

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

	private parenBinaryExpression(): BinaryExpressionToken | undefined {
		const { pointer } = this;

		pointer.take('OpenParen');

		const binary = this.expression();
		const allowedExpr = ['Number', 'Identifier', 'ParenBinaryExpression', 'BinaryExpression'];

		if (!binary || !allowedExpr.includes(binary.type))
			new SyntaxError(pointer, {
				lineError: pointer.line,
				reason: 'Expected a right paren expression',
			});

		const close = pointer.take('CloseParen');
		if (!close)
			new SyntaxError(pointer, {
				lineError: pointer.line,
				reason: "Expected a ')'",
			});

		return {
			...(binary as any),
			type: 'ParenBinaryExpression',
		};
	}

	private binaryExpression(): BinaryExpressionToken | Token | undefined {
		const { pointer } = this;

		const left = pointer.take('Identifier') ?? pointer.take('Number');
		const next = pointer.previewNext();

		if (
			next &&
			next.type === 'Operator' &&
			next.value === '/' &&
			pointer.token?.type === 'Operator' &&
			pointer.token?.value === '/'
		) {
			return;
		}

		const operator = pointer.take('Operator');
		const allowedExpr = ['Number', 'Identifier', 'ParenBinaryExpression', 'BinaryExpression'];

		const right = this.expression(true);
		if (!right || !allowedExpr.includes((right as Token).type))
			new SyntaxError(pointer, {
				lineError: pointer.line,
				reason: 'Expected a right expression',
			});

		return {
			type: 'BinaryExpression',
			left: left!,
			operator: operator as Token,
			right: right as Token,
		};
	}

	private returnExpression(): TypeToken | undefined {
		const { pointer } = this;

		if (!pointer.token || !pointer.take('ReturnKeyword')) return;

		const value = this.expression(true);

		return {
			type: 'ReturnExpression',
			value: value ? (value as ParsedToken) : 'undefined',
		};
	}

	private value(): ParsedToken | undefined {
		const { pointer } = this;
		if (!pointer.token) return;

		let { token } = pointer;

		if (['ThisKeyword', 'Identifier'].includes(token.type)) {
			const value = this.object.objectProperty();

			if (value) return value;
		}

		switch (token.type) {
			case 'SingleQuote':
			case 'DoubleQuote':
				return this.string.string();

			case 'OpenSquare':
				return this.array.array();

			case 'OpenCurly':
				return this.object.object();

			case 'OpenParen':
				return this.parenBinaryExpression();

			case 'Boolean':
			case 'NullExpr':
			case 'UndefinedExpr':
				const _token = token;

				pointer.next();

				return _token;

			case 'Number':
				token = this.number.number() as Token;

			case 'ThisKeyword':
			case 'Identifier':
				const next = pointer.previewNext();

				if (next) {
					if (next.type === 'Dot' && ['Identifier', 'ThisKeyword'].includes(token.type)) {
						return this.object.objectProperty();
					}

					if (next.type === 'Operator') {
						return this.binaryExpression();
					}
				}

				if (pointer.token.type == 'ThisKeyword') return;

				pointer.next();

				return token;

			case 'Operator':
				if (token.value === '/') {
					return this.regexp.regexp();
				}
		}
	}

	private allExprs() {
		const { pointer } = this;
		if (!pointer.token) return;

		let { token } = pointer;

		switch (token.type) {
			case 'ReturnKeyword':
				return this.returnExpression();

			default:
				return this.value();
		}
	}

	expression(isValue = false): ParsedToken | undefined {
		return isValue ? this.value() : this.allExprs();
	}
}
