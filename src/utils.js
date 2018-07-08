const handler = { construct() { return {}; } };
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
