import { SyntaxError } from '../errors/SyntaxError';
import { ParserPointer, Token } from '../utils/ParserPointer';
import { Expression } from './Expression';
import { Variable } from './Variable';

export class _Function {
	constructor(
		private pointer: ParserPointer,
		private stmts: Function,
		private expression: Expression,
		private variable: Variable
	) {}

	private functionReadArg() {
		const { pointer } = this;

		if (!pointer.token) return null;

		const name = pointer.take('Identifier');
		if (!name) return null;

		const arg = {
			type: 'FunctionParam',
			name,
			default: 'undefined',
		} as Token;

		switch (pointer.token.type) {
			case 'Assignment': {
				pointer.take('Assignment');

				const value = this.expression.expression(true);
				if (!value) {
					new SyntaxError(pointer, {
						lineError: pointer.line,
						reason: 'Expected a default param value',
					});
				}

				arg.default = value as Token;

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

			case 'Comma': {
				const next = pointer.previewNext();

				if (!next || next.type != 'Identifier')
					new SyntaxError(pointer, {
						lineError: pointer.line,
						reason: `Unexpected a '${pointer.token.value}'`,
					});

				pointer.take('Comma');

				break;
			}
		}

		return arg;
	}

	private functionArgs() {
		const { pointer } = this;

		if (!pointer.token) return null;

		const args: Token[] = [];

		for (;;) {
			if (!pointer.token) break;

			const arg = this.functionReadArg();
			if (!arg) break;

			args.push(arg);
		}

		return args;
	}

	private functionBody() {
		const { pointer } = this;
		if (!pointer.token) return null;

		const body: Token[] = [];

		for (;;) {
			if (!pointer.token || pointer.take('EndFile'))
				new SyntaxError(this.pointer, {
					lineError: pointer.line,
					reason: 'Expected a end function',
				});

			if (pointer.take('EndKeyword')) break;

			const result = this.stmts();
			if (result) body.push(result);
		}

		return body;
	}

	private functionCallArgs() {
		const { pointer } = this;

		const params: Token[] = [];
		const data = ['Identifier'];

		for (;;) {
			if (!pointer.token || pointer.take('EndFile') || data.includes(pointer.token.type))
				break;

			const comma = pointer.take('Comma');
			const lineError = pointer.line;

			const arg = this.expression.expression(true);

			if (params.length >= 1) {
				if (!comma && arg) {
					new SyntaxError(pointer, {
						lineError,
						reason: `Expected a ','`,
					});
				}
			}

			if (!arg) break;

			params.push(arg);
		}

		return params;
	}

	functionCall() {
		const { pointer } = this;

		if (!pointer.token) return null;

		const next = pointer.previewNext();
		if (next && next.type === 'Assignment') return null;

		const callWithAwait = pointer.token.type === 'AwaitKeyword';
		pointer.take('AwaitKeyword');

		const name = pointer.take('Identifier');
		if (!name) return null;

		switch (pointer.token.type) {
			case 'OpenParen': {
				pointer.take('OpenParen');

				const params = this.functionCallArgs();

				const close = pointer.take('CloseParen');
				if (!close)
					new SyntaxError(pointer, {
						lineError: pointer.line,
						reason: `Expected a ')'`,
					});

				return {
					type: callWithAwait ? 'AsyncFunctionCall' : 'FunctionCall',
					name,
					params,
				};
			}

			case 'Not':
				pointer.take('Not');

			default: {
				const params = this.functionCallArgs();

				return {
					type: callWithAwait ? 'AsyncFunctionCall' : 'FunctionCall',
					name,
					params,
				};
			}
		}
	}

	functionDeclaration() {
		const { pointer } = this;

		if (!pointer.token || !['FunctionKeyword', 'AsyncKeyword'].includes(pointer.token.type))
			return null;

		const isAsync = pointer.token.type == 'AsyncKeyword';
		if (isAsync) {
			pointer.take('AsyncKeyword');

			if (!pointer.token || pointer.token.type != 'FunctionKeyword')
				new SyntaxError(pointer, {
					lineError: pointer.line,
					reason: 'Expected a function declaration',
				});
		}

		pointer.take('FunctionKeyword');

		const name = pointer.take('Identifier');
		if (!name)
			new SyntaxError(this.pointer, {
				lineError: pointer.line,
				reason: 'Expected a function name',
			});

		const args = this.functionArgs();
		const body = this.functionBody();

		return {
			type: isAsync ? 'AsyncFunctionDeclaration' : 'FunctionDeclaration',
			name,
			args,
			body,
		};
	}
}
