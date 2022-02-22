import { Pointer } from '../utils/Pointer';
import { Boolean } from './Boolean';

export class Identifier {
	private value = '';
	private exprs = {
		null: 'NullExpr',
		undefined: 'UndefinedExpr',
	} as { [key: string]: string };

	static keywords = {
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
		class: 'ClassKeyword',
		end: 'EndKeyword',
		// react
		// define: 'DefineKeyword',
		// global: 'GlobalKeyword',
		// css: 'CssKeyword',
		// component: 'ComponentKeyword',
		// prop: 'PropKeyword',
		// state: 'StateKeyword',
		// ref: 'EefKeyword',
	} as { [key: string]: string };

	constructor(private pointer: Pointer, private boolean: Boolean) {}

	isLetter() {
		const { char } = this.pointer;

		return ('a' <= char && char <= 'z') || ('A' <= char && char <= 'Z') || char === '_';
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

			const keywordOrExpr = Identifier.keywords[this.value] ?? this.exprs[this.value];
			if (keywordOrExpr) {
				console.log(keywordOrExpr);

				return {
					type: keywordOrExpr,
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
