export class Parser {
	constructor(tokenizer) {
		this.token = null;
		this.rawTokens = [];

		this.tokenizer = tokenizer;
	}

	next(mode, ignoreWhitespace = true) {
		this.token = this.tokenizer.next(mode);
		if (!this.token) throw new TypeError('next token is undefined');

		this.rawTokens.push(this.token);

		switch (this.token.type) {
			case 'Whitespace':
				if (ignoreWhitespace) {
					this.next(mode, ignoreWhitespace);
				}

				return;

			case 'Comment':
			case 'Newline':
				return this.next(mode);
		}
	}

	takeValues() {
		return this.maybeTake(['String', 'Boolean', 'Array', 'RegExp', 'Number']);
	}

	take(type, mode) {
		if (Array.isArray(type)) {
			if (type.includes(this.token.type)) {
				const _token = this.token;

				this.next(mode);

				return _token;
			}

			return null;
		}

		if (this.token.type === type) {
			const _token = this.token;

			this.next(mode);

			return _token;
		}

		throw new SyntaxError(`Expected token type "${type}" got "${this.token.type}"`);
	}

	maybeTake(type, mode) {
		if (Array.isArray(type)) {
			if (type.includes(this.token.type)) {
				const _token = this.token;

				this.next(mode);

				return _token;
			}
		}

		if (this.token.type === type) {
			const _token = this.token;

			this.next(mode);

			return _token;
		}

		return null;
	}

	expression() {
		switch (this.token.type) {
			case 'EndFile':
				return null;

			case 'String':
			case 'Boolean':
			case 'Array':
			case 'RegExp':
			case 'Number': {
				const token = this.token;

				this.next();

				if (this.token.type === 'Semicolon') {
					this.take('Semicolon', 'expression');
				}

				return token;
			}

			case 'Identifier':
			case 'PlusOperator':
			case 'MinusOperator':
			case 'MultiplyOperator':
			case 'DivisionOperator':
			case 'DivisionRestOperator': {
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
			this.take('Semicolon', 'expression');
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

	statement() {
		const expr = this.expression();
		if (expr) return expr;

		const variable = this.variableStatement();
		if (variable) return variable;

		return null;
	}

	parse() {
		this.next('expression');

		const stmts = [];

		for (;;) {
			const stmt = this.statement();
			if (!stmt) break;

			stmts.push(stmt);
		}

		console.log(stmts[0].variables);
		console.log(stmts[1].variables);
	}
}
