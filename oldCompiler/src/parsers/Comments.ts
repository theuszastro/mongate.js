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

		const line = pointer.line;

		if (onlyReadLine) {
			const value = this.readLine();

			return {
				type: 'Comment',
				value: value,
				ctx: pointer.ctx(line),
			};
		}

		const next = pointer.previewNext();
		const typeAllowed = ['Operator'];

		if (
			!pointer.token ||
			!next ||
			!typeAllowed.includes(pointer.token.type) ||
			!typeAllowed.includes(next.type) ||
			// @ts-ignore
			!['//'].includes(pointer.token.value + next.value)
		)
			return;

		pointer.takeMultiple(['Operator', 'Operator'], true, false);

		const value = this.readLine();

		return {
			type: 'Comment',
			value: value,
			ctx: pointer.ctx(line),
		};
	}
}
