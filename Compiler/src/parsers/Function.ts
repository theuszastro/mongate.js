import { SyntaxError } from '../errors/SyntaxError';
import { ParserPointer, Token } from '../utils/ParserPointer';
import { Expression } from './Expression';

export class _Function {
	constructor(
		private pointer: ParserPointer,
		private stmts: Function,
		private expression: Expression
	) {}

	private functionReadArg(line: number) {
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
						startLine: line,
						reason: 'Expected a default param value',
						isParser: true,
					});
				}

				arg.default = value as Token;

				const next = pointer.previewNext();

				if ((pointer.token.type as string) == 'Comma') {
					if (!next || next.type != 'Identifier')
						new SyntaxError(pointer, {
							lineError: pointer.line,
							startLine: line,
							reason: `Unexpected a '${pointer.token.value}'`,
							isParser: true,
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
						startLine: line,
						reason: `Unexpected a '${pointer.token.value}'`,
						isParser: true,
					});

				pointer.take('Comma');

				break;
			}
		}

		return arg;
	}

	private functionArgs(line: number) {
		const { pointer } = this;

		if (!pointer.token) return null;

		const args: Token[] = [];

		for (;;) {
			if (!pointer.token) break;

			const arg = this.functionReadArg(line);
			if (!arg) break;

			args.push(arg);
		}

		return args;
	}

	private functionBody(line: number) {
		const { pointer } = this;
		if (!pointer.token) return null;

		const body: Token[] = [];

		for (;;) {
			if (!pointer.token || pointer.take('EndFile'))
				new SyntaxError(this.pointer, {
					lineError: pointer.line,
					startLine: line,
					reason: 'Expected a end function',
					isParser: true,
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

		const line = pointer.line;

		const name = pointer.take('Identifier');
		if (!name)
			new SyntaxError(this.pointer, {
				lineError: pointer.line,
				startLine: line,
				reason: 'Expected a function name',
				isParser: true,
			});

		const args = this.functionArgs(line);
		const body = this.functionBody(line);

		return {
			type: 'FunctionDeclaration',
			name,
			args,
			body,
		};
	}
}
