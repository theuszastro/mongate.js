import { Tokenizer } from './tokenizer';

type Token = {
	type: string;
	value?: string;
	ctx: any;
};

export class Parser {
	private token?: Token | null;
	private rawTokens: Token[] = [];

	constructor(private tokenizer: Tokenizer) {}

	next() {
		this.token = this.tokenizer.nextToken();
		if (!this.token) throw new TypeError('next token is undefined');

		this.rawTokens.push(this.token);

		// switch (this.token.type) {
		// 	case 'Whitespace':
		// 		this.ident = this.token.size;

		// 	case 'Newline':
		// 	case 'Comment':
		// 		return this.next();
		// }
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
