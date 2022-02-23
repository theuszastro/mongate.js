import { SyntaxError } from '../errors/SyntaxError';
import { ParserPointer, Token } from '../utils/ParserPointer';

export class Number {
	private value = '';

	constructor(private pointer: ParserPointer) {}

	number() {
		const { pointer } = this;

		const token = pointer.token;
		if (!token || token.type != 'Number') return null;

		this.value = '';

		for (;;) {
			const next = pointer.previewNext();

			if (!next || (next.type == 'Identifier' && next.value != 'e')) break;

			this.value += (pointer.token as Token).value;

			if (!['Number', 'Identifier'].includes(next.type)) break;

			pointer.take((pointer.token as Token).type);
		}

		if (this.value.endsWith('e'))
			new SyntaxError(this.pointer, {
				lineError: pointer.line,
				startLine: pointer.line,
				reason: `Unexpected 'e'`,
				isParser: true,
			});

		return {
			type: 'Number',
			value: this.value,
		};
	}
}
