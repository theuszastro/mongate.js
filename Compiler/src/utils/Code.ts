export abstract class Code {
	generate(length: number, char: string) {
		return new Array(length + 1).join(char);
	}

	extractCode(line: string, code: string, lineNumber: number) {
		const { index = 0 } = line.match(code) ?? { index: 0 };

		const start = line.substring(0, index).length + `[Line ${lineNumber}]`.length;
		const end = line.substring(index + code.length).length;

		return [start, end];
	}
}
