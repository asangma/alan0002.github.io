/**
 * Floating point assertion utilities.
 * @module test-utils/assertFloat
 */
define([
  "intern/chai!assert"
], function(assert) {
  function almostEqual(p1, p2, epsilon) {
    if (epsilon === undefined) {
      epsilon = 1e-6;
    }

    if (p1.length != p2.length) {
      return false;
    }

    for (var i = 0; i < p1.length; i++) {
      if (isNaN(p1[i]) || isNaN(p2[i])) {
        return false;
      }

      /* Implementation inspired by: http://floating-point-gui.de/errors/comparison/ */

      // Check exact equality first
      if (p1[i] == p2[i]) {
        return true;
      }

      var diff = Math.abs(p1[i] - p2[i]);
      var a1 = Math.abs(p1[i]);
      var a2 = Math.abs(p2[i]);

      if (p1[i] === 0 || p2[i] === 0 || (a1 < 1e-12 && a2 < 1e-12)) {
        // a or b is zero, or both are very close to it, using a relative
        // error doesn't make sense
        if (diff > 0.01 * epsilon) {
          return false;
        }
      } else {
        if (diff / (a1 + a2) > epsilon) {
          return false;
        }
      }
    }

    return true;
  }

  function arrayToString(p1) {
    return "[" + p1.join(", ") + "]";
  }

  function arrayDiff(p1, p2) {
    var ret = [];
    var i;

    for (i = 0; i < p1.length; i++) {
      if (i >= p2.length) {
        ret.push(-p1[i]);
      } else {
        ret.push(p2[i] - p1[i]);
      }
    }

    for (i = p1.length; i < p2.length; i++) {
      ret.push(p2[i]);
    }

    return "[" + ret.join(", ") + "]";
  }

  function assertArrayEqual(actual, expected, message, epsilon) {
    if (!almostEqual(actual, expected, epsilon)) {
      var actualS = arrayToString(actual);
      var expectedS = arrayToString(expected);

      message = (message || "failed") + ": expected " + expectedS + ", but got " + actualS + " difference: " + arrayDiff(actual, expected);
      assert.fail(actualS, expectedS, message);
    }
  }

  /**
   * Assert floating point equality.
   *
   * `actual` and `expected` must be either both `number` or `number[]`.
   *
   * @param {number|number[]} actual the actual value.
   * @param {number|number[]} expected the expected value.
   * @param {string} [message] an optional message to display when the assertion fails.
   * @param {number} [epsilon=1e-6] an optional tolerance.
   *
   * @alias module:test-utils/assertFloat
   * @throws {AssertionError}
   */
  function assertFloat(actual, expected, message, epsilon) {
    if (Array.isArray(actual)) {
      assertArrayEqual(actual, expected, message, epsilon);
    } else {
      if (!almostEqual([actual], [expected], epsilon)) {
        message = (message || "failed") + ": expected " + expected + ", but got " + actual;
        assert.fail(actual, expected, message);
      }
    }
  }

  /**
   * Alias for {@link module:test-utils/assertFloat}.
   *
   * @param {number|number[]} actual the actual value.
   * @param {number|number[]} expected the expected value.
   * @param {string} [message] an optional message to display when the assertion fails.
   * @param {number} [epsilon=1e-6] an optional tolerance.
   * @throws {AssertionError}
   */
  assertFloat.assert = function(actual, expected, message, epsilon) {
    return assertFloat(actual, expected, message, epsilon);
  };

  return assertFloat;
});
