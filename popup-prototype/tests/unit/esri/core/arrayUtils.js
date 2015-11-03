define([
  "intern!tdd",
  "intern/chai!assert",
  "esri/core/arrayUtils"
], function(tdd, assert, arrayUtils) {
  tdd.suite("arrayUtils", function() {
    tdd.test("equals", function() {
      assert.isTrue(arrayUtils.equals(null, null), "null, null");
      assert.isTrue(arrayUtils.equals([], []), "[]");
      assert.isTrue(arrayUtils.equals([1, 2], [1, 2]), "[1, 2]");
      assert.isTrue(arrayUtils.equals(["1", "2"], ["1", "2"]), "['1', '2']");
      assert.isFalse(arrayUtils.equals([1], [1, 2]), "[1], [1, 2]");
      assert.isFalse(arrayUtils.equals([1, 2], [1]), "[1, 2], [1]");
      assert.isFalse(arrayUtils.equals(null, [1, 2]), "null, [1, 2]");
      assert.isFalse(arrayUtils.equals(["1", "2"], [1, 2]), "['1', '2'], [1, 2]");
      assert.isFalse(arrayUtils.equals([1, 2], [2, 1]), "[1, 2], [2, 1]");
    });

    tdd.suite("arrayUtils - difference", function() {
      tdd.test("empty", function() {
        var actual = arrayUtils.difference([], []),
          expected = {
            added: [],
            removed: []
          };
        assertDifferenceEqual(actual, expected);
      });

      tdd.test("empty before", function() {
        var actual = arrayUtils.difference([], [1, 2, 3]),
          expected = {
            added: [1, 2, 3],
            removed: []
          };
        assertDifferenceEqual(actual, expected);
      });

      tdd.test("empty after", function() {
        var actual = arrayUtils.difference(["1", "2"], []),
          expected = {
            added: [],
            removed: ["1", "2"]
          };
        assertDifferenceEqual(actual, expected);
      });

      tdd.test("equal", function() {
        var actual = arrayUtils.difference([1, 2, 3], [1, 2, 3]),
          expected = {
            added: [],
            removed: []
          };
        assertDifferenceEqual(actual, expected);
      });

      tdd.test("added and removed", function() {
        var actual = arrayUtils.difference(["1", "2", 3], [1, 2, 3]),
          expected = {
            added: [1, 2],
            removed: ["1", "2"]
          };
        assertDifferenceEqual(actual, expected);
      });

      tdd.test("custom comparator", function() {
        var comp = function(a, b) { return a[0] === b[0]; },
          actual = arrayUtils.difference(["abc", "bcd", "def"], ["aaa", "bbb", "ccc"], comp),
          expected = {
            added: ["ccc"],
            removed: ["def"]
          };
        assertDifferenceEqual(actual, expected);
      });
    });
  });

  function assertDifferenceEqual(actual, expected) {
    if (!arrayUtils.equals(actual.added, expected.added)) {
      assert.fail(actual.added, expected.added,
        "Expected added " + arrayToString(expected.added) + ", got " + arrayToString(actual.added));
    }
    if (!arrayUtils.equals(actual.removed, expected.removed)) {
      assert.fail(actual.removed, expected.removed,
        "Expected removed " + arrayToString(expected.removed) + ", got " + arrayToString(actual.removed));
    }
  }

  function arrayToString(p1) {
    return "[" + p1.join(", ") + "]";
  }
});
