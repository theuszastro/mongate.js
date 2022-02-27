import { Tokenizer } from '../tokenizer';
import { Token } from '../types/token';

export class ParserPointer {
	public token: Token | undefined;
	public rawTokens: Token[] = [];

	public line = 1;

	constructor(private tokenizer: Tokenizer, public filename: string, private content: string) {}

	memorize() {
		return this.tokenizer.pointer.memorize();
	}

	restore(data: any) {
		return this.tokenizer.pointer.restore(data);
	}

	previewNext(skipNewline = true, skipWhiteSpace = true) {
		return this.tokenizer.previewNext(skipNewline, skipWhiteSpace);
	}

	next(skipSemicolon = true, skipWhiteSpace = true, skipNewline = true) {
		this.token = this.tokenizer.nextToken();
		if (!this.token) throw new TypeError('next token is undefined');

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

	takeMultiple(
		types: string[],
		skipSemicolon?: boolean,
		skipWhiteSpace?: boolean,
		skipNewline?: boolean
	) {
		let result: Array<Token | undefined> = [];

		if (this.token) {
			for (let type of types) {
				if (this.token.type == type) {
					result.push(this.token);

					this.take(type, skipSemicolon, skipWhiteSpace, skipNewline);

					continue;
				}

				result.push(undefined);
			}
		}

		return result;
	}

	take(type: string, skipSemicolon?: boolean, skipWhiteSpace?: boolean, skipNewline?: boolean) {
		if (this.token && this.token.type === type) {
			const _token = this.token;

			this.next(skipSemicolon, skipWhiteSpace, skipNewline);

			return _token;
		}
	}
}
