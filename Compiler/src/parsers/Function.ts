import { SyntaxError } from '../errors/SyntaxError';
import { ParserPointer } from '../utils/ParserPointer';

import { Token } from '../types/token';
import { Expression } from './Expression';
import { FunctionArg, FunctionCallToken, FunctionToken, ParsedToken } from '../types/parsedToken';

export class _Function {
	constructor(
		private pointer: ParserPointer,
		private expression: Expression,
		private stmt: Function
	) {}

	private functionArgs(): FunctionArg[] {
		const { pointer } = this;

		const args: FunctionArg[] = [];
		if (!pointer.token) return args;

		let isFirst = true;

		for (;;) {
			if (!pointer.token) break;

			const comma = pointer.take('Comma');
			if (!comma) {
				if (!isFirst) {
					break;
				}

				isFirst = false;
			}

			const name = pointer.take('Identifier');
			if (!name) break;

			const arg = {
				type: 'FunctionArg',
				name,
				default: 'undefined',
				ctx: pointer.ctx(pointer.line),
			} as FunctionArg;

			switch (pointer.token.type) {
				case 'Assignment': {
					pointer.take('Assignment');

					const value = this.expression.expression(true);
					if (!value) {
						new SyntaxError(pointer, {
							lineError: pointer.line,
							reason: 'Expected a default param value',
						});

						break;
					}

					arg.default = value;

					const next = pointer.previewNext();
					if ((pointer.token.type as string) == 'Comma') {
						if (!next || next.type != 'Identifier')
							new SyntaxError(pointer, {
								lineError: pointer.line,
								reason: `Unexpected a '${pointer.token.value}'`,
							});

						pointer.take('Comma');
					}

					break;
				}
			}

			args.push(arg);
		}

		return args;
	}

	private functionBody(): ParsedToken[] {
		const { pointer } = this;

		const body: ParsedToken[] = [];
		if (!pointer.token) return body;

		for (;;) {
			if (!pointer.token || pointer.take('EndFile'))
				new SyntaxError(this.pointer, {
					lineError: pointer.line,
					reason: 'Expected a end function',
				});

			if (pointer.take('EndKeyword')) break;

			const result = this.stmt();
			if (result) body.push(result);
		}

		return body;
	}

	private functionCallArgs(): ParsedToken[] {
		const { pointer } = this;

		const params: ParsedToken[] = [];
		const data = ['Identifier'];

		for (;;) {
			if (
				!pointer.token ||
				pointer.take('EndFile') ||
				data.includes(pointer.token.type) ||
				pointer.token.type.endsWith('Keyword')
			)
				break;

			const comma = pointer.take('Comma');
			const lineError = pointer.line;

			const arg = this.expression.expression(true);

			if (params.length >= 1)
				if (!comma && arg)
					new SyntaxError(pointer, {
						lineError,
						reason: `Expected a ','`,
					});

			if (!arg) break;

			params.push(arg);
		}

		return params;
	}

	functionCall(): FunctionCallToken | undefined {
		const { pointer } = this;

		if (!pointer.token) return;

		const next = pointer.previewNext();
		if (next && ['Operator', 'Assignment'].includes(next.type)) return;

		const lineError = pointer.line;
		const isAwait = Boolean(pointer.take('AwaitKeyword'));

		if (!['Identifier'].includes(pointer.token.type)) return;

		const name = pointer.take('Identifier', true, false);

		switch (pointer.token.type) {
			case 'OpenParen': {
				pointer.take('OpenParen');

				const params = this.functionCallArgs();

				const close = pointer.take('CloseParen');
				if (!close)
					new SyntaxError(pointer, {
						lineError,
						reason: `Expected a ')'`,
					});

				return {
					type: 'FunctionCall',
					name: name!,
					params,
					isAwait,
					ctx: pointer.ctx(lineError),
				};
			}

			case 'Not':
				pointer.take('Not');

			default: {
				const params = this.functionCallArgs();

				return {
					type: 'FunctionCall',
					name: name!,
					params,
					isAwait,
					ctx: pointer.ctx(lineError),
				};
			}
		}
	}

	functionDeclaration(isClass = false): FunctionToken | undefined {
		const { pointer } = this;

		const types = isClass
			? ['AsyncKeyword', 'Identifier', 'ConstructorKeyword']
			: ['FunctionKeyword', 'AsyncKeyword'];

		if (!pointer.token || !types.includes(pointer.token.type)) return;

		const lineError = pointer.line;
		const [async, func, name] = pointer.takeMultiple([
			'AsyncKeyword',
			'FunctionKeyword',
			'Identifier',
		]);

		if (async) {
			if (!func && !isClass && pointer.token.type != 'ConstructorKeyword')
				new SyntaxError(pointer, {
					lineError,
					reason: 'Expected a function declaration',
				});
		}

		if (!name && pointer.token.type != 'ConstructorKeyword') {
			new SyntaxError(this.pointer, {
				lineError,
				reason: 'Expected a function name',
			});

			return;
		}

		if (isClass && !name && async)
			new SyntaxError(pointer, {
				lineError,
				reason: `Unexpected token 'async'`,
			});

		const constructor = pointer.take('ConstructorKeyword')!;

		const args = this.functionArgs();
		const body = this.functionBody();

		return {
			type: 'FunctionDeclaration',
			name: name ?? constructor,
			body,
			args,
			isAsync: !!async,
			ctx: pointer.ctx(lineError),
		};
	}
}
