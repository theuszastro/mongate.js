import chalk from 'chalk';

export abstract class Logger {
	block(name: string) {
		return chalk.white(`[${name}]`);
	}

	white(msg: string, isBold = false) {
		let color = isBold ? chalk.bold.white : chalk.white;

		return color(msg);
	}

	yellow(msg: string, isBold = false) {
		let color = isBold ? chalk.bold.yellow : chalk.yellow;

		return color(msg);
	}

	red(msg: string, isBold = false) {
		let color = isBold ? chalk.bold.red : chalk.red;

		return color(msg);
	}

	cyan(msg: string, isBold = false) {
		let color = isBold ? chalk.bold.cyan : chalk.cyan;

		return color(msg);
	}
}
