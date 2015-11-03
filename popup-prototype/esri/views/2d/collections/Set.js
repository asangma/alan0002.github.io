define(
[
  "../../../core/declare",

  "../../../core/Collection"
],
function(
  declare,
  Collection
) {

  /**
   * Set has a Collection with unique items.
   *
   * Usage:
   *
   *  var col = new Set();
   *  col.on("change", function(event) {
   *    console.log(event.kind + " " + event.items[0].id);
   *  });
   *  col.add(tile1);
   *  col.add(tile1);
   *  col.add(tile1);
   *  console.log(col.get("length"));
   *  // print: 1
   */
  var Set = declare([Collection], {

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function() {
      this._index = {};
    },

    //--------------------------------------------------------------------------
    //
    //  Public methods
    //
    //--------------------------------------------------------------------------

    addItem: function(item) {
      if (!this.contains(item)) {
        var itemHash = this.hash(item);
        this._index[itemHash] = item;
        this.inherited(arguments);
      }
    },

    addItems: function(items) {
      var i, n,
          item, itemHash;
      for (i = items.length - 1; i >= 0; i--) {
        item = items[i];
        itemHash = this.hash(item);
        if (this.contains(itemHash)) {
          items.splice(i, 1);
        }
        else {
          this._index[itemHash] = item;
        }
      }
      return this.getInherited(arguments).call(this, items);
    },

    removeItem: function(item) {
      var itemHash = this.hash(item);
      if (this.contains(itemHash)) {
        item = this.getItem(itemHash);
        delete this._index[itemHash];
        this.getInherited(arguments).call(this, item);
      }
      else {
        item = null;
      }
      return item;
    },

    removeItems: function(items) {
      if (!items || !items.length) {
        return null;
      }
      var i, n,
          itemHash;
      items = items.slice(0);
      for (i = items.length - 1; i >= 0; i--) {
        itemHash = this.hash(items[i]);
        if (!this.contains(itemHash)) {
          items.splice(i, 1);
        }
        else {
          items[i] = this.getItem(itemHash);
          delete this._index[itemHash];
        }
      }
      return this.getInherited(arguments).call(this, items);
    },

    getItem: function(item /* hash or item */) {
      return this._index[this.hash(item)];
    },

    contains: function(item) {
      return !!(this.getItem(item));
    },

    clear: function() {
      this._index = {};
      this.inherited(arguments);
    },

    keys: function() {
      // TODO perfs: cache the keys?
      var index = this._index,
          keys = [];
      for (var key in index) {
        if (index.hasOwnProperty(key)) {
          keys.push(key);
        }
      }
      return keys;
    },

    hash: function(item) {
      return (item && item.id) ? item.id : item;
    }

  });

  return Set;

});
