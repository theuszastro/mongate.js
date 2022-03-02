import { CodeGeneration } from './codeGeneration';
import { Parser } from './parser';
import { Tokenizer } from './tokenizer';
import { Verifier } from './verifier';

import { FunctionToken } from './types/parsedToken';

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
		const variables = tokens.filter(c => c.type === 'VariableDeclaration') as FunctionToken[];
		const constants = tokens.filter(c => c.type === 'ConstantDeclaration') as FunctionToken[];

		const verifier = new Verifier(filename, {
			functions,
			variables,
			constants,
		});
		verifier.verifyBody(tokens);

		const codeGeneration = new CodeGeneration();
		console.log(codeGeneration.generate(tokens));
	}
}
