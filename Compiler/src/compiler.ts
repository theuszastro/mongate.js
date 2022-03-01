import { Parser } from './parser';
import { Tokenizer } from './tokenizer';
import { FunctionToken } from './types/parsedToken';
import { Verifier } from './verifier';

type ConfigType = {
	filename: string;
	content: string;
};

export class Compiler {
	constructor() {}

	run(config: ConfigType) {
		const { filename, content } = config;

		const tokenizer = new Tokenizer(filename, content);
		const parser = new Parser(tokenizer, content, filename);

		const { tokens } = parser.parse();
		const functions = tokens.filter(c => c.type === 'FunctionDeclaration') as FunctionToken[];

		const verifier = new Verifier(filename, functions);
		verifier.verifyBody(tokens);
	}
}
