import { Logger } from '../utils/Logger';
import { Pointer } from '../utils/Pointer';

export class SyntaxError extends Logger {
	constructor(private pointer: Pointer, private code: string, private error: string) {
		super();

		this.setup();
	}

	private setup() {
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
