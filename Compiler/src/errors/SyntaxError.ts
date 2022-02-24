import { Logger } from '../utils/Logger';
import { ParserPointer } from '../utils/ParserPointer';
import { Pointer } from '../utils/Pointer';

type ErrorLog = {
	filename: string;
	lines: ErrorLine[];
};

type ErrorLine = {
	line: number;
	content: string;
};

type ErrorData = {
	startLine: number;
	lineError: number;
	reason: string;
	isParser?: boolean;
};

export class SyntaxError extends Logger {
	constructor(private pointer: Pointer | ParserPointer, private data: ErrorData) {
		super();

		const { isParser = false } = data;

		isParser ? this.setupParser() : this.setup();
	}

	private getLines(start: number) {
		const lines: ErrorLine[] = [
			{
				line: start,
				content: this.pointer.getLine(start - 1),
			},
		];

		return lines;
	}

	private logError(data: ErrorLog) {
		const { filename } = data;
		const { block } = this;

		const { lineError } = this.data;

		const currentLine = `in ${this.warn(`line ${lineError}`)}`;

		console.log(
			block(this.error('Error')),
			this.ctx(`SyntaxError on ${this.error(filename)} ${currentLine}`)
		);

		for (let { line, content } of data.lines) {
			const lineWarn = this.warn('Line ' + line);

			console.log(block(lineWarn), content);
		}

		console.log(block(this.info('Info')), this.ctx(this.data.reason));
	}

	private setupParser() {
		this.pointer = this.pointer as ParserPointer;

		const { pointer } = this;
		const { startLine } = this.data;

		this.logError({
			filename: pointer.filename,
			lines: this.getLines(startLine),
		});

		process.exit(1);
	}

	private setup() {
		this.pointer = this.pointer as Pointer;

		const { pointer } = this;
		const { file: filename } = pointer.context();

		this.logError({
			filename,
			lines: this.getLines(this.data.startLine),
		});

		process.exit(1);
	}
}
