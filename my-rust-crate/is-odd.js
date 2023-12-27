/*!
 * is-number <https://github.com/jonschlinkert/is-number>
 *
 * Copyright (c) 2014-2018, Jon Schlinkert.
 * Released under the MIT License.
 */

var isNumber$1 = function isNumber(num) {
  var number = +num;

  if ((number - number) !== 0) {
    // Discard Infinity and NaN
    return false;
  }

  if (number === num) {
    return true;
  }

  if (typeof num === 'string') {
    // String parsed, both a non-empty whitespace string and an empty string
    // will have been coerced to 0. If 0 trim the string and see if its empty.
    if (number === 0 && num.trim() === '') {
      return false;
    }
    return true;
  }
  return false;
};

/*!
 * is-odd <https://github.com/jonschlinkert/is-odd>
 *
 * Copyright (c) 2015-2017, Jon Schlinkert.
 * Released under the MIT License.
 */

const isNumber = isNumber$1;

var isOdd = function isOdd(value) {
  const n = Math.abs(value);
  if (!isNumber(n)) {
    throw new TypeError('expected a number');
  }
  if (!Number.isInteger(n)) {
    throw new Error('expected an integer');
  }
  if (!Number.isSafeInteger(n)) {
    throw new Error('value exceeds maximum safe integer');
  }
  return (n % 2) === 1;
};

export { isOdd as isOdd };
