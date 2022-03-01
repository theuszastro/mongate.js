import { VerifyError } from '../errors/VerifyError';
import { FunctionCallToken, FunctionToken } from '../types/parsedToken';

import { Verifier } from '../verifier';

export class Function {
	constructor(private filename: string, private verifier: Verifier) {}

	verifyFunction(data: FunctionToken) {
		const { name, args, body, isAsync, ctx } = data;

		const existsFunctionName =
			// @ts-ignore
			body.find(c => c.name.value == name.value);
		const context = { ...ctx!, name: name.value as string };

		if (existsFunctionName) {
			const defCtx = { ...existsFunctionName.ctx!, name: '' };

			new VerifyError({
				lines: [context, defCtx],
				reason: `Identifier '${name.value}' has already been declared`,
				filename: this.filename,
			});
		}

		if (isAsync) {
			// @ts-ignore
			const asyncIsUsed = body.find(c => Boolean(c.isAwait));

			if (!asyncIsUsed) {
				// ainda não feito

				console.warn('async not used');
			}
		}

		this.verifier.verifyBody([args, body].flat());
	}

	verifyFunctionCall(token: FunctionCallToken, functions: FunctionToken[]) {
		const allFunctions = [...functions, ...this.verifier.functions];

		const currentFunction = allFunctions.find(f => f.name.value == token.name.value);
		if (!currentFunction) {
			new VerifyError({
				lines: [{ ...token.ctx!, name: '' }],
				reason: `Function name '${token.name.value}' not found`,
				filename: this.filename,
			});

			return;
		}

		if (token.isAwait && !currentFunction.isAsync) {
			console.warn('await is not used');
		}
	}
}
