// -----------------
// Request Handlers
// -----------------

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');

// Define the handlers
let handlers = {};

// ***************************** Users handler *****************************
handlers.users = function(data, callback){
	let acceptableMethods = ['post', 'get', 'put', 'delete'];
	if(acceptableMethods.indexOf(data.method) > -1){
		handlers._users[data.method](data, callback);
	} else {
		callback(405);
	}
};

// Container for the user methods
handlers._users = {};

// Users - post
// Requiered data: firstName, lastName, phone, password, tosAgreement
handlers._users.post = function(data, callback){
	// Check that all required fields are filled out
	let firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
	let lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
	let phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
	let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
	let tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

	if(firstName && lastName && phone && password && tosAgreement){
		// Make sure that the users doesnt already exists
		_data.read('users', phone, function(err, data){
			if(err){
				// Hash the password
				let hashedPassword = helpers.hash(password);

				if(hashedPassword){
					// Create the user object
					let userObject = {
						'firstName' : firstName,
						'lastName' : lastName,
						'phone' : phone,
						'hashedPassword' : hashedPassword,
						'tosAgreement' : true
					};

					// Store the user
					_data.create('users', phone, userObject, function(err){
						if(!err){
							callback(200);
						}
						else {
							console.log(err);
							callback(500, {'Error' : 'Could not create new user'});
						}
					});
				} else {
					callback(500, {'Error' : 'Could not hash the user\'s password'});
				}
			} else {
				// User already exists
				callback(400, {'Error' : 'A user with that phone number already exists'});
			}
		});
	} else {
		callback(400, {'Error' : 'Missing required fields'});
	}
};

// Users - get
// Required data: phone
handlers._users.get = function(data, callback){
	// Check the phone number is valid
	let phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
	if(phone){
		// Get the token from the headers
		let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
		// Verify that the given token is valid for the phonenumber
		handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
			if(tokenIsValid){
				// Lookup the user
				_data.read('users', phone, function(err, data){
					if(!err && data){
						// Remove the hashed password from object before returning the request
						delete data.hashedPassword;
						callback(200, data);
					} else {
						callback(404, {'Error' : 'Phone number not found'});
					}
				});
			} else {
				callback(403, {'Error' : 'Missing required token in header, or token is invalid'});
			}
		});
	} else {
		callback(400, {'Error':'Missing required field'});
	}
};

// Users - put
// Required data: phone
// Optional data: firstName, lastName, password (at least one)
handlers._users.put = function(data, callback){
	// Check for the required field
	let phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

	// Check for the optional fields
	let firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
	let lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
	let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

	// Error if the phone is invalid
	if(phone){
		// Error if nothign is set to update
		if(firstName || lastName || password){
			// Get the token from the headers
			let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
			// Verify that the given token is valid for the phonenumber
			handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
				if(tokenIsValid){
					// Lookup the user
					_data.read('users', phone, function(err, userData){
						if(!err && userData){
							// Update fields
							if(firstName){
								userData.firstName = firstName;
							}
							if(lastName){
								userData.lastName = lastName;
							}
							if(password){
								userData.hashedPassword = helpers.hash(password);
							}

							// Store the new updates
							_data.update('users', phone, userData, function(err){
								if(!err){
									callback(200);
								} else {
									console.log(err);
									callback(500, {'Error' : 'Could not update the user'});
								}
							});
						} else {
							callback(400, {'Error' : 'The specified user does not exists'});
						}
					});
				} else {
					callback(403, {'Error' : 'Missing required token in header, or token is invalid'});
				}
			});

		} else {
			callback(400, {'Error':'Missing fields to update'});
		}
	} else {
		callback(400, {'Error':'Missing required field'});
	}


};

// Users - delete
// Require fields: phone
// @TODO Only let authenticate duser delete their objects
// @TODO Cleanup any other data files related to this user
handlers._users.delete = function(data, callback){
	// Check the phone number is valid
	let phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
	if(phone){
		// Get the token from the headers
		let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
		// Verify that the given token is valid for the phonenumber
		handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
			if(tokenIsValid){
				// Lookup the user
				_data.read('users', phone, function(err, data){
					if(!err && data){
						_data.delete('users', phone, function(err){
							if(!err){
								callback(200);
							} else {
								callback(500, {'Error' : 'Could not delete the specified user'});
							}
						});
					} else {
						callback(400, {'Error' : 'Phone number not found'});
					}
				});
			} else {
				callback(403, {'Error' : 'Missing required token in header, or token is invalid'});
			}
		});
	} else {
		callback(400, {'Error':'Missing required field'});
	}
};

