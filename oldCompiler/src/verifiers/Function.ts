import { VerifyError } from '../errors/VerifyError';
import { FunctionArg, FunctionCallToken, FunctionToken, ParsedToken } from '../types/parsedToken';

import { DataType, Verifier } from '../verifier';

import JavaScript from '../utils/JavaScript';

export class Function {
	constructor(private verifier: Verifier) {}

	verifyFunctionArg(token: FunctionArg, data: DataType) {
		const { name, type, default: defaultValue } = token;

		if (JavaScript.keywords.includes(name.value as string)) {
			new VerifyError({
				lines: [{ ...name.ctx!, name: '', lineContent: '' }],
				reason: `Identifier '${name.value}' is a reserved js keyword`,
				filename: this.verifier.filename,
			});
		}

		this.verifier.verifyToken(defaultValue as ParsedToken, data);
	}

	verifyFunction(data: FunctionToken) {
		const { name, args, body, isAsync, ctx } = data;

		const functions = body.filter(c => c.type === 'FunctionDeclaration') as FunctionToken[];
		const variables = body.filter(c => c.type === 'VariableDeclaration') as FunctionArg[];
		const constants = body.filter(c => c.type === 'ConstantDeclaration') as FunctionArg[];

		args.map(item => this.verifier.verifyToken(item, { functions, variables, constants }));

		// @ts-ignore
		const existsName = body.find(c => c.name.value == name.value);
		const context = { ...ctx!, name: name.value as string };

		if (existsName || JavaScript.keywords.includes(name.value as string)) {
			new VerifyError({
				lines: existsName ? [context, { ...existsName.ctx!, name: '' }] : [context],
				reason: existsName
					? `Identifier '${name.value}' has already been declared`
					: `Identifier '${name.value}' is a reserved js keyword`,
				filename: this.verifier.filename,
			});
		}

		if (isAsync) {
			// @ts-ignore
			const asyncIsUsed = body.find(c => Boolean(c.isAwait));

			if (!asyncIsUsed) {
				console.warn('async not used');
			}
		}

		this.verifier.verifyBody([args, body].flat());
	}

	verifyFunctionCall(token: FunctionCallToken, functions: FunctionToken[]) {
		const allFunctions = [...functions, ...this.verifier.data.functions];

		const name = token.name.value as string;

		const currentFunction = allFunctions.find(f => f.name.value == name);
		if (!currentFunction || JavaScript.keywords.includes(name)) {
			if (!JavaScript.globalsFunctions.includes(name)) {
				new VerifyError({
					lines: [{ ...token.ctx!, name: '' }],
					reason: JavaScript.keywords.includes(name)
						? `Function name '${name}' is a js keyword`
						: `Function name '${name}' not found`,
					filename: this.verifier.filename,
				});
			}

			return;
		}

		if (token.isAwait && !currentFunction.isAsync) {
			console.warn('await is not used');
		}
	}
}
