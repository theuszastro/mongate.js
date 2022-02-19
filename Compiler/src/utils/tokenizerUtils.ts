export abstract class TokenizerUtils {
	private isNumber(char: string) {
		return /\d/.test(char);
	}

	private isLetter(char: string) {
		return /a-zA-Z/.test(char);
	}

	private isWhiteSpace(char: string) {
		return /\s/.test(char);
	}
}
