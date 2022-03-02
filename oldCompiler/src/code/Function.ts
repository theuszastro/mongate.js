import { CodeGeneration } from '../codeGeneration';
import { FunctionArg, FunctionToken, ParsedToken } from '../types/parsedToken';

export class Function {
	constructor(private generation: CodeGeneration) {}

	private createArgs(args: FunctionArg[]) {
		let code = '';

		args.map((item, index, arr) => {
			const { name, default: defaultValue } = item;

			code += name.value;

			if (defaultValue != 'undefined') {
				code += ` = ${this.generation.expression.create(defaultValue as ParsedToken)}`;
			}

			if (index != arr.length - 1) {
				code += ', ';
			}
		});

		return code;
	}

	create(data: FunctionToken) {
		const { args, isAsync, body, name } = data;

		let code = `${isAsync ? 'async ' : ''}`;
		code += `function ${name.value}(${this.createArgs(args)})`;

		const funcBody = this.generation.createBody(body);

		return code;
	}
}
