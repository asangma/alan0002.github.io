/* jshint bitwise:false */
define([], function() {
  function siftDown(array, start, end, compare) {
    var i = start;
    var c = start;
    var last = end >>> 1;
    var tmp = array[i - 1];

    while (c <= last) {
      c = i << 1;

      if (c < end && compare(array[c - 1], array[c]) < 0) {
        ++c;
      }

      var c1 = array[c - 1];

      if (compare(c1, tmp) <= 0) {
        break;
      }

      array[i - 1] = c1;
      i = c;
    }

    array[i - 1] = tmp;
  }

  function defaultComparison(a, b) {
    return a < b ? -1 : (a > b ? 1 : 0);
  }

  return {
    sort: function(array, start, end, comparison) {
      if (start === undefined) {
        start = 0;
      }

      if (end === undefined) {
        end = array.length;
      }

      if (comparison === undefined) {
        comparison = defaultComparison;
      }

      for (var i = end >>> 1; i > start; i--) {
        siftDown(array, i, end, comparison);
      }

      var s1 = start + 1;

      for (i = end - 1; i > start; i--) {
        var tmp = array[start];
        array[start] = array[i];
        array[i] = tmp;
        siftDown(array, s1, i, comparison);
      }

      return array;
    }
  };
});
