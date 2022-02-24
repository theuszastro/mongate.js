import { SyntaxError } from '../errors/SyntaxError';
import { ParserPointer, Token } from '../utils/ParserPointer';
import { Expression } from './Expression';

export class _Function {
	constructor(
		private pointer: ParserPointer,
		private stmts: Function,
		private expression: Expression
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

	functionDeclaration() {
		const { pointer } = this;

		if (!pointer.token || !pointer.take('FunctionKeyword')) return null;

		const name = pointer.take('Identifier');
		if (!name)
			new SyntaxError(this.pointer, {
				lineError: pointer.line,
				reason: 'Expected a function name',
			});

		const args = this.functionArgs();
		const body = this.functionBody();

		return {
			type: 'FunctionDeclaration',
			name,
			args,
			body,
		};
	}
}
