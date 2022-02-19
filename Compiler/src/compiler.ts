import { Parser } from './parser';
import { Tokenizer } from './tokenizer';

import { SyntaxError } from './utils/SyntaxError';

type ConfigType = {
	filename: string;
	content: string;
};

export class Compiler {
	private filename: string;
	private content: string;

	private tokenizer: Tokenizer;
	private parser: Parser;

	constructor(config: ConfigType) {
		const { filename, content } = config;

		this.filename = filename;
		this.content = content;

		this.tokenizer = new Tokenizer(filename, content);
		this.parser = new Parser(this.tokenizer);
	}

	run() {
		this.parser.parse();

		// new SyntaxError();
	}
}
