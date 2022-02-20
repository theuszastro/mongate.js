import { Tokenizer } from '../tokenizer';

export type Token = {
	type: string;
	value?: string;
	size?: number;
	flags?: string;
	ctx: any;
};

export class ParserPointer {
	public token?: Token | null = null;
	public rawTokens: Token[] = [];
	public ident = 0;

	private line = 1;

	constructor(private tokenizer: Tokenizer, public filename: string, private content: string) {}

	next() {
		this.token = this.tokenizer.nextToken();
		if (!this.token) throw new TypeError('next token is undefined');

		this.rawTokens.push(this.token);

		switch (this.token.type) {
			case 'Whitespace':
				this.ident = this.token.size as number;

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
			lineContent: this.content.split('\n')[this.line - 1],
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
