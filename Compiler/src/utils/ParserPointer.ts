import { SyntaxError } from '../errors/SyntaxError';
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
	operator?: Token;
	default?: string | Token;
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

	previewNext(skipNewline = true, skipWhiteSpace = true) {
		return this.tokenizer.previewNext(skipNewline, skipWhiteSpace);
	}

	next(skipSemicolon = true, skipWhiteSpace = true, skipNewline = true) {
		this.token = this.tokenizer.nextToken();

		if (!this.token) {
			throw new TypeError('next token is undefined');
		}

		this.rawTokens.push(this.token);

		switch (this.token.type) {
			case 'Semicolon':
				if (!skipSemicolon) {
					break;
				}

			case 'Whitespace':
				if (!skipWhiteSpace) {
					break;
				}

			case 'Comment':
				this.next();

				break;

			case 'NewLine':
				this.line++;

				if (skipNewline) {
					this.next();
				}

				break;
		}
	}

	getLine(line: number) {
		return this.content.split('\n')[line - 1];
	}

	take(type: string, skipSemicolon?: boolean, skipWhiteSpace?: boolean, skipNewline?: boolean) {
		if (this.token && this.token.type === type) {
			const _token = this.token;

			this.next(skipSemicolon, skipWhiteSpace, skipNewline);

			return _token;
		}
	}
}