// ***************************** Tokens handler *****************************
handlers.tokens = function(data, callback){
	let acceptableMethods = ['post', 'get', 'put', 'delete'];
	if(acceptableMethods.indexOf(data.method) > -1){
		handlers._tokens[data.method](data, callback);
	} else {
		callback(405);
	}
};

// Container for all the tokens methods
handlers._tokens = {};

// Tokens - post
// Required data: phone, password
// Optional data: none
handlers._tokens.post = function(data, callback){
	let phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
	let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
	if(phone && password){
		// Look up the user who matches that phone number
		_data.read('users', phone, function(err, userData){
			if(!err && userData){
				// Hash the sent password and compare it with the stored one
				let hashedPassword = helpers.hash(password);
				if(hashedPassword == userData.hashedPassword){
					// Create a new token. Set expiration date 1 hour in the future
					let tokenId = helpers.createRandomString(20);
					let expires = Date.now() + 1000 * 60 * 60;
					let tokenObject = {
						'phone' : phone,
						'id' : tokenId,
						'expires' : expires
					}

					// Store the token
					_data.create('tokens', tokenId, tokenObject, function(err){
						if(!err){
							callback(200, tokenObject);
						} else {
							callback(500, {'Error' : 'Could not create the new token'});
						}
					});
				} else {
					callback(400, {'Error' : 'Password did not macth'});
				}
			} else {
				callback(400, {'Error' : 'Could not find the specified user'});
			}
		});
	} else {
		callback(400, {'Error' : 'Missing required field(s)'});
	}
};

// Tokens - get
// Required data: id
handlers._tokens.get = function(data, callback){
	// Check that the id is valid
	let id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
	if(id){
		// Lookup the token
		_data.read('tokens', id, function(err, tokenData){
			if(!err && tokenData){
				callback(200, tokenData);
			} else {
				callback(404, {'Error' : 'Phone number not found'});
			}
		});
	} else {
		callback(400, {'Error':'Missing required field'});
	}
};

// Tokens - put
// Required fields: id, extend
handlers._tokens.put = function(data, callback){
	let id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
	let extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
	if(id && extend){
		// Lookup the token
		_data.read('tokens', id, function(err, tokenData){
			if(!err && tokenData){
				// Check the token is not expired
				if(tokenData.expires > Date.now()){
					// Set the expiration an hour from now
					tokenData.expires = Date.now() + 1000 * 60 * 60;

					//Store the new updates
					_data.update('tokens', id, tokenData, function(err){
						if(!err){
							callback(200);
						} else {
							callback(500, {'Error' : 'Could not update the token\'s expiration'});
						}
					});
				} else {
					callback(400, {'Error' : 'The token has already expired and cannot be extended'});
				}
			} else {
				callback(400, {'Error' : 'Specified token does not exists'});
			}
		});
	} else {
		callback(400, {'Error' : 'Missing required fields or they are invalid'});
	}
};

// Tokens - delete
handlers._tokens.delete = function(data, callback){
	// Check the id is valid
	let id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
	if(id){
		// Lookup the user
		_data.read('tokens', id, function(err, data){
			if(!err && data){
				_data.delete('tokens', id, function(err){
					if(!err){
						callback(200);
					} else {
						callback(500, {'Error' : 'Could not delete the specified token'});
					}
				});
			} else {
				callback(400, {'Error' : 'ID not found'});
			}
		});
	} else {
		callback(400, {'Error':'Missing required field'});
	}
};

// Verify if a given token is currently valid for a given user
handlers._tokens.verifyToken = function(id, phone, callback){
	// Lookup the token
	_data.read('tokens', id, function(err, tokenData){
		if(!err){
			// Check if token has not expired and matches the given user
			if(tokenData.phone == phone && tokenData.expires > Date.now()){
				callback(true);
			} else {
				callback(false);
			}
		} else {
			callback(false);
		}
	});
};


// ***************************** Ping handler *****************************
handlers.ping = function(data, callback){
	// The second parameter is the payload as object
	callback(200);
};

// ***************************** Not Found handler *****************************
handlers.notFound = function(data, callback){
	callback(404);
};


// Export the module
module.exports = handlers;
