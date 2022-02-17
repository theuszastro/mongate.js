import fs from 'fs/promises';
import { compiler } from './src/compiler.mjs';

(async () => {
	const content = await fs.readFile('./data.mon', 'utf-8');

	compiler('data.mon', content);
})();
