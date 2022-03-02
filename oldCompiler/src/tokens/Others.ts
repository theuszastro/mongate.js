import { Token } from '../types/token';
import { Pointer } from '../utils/Pointer';

export class Others {
	private tokens = {
		'^': 'Circumflex',
		'\\': 'BackSlash',
		'$': 'DollarSign',
		'#': 'HashTag',
		"'": 'SingleQuote',
		'"': 'DoubleQuote',
		'@': 'Decorator',
	} as { [key: string]: string };

	constructor(private pointer: Pointer) {}

	others(): Token | undefined {
		const { pointer, tokens } = this;

		const char = pointer.char;
		const token = tokens[char];

		if (!char || !token) return;

		pointer.next();

		return {
			type: token,
			value: char,
			ctx: pointer.context(),
		};
	}
}
