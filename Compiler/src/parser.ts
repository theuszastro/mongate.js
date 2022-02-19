import { Tokenizer } from './tokenizer';

type Token = {
	type: string;
	value?: string;
	size?: number;
	ctx: any;
};

export class Parser {
	private token?: Token | null;
	private rawTokens: Token[] = [];
	private ident: number = 0;

	constructor(private tokenizer: Tokenizer) {}

	next(skipWhitespace = true) {
		this.token = this.tokenizer.nextToken();
		if (!this.token) throw new TypeError('next token is undefined');

		this.rawTokens.push(this.token);

		switch (this.token.type) {
			case 'Whitespace':
				if (!skipWhitespace) {
					this.ident = this.token.size as number;

					break;
				}

			case 'Comment':
				this.next();

				break;
		}
	}

	parse() {
		for (;;) {
			if (this.token) {
				if (this.token.type == 'EndFile') break;
			}

			this.next();
		}
	}
}
