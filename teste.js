const http = require('http');

http.createServer((req, res) => {
	res.write('Heelo');

	res.end();
});
