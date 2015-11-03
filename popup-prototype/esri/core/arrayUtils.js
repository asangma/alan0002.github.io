define([], function() {

  var arrayUtils = {
    findIndex: function(list, callback, thisArg) {
      // adapted from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex
      var length = list.length;
      var value;

      for (var i = 0; i < length; i++) {
        value = list[i];
        if (callback.call(thisArg, value, i, list)) {
          return i;
        }
      }
      return -1;
    },

    equals: function(a, b) {
      if (!a && !b) {
        return true;
      }
      if (!a || !b) {
        return false;
      }
      if (a.length != b.length) {
        return false;
      }
      for (var i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
          return false;
        }
      }
      return true;
    },

    difference: function(before, after, compareFunction) {
      var added, removed;
      if (compareFunction) {
        added = after.filter(notInArrayComp.bind(null, before, compareFunction));
        removed = before.filter(notInArrayComp.bind(null, after, compareFunction));
      }
      else {
        added = after.filter(notInArray.bind(null, before));
        removed = before.filter(notInArray.bind(null, after));
      }

      return {
        added: added,
        removed: removed
      };
    }
  };

  function notInArray(array, key) {
    return array.indexOf(key) === -1;
  }

  function notInArrayComp(array, comp, key) {
    return !array.some(comp.bind(null, key));
  }


  return arrayUtils;
});
