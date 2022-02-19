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
	} as { [key: string]: string };

	constructor(private pointer: Pointer, private boolean: Boolean) {}

	private isLetter() {
		return (
			('a' <= this.pointer.char && this.pointer.char <= 'z') ||
			('A' <= this.pointer.char && this.pointer.char <= 'Z')
		);
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
