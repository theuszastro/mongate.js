import { SyntaxError } from '../errors/SyntaxError';
import { ParserPointer, Token } from '../utils/ParserPointer';

export class _Function {
	constructor(private pointer: ParserPointer, private stmts: Function) {}

	private functionArgs(line: number) {
		const { pointer } = this;

		if (!pointer.token) return null;

		const args: Token[] = [];

		for (;;) {
			if (!pointer.token) break;

			const arg = pointer.take('Identifier');
			if (!arg) break;

			args.push(arg as Token);

			const next = pointer.previewNext();
			if (!next || next.type === 'EndFile') break;

			if (pointer.token.type == 'Comma') {
				if (next.type != 'Identifier')
					new SyntaxError(this.pointer, {
						lineError: pointer.line,
						startLine: line,
						reason: 'Expected a valid function argument',
						isParser: true,
					});

				pointer.take('Comma');
			} else {
				if (pointer.token.type === 'Identifier') {
					new SyntaxError(this.pointer, {
						lineError: pointer.line,
						startLine: line,
						reason: `Expected a ','`,
						isParser: true,
					});
				}
			}
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
