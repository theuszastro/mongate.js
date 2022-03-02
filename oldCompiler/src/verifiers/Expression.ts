import { VerifyError } from '../errors/VerifyError';
import { ObjectProperty, ObjectToken, VariableToken } from '../types/parsedToken';
import { Verifier } from '../verifier';

export class Expression {
	constructor(private verifier: Verifier) {}

	verifyObject(data: ObjectToken) {
		const { variables: allVariables, constants } = this.verifier.data;

		const allData = [...allVariables, ...constants];

		const { properties } = data;

		for (let { name, value, ctx } of properties as ObjectProperty[]) {
			if (value.type == 'Identifier') {
				// @ts-ignore
				const valueName = value.value;

				// @ts-ignore
				const variable = allData.find(v => v.name.value == valueName);

				if (!variable) {
					new VerifyError({
						lines: [{ ...value.ctx!, name: '' }],
						filename: this.verifier.filename,
						reason: `Variable/constant '${valueName}' is not declared`,
					});

					return;
				}

				console.log(variable.ctx);

				if (variable.ctx!.line > data.ctx!.line) {
					new VerifyError({
						lines: [{ ...variable.ctx!, name: '' }],
						filename: this.verifier.filename,
						reason: `Variable/constant '${valueName}' is used before it is declared`,
					});
				}
			}

			console.log(name, value);
		}
	}
}
