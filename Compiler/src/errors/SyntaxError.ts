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
	lineError: number;
	reason: string;
};

export class SyntaxError extends Logger {
	constructor(private pointer: ParserPointer, private data: ErrorData) {
		super();

		this.setup();
	}

	private getLines(start: number) {
		const lines: ErrorLine[] = [];

		if (start > 0) {
			for (let i of [1, 2, 3, 4, 5].reverse()) {
				const lineNumber = start - i;
				if (lineNumber < 0) continue;

				const line = this.pointer.getLine(lineNumber);
				if (line === undefined) continue;

				lines.push({
					line: lineNumber,
					content: line,
				});
			}
		}

		lines.push({
			line: start,
			content: this.pointer.getLine(start),
		});

		for (let i of [1, 2, 3, 4, 5]) {
			const lineNumber = start + i;

			const line = this.pointer.getLine(lineNumber);
			if (line === undefined) continue;

			lines.push({
				line: lineNumber,
				content: line,
			});
		}

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

	private setup() {
		this.pointer = this.pointer as ParserPointer;

		const { pointer } = this;
		const { lineError } = this.data;

		this.logError({
			filename: pointer.filename,
			lines: this.getLines(lineError),
		});

		process.exit(1);
	}
}
