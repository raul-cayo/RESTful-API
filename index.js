// ---------------------------
// Primary file for the API
// ---------------------------

// Dependency
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');

// Instatiate the HTTP server
let httpServer = http.createServer(function(req, res){
	unifiedSever(req, res);
});

// Start the HTTP server
httpServer.listen(config.httpPort, function(){
	console.log('The HTTP server is listening on port '+config.httpPort+' in '+config.envName+' mode.');
});

// Instatiate the HTTPS server
let httpsServerOptions = {
	'key' : fs.readFileSync('./https/key.pem'),
	'cert' : fs.readFileSync('./https/cert.pem')
};
let httpsServer = https.createServer(httpsServerOptions, function(req, res){
	unifiedSever(req, res);
});

// Start the HTTPS Server
httpsServer.listen(config.httpsPort, function(){
	console.log('The HTTPS server is listening on port '+config.httpsPort+' in '+config.envName+' mode.');
});

// All the server logic for both the http and https server
let unifiedSever = function(req, res){
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
			res.setHeader('Content-Type', 'application/json');
			res.writeHead(statusCode);
			res.end(payloadString);

			// Log the parsed information
			console.log('Request received on path: '+trimmedPath+' with method: '+method);
				//console.log('Query string parameters: ', queryStringObject);
				//console.log('Headers: ', headers);
				//console.log('Returning this response: ', statusCode, payloadString);
				//console.log('User paylaod: ', data.payload);
		});
	});
};

// Define the handlers
let handlers = {};

handlers.ping = function(data, callback){
	// The second parameter is the payload as object
	callback(200);
};

handlers.notFound = function(data, callback){
	callback(404);
};

// Define a request router
let router = {
	'ping' : handlers.ping
};
