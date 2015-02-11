/*global describe, it, before, after*/
'use strict';

// A require to work on node or browser
function smartRequire(name, windowName) {
	var stripName = function(name) {
		if(!name) {
			return;
		}
		var strippedName = name.match(/\/([^\/]+)$/);
		return strippedName? strippedName[1]: name;
	};
	if(typeof require === 'function') {
		return require(name);
	} else {
		return window[windowName || stripName(name)];
	}
}

var assert = smartRequire('chai').assert,
	sinon = smartRequire('sinon'),
	jsonpipe = smartRequire('../lib/jsonpipe'),
	testUrl = 'https://github.com/eBay/jsonpipe'; // this is a dummy URL, the actual response will be simulated by sinon

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

describe('jsonpipe', function() {
	it('should check if jsonpipe API is present', function() {
		assert.isNotNull(jsonpipe, 'jsonpipe should not be null');
	});

	describe('verify the iterface', function() {

		var fakexhr;
		
		before(function () {
    		fakexhr = sinon.useFakeXMLHttpRequest();
		});

		after(function() {
			fakexhr.restore();
		});

		it('should return undefined when called with no arguments', function() {
			assert.isUndefined(jsonpipe.flow());
		});

		it('should return undefined when called with a string url with no options', function() {
			assert.isUndefined(jsonpipe.flow(testUrl));
		});		

		it('should return undefined when called with options object with no attributes', function() {
			assert.isUndefined(jsonpipe.flow({}));
		});				

		it('should return undefined when called with options object with only url attribute', function() {
			assert.isUndefined(jsonpipe.flow({
				"url": testUrl
			}));
		});						

		it('should return XMLHttpRequest object when called with url and success attributes', function() {
			var xhr = jsonpipe.flow(testUrl, {
				"success": function() {					
				}
			});
			assert.isObject(xhr);
		});						

		it('should return XMLHttpRequest object when called with url and error attributes', function() {
			var xhr = jsonpipe.flow(testUrl, {
				"error": function() {					
				}
			});
			assert.isObject(xhr);
		});

		it('should return object which is an instance of XMLHttpRequest', function() {
			var xhr = jsonpipe.flow(testUrl, {
				"success": function() {					
				}
			});
			assert.instanceOf(xhr, XMLHttpRequest);
		});								
		it('should check if request headers are set right', function() {
			var xhr = jsonpipe.flow(testUrl, {
				"success": function() {					
				},
				"headers": {
					"x-test": "jsonpipe"
				}
			});
			assert.equal(xhr.requestHeaders['x-test'], 'jsonpipe');
		});										
	});

	describe('verify success scenarios', function() {

		var fakexhr,
			headers = {
				"Content-Type": "application/json",
				"Transfer-Encoding": "chunked"
			};
		
		before(function () {
    		fakexhr = sinon.useFakeXMLHttpRequest();
		});

		after(function() {
			fakexhr.restore();
		});

		it('should process a JSON response with no chunks', function(done) {
			var xhr = jsonpipe.flow(testUrl, {
				"success": function(data) {
					assert.equal(data.id, 7);
					done();
				}
			});			

			// increase the chunkSize
			xhr.chunkSize = 20;

			xhr.respond(200, {
					"Content-Type": "application/json"
				}, 
				JSON.stringify({
					"id": 7
				}));
		});

		it('should process a JSON response with 1 chunk and ending with \\n\\n', function(done) {
			var xhr = jsonpipe.flow(testUrl, {
				"success": function(data) {
					assert.equal(data.id, 7);
					done();
				}
			});			

			// increase the chunkSize
			xhr.chunkSize = 20;
			xhr.respond(200, headers, 
				'{"id": 7}\n\n');
		});

		it('should process a JSON response with 1 chunk and starting with \\n\\n', function(done) {
			var xhr = jsonpipe.flow(testUrl, {
				"success": function(data) {
					assert.equal(data.id, 7);
					done();
				}
			});			

			// increase the chunkSize
			xhr.chunkSize = 20;			
			xhr.respond(200, headers, 
				'\n\n{"id": 7}');
		});

		it('should process a JSON response with 1 chunk, starting and ending with \\n\\n', function(done) {
			var xhr = jsonpipe.flow(testUrl, {
				"success": function(data) {
					assert.equal(data.id, 7);
					done();
				}
			});			

			// increase the chunkSize
			xhr.chunkSize = 20;
			xhr.respond(200, headers, 
				'\n\n{"id": 7}\n\n');
		});

		it('should process a JSON response with 1 chunk, and JSON separated with \\n\\n', function(done) {
			var chunkCount = 0,
				xhr = jsonpipe.flow(testUrl, {
				"success": function(data) {
					assert.equal(data.id, chunkCount++);
					if(chunkCount === 2) {
						done();
					}
				}
			});		

			// increase the chunkSize
			xhr.chunkSize = 20;
			xhr.respond(200, headers, 
				'{"id": 0}\n\n{"id": 1}');
		});

		it('should process a JSON response with multile chunks', function(done) {
			var chunkCount = 0,
				xhr = jsonpipe.flow(testUrl, {
				"success": function(data) {
					assert.equal(data.id, chunkCount++);
					if(chunkCount === 3) {
						done();
					}
				}
			});		

			// reduce the chunkSize
			xhr.chunkSize = 5;
			xhr.respond(200, headers, 
				'{"id": 0}\n\n{"id": 1}\n\n{"id": 2}');
		});		

		it('should process a JSON response with multile chunks and bigger buffer size', function(done) {
			var chunkCount = 0,
				xhr = jsonpipe.flow(testUrl, {
				"success": function(data) {
					assert.equal(data.id, chunkCount++);
					if(chunkCount === 3) {
						done();
					}
				}
			});		

			// reduce the chunkSize
			xhr.chunkSize = 15;
			xhr.respond(200, headers, 
				'{"id": 0}\n\n{"id": 1}\n\n{"id": 2}');
		});		

		it('should process a JSON response with multile chunks, staring and ending with \\n\\n', function(done) {
			var chunkCount = 0,
				xhr = jsonpipe.flow(testUrl, {
				"success": function(data) {
					assert.equal(data.id, chunkCount++);
					if(chunkCount === 3) {
						done();
					}
				}
			});		

			// reduce the chunkSize
			xhr.chunkSize = 5;
			xhr.respond(200, headers, 
				'\n\n{"id": 0}\n\n{"id": 1}\n\n{"id": 2}\n\n');
		});	

		it('should process a JSON response with multile chunks, and a complete function', function(done) {
			var chunkCount = 0,
				xhr = jsonpipe.flow(testUrl, {
				"success": function(data) {
					assert.equal(data.id, chunkCount++);
				},
				"complete": function() {
					done();
				}
			});		

			// reduce the chunkSize
			xhr.chunkSize = 5;
			xhr.respond(200, headers, 
				'\n\n{"id": 0}\n\n{"id": 1}\n\n{"id": 2}\n\n');
		});		

		it('should process a JSON response which has Array chunks', function(done) {
			var chunkCount = 0,
				xhr = jsonpipe.flow(testUrl, {
				"success": function(data) {
					assert.isArray(data);					
					if(++chunkCount === 2) {
						done();
					}
				}
			});		

			// reduce the chunkSize
			xhr.chunkSize = 5;
			xhr.respond(200, headers, 
				'[{"id": 0},{"id": 1}]\n\n[{"id": 2},{"id": 3}]');
		});			
	});

	describe('vefiry error scenarios', function() {

		var fakexhr,
			headers = {
				"Content-Type": "application/json",
				"Transfer-Encoding": "chunked"
			};

		before(function() {
			fakexhr = sinon.useFakeXMLHttpRequest();
		});

		after(function() {
			fakexhr.restore();
		});

		it('should call error function on invalid JSON response', function(done) {
			var chunkSize = 0,
				xhr = jsonpipe.flow(testUrl, {
				"error": function(msg) {
					assert.equal(msg, 'parsererror');
					if(++chunkSize === 2) {
						done();
					}					
				}
			});

			xhr.respond(200, headers, '{"id"\n\n}');

		});

		it('should call success function on valid chunk and error function on invalid JSON chunk', function(done) {
			var chunkSize = 0,
				callDone = function() {					
					if(++chunkSize === 2) {
						done();
					}
				},
				xhr = jsonpipe.flow(testUrl, {
				"success": function(data) {
					assert.equal(data.id, 1);
					callDone();
				},	
				"error": function(msg) {
					assert.equal(msg, 'parsererror');
					callDone();
				}
			});

			xhr.respond(200, headers, '{"id"}\n\n{"id": 1}');

		});

		it('should call error function if timeout exceeded', function(done) {
			var xhr = jsonpipe.flow(testUrl, {
				"error": function() {
					assert.equal(xhr.status, 0);
					done();
				},
				"timeout": 20
			});		

			// Set auto response
			xhr.autoRespond = true;
			xhr.autoRespondAfter = 50;
		});	

		it('should call error function on HTTP response code other than 200. e.g. 404', function(done) {

			var xhr = jsonpipe.flow(testUrl, {
				"error": function(msg) {
					assert.equal(xhr.status, '404');
					assert.equal(msg, 'Not Found');
					done();
				}
			});

			xhr.respond(404);
		});
	});

});
