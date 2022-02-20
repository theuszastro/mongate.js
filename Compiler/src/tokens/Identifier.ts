import { Pointer } from '../utils/Pointer';
import { Boolean } from './Boolean';

export class Identifier {
	private value: string = '';
	private keywords = {
		let: 'VariableKeyword',
		const: 'ConstantKeyword',
		def: 'FunctionKeyword',
		async: 'AsyncKeyword',
		await: 'AwaitKeyword',
		loop: 'LoopKeyword',
		for: 'ForKeyword',
		if: 'IfKeyword',
		else: 'ElseKeyword',
		return: 'ReturnKeyword',
	} as { [key: string]: string };

	constructor(private pointer: Pointer, private boolean: Boolean) {}

	private isLetter() {
		const { char } = this.pointer;

		return ('a' <= char && char <= 'z') || ('A' <= char && char <= 'Z');
	}

	identifier() {
		const { pointer } = this;

		if (this.isLetter()) {
			this.value = '';

			while (this.isLetter()) {
				this.value += pointer.char;

				pointer.next();
			}

			if (this.boolean.isBoolean(this.value)) {
				return this.boolean.boolean(this.value);
			}

			const keyword = this.keywords[this.value];
			if (keyword) {
				return {
					type: keyword,
					ctx: pointer.context(),
				};
			}

			return {
				type: 'Identifier',
				value: this.value,
				ctx: pointer.context(),
			};
		}

		return null;
	}
}
