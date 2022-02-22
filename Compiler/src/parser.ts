import { SyntaxError } from './errors/SyntaxError';
import { Constant } from './parsers/Constant';
import { Expression } from './parsers/Expression';
import { _Function } from './parsers/Function';
import { Variable } from './parsers/Variable';

import { Tokenizer } from './tokenizer';
import { ParserPointer } from './utils/ParserPointer';

export class Parser {
	private parserPointer: ParserPointer;

	private expression: Expression;
	private variable: Variable;
	private constant: Constant;
	private function: _Function;

	constructor(private tokenizer: Tokenizer, content: string, filename: string) {
		this.parserPointer = new ParserPointer(this.tokenizer, content, filename);

		this.expression = new Expression(this.parserPointer);
		this.variable = new Variable(this.parserPointer, this.expression);
		this.constant = new Constant(this.parserPointer, this.expression);
		this.function = new _Function(this.parserPointer, this.stmt.bind(this));
	}

	private stmt() {
		const variable = this.variable.variable();
		if (variable) return variable;

		const constant = this.constant.constant();
		if (constant) return constant;

		const func = this.function.functionDeclaration();
		if (func) return func;

		const expr = this.expression.expression();
		if (expr) return expr;
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

		console.log(stmts[0]);
		console.log(stmts[0].right);
		console.log(stmts[0].right.right);
	}
}
