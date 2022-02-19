export class Pointer {
	private line = 1;
	private column = 1;
	private cursor = 0;

	public ident: number = 0;
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
