import { takeCoverage } from 'v8';
import { SyntaxError } from '../errors/SyntaxError';
import { ParserPointer, Token } from '../utils/ParserPointer';

export class _Function {
	constructor(private pointer: ParserPointer, private stmts: Function) {}

	private functionArgs() {
		const { pointer } = this;

		if (!pointer.token) return null;

		const args: Token[] = [];
		const currentLine = pointer.line;

		for (;;) {
			if (!pointer.token) break;
			// if (!['Comma', 'Identifier'].includes(pointer.token?.type)) {
			// 	if (pointer.line >= currentLine) break;

			// 	new SyntaxError(this.pointer, `Unexpected a ${pointer.token?.type}`, 'parser');
			// }

			const arg = pointer.take('Identifier');
			if (!arg) break;

			args.push(arg as Token);

			const next = pointer.previewNext();
			if (!next || next.type === 'EndFile') break;

			if (pointer.token.type == 'Comma') {
				if (next.type != 'Identifier') {
					new SyntaxError(this.pointer, `Expected a identifier`, 'parser');
				}

				pointer.take('Comma');
			}
		}

		return args;
	}

	private functionBody() {
		const { pointer } = this;
		if (!pointer.token) return null;

		const body: Token[] = [];

		for (;;) {
			if (!pointer.token || pointer.take('EndFile'))
				new SyntaxError(this.pointer, 'Expected a end', 'parser');

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
		if (!name) new SyntaxError(this.pointer, 'Expected a function name', 'parser');

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
