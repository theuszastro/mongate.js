type Memorized = {
	line: number;
	cursor: number;
	column: number;
	char: string;
};

export class Pointer {
	private line = 1;
	private column = 1;
	private cursor = 0;

	public char: string;

	constructor(private filename: string, private content: string) {
		this.char = content[this.cursor];
	}

	context() {
		return {
			file: this.filename,
			line: this.line,
			column: this.column,
		};
	}

	memorize() {
		return {
			char: this.char,
			cursor: this.cursor,
			column: this.column,
			line: this.line,
		};
	}

	restore(data: Memorized) {
		this.char = data.char;
		this.cursor = data.cursor;
		this.column = data.column;
		this.line = data.line;
	}

	next() {
		this.cursor++;
		this.column++;
		this.char = this.content[this.cursor];
	}

	nextLine() {
		this.line++;
		this.column = 1;
	}
}
