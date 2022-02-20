import { ParserPointer } from '../utils/ParserPointer';

export class Expression {
	constructor(private pointer: ParserPointer) {}

	expression() {
		const { token } = this.pointer;
		const { pointer } = this;

		if (!token) return null;

		switch (token.type) {
			case 'String':
			case 'Boolean':
			case 'RegExp':
			case 'Number':
			case 'Identifier':
				const _token = token;

				pointer.next();

				return _token;
		}

		return null;
	}
}
