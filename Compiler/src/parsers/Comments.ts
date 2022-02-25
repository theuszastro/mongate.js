import { ParserPointer } from '../utils/ParserPointer';

export class Comments {
	constructor(private pointer: ParserPointer) {}

	private readLine() {
		let value = '';

		const { pointer } = this;

		const startLine = pointer.line;

		for (;;) {
			if (!pointer.token || pointer.take('EndFile')) break;

			if (pointer.line == startLine) {
				value += pointer.token.value;

				pointer.take(pointer.token.type, false, false);

				continue;
			}

			break;
		}

		console.log(value);

		return value;
	}

	hashtag() {
		const { pointer } = this;

		if (!pointer.token || !pointer.take('HashTag')) return null;

		const value = this.readLine();

		return {
			type: 'Comment',
			value,
		};
	}

	comment(onlyReadLine = false) {
		const { pointer } = this;

		if (onlyReadLine) {
			const value = this.readLine();

			return {
				type: 'Comment',
				value: value,
			};
		}

		if (!pointer.token) return null;

		const token = pointer.token;

		if (token.type === 'Operator' && token.value === '/') {
			const next = pointer.previewNext(true, false);

			if (next && next.type === 'Operator' && next.value == '/') {
				pointer.take('Operator');
				pointer.take('Operator');

				const value = this.readLine();

				return {
					type: 'Comment',
					value: value,
				};
			}
		}

		return null;
	}
}
