// ---------------------------
// Primary file for the API
// ---------------------------

// Dependency
const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;

// Ther server should respond to all requests with a string
let server = http.createServer(function(req, res){
	// Get the URL and parse it
	let parsedURL = url.parse(req.url, true);

	// Get the path
	let path = parsedURL.pathname;
	let trimmedPath = path.replace(/^\/+|\/+$/g, '');

	// Get the query string as an object
	let queryStringObject = parsedURL.query;

	// Get the HTTP method
	let method = req.method.toLowerCase();

	// Get the headers as an object
	let headers = req.headers;

	// Get the payload, if any
	let decoder = new StringDecoder('utf-8');
	let buffer = '';
	req.on('data', function(data){
		buffer += decoder.write(data);
	});

	//This event gets triggered even if there is no payload
	req.on('end', function(){
		buffer += decoder.end();

		// Send the response
		res.end('Hello world!\n');

		// Log the parsed information
		console.log('Request received on path: '+trimmedPath+' with method: '+method);
		console.log('Query string parameters: ', queryStringObject);
		console.log('Headers: ', headers);
		console.log('Payload received: ', buffer);
	});

});

// Start the server, and have it listen on port 3000
server.listen(3000, function(){
	console.log('The server is listening on port 3000 now.');
});
