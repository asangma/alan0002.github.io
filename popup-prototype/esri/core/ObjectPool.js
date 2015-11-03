define([], function() {

  /*

  var handleItems = new ObjectPool(
    function(callback) {
      this.isActive = true;
      this.callback = callback;
    },
    function() {
      this.isActive = false;
      this.callback = null;
    }
  );

  var hdl = handleItems.get(callback);

  handleItems.put(hdl);

  */

  return function ObjectPool(ctorFn, disposeFn) {
    var Ctor = ctorFn;
    var pool = [];
    var idx = -1;

//     var created = 0;
//     var reused = 0;

    this.get = function() {
      var item;
      if (idx === -1) {
        item = new Ctor();
//         created++;
      }
      else {
        idx = idx - 1;
        item = pool.pop();
        ctorFn.call(item);
//         reused++;
      }
      return item;
    };

    this.put = function(item) {
      if (!item) {
        return;
      }
      disposeFn.call(item);
      idx = idx + 1;
      pool[idx] = item;
    };

//     Object.defineProperty(this, "created", {
//       get: function() {
//         return idx + 1;
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

});
