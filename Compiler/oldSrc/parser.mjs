export class Parser {
	constructor(tokenizer) {
		this.token = null;
		this.rawTokens = [];

		this.tokenizer = tokenizer;
		this.ident = 0;
	}

	next(ignoreWhitespace = true) {
		this.token = this.tokenizer.next();
		if (!this.token) throw new TypeError('next token is undefined');

		this.rawTokens.push(this.token);

		switch (this.token.type) {
			case 'Whitespace':
				this.ident = this.token.size;

			case 'Newline':
			case 'Comment':
				return this.next();
		}
	}

	takeValues() {
		return this.maybeTake(['String', 'Boolean', 'Array', 'RegExp', 'Number']);
	}

	take(type, ignoreWhitespace = true) {
		if (Array.isArray(type)) {
			if (type.includes(this.token.type)) {
				const _token = this.token;

				this.next(ignoreWhitespace);

				return _token;
			}

			return null;
		}

		if (this.token.type === type) {
			const _token = this.token;

			this.next(ignoreWhitespace);

			return _token;
		}

		throw new SyntaxError(`Expected token type "${type}" got "${this.token.type}"`);
	}

	maybeTake(type, ignoreWhitespace = true) {
		if (Array.isArray(type)) {
			if (type.includes(this.token.type)) {
				const _token = this.token;

				this.next(ignoreWhitespace);

				return _token;
			}
		}

		if (this.token.type === type) {
			const _token = this.token;

			this.next(ignoreWhitespace);

			return _token;
		}

		return null;
	}

	expression() {
		switch (this.token.type) {
			case 'EndFile':
				return null;

			case 'Number': {
				const token = this.token;

				this.next();

				if (this.token.type === 'Operator') {
					const expr = {
						type: 'BinaryExpression',
						operator: this.token,
						left: token,
					};

					const op = this.token;

					this.next();

					const value = this.takeValues();
					if (!value) throw new SyntaxError(`Expected value for this ${op.value}`);

					return;
				}

				if (this.token.type === 'Semicolon') {
					this.take('Semicolon');
				}

				return token;
			}

			case 'String':
			case 'Boolean':
			case 'Array':
			case 'RegExp': {
				const token = this.token;

				this.next();

				if (this.token.type === 'Semicolon') {
					this.take('Semicolon');
				}

				return token;
			}

			case 'Identifier':

			case 'Operator': {
				const token = this.token;
				this.next();

				return token;
			}
		}

		return null;
	}

	variableAssignment(token) {
		this.take('Assignment');

		const value = this.takeValues();
		if (!value) throw new SyntaxError(`Expected value for this variable **${token.value}**`);

		this.next();

		if (this.token.type === 'Semicolon') {
			this.take('Semicolon');
		}

		return {
			type: 'VariableAssignment',
			variable: token,
			value,
			loc: {
				...token.loc,
				end: value.loc.end,
			},
		};
	}

	shortVariableStatement(short, loc) {
		for (;;) {
			const name = this.maybeTake('Identifier');

			if (!name)
				throw new SyntaxError(
					`Expected variable name in ${loc.file} line ${loc.start.line} column ${loc.end.column}`
				);

			const assign = this.maybeTake('Assignment');
			if (!assign) {
				short.variables.push({
					type: 'VariableStatement',
					name,
					value: 'undefined',
					loc: this.token.loc,
				});

				if (this.token.type === 'Colon') {
					this.take('Colon');

					continue;
				}

				if (this.token.type === 'Semicolon') {
					this.take('Semicolon');
				}
				break;
			}

			const value = this.takeValues();
			if (!value) throw SyntaxError('Expected value for this variable');

			short.variables.push({
				type: 'VariableDeclaration',
				name,
				value,
				loc: this.token.loc,
			});

			if (this.token.type === 'Colon') {
				this.take('Colon');

				continue;
			}

			if (this.token.type === 'Semicolon') {
				this.take('Semicolon');
			}

			break;
		}

		return short;
	}

	variableStatement() {
		const variable = this.maybeTake('VariableDeclaration');
		if (!variable) return null;

		const name = this.maybeTake('Identifier');
		if (!name)
			throw new SyntaxError(
				`Expected variable name in ${variable.loc.file}:${variable.loc.start.line}`
			);

		const assign = this.maybeTake('Assignment');
		if (!assign) {
			if (this.token.type === 'Colon') {
				const colon = this.take('Colon');

				return this.shortVariableStatement(
					{
						type: 'ShortVariableStatement',
						variables: [
							{
								type: 'VariableDeclaration',
								name,
								value: 'undefined',
								loc: variable.loc,
							},
						],
						loc: variable.loc,
					},
					colon.loc
				);
			}

			if (this.token.type === 'Semicolon') {
				this.take('Semicolon');
			}

			return {
				type: 'VariableStatement',
				name,
				value: 'undefined',
				loc: variable.loc,
			};
		}

		const value = this.takeValues();
		if (!value) {
			throw new SyntaxError(
				`Expected value for this variable **${name.value}** in ${name.loc.file}:${name.loc.start.line}`
			);
		}

		if (this.token.type === 'Semicolon') {
			this.take('Semicolon');
		}

		if (this.token.type === 'Colon') {
			const colon = this.take('Colon');

			return this.shortVariableStatement(
				{
					type: 'ShortVariableStatement',
					variables: [
						{
							type: 'VariableDeclaration',
							name,
							value,
							loc: variable.loc,
						},
					],
					loc: variable.loc,
				},
				colon.loc
			);
		}

		return {
			type: 'VariableStatement',
			name,
			value,
			loc: variable.loc,
		};
	}

	functionStatement() {
		const functionToken = this.maybeTake('FunctionDeclaration', false);
		if (!functionToken) return null;

		this.token.type === 'Whitespace' && this.maybeTake('Whitespace', false);

		const name = this.maybeTake('Identifier', false);
		if (!name) throw SyntaxError('Expected function name');

		const block = [];

		let functionIdent = this.ident;

		for (;;) {
			if (this.ident < functionIdent) break;

			if (this.token.type === 'ReturnDeclaration') {
				this.take('ReturnDeclaration');

				block.push({
					type: 'ReturnStatement',
					value: this.takeValues() || 'undefined',
				});

				break;
			}

			const data = this.statement();
			if (data) {
				block.push(data);

				continue;
			}

			break;
		}

		return {
			type: 'FunctionStatement',
			name,
			block,
		};
	}

	statement() {
		const expr = this.expression();
		if (expr) return expr;

		const variable = this.variableStatement();
		if (variable) return variable;

		const func = this.functionStatement();
		if (func) return func;

		return null;
	}

	parse() {
		this.next();

		const stmts = [];

		for (;;) {
			const stmt = this.statement();

			if (!stmt) break;

			stmts.push(stmt);
		}

		console.log(stmts);
	}
}
