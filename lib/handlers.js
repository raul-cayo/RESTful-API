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
// Optional data: none
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
// Optinal data: none
// @TODO Only let authenticated users access their objects
handlers._users.get = function(data, callback){
	// Check the phone number is valid
	let phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
	if(phone){
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
		callback(400, {'Error':'Missing required field'});
	}
};

// Users - put
// Required dara: phone
// Optional data: firstName, lastName, password (at least one)
// @TODO Only let authenticated user their own object
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
			callback(400, {'Error':'Missing fields to update'});
		}
	} else {
		callback(400, {'Error':'Missing required field'});
	}


};

// Users - delete
// Require fields: phone
// Optional fields: none
// @TODO Only let authenticate duser delete their objects
// @TODO Cleanup any other data files related to this user
handlers._users.delete = function(data, callback){
	// Check the phone number is valid
	let phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
	if(phone){
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
		callback(400, {'Error':'Missing required field'});
	}
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
