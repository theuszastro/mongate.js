import { Colon } from './tokens/Colon';
import { NewLine } from './tokens/NewLine';
import { Number } from './tokens/Number';
import { Whitespace } from './tokens/Whitespace';
import { Pointer } from './utils/Pointer';

export class Tokenizer {
	private keywords = {};

	private pointer: Pointer;
	private newline: NewLine;
	private colon: Colon;
	private whitespace: Whitespace;
	private number: Number;

	constructor(filename: string, content: string) {
		this.pointer = new Pointer(filename, content);

		this.number = new Number(this.pointer);
		this.newline = new NewLine(this.pointer);
		this.colon = new Colon(this.pointer);
		this.whitespace = new Whitespace(this.pointer);
	}

	private endFile() {
		if (!this.pointer.char) {
			return {
				type: 'EndFile',
				ctx: this.pointer.context(),
			};
		}

		return null;
	}

	nextToken() {
		const token =
			this.newline.newline() ||
			this.whitespace.whitespace() ||
			this.colon.semicolon() ||
			this.colon.colon() ||
			this.number.number() ||
			this.endFile();

		console.log(token);

		return token;
	}
}
