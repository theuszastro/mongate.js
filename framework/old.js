class Other {
	render(props) {
		const elements = {};
		const state = new Proxy(
			{ name: '', lastname: '' },
			{
				get: (target, key) => {
					return target[key];
				},
				set: (target, key, value) => {
					target[key] = value;

					if (elements[key]) {
						elements[key].forEach(({ tag, props, element }, i) => {
							if (tag == 'input') {
								element.value = state[key];

								return;
							}

							const value =
								typeof props['child'] === 'function'
									? props['child'](state)
									: props['child'];

							element.innerHTML = '';
							value.forEach(child => {
								if (child) {
									element.append(child);
								}
							});
						});
					}

					return true;
				},
			}
		);

		const createElement = (tag, props, ignore) => {
			const element = document.createElement(tag);

			for (let [k, v] of Object.entries(props)) {
				if (k == 'child') {
					const value = typeof v === 'function' ? v(state) : v;

					value.forEach(child => {
						if (child) {
							element.append(child);
						}
					});

					continue;
				}

				if (k === 'state') {
					if (!elements[v]) {
						elements[v] = [];
					}

					if (!ignore) {
						elements[v].push({ tag, props, element });
					}

					continue;
				}

				if (k.startsWith('on')) {
					element.addEventListener(k.slice(2), v);

					continue;
				}

				element[k] = v;
			}

			return element;
		};

		return createElement('div', {
			child: [
				createElement('input', {
					placeholder: 'name',
					state: 'name',
					oninput: e => {
						state['name'] = e.target.value;
					},
				}),
				createElement('input', {
					placeholder: 'lastname',
					state: 'lastname',
					oninput: e => {
						state['lastname'] = e.target.value;
					},
				}),
				createElement('h1', {
					child: [`Hello ${state.name} ${state.lastname}, your email is ${props.email}?`],
				}),
			],
		});
	}
}

class App {
	constructor() {
		document.body.append(this.render());
	}

	render() {
		const elements = {};
		const state = new Proxy(
			{ email: '' },
			{
				get: (target, key) => {
					return target[key];
				},
				set: (target, key, value) => {
					target[key] = value;

					if (elements[key]) {
						elements[key].forEach(({ tag, props, element }, i) => {
							if (tag == 'input') {
								element.value = state[key];

								return;
							}

							const value =
								typeof props['child'] === 'function'
									? props['child'](state)
									: props['child'];

							element.innerHTML = '';
							value.forEach(child => {
								if (child) {
									console.log(typeof child === 'function');

									element.append(
										typeof child === 'function' ? child(target) : child
									);
								}
							});
						});
					}

					return true;
				},
			}
		);

		const createElement = (tag, props, ignore) => {
			const element = document.createElement(tag);

			for (let [k, v] of Object.entries(props)) {
				if (k == 'child') {
					const value = typeof v === 'function' ? v(state) : v;

					value.forEach(child => {
						if (child) {
							element.append(typeof child === 'function' ? child(state) : child);
						}
					});

					continue;
				}

				if (k === 'state') {
					if (!elements[v]) {
						elements[v] = [];
					}

					if (!ignore) {
						elements[v].push({ tag, props, element });
					}

					continue;
				}

				if (k.startsWith('on')) {
					element.addEventListener(k.slice(2), v);

					continue;
				}

				element[k] = v;
			}

			return element;
		};

		let other = new Other();

		return createElement('div', {
			child: [
				createElement('input', {
					placeholder: 'email',
					state: 'email',
					oninput: e => {
						state['email'] = e.target.value;
					},
				}),
				createElement('h1', {
					child: state => [
						state['email'].length >= 1 ? state['email'] : 'no email',
						state.email.length >= 1 &&
							createElement('a', {
								child: [' reset'],
								onclick: e => {
									state['email'] = '';
								},
							}),
					],
					state: 'email',
				}),
				state => other.render({ email: state['email'] }),
			],
		});
	}
}

new App();
