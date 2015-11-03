define([
  "../../../core/declare",
  "./HeapSort"
], function(declare, HeapSort) {
  var PreallocArray = declare([], {
    constructor: function(initialSize, allocator) {
      this.data = new Array(initialSize);
      this.length = 0;

      if (allocator) {
        for (var i = 0; i < initialSize; i++) {
          this.data[i] = allocator(i);
        }

        this._allocator = allocator;
        this._hasAllocator = true;
      } else {
        this._allocator = this._nullAllocator;
        this._hasAllocator = false;
      }
    },

    _nullAllocator: function() {
      return null;
    },

    grow: function(l) {
      while (this.data.length < l) {
        this.data.push(this._allocator(this.data.length));
      }
    },

    next: function() {
      if (!this._hasAllocator) {
        return null;
      }

      if (this.data.length === this.length) {
        // TODO: grow strategy?
        this.grow(this.length * 2);
      }

      return this.data[this.length++];
    },

    swap: function(i, j) {
      var item = this.data[i];
      this.data[i] = this.data[j];
      this.data[j] = item;
    },

    push: function(item) {
      if (this.data.length === this.length) {
        // TODO: grow strategy?
        this.grow(this.length * 2);
      }

      this.data[this.length++] = item;
    },

    pushArray: function(items) {
      var newLength = this.length + items.length;
      if (newLength >= this.data.length) {
        this.grow(Math.max(this.length * 2, newLength));
      }
      for (var i = 0; i < items.length; i++) {
        this.data[this.length++] = items[i];
      }
    },

    pushEither: function(items) {
      if (Array.isArray(items)) {
        this.pushArray(items);
      }
      else {
        this.push(items);
      }
    },

    pop: function() {
      if (this.length === 0) {
        return null;
      }

      var ret = this.data[--this.length];

      if (!this._hasAllocator) {
        this.data[this.length] = null;
      }

      return ret;
    },

    slice: function(begin, end) {
      if (end === undefined) {
        end = this.length;
      }

      return this.data.slice(begin, end);
    },

    clear: function() {
      if (!this._hasAllocator) {
        for (var i = 0; i < this.length; i++) {
          this.data[i] = null;
        }
      }

      this.length = 0;
    },

    peek: function() {
      if (this.length === 0) {
        return null;
      }

      return this.data[this.length - 1];
    },

    sort: function(compareFunc) {
      HeapSort.sort(this.data, 0, this.length, compareFunc);
      return this;
    }
  });

  return PreallocArray;
});
