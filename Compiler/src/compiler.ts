import { Parser } from './parser';
import { Tokenizer } from './tokenizer';

type ConfigType = {
	filename: string;
	content: string;
};

export class Compiler {
	private tokenizer: Tokenizer;
	private parser: Parser;

	constructor(config: ConfigType) {
		const { filename, content } = config;

		this.tokenizer = new Tokenizer(filename, content);
		this.parser = new Parser(this.tokenizer, filename, content);
	}

	run() {
		this.parser.parse();

		// new SyntaxError();
	}
}
