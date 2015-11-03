define([], function() {
  
  var splice = Array.prototype.splice;

  var ArrayPool = function ArrayPool(initialSize, allocationSize) {
    allocationSize = allocationSize == null ? 50 : allocationSize;
    initialSize = initialSize == null ? 50 : initialSize;

    var pool = [];
    var idx = -1;

//     var created = 0;
//     var reused = 0;

    for (var i = initialSize; i > 0; --i) {
      pool.push([]);
    }
//     created = initialSize;
    idx = initialSize - 1;

    this.get = function() {
      if (idx === -1) {
        for (var i = allocationSize; i > 0; --i) {
          pool.push([]);
        }
//         created += allocationSize;
        idx += allocationSize;
      }
      idx = idx - 1;
      return pool.pop();
    };

    this.getCopy = function(arr) {
      var copy = this.get();
      arr.unshift(0, 0);
      splice.apply(copy, arr);
      arr.splice(0, 2);
      return copy;
    };

    this.put = function(arr) {
      if (!arr) {
        return;
      }
//       reused++;
      arr.length = 0;
      idx = idx + 1;
      pool[idx] = arr;
    };

//     Object.defineProperty(this, "created", {
//       get: function() {
//         return created;
//       }
//     });

//     Object.defineProperty(this, "reused", {
//       get: function() {
//         return reused;
//       }
//     });

//     Object.defineProperty(this, "size", {
//       get: function() {
//         return idx + 1;
//       }
//     });
  };

  var instance = new ArrayPool(100);

  ArrayPool.get = function() {
    return instance.get();
  };

  ArrayPool.getCopy = function(arr) {
    return instance.getCopy(arr);
  };

  ArrayPool.put = function(arr) {
    return instance.put(arr);
  };

//   window.ArrayPool = instance;

  return ArrayPool;

});
