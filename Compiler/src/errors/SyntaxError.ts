import { Logger } from '../utils/Logger';
import { ParserPointer } from '../utils/ParserPointer';
import { Pointer } from '../utils/Pointer';

type ErrorLog = {
	filename: string;
	content: string;
	line: number;
};

export class SyntaxError extends Logger {
	constructor(private pointer: Pointer | ParserPointer, private error: string, type?: 'parser') {
		super();

		if (type === 'parser') {
			this.setupParser();
		} else {
			this.setup();
		}
	}

	private logError(data: ErrorLog) {
		const { filename, line, content } = data;
		const { block } = this;

		const error = (msg: string) => this.color('redBright', msg);
		const warn = (msg: string) => this.color('yellow', msg);
		const info = (msg: string) => this.color('cyan', msg);
		const ctx = (msg: string) => this.color('white', msg);

		const currentLine = !Boolean(content) ? `in ${warn(`line ${line}`)}` : '';

		console.log(block(error('Error')), ctx(`SyntaxError on ${error(filename)} ${currentLine}`));
		Boolean(content) && console.log(block(warn(`Line ${line}`)), ctx(content));
		console.log(block(info('Info')), ctx(this.error));
	}

	private setupParser() {
		this.pointer = this.pointer as ParserPointer;

		const { pointer } = this;
		const { line, content } = pointer.getLine();

		this.logError({
			filename: pointer.filename,
			content,
			line,
		});

		process.exit(1);
	}

	private setup() {
		this.pointer = this.pointer as Pointer;

		const { pointer } = this;

		const { line, file: filename } = pointer.context();
		const content = pointer.getLine();

		this.logError({
			filename,
			content,
			line,
		});

		process.exit(1);
	}
}
