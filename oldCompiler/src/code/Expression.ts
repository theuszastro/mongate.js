import { ArrayToken, ObjectToken, ParsedToken } from '../types/parsedToken';

export class Expression {
	create(data: ParsedToken) {
		let code = '';

		switch (data.type) {
			case 'Array': {
				const { values } = data as ArrayToken;

				code += '[';

				values.map((item, index, arr) => {
					code += this.create(item);

					if (index !== arr.length - 1) {
						code += ', ';
					}
				});

				code += ']';

				break;
			}

			case 'Object': {
				const { properties } = data as ObjectToken;

				code += '{';

				properties.map((item, index, arr) => {});

				break;
			}

			case 'String':
				// @ts-ignore
				data.value = `\`${data.value}\``;

			case 'Number':
			case 'Boolean':
			case 'NullExpr':
			case 'UndefinedExpr':
				// @ts-ignore
				code += data.value;

				break;
		}

		return code;
	}
}
