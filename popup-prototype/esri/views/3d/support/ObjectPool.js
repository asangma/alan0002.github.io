define([
  "../../../core/declare",
  "./PreallocArray"
], function(declare, PreallocArray) {
  var ObjectPool = declare([], {
    constructor: function(initialSize, cls) {
      this.freelist = new PreallocArray(initialSize);
      this.cls = cls;
      this.initialSize = initialSize;
    },

    _allocate: function() {
      return new this.cls();
    },

    acquire: function() {
      if (this.freelist.length === 0) {
        var n = Math.max(1, this.initialSize / 2);

        for (var i = 0; i < n; i++) {
          this.freelist.push(new this.cls());
        }
      }

      return this.freelist.pop();
    },

    release: function(obj) {
      this.freelist.push(obj);
    }
  });

  ObjectPool.on = function(obj, initialSize) {
    obj._pool = null;

    Object.defineProperty(obj, "Pool", {
      get: function() {
        if (!this._pool) {
          this._pool = new ObjectPool(initialSize, obj);
        }

        return this._pool;
      }
    });
  };

  return ObjectPool;
});
