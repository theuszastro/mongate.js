import { ErrorLine, VerifyError } from './errors/VerifyError';
import { FunctionCallToken, FunctionToken, ParsedToken } from './types/parsedToken';

import { Function } from './verifiers/Function';

export class Verifier {
	private function: Function;

	constructor(private filename: string, public functions: FunctionToken[]) {
		this.function = new Function(filename, this);
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

		for (let token of data) {
			switch (token.type) {
				case 'FunctionDeclaration':
					this.function.verifyFunction(token as FunctionToken);

					break;

				case 'FunctionCall':
					this.function.verifyFunctionCall(token as FunctionCallToken, functions);

					break;
			}
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
