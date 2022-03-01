import { Logger } from '../utils/Logger';

export type ErrorLine = {
	lineContent: string;
	line: number;
	name: string;
};

type ErrorData = {
	lines: ErrorLine[];
	filename: string;
	reason: string;
};

export class VerifyError extends Logger {
	constructor(private data: ErrorData) {
		super();

		this.setup();
	}

	setup() {
		const { lines, filename, reason } = this.data;

		console.log(
			this.block(this.error('Error')),
			this.ctx(`VerifyError on ${this.error(filename)}`)
		);

		for (let { line, lineContent } of lines) {
			console.log(this.block(this.warn(`Line ${line}`)), lineContent);
		}

		console.log(this.block(this.info('Info')), this.ctx(reason));

		process.exit(1);
	}
}
