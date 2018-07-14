const privates = new WeakMap();
const NOINIT = Symbol('NoInit');

class TwoWayMap {
	constructor(iterable) {
		const _private = {};
		privates.set(this, _private);

		if(iterable === NOINIT) return;

		_private.normal = new Map();
		_private.reversed = new Map();

		const reversed = new TwoWayMap(NOINIT);
		const newPrivate = privates.get(reversed);
		newPrivate.normal = _private.reversed;
		newPrivate.reversed = _private.normal;
		newPrivate.parent = this;
		_private.parent = reversed;

		if(iterable) {
			for(let [key, val] of iterable) {
				if(privates.reverse.has(val)) throw new Error('Values must be unique in a TwoWayMap');
				_private.reversed.set(val, key);
				_private.normal.set(key, val);
			}
		}
	}

	get size() {
		const _private = privates.get(this);
		return _private.normal.size;
	}

	get reversed() {
		const _private = privates.get(this);
		return _private.parent;
	}

	clear() {
		const _private = privates.get(this);
		_private.normal.clear();
		_private.reversed.clear();
	}

	delete(key) {
		const _private = privates.get(this);
		if(!_private.normal.has(key)) return false;
		const val = _private.normal.get(key);
		_private.normal.delete(key);
		_private.reversed.delete(val);
		return true;
	}

	entries() {
		const _private = privates.get(this);
		return _private.normal.entries();
	}

	forEach(callback, thisArg) {
		const _private = privates.get(this);
		return _private.normal.forEach(callback, thisArg);
	}

	get(key) {
		const _private = privates.get(this);
		return _private.normal.get(key);
	}

	has(key) {
		const _private = privates.get(this);
		return _private.normal.has(key);
	}

	keys(key) {
		const _private = privates.get(this);
		return _private.normal.keys(key);
	}

	set(key, val) {
		const _private = privates.get(this);
		if(_private.reversed.has(val)) {
			const reversedVal = _private.reversed.get(val);
			const bothNan = Object.is(reversedVal, NaN) && Object.is(key, NaN);
			if(reversedVal === key || bothNan) return this;
			throw new Error('Values must be unique in a TwoWayMap');
		}

		if(_private.normal.has(key)) {
			const oldVal = _private.normal.get(key);
			_private.normal.delete(key);
			_private.reversed.delete(oldVal);
		}

		_private.normal.set(key, val);
		_private.reversed.set(val, key);
		return _private.normal.keys(key);
	}

	values(key) {
		const _private = privates.get(this);
		return _private.normal.values(key);
	}
}

TwoWayMap.prototype[Symbol.iterator] = TwoWayMap.prototype.entries;

module.exports = TwoWayMap;
