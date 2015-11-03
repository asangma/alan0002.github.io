/*jslint browser: true, continue: true, eqeq: true, nomen: true, plusplus: true, regexp: true, unparam: true, sloppy: true, todo: true, vars: true, white: true */
/*global define */
define(
[
  "../../../core/declare",
  "dojo/_base/array",

  "../../../core/Collection"
],
function(
  declare, array,
  Collection
) {

  /**
   * ReferenceMap is a Collection.
   *
   * From the class API, it acts has a collection for the events part,
   * but exposes different methods.
   *
   * Usage:
   *
   *  var col = new ReferencesMap();
   *  col.on("change", function(event) {
   *    console.log(event.kind + " " + event.items[0].id);
   *  });
   *  col.add(tile1, referenceTile11);
   *  // print: add 11
   *  col.add(tile5, referenceTile11);
   *  col.add(tile6, referenceTile11);
   *  col.remove(tile1);
   *  col.remove(tile5);
   *  col.remove(tile6);
   *  // print: remove 11
   */
  var ReferenceMap = declare([Collection], {

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function() {
      this._itemById   = {};
      this._itemToKeys = {};
      this._keyToItem  = {};
    },
        

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    addItem: function(key, item) {
      var keyHash   = this.hash(key),
          itemHash = this.hash(item),
          keyItem = this._keyToItem[keyHash],
          keys = this._itemToKeys[itemHash];
      // get the item reference already in the map.
      item = this._itemById[itemHash] ? this._itemById[itemHash] : item;
      this._keyToItem[keyHash] = item;
      if (!keys) {
        this._itemById[itemHash] = item;
        this._itemToKeys[itemHash] = keys = [];
        this.getInherited(arguments).call(this, item);
      }
      keys.push(keyHash);
    },

    removeItem: function(key) {
      return this.removeItems([key]);
    },

    removeItems: function(keys) {
      if (!keys || !keys.length) {
        return null;
      }
      var i, n,
          key, item,
          itemHash, itemKeys,
          rm = [];
      for (i = keys.length - 1; i >= 0; i--) {
        key  = this.hash(keys[i]);
        item = this.getItem(key);
        if (item) {
          delete this._keyToItem[key];

          itemHash = this.hash(item);
          itemKeys = this._itemToKeys[itemHash];
          itemKeys.splice(array.indexOf(itemKeys, key), 1);
          if (!itemKeys.length) {
            delete this._itemToKeys[itemHash];
            delete this._itemById[itemHash];
            rm.push(item);
          }
        }
      }
      this.getInherited(arguments).call(this, rm);
      return rm;
    },

    getItem: function(key) {
      return this._keyToItem[this.hash(key)];
    },

    contains: function(key) {
      return !!(this.getItem(key));
    },

    hash: function(item) {
      return (item && item.id) ? item.id : item;
    }

  });

  return ReferenceMap;

});
