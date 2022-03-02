import { ErrorLine, VerifyError } from './errors/VerifyError';
import {
	FunctionArg,
	FunctionCallToken,
	FunctionToken,
	ObjectToken,
	ParsedToken,
	VariableToken,
} from './types/parsedToken';

import { Function } from './verifiers/Function';
import { Expression } from './verifiers/Expression';

export type DataType = {
	functions: FunctionToken[];
	variables: VariableToken[];
	constants: VariableToken[];
};

export class Verifier {
	private function: Function;
	private expression: Expression;

	constructor(public filename: string, public data: DataType) {
		this.function = new Function(this);
		this.expression = new Expression(this);
	}

	verifyToken(token: ParsedToken, data: DataType) {
		switch (token.type) {
			case 'FunctionDeclaration':
				this.function.verifyFunction(token as FunctionToken);

				break;

			case 'FunctionCall':
				this.function.verifyFunctionCall(token as FunctionCallToken, data.functions);

				break;

			case 'FunctionArg':
				this.function.verifyFunctionArg(token as FunctionArg, data);

				break;

			case 'Object':
				this.expression.verifyObject(token as ObjectToken);

				break;
		}
	}

	verifyBody(data: ParsedToken[]) {
		const errors = this.verifyNames(data);

		if (errors.length >= 1)
			new VerifyError({
				lines: [errors[0], errors[1]],
				reason: `Identifier '${errors[0].name}' has already been declared`,
				filename: this.filename,
			});

		const functions = data.filter(t => t.type == 'FunctionDeclaration') as FunctionToken[];
		const variables = data.filter(t => t.type == 'VariableDeclaration') as VariableToken[];
		const constants = data.filter(t => t.type == 'ConstantDeclaration') as VariableToken[];

		for (let token of data) {
			this.verifyToken(token as ParsedToken, {
				functions,
				variables,
				constants,
			});
		}
	}

	private verifyNames(data: ParsedToken[]) {
		const names: string[] = [];
		const lines = {} as { [key: string]: Array<ErrorLine> };

		for (const token of data) {
			const { name, ctx, type } = token as any;

			if (name && type != 'FunctionCall') {
				const context = { ...ctx, name: name.value };

				names.includes(name.value) && lines[name.value].push(context);
				if (!lines[name.value]) lines[name.value] = [context];

				names.push(name.value);
			}
		}

		return Object.values(lines)
			.filter(li => li.length > 1)
			.flat();
	}
}
