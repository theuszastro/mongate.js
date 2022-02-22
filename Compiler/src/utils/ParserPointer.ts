import { Tokenizer } from '../tokenizer';

export type Token = {
	type: string;
	value?: string | Token;
	size?: number;
	flags?: string;
	values?: Token[];
	body?: Token[];
	left?: Token;
	right?: Token;
	Operator?: Token;
	ctx?: {
		file: string;
		line: number;
		column: number;
	};
};

export class ParserPointer {
	public token?: Token | null = null;
	public rawTokens: Token[] = [];

	public line = 1;

	constructor(private tokenizer: Tokenizer, public filename: string, private content: string) {}

	previewNext() {
		return this.tokenizer.previewNext();
	}

	next() {
		this.token = this.tokenizer.nextToken();
		if (!this.token) throw new TypeError('next token is undefined');

		this.rawTokens.push(this.token);

		switch (this.token.type) {
			case 'Whitespace':
			case 'Comment':
				this.next();

				break;

			case 'NewLine':
				this.line++;

				this.next();

				break;
		}
	}

	getLine() {
		return {
			content: this.content.split('\n')[this.line - 1],
			line: this.line,
		};
	}

	take(type: string) {
		if (this.token && this.token.type === type) {
			const _token = this.token;

			this.next();

			return _token;
		}
	}
}
