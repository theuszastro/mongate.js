import chalk from 'chalk';

export abstract class Logger {
	block(name: string) {
		return chalk.white(`[${name}]`);
	}

	color(name: string, msg: string, isBold = false) {
		// @ts-ignore
		let color = isBold ? chalk.bold[name] : chalk[name];

		return color(msg);
	}

	error(msg: string) {
		return this.color('redBright', msg);
	}

	warn(msg: string) {
		return this.color('yellow', msg);
	}

	info(msg: string) {
		return this.color('cyan', msg);
	}

	ctx(msg: string) {
		return this.color('white', msg);
	}
}
