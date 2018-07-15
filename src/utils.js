const handler = { construct() { return {}; } };

/**
 * Checks if the provided object is a constructor.
 * @param {any} func The object to check.
 * @returns {boolean} True if the provided object is a constructor function, false otherwise.
 */
function isConstructor(func) {
	try {
		return !!new new Proxy(func, handler)();
	} catch(err) {
		return false;
	}
}

module.exports = {
	isConstructor
};
