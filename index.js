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

		// Choose the handler this request should go to. If one is not found use notFound
		let chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

		// Construct the data object to send to the handler
		let data = {
			'trimmedPath' : trimmedPath,
			'queryStringObject' : queryStringObject,
			'method' : method,
			'headers' : headers,
			'payload' : buffer
		}

		// Route the request to the handler specified in the router
		chosenHandler(data, function(statusCode, payload){
			// Use the status code, or default to 200
			statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

			// Use the paydload, or default empty object
			payload = typeof(payload) == 'object' ? payload : {};

			// Convert the payload to a string
			let payloadString = JSON.stringify(payload);

			// Return the response
			res.writeHead(statusCode);
			res.end(payloadString);

			// Log the parsed information
			console.log('Request received on path: '+trimmedPath+' with method: '+method);
			console.log('Query string parameters: ', queryStringObject);
			console.log('Headers: ', headers);
			console.log('Returning this response: ', statusCode, payloadString);
		});
	});
});

// Start the server, and have it listen on port 3000
server.listen(3000, function(){
	console.log('The server is listening on port 3000 now.');
});

// Define the handlers
let handlers = {}

handlers.sample = function(data, callback){

	// Callback http status code, and a payload object
	callback(406, {'name' : 'sample handler'});
};

handlers.notFound = function(data, callback){
	callback(404);
};

// Define a request router
let router = {
	'sample' : handlers.sample
}
