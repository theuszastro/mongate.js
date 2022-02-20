import chalk from 'chalk';

import { Logger } from '../utils/Logger';
import { Pointer } from '../utils/Pointer';

export class SyntaxError extends Logger {
	constructor(private pointer: Pointer, private code: string, private error: string) {
		super();

		this.setup();
	}

	private generate(length: number, char: string) {
		return new Array(length + 1).join(char);
	}

	private setup() {
		const splited = this.pointer.content.split('\n');
		const ctx = this.pointer.context();
		const line = splited[ctx.line - 1];

		const { index = 0 } = line.match(this.code) ?? { index: 0 };

		const start = line.substring(0, index).length + `[Line ${ctx.line}]`.length;
		const end = line.substring(index + this.code.length).length;

		const logs = [
			[this.block(this.red('Error')), this.white(`SyntaxError on ${this.red(ctx.file)}`)],
			[this.block(this.yellow(`Line ${ctx.line}`)), this.white(line)],
			[
				this.generate(start, ' '),
				this.generate(this.code.length, '^'),
				this.generate(end, ' '),
			],
			[this.block(this.cyan('Info')), this.white(this.error)],
		];

		for (let log of logs) {
			console.log(...log);
		}

		process.exit(1);
	}
}
