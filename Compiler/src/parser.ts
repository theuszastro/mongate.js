import { SyntaxError } from './errors/SyntaxError';
import { Comments } from './parsers/Comments';
import { Constant } from './parsers/Constant';
import { Expression } from './parsers/Expression';
import { _Function } from './parsers/Function';
import { Loops } from './parsers/Loops';

import { Variable } from './parsers/Variable';

import { Tokenizer } from './tokenizer';
import { ParserPointer, Token } from './utils/ParserPointer';

export class Parser {
	private parserPointer: ParserPointer;
	private expression: Expression;

	private comments: Comments;
	private variable: Variable;
	private constant: Constant;
	private function: _Function;
	private loops: Loops;

	constructor(private tokenizer: Tokenizer, private content: string, private filename: string) {
		this.parserPointer = new ParserPointer(this.tokenizer, content, filename);

		this.stmt = this.stmt.bind(this);

		this.comments = new Comments(this.parserPointer);
		this.expression = new Expression(this.parserPointer, this.comments);
		this.loops = new Loops(this.parserPointer, this.stmt);
		this.variable = new Variable(this.parserPointer, this.stmt);
		this.constant = new Constant(this.parserPointer, this.expression);
		this.function = new _Function(
			this.parserPointer,
			this.stmt,
			this.expression,
			this.variable
		);
	}

	private stmt(isValue?: boolean) {
		if (isValue) {
			const funcCall = this.function.functionCall();
			if (funcCall) return funcCall;

			const expr = this.expression.expression(isValue);
			if (expr) return expr;

			return null;
		}

		const comment = this.comments.hashtag() || this.comments.comment();
		if (comment) return comment;

		const variable = this.variable.variable();
		if (variable) return variable;

		const constant = this.constant.constant();
		if (constant) return constant;

		const func = this.function.functionDeclaration();
		if (func) return func;

		const funcCall = this.function.functionCall();
		if (funcCall) return funcCall;

		const variableAssignment = this.variable.variableAssignment();
		if (variableAssignment) return variableAssignment;

		const loops = this.loops.loop();
		if (loops) return loops;

		const expr = this.expression.expression();
		if (expr) return expr;
	}

	parse() {
		const stmts: Token[] = [];
		const { parserPointer } = this;

		parserPointer.next();

		for (;;) {
			if (parserPointer.token) {
				if (parserPointer.token.type == 'EndFile') break;

				const token = this.stmt();
				if (!token) {
					if (parserPointer.token.type != 'EndFile') {
						const { token: pToken } = parserPointer;

						new SyntaxError(parserPointer, {
							lineError: parserPointer.line,
							reason: pToken.value
								? `Unexpected token '${pToken.value}'`
								: `Unexpected token ${pToken.type}`,
						});
					}

					break;
				}

				stmts.push(token as Token);
			}
		}

		console.log(stmts);

		return {
			filename: this.filename,
			content: this.content,
			tokens: stmts,
		};
	}
}
