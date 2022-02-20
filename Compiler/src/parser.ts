import { Expression } from './parsers/Expression';
import { Variable } from './parsers/Variable';

import { Tokenizer } from './tokenizer';
import { ParserPointer } from './utils/ParserPointer';

export class Parser {
	private parserPointer: ParserPointer;

	private variable: Variable;
	private expression: Expression;

	constructor(private tokenizer: Tokenizer, content: string, filename: string) {
		this.parserPointer = new ParserPointer(this.tokenizer, content, filename);

		this.expression = new Expression(this.parserPointer);
		this.variable = new Variable(this.parserPointer, this.expression);
	}

	private stmt() {
		const variable = this.variable.variable();
		if (variable) return variable;
	}

	parse() {
		const stmts: any[] = [];

		this.parserPointer.next();

		for (;;) {
			if (this.parserPointer.token) {
				if (this.parserPointer.token.type == 'EndFile') break;

				const token = this.stmt();
				if (!token) break;

				stmts.push(token);
			}
		}

		console.log(stmts);
	}
}
