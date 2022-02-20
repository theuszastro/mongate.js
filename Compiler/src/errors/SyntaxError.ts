import { Logger } from '../utils/Logger';
import { ParserPointer } from '../utils/ParserPointer';
import { Pointer } from '../utils/Pointer';

export class SyntaxError extends Logger {
	constructor(
		private pointer: Pointer | ParserPointer,
		private code: string,
		private error: string,
		type?: 'parser'
	) {
		super();

		if (type === 'parser') {
			this.setupParser();
		} else {
			this.setup();
		}
	}

	private setupParser() {
		this.pointer = this.pointer as ParserPointer;

		const { pointer, code } = this;

		const { line, lineContent } = pointer.getLine();
		const [start, end] = this.extractCode(lineContent, code, line);

		const logs = [
			[
				this.block(this.red('Error')),
				this.white(`SyntaxError on ${this.red(pointer.filename)}`),
			],
			[this.block(this.yellow(`Line ${line}`)), this.white(lineContent)],
			[this.generate(start, ' '), this.generate(code.length, '^'), this.generate(end, ' ')],
			[this.block(this.cyan('Info')), this.white(this.error)],
		];

		for (let log of logs) {
			console.log(...log);
		}

		process.exit(1);
	}

	private setup() {
		this.pointer = this.pointer as Pointer;

		const { pointer, code } = this;

		const splited = pointer.content.split('\n');
		const ctx = pointer.context();
		const line = splited[ctx.line - 1];

		const [start, end] = this.extractCode(line, code, ctx.line);

		const logs = [
			[this.block(this.red('Error')), this.white(`SyntaxError on ${this.red(ctx.file)}`)],
			[this.block(this.yellow(`Line ${ctx.line}`)), this.white(line)],
			[this.generate(start, ' '), this.generate(code.length, '^'), this.generate(end, ' ')],
			[this.block(this.cyan('Info')), this.white(this.error)],
		];

		for (let log of logs) {
			console.log(...log);
		}

		process.exit(1);
	}
}
