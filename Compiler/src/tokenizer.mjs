import { buffer } from 'stream/consumers';

export class Tokenizer {
	constructor(file, code) {
		this.line = 1;
		this.column = 1;
		this.cursor = 0;

		this.file = file;
		this.code = code;

		this.char = code[this.cursor];

		this.keywords = {
			let: 'VariableDeclaration',
		};
	}

	#isNumeric() {
		return '0' <= this.char && this.char <= '9';
	}

	#isWhitespace() {
		return this.char === ' ';
	}

	#isAlpha() {
		return ('a' <= this.char && this.char <= 'z') || ('A' <= this.char && this.char <= 'Z');
	}

	#position() {
		return { cursor: this.cursor, line: this.line, column: this.column };
	}

	#next() {
		this.cursor++;
		this.column++;
		this.char = this.code[this.cursor];
	}

	#whitespace() {
		const start = this.#position();
		if (!this.#isWhitespace()) return null;

		let size = 0;

		this.#next();

		while (this.#isWhitespace()) {
			size++;

			this.#next();
		}

		return {
			type: 'Whitespace',
			size,
			loc: { file: this.file, start, end: this.#position() },
		};
	}

	#regexp() {
		if (this.char === '/') {
			const char = this.char;
			const cursor = this.cursor;
			const column = this.column;

			const start = this.#position();
			this.#next();

			// if (this.char === '/') {
			// 	this.#next();
			// 	return this.readComment(start);
			// }

			const allowedFlags = ['g', 'i', 'm', 'u', 'y'];
			let value = '/';
			let flags = [];

			this.#next();

			while (this.char !== '/') {
				if (!this.char) {
					this.char = char;
					this.cursor = cursor;
					this.column = column;

					return this.#operator();
				}

				value += this.char;

				this.#next();
			}

			value += '/';

			this.#next();

			for (;;) {
				if (!this.char || !this.#isAlpha() || this.#semicolon()) break;
				if (allowedFlags.includes(this.char) && !flags.includes(this.char))
					flags.push(this.char);

				this.#next();
			}

			return {
				type: 'RegExp',
				value: value.concat(flags.join('')),
				loc: { file: this.file, start, end: this.#position() },
			};
		}
	}

	#string() {
		const strings = ['"', "'"];
		if (!strings.includes(this.char)) return null;

		let value = '';

		const start = this.#position();
		this.#next();

		while (!strings.includes(this.char)) {
			if (this.char === '\n' || !this.char) {
				throw SyntaxError(`cannot closign string in ${this.file}:${this.line}`);
			}

			value += this.char;

			this.#next();
		}

		this.#next();

		const end = this.#position();
		return {
			type: 'String',
			value,
			loc: { file: this.file, start, end },
		};
	}

	#number() {
		let buffer = '';
		const start = this.#position();

		while (this.#isNumeric()) {
			buffer += this.char;

			this.#next();
		}

		if (buffer.length >= 1) {
			const end = this.#position();
			return {
				type: 'Number',
				value: Number(buffer),
				loc: { file: this.file, start, end },
			};
		}

		return null;
	}

	#boolean(val) {
		let value = '';

		const start = this.#position();

		if (!val) {
			while (this.#isAlpha()) {
				value += this.char;

				this.#next();
			}
		}

		if (['true', 'false'].includes(val ?? value)) {
			return {
				type: 'Boolean',
				value: val ?? value,
				loc: { file: this.file, start, end: this.#position() },
			};
		}

		return null;
	}

	#array() {
		if (this.char === '[') {
			let value = '';

			const start = this.#position();
			this.#next();

			while (this.char !== ']') {
				value += this.char;

				this.#next();
			}

			this.#next();

			return {
				type: 'Array',
				value,
				loc: { file: this.file, start, end: this.#position() },
			};
		}

		return null;
	}

	#operator() {
		const start = this.#position();

		switch (this.char) {
			case '+':
				this.#next();

				return {
					type: 'PlusOperator',
					value: '+',
					loc: { file: this.file, start, end: this.#position() },
				};

			case '-':
				this.#next();

				return {
					type: 'MinusOperator',
					value: '-',
					loc: { file: this.file, start, end: this.#position() },
				};

			case '*':
				this.#next();

				return {
					type: 'MultiplyOperator',
					value: '*',
					loc: { file: this.file, start, end: this.#position() },
				};

			case '%':
				this.#next();

				return {
					type: 'DivisionRestOperator',
					value: '%',
					loc: { file: this.file, start, end: this.#position() },
				};

			case '/':
				this.#next();

				return {
					type: 'DivisionOperator',
					value: '/',
					loc: { file: this.file, start, end: this.#position() },
				};

			default:
				return null;
		}
	}

	#assign() {
		if (this.char === '=') {
			const start = this.#position();
			this.#next();

			return {
				type: 'Assignment',
				loc: { file: this.file, start, end: this.#position() },
			};
		}

		return null;
	}

	#checkType(value) {
		const bool = this.#boolean(value);
		if (bool) return bool;
	}

	#identifier() {
		if (!this.#isAlpha()) return null;

		let value = '';
		const start = this.#position();

		value += this.char;

		this.#next();

		while (this.#isNumeric() || this.#isAlpha()) {
			value += this.char;

			this.#next();
		}

		const end = this.#position();

		const exists = this.#checkType(value);
		if (exists) return exists;

		const keyword = this.keywords[value];
		if (keyword) {
			return {
				type: keyword,
				value,
				loc: { file: this.file, start, end },
			};
		}

		return {
			type: 'Identifier',
			value,
			loc: { file: this.file, start, end },
		};
	}

	#semicolon() {
		if (this.char !== ';') return null;

		const start = this.#position();
		this.#next();

		return {
			type: 'Semicolon',
			loc: { file: this.file, start, end: this.#position() },
		};
	}

	#colon() {
		if (this.char !== ',') return null;

		const start = this.#position();
		this.#next();

		return {
			type: 'Colon',
			loc: { file: this.file, start, end: this.#position() },
		};
	}

	#nextLine() {
		const start = this.#position();
		if (this.char != '\n') return null;

		this.#next();

		this.line++;
		this.column = 1;

		return {
			type: 'Newline',
			loc: { file: this.file, start, end: this.#position() },
		};
	}

	#eof() {
		if (!this.char) {
			return {
				type: 'EndFile',
				loc: { file: this.file, start: this.#position(), end: this.#position() },
			};
		}

		return null;
	}

	next() {
		const token =
			this.#whitespace() ||
			this.#nextLine() ||
			this.#identifier() ||
			this.#semicolon() ||
			this.#colon() ||
			this.#assign() ||
			this.#array() ||
			this.#regexp() ||
			this.#boolean() ||
			this.#string() ||
			this.#number() ||
			this.#operator() ||
			this.#eof();

		if (token) return token;

		throw SyntaxError('iea');
	}
}
