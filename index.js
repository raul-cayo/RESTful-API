// ---------------------------
// Primary file for the API
// ---------------------------

// Dependency
const http = require('http');
const url = require('url');

// Ther server should respond to all requests with a string
let server = http.createServer(function(req, res){
	// Get the URL and parse it
	let parsedURL = url.parse(req.url, true);

	// Get the path
	let path = parsedURL.pathname;
	let trimmedPath = path.replace(/^\/+|\/+$/g, '')

	// Send the response
	res.end('Hello world!\n');

	// Log the request path
	console.log('Request received on path: ' + trimmedPath);

});

// Start the server, and have it listen on port 3000
server.listen(3000, function(){
	console.log('The server is listening on port 3000 now.');
});
