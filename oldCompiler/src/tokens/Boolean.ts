import { Token } from '../types/token';
import { Pointer } from '../utils/Pointer';

export class Boolean {
	private value = '';

	constructor(private pointer: Pointer) {}

	isBoolean(data: string) {
		return ['true', 'false'].includes(data);
	}

	boolean(data?: string): Token | undefined {
		const { pointer } = this;

		if (data) {
			return {
				type: 'Boolean',
				value: data,
				ctx: this.pointer.context(),
			};
		}

		if (pointer.char) {
			this.value = '';

			while (/\d/.test(pointer.char)) {
				this.value += pointer.char;

				pointer.next();
			}

			if (this.isBoolean(this.value)) {
				return {
					type: 'Boolean',
					value: this.value,
					ctx: this.pointer.context(),
				};
			}
		}
	}
}
