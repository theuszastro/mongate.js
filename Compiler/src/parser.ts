import { SyntaxError } from './errors/SyntaxError';
import { Comments } from './parsers/Comments';
import { Constant } from './parsers/Constant';
import { Expression } from './parsers/Expression';
import { _Function } from './parsers/Function';
import { Loops } from './parsers/Loops';
import { Class } from './parsers/Class';

import { Variable } from './parsers/Variable';

import { Tokenizer } from './tokenizer';
import { ParserPointer } from './utils/ParserPointer';
import { ParsedToken } from './types/parsedToken';

export class Parser {
	private parserPointer: ParserPointer;
	private expression: Expression;

	private comments: Comments;
	private variable: Variable;
	private constant: Constant;
	private function: _Function;
	private loops: Loops;
	private classes: Class;

	constructor(private tokenizer: Tokenizer, private content: string, private filename: string) {
		this.parserPointer = new ParserPointer(this.tokenizer, content, filename);

		this.stmt = this.stmt.bind(this);
		this.argStmt = this.argStmt.bind(this);
		this.valueStmt = this.valueStmt.bind(this);

		this.comments = new Comments(this.parserPointer);
		this.expression = new Expression(this.parserPointer);
		this.loops = new Loops(this.parserPointer, this.stmt);
		this.variable = new Variable(this.parserPointer, this.stmt);
		this.constant = new Constant(this.parserPointer, this.expression);
		this.function = new _Function(this.parserPointer, this.expression, this.stmt, this.argStmt);
		this.classes = new Class(this.parserPointer, this.function, this.stmt);
	}

	private stmt() {
		const comment = this.comments.hashtag() || this.comments.comment();
		if (comment) return comment;

		const variable = this.variable.variable();
		if (variable) return variable;

		const constant = this.constant.constant();
		if (constant) return constant;

		const _class = this.classes._class();
		if (_class) return _class;

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

	argStmt() {
		const funcCall = this.function.functionCall();
		if (funcCall) return funcCall;

		return;
	}

	valueStmt() {
		const funcCall = this.function.functionCall();
		if (funcCall) return funcCall;

		const expr = this.expression.expression(true);
		if (expr) return expr;

		return;
	}

	parse() {
		const stmts: ParsedToken[] = [];
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

				stmts.push(token as ParsedToken);
			}
		}

		// @ts-ignore
		console.log(stmts[0].body[1].body[0].value.properties);

		return {
			filename: this.filename,
			content: this.content,
			tokens: stmts,
		};
	}
}
