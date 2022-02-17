import { Tokenizer } from './tokenizer.mjs';
import { Parser } from './parser.mjs';

class Compiler {
	constructor(file, code) {
		this.tokenizer = new Tokenizer(file, code);
		this.parser = new Parser(this.tokenizer);
	}

	run() {
		this.parser.parse();
	}
}

export { Compiler };
