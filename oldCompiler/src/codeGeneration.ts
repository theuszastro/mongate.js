import { Expression } from './code/Expression';
import { Function } from './code/Function';
import { FunctionToken, ParsedToken } from './types/parsedToken';

export class CodeGeneration {
	private function: Function;
	public expression: Expression;

	constructor() {
		this.function = new Function(this);
		this.expression = new Expression();
	}

	createBody(tokens: ParsedToken[]) {
		let code = '';

		for (let token of tokens) {
			switch (token.type) {
				case 'FunctionDeclaration':
					code += this.function.create(token as FunctionToken);

					break;
			}
		}

		return code;
	}

	generate(tokens: ParsedToken[]) {
		return this.createBody(tokens);
	}
}
