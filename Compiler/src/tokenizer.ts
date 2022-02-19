import { Colon } from './tokens/Colon';
import { NewLine } from './tokens/NewLine';
import { Number } from './tokens/Number';
import { String } from './tokens/String';
import { Whitespace } from './tokens/Whitespace';
import { Pointer } from './utils/Pointer';

export class Tokenizer {
	private keywords = {};

	private pointer: Pointer;
	private newline: NewLine;
	private colon: Colon;
	private whitespace: Whitespace;
	private number: Number;
	private string: String;

	constructor(filename: string, content: string) {
		this.pointer = new Pointer(filename, content);

		this.newline = new NewLine(this.pointer);
		this.colon = new Colon(this.pointer);
		this.whitespace = new Whitespace(this.pointer);
		this.string = new String(this.pointer);
		this.number = new Number(this.pointer);
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
			this.string.string() ||
			this.endFile();

		console.log(token);

		return token;
	}
}
