import { ParserPointer } from '../utils/ParserPointer';

export class Comments {
	constructor(private pointer: ParserPointer) {}

	private readLine() {
		let value = '';

		const { pointer } = this;

		for (;;) {
			if (!pointer.token || pointer.take('EndFile')) break;

			const next = pointer.previewNext(false);
			if (next && next.type != 'NewLine') {
				value += pointer.token.value;

				pointer.next();

				continue;
			}

			break;
		}

		return value;
	}

	hashtag() {
		const { pointer } = this;

		if (!pointer.token || !pointer.take('HashTag')) return null;

		const value = this.readLine();
		pointer.next();

		return {
			type: 'Comment',
			value,
		};
	}

	comment() {
		const { pointer } = this;

		if (!pointer.token) return null;

		const token = pointer.token;

		if (token.type === 'Operator' && token.value === '/') {
			const next = pointer.previewNext();

			if (next && next.type === 'Operator' && next.value == '/') {
				pointer.take('Operator');
				pointer.take('Operator');

				const value = this.readLine();
				pointer.next();

				return {
					type: 'Comment',
					value: value,
				};
			}
		}

		return null;
	}
}
