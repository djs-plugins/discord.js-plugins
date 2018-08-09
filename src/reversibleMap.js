const privates = new WeakMap();
const NOINIT = Symbol('NoInit');

/**
 * @typedef {Array|string|Map|Set|Collection|Iterator} Iterable
 */
/**
 * A reversible map where both keys and values must be unique and where the map can be flipped.
 */
class ReversibleMap {
	/**
	 * @param {Iterable} [iterable] Which iterable object to generate the initial map from.
	 */
	constructor(iterable) {
		const _private = {};
		privates.set(this, _private);

		if(iterable === NOINIT) return;

		_private.normal = new Map();
		_private.reversed = new Map();

		const reversed = new ReversibleMap(NOINIT);
		const newPrivate = privates.get(reversed);
		newPrivate.normal = _private.reversed;
		newPrivate.reversed = _private.normal;
		newPrivate.parent = this;
		_private.parent = reversed;

		if(iterable) {
			for(let [key, val] of iterable) {
				if(privates.reverse.has(val)) throw new Error('Values must be unique in a ReversibleMap');
				_private.reversed.set(val, key);
				_private.normal.set(key, val);
			}
		}
	}

	/**
	 * Returns the number of key/value pairs in the `ReversibleMap` object.
	 * @type {number}
	 * @readonly
	 */
	get size() {
		const _private = privates.get(this);
		return _private.normal.size;
	}

	/**
	 * Reversed version of the `ReversibleMap` object.
	 * This is **NOT** a copy, any changes made to the reversed
	 * version of the `ReversibleMap` will reflect on the non-reversed
	 * version. Also the reversed-reversed version is the same object
	 * as the original non-reversed version.
	 * @type {ReversibleMap}
	 * @readonly
	 */
	get reversed() {
		const _private = privates.get(this);
		return _private.parent;
	}

	/**
	 * Removes all key/value pairs from the Map object.
	 */
	clear() {
		const _private = privates.get(this);
		_private.normal.clear();
		_private.reversed.clear();
	}

	/**
	 * Returns `true` if an element in the `ReversibleMap` object existed and has been removed,
	 * or `false` if the element does not exist.
	 * {@link ReversibleMap#has} will return `false` afterwards.
	 * @param {*} key The key of the element to remove from the `ReversibleMap` object.
	 * @returns {boolean} Returns true if an element in the ReversibleMap object existed and has been removed,
	 * or false if the element does not exist.
	 */
	delete(key) {
		const _private = privates.get(this);
		if(!_private.normal.has(key)) return false;
		const val = _private.normal.get(key);
		_private.normal.delete(key);
		_private.reversed.delete(val);
		return true;
	}

	/**
	 * Returns a new {@link Iterator} object that contains
	 * **an array of `[key, value]`** for each element in the `ReversibleMap` object.
	 * @return {Iterator} A new Map iterator object.
	 */
	entries() {
		const _private = privates.get(this);
		return _private.normal.entries();
	}

	/**
	 * Calls `callback` once for each key-value pair present in the `ReversibleMap` object.
	 * If a thisArg parameter is provided to forEach, it will be used as the this value for each callback.
	 * @param {Function} callback Function to execute for each element.
	 * @param {*} [thisArg] Value to use as this when executing `callback`.
	 * @returns {void}
	 */
	forEach(callback, thisArg) {
		const _private = privates.get(this);
		return _private.normal.forEach(callback, thisArg);
	}

	/**
	 * Returns the value associated to the `key`, or `undefined` if there is none.
	 * @param {*} key The key of the element to return from the `ReversibleMap` object.
	 * @return {*} Returns the element associated with the specified key or
	 * undefined if the key can't be found in the ReversibleMap object.
	 */
	get(key) {
		const _private = privates.get(this);
		return _private.normal.get(key);
	}
	/**
	 * The `has()` method returns a boolean indicating whether an element with the specified key exists or not.
	 * @param {*} key The key of the element to test for presence in the `ReversibleMap` object.
	 * @returns {boolean} Returns `true` if an element with the specified key exists in the
	 * `ReversibleMap` object; otherwise `false`.
	 */
	has(key) {
		const _private = privates.get(this);
		return _private.normal.has(key);
	}

	/**
	 * The `keys()` method returns a new {@link Iterator} object that contains the
	 * keys for each element in the `ReversibleMap` object.
	 * @returns {Iterator} A new Map iterator object.
	 */
	keys() {
		const _private = privates.get(this);
		return _private.normal.keys();
	}

	/**
	 * The `set()` method adds or updates an element with a specified `key` and `value` to a `ReversibleMap` object.
	 * NOTE: Unlike a normal map, values must be unique in this map.
	 * @param {*} key The key of the element to add to the `ReversibleMap` object.
	 * @param {*} val The value of the element to add to the `ReversibleMap` object.
	 * @return {ReversibleMap} The `ReversibleMap` object.
	 */
	set(key, val) {
		const _private = privates.get(this);
		if(_private.reversed.has(val)) {
			const reversedVal = _private.reversed.get(val);
			const bothNan = Object.is(reversedVal, NaN) && Object.is(key, NaN);
			if(reversedVal === key || bothNan) return this;
			throw new Error('Values must be unique in a ReversibleMap');
		}

		if(_private.normal.has(key)) {
			const oldVal = _private.normal.get(key);
			_private.normal.delete(key);
			_private.reversed.delete(oldVal);
		}

		_private.normal.set(key, val);
		_private.reversed.set(val, key);
		return this;
	}

	values(key) {
		const _private = privates.get(this);
		return _private.normal.values(key);
	}
}

ReversibleMap.prototype[Symbol.iterator] = ReversibleMap.prototype.entries;

module.exports = ReversibleMap;
