import { exec } from 'child_process';
import { promisify } from 'util';

import { runInThisContext } from 'vm';

import chalk from 'chalk';

class Logger {
    block(msg: string) {
        let open = chalk.white('[');
        let close = chalk.white(']');

        return `${open}${msg}${close}`;
    }

    SyntaxError(filename: string, lines: any[], lineNumber: number, reason: string) {
        console.log(
            this.block(chalk.redBright('Error')),
            chalk.white("SyntaxError on "),
            chalk.redBright(filename),
            chalk.white(" in"),
            chalk.yellow(`line ${lineNumber}`),
        );

        for (let {line, lineContent} of lines) {
            console.log(
                this.block(chalk.yellow(`Line ${line}`)),
                chalk.white(lineContent.replace("\n", ""))
            );  
        }
    }
}

const logger = new Logger();
const execAsync = promisify(exec);

(async () => {
    try {
        const { stdout } = await execAsync(`./Compiler data/data.nylock --react --es6`);

        console.log(stdout);

        // runInThisContext(stdout);
    } catch(e) {
        const { stdout } = e as any;

        console.log(stdout);

        if (stdout) {
            const { type, reason, filename, lineNumber, lines } = JSON.parse(stdout);

            // @ts-ignore
            logger[type](filename, lines, lineNumber, reason);
        }
    }
})();