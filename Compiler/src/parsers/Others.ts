import { SyntaxError } from '../errors/SyntaxError';
import { TypeToken } from '../types/parsedToken';
import { ParserPointer } from '../utils/ParserPointer';

export class Others {
	constructor(private pointer: ParserPointer) {}

	private scape(): TypeToken | undefined {
		const { pointer } = this;

		if (!pointer.token || pointer.token.type != 'BackSlash') return;

		const next = pointer.previewNext(true, false);
		if (!next || next.type == 'Whitespace' || next.type == 'EndFile') return;

		pointer.take('BackSlash');

		const value = pointer.token;
		if (!value) {
			new SyntaxError(pointer, {
				lineError: pointer.line,
				reason: `Unexpected token '${pointer.token.value}'`,
			});
		}

		pointer.take(value.type);

		return {
			type: 'ScapeCarecter',
			value: `\\${value.value}`,
		};
	}

	others() {
		return this.scape();
	}
}
