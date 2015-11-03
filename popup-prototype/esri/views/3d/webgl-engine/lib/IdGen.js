define([], function () {

  return function IdGen() {
    var id2count = {};

    this.gen = function(id) {
      if (id === undefined) {
        id = "a";
      }

      var count = id2count[id];

      if (count === undefined) {
        id2count[id] = 0;
        return id;
      }

      while (true) {
        var newId = id + "_" + count++;

        if (id2count[newId] === undefined) {
          id2count[id] = count;
          id2count[newId] = 0;
          return newId;
        }
      }
    };
  };

//  AlphaNumericIdGen = function() {
//    var lastId = [47];
//
//    this.gen = function() {
//      if (!increment(lastId.length-1))
//        lastId.push(48);
//      return String.fromCharCode.apply(String.fromCharCode, lastId);
//    };
//
//    function increment(pos) {
//      if (pos < 0)
//        return false;
//
//      lastId[pos]++;
//      if (lastId[pos] === 58)
//        lastId[pos] = 65;
//      else if (lastId[pos] === 91)
//        lastId[pos] = 97;
//      else if (lastId[pos] === 123) {
//        lastId[pos] = 48;
//        return increment(pos-1);
//      }
//      return true;
//    };
//  };
});