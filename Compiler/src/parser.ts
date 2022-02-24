import { SyntaxError } from './errors/SyntaxError';
import { Comments } from './parsers/Comments';
import { Constant } from './parsers/Constant';
import { Expression } from './parsers/Expression';
import { _Function } from './parsers/Function';

import { Variable } from './parsers/Variable';

import { Tokenizer } from './tokenizer';
import { ParserPointer } from './utils/ParserPointer';

export class Parser {
	private parserPointer: ParserPointer;

	private expression: Expression;

	private comments: Comments;
	private variable: Variable;
	private constant: Constant;
	private function: _Function;

	constructor(private tokenizer: Tokenizer, content: string, filename: string) {
		this.parserPointer = new ParserPointer(this.tokenizer, content, filename);

		this.expression = new Expression(this.parserPointer);

		this.variable = new Variable(this.parserPointer, this.expression);
		this.constant = new Constant(this.parserPointer, this.expression);
		this.function = new _Function(this.parserPointer, this.stmt.bind(this), this.expression);
		this.comments = new Comments(this.parserPointer);
	}

	private stmt() {
		const comment = this.comments.hashtag() || this.comments.comment();
		if (comment) return comment;

		const variable = this.variable.variable();
		if (variable) return variable;

		const variableAssignment = this.variable.variableAssignment();
		if (variableAssignment) return variableAssignment;

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
				if (!token) {
					if (this.parserPointer.token.type != 'EndFile') {
						const { token: pToken } = this.parserPointer;

						new SyntaxError(this.parserPointer, {
							startLine: this.parserPointer.line,
							lineError: this.parserPointer.line,
							reason: pToken.value
								? `Unexpected token '${pToken.value}'`
								: `Unexpected token ${pToken.type}`,
							isParser: true,
						});
					}

					break;
				}

				stmts.push(token);
			}
		}

		console.log(stmts[0]);
	}
}
