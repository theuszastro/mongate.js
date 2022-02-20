import chalk from 'chalk';
import { Code } from './Code';

export abstract class Logger extends Code {
	constructor() {
		super();
	}

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
