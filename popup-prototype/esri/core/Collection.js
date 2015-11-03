/**
 * Collection is a generic object that stores an array of items of the same type.
 * It provides useful utility methods for working with items in the Collection, including
 * [filter()](#filter), [find()](#find), and [reduce()](#reduce). 
 * 
 * A Collection can be of any type. For example, {@link module:esri/layers/GraphicsLayer#graphics GraphicsLayer.graphics}
 * is a collection of graphics that are stored in the GraphicsLayer. You can use the methods found in the Collection class 
 * to add, remove, re-order, or manipulate graphics in a GraphicsLayer.
 * 
 * Another example of a Collection is {@link module:esri/Map#layers Map.layers}, which is a Collection of operational layers included in
 * the {@link module:esri/Map Map}.
 * 
 * ```js
 * //Removes a layer from the map using Collection.removeItem();
 * map.layers.removeItem(layer);
 * ```
 * 
 * The [change event](#event:change) fires each time an item is [added](#addItem), [moved](#moveItem), or [removed](#removeItem) from the Collection.
 * 
 * @module esri/core/Collection
 * @since 4.0
 * @see module:esri/layers/GraphicsLayer#graphics
 * @see module:esri/Map#layers
 */

/**
 * Fires after an item has been [added](#addItem), [moved](#moveItem), or [removed](#removeItem) from the Collection. Only 
 * the following methods will trigger this event: [addItem()](#addItem), [addItems()](#addItems), [clear()](#clear), 
 * [moveItem()](#moveItem), [removeItem()](#removeItem), [removeItemAt()](#removeItemAt), and [removeItems()](#removeItems). 
 * Using methods of other classes that affect collections will **not** cause this event to fire, such as 
 * {@link module:esri/Map#add Map.add()}, {@link module:esri/Map#remove Map.remove()}, {@link module:esri/Map#reorder Map.reorder()}.
 * Only methods from {@link module:esri/core/Collection}, trigger this event.
 * 
 * For example, `map.layers.addItem(newLyr)` will cause this event to fire. But `map.add(newLyr)`, which uses {@link module:esri/Map#add Map.add()}
 * to add a new layer to the `map.layers` collection, will not because {@link module:esri/Map#add Map.add()} is a method of 
 * {@link module:esri/Map}, not {@link module:esri/core/Collection}.
 *
 * @event module:esri/core/Collection#change
 * @property {Array<*>} added - An array of items added to the collection using either [addItem()](#addItem) or [addItems()](#addItems).
 * @property {Array<*>} moved - An array of items that moved in the collection using [moveItem()](#moveItem).
 * @property {Array<*>} removed - An array of items removed from the collection using either [removeItem()](#removeItem), 
 * [removeItems()](#removeItems), [removeItemAt()](#removeItemAt), or [clear()](#clear).
 * 
 * @example 
 * //This function will fire each time a layer is either added,
 * //moved, or removed from the map.layers Collection
 * map.layers.on("change", function(evt){
 *   var newLayers = evt.added; //an array of layers added to the map.layers Collection
 *   var reorderedLayers = evt.moved;  //an array of layers moved in the Collection
 *   var removedLayers = evt.removed;  //an array of layers removed from map
 * });
 */

define(
[
  "./declare",

  "dojo/on",
  "dojo/aspect",

  "./ArrayPool",
  "./Accessor",
  "./Evented",
  "./Scheduler"
],
function(
  declare,
  on, aspect,
  ArrayPool, Accessor, Evented, Scheduler
) {
  
  var noop = function() {};

  var after = aspect.after;

  var idCounter = 0;

  /**
   * @extends module:esri/core/Accessor
   * @constructor module:esri/core/Collection
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var Collection = declare([Accessor, Evented],
  /** @lends module:esri/core/Collection.prototype */
  {

    //--------------------------------------------------------------------------
    //
    //  LifeCycle
    //
    //--------------------------------------------------------------------------

    constructor: function() {
      this.id = (new Date().getTime()).toString(16) + "-collection" + (idCounter++);
      
      this._chgListeners = [];
      this._notification = null;
      this._timer = null;
      this._items = [];
      this._dispatchColChange = this._dispatchColChange.bind(this);
    },

    normalizeCtorArgs: function(items) {
      if (!items) {
        return {};
      }
      if (Array.isArray(items) || (items.isInstanceOf && items.isInstanceOf(Collection))) {
        return {
          items: items
        };
      }
      return items;
    },

    
    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    onchange: null,

    //----------------------------------
    //  length
    //----------------------------------

    /**
    * The number of items in the Collection.
    *
    * @type {number}
    */
    length: 0,
    
    //----------------------------------
    //  items
    //----------------------------------

    _itemsGetter: function() {
      return this._items.concat();
    },
      
    _itemsSetter: function(value) {
      if (value) {
        if (value.isInstanceOf && value.isInstanceOf(Collection)) {
          value = value.getAll();
        }
        else if (Array.isArray(value)) {
          value = value.slice();
        }
        else {
          value = [];
        }
      }
      this._splice(0, this.length, value);
      return this._items;
    },


    //--------------------------------------------------------------------------
    //
    //  Overridden Methods
    //
    //--------------------------------------------------------------------------

    /*
     * We override Evented to support asynchronous emitting.
     * The use case where straight Evented doesn't work:
     *   
     *   var col = new Collection();
     *   col.addItem({});
     *   col.on("change", function() {
     *     // we shouldn't receive an event for the items
     *     // that has just been added, since we add the listener
     *     // after the modification.
     *   });
     */
    on: function(type, listener){
      return on.parse(this, type, listener, function(target, type){
        if (type === "change") {
          var callbackObject = {
                removed: false,
                callback: listener
              };
          target._chgListeners.push(callbackObject);
          return {
            remove: function () {
              this.remove = noop;
              // remove from in-flight notifications
              callbackObject.removed = true;
              // remove from future notifications
              target._chgListeners.splice(target._chgListeners.indexOf(callbackObject), 1);
            }
          };
        }
        return after(target, "on" + type, listener, true);
      });
    },

    hasEventListener: function hasEventListener(type) {
      if (type === "change") {
        return this._chgListeners.length > 0;
      }
      return this.inherited(arguments);
    },
    
    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    /**
     * Adds a single item to the collection. The [change event](#events) is fired after an item is added to the Collection.
     *
     * @param {*} item - The item to add.
     * @param {number=} index - Zero-based index of where in the collection to add the item. 
     *                        If not specified, the items will be added at the end.
     *                        
     * @example
     * var gpc = new Graphic();  //creates a new graphic
     * var layer = new GraphicsLayer(); //creates a new graphics layer
     * layer.graphics.addItem(gpc);  //adds graphic to layer's graphics collection
     */
    addItem: function(item, index) {
      index = this.getNextIndex(index);
      this._splice(index, 0, [item]);
    },

    /**
     * Adds multiple items to the collection. The [change event](#events) is fired after items are added to the Collection.
     *
     * @param {Array<*>} items - An array of items to add.
     * @param {number=} index - Zero-based index of where in the collection to add the items. 
     *                        If not specified, the items will be added at the end.
     *
     * @example
     * //creates two new graphics
     * var gpc1 = new Graphic();
     * var gpc2 = new Graphic();
     * 
     * var layer = new GraphicsLayer(); //creates a new graphics layer
     * 
     * //adds both graphics to layer's graphics collection
     * layer.graphics.addItems([gpc1, gpc2]);
     */
    addItems: function(items, index) {
      if (items && items.getAll) {
        items = items.getAll();
      }
      index = this.getNextIndex(index);
      this._splice(index, 0, items);
    },

    /**
     * Removes all items in the collection.
     * 
     * @example
     * //Removes all layers from the map
     * map.layers.clear();
     */
    clear: function() {
      return this._splice(0, this.length);
    },

    /**
     * Creates a shallow clone of the Collection.
     * 
     * @return {module:esri/core/Collection} A copy of the Collection that invoked this method.
     * @example
     * //elevationLyrs is a clone of the map's elevation layers
     * var elevationLyrs = map.basemap.elevationLayers.clone();
     */
    clone: function() {
      return new Collection({
        items: this._items
      });
    },

    /**
     * @private
     */
    drain: function(callback, thisArg) {
      var items = this.clear(),
          i, n;
      for (i = 0, n = items.length; i < n; i++) {
        callback.call(thisArg, items[i]);
      }
    },

    /**
     * Filters the Collection's items based on a test defined by the
     * `callback` function. Each item is passed into the `callback` function, which
     *  returns `true` if the item passes the test and `false` if it does not.
     * 
     * @param {function} callback - The function that defines a test for determining
     *                            whether to return the item in a new array or ignore it.
     *                            
     * @return {module:esri/core/Collection} Returns a new Collection containing the items that passed the filter test.
     * @see [Array.prototype.filter()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter)
     * 
     * @example
     * //filteredLayers is a Collection of all the non-visible layers in the map
     * var filteredLayers = map.layers.filter(function(lyr){
     *   if(lyr.visible === false){
     *     return lyr;
     *   }
     * });
     */
    filter: function(callback, thisArg) {
      return new Collection({
        items: this._items.filter(callback, thisArg)
      });
    },

    /**
     * Returns an item in the Collection if that item passes a test as 
     * defined in the `callback` function. Each item is passed into the 
     * `callback` function, which
     * returns `true` if the item passes the test and `false` if it does not.
     * 
     * @param {function} callback - The testing function that will assess each
     *                            item in the Collection. Returns `true` if an item
     *                            passes the test and `false` if it fails.
     *                            
     * @return {*} The item in the Collection that satsifies the test function.       
     * @see [Array.prototype.find()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find)   
     * 
     * @example
     * //If the id of a map layer is already known, get the layer that matches the id
     * var myLayer = map.layers.find(function(lyr){
     *   if(lyr.id === "speciesLyr01"){
     *     return lyr;
     *   } else {
     *     console.log("layer with ID 'speciesLyr01' not found");
     *   }
     * });
     * //myLayer references the layer in map with ID "speciesLyr01"
     */
    find: function(callback, thisArg) {
      if (typeof callback !== "function") {
        throw new TypeError(callback + " is not a function");
      }
      var items = this._items,
          length = this.length,
          value, i;
      for (i = 0; i < length; i++) {
        value = items[i];
        if (callback.call(thisArg, value, i, items)) {
          return value;
        }
      }
      return undefined;
    },

    /**
     * Returns the index of an item in the Collection if that item passes a test as 
     * defined in the `callback` function. Each item is passed into the `callback` function, which
     * returns `true` if the item passes the test and `false` if it does not.
     * 
     * @param {function} callback - The testing function that will assess each
     *                            item in the Collection. Returns `true` if an item
     *                            passes the test and `false` if it fails.
     *                            
     * @return {number} Returns the index of the Collection item that satsifies the test function. 
     *             If an item fails the test, `-1` is returned.
     *             
     * @see [Array.prototype.findIndex()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex)
     * 
     * @example 
     * //gpcIndex is assigned the index of the first graphic whose name
     * //property is 'Redlands'. This result can be used in getItemAt()
     * var gpcIndex = graphicsLyr.graphics.findIndex(function(item){
     *   if(item.attributes.name === "Redlands"){
     *     return true;
     *   }
     * });
     */
    findIndex: function(callback, thisArg) {
      if (typeof callback !== "function") {
        throw new TypeError(callback + " is not a function");
      }
      var items = this._items,
          length = this.length,
          value, i;
      for (i = 0; i < length; i++) {
        value = items[i];
        if (callback.call(thisArg, value, i, items)) {
          return i;
        }
      }
      return -1;
    },

    /**
     * Executes the input function for each item in the Collection.
     * 
     * @param   {function} callback - The function to call for each item in the Collection.
     * @see [Array.prototype.forEach()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach)   
     * 
     * @example 
     * graphicsLayer.graphics.forEach(function(item, i){
     *   //do something here to each graphic like calculate area of it's geometry
     *   calculateArea(item.geometry);
     * });
     */
    forEach: function(callback, thisArg) {
      return this._items.forEach(callback, thisArg);
    },

    /**
     * Returns a shallow copy of the items in the Collection as a new array object.
     * 
     * @return {Array<*>} An array containing the Collection's items.
     *                     
     * @example 
     * //creates an array populated with the map's layers
     * var mapLyrsArray = map.layers.getAll();
     */
    getAll: function() {
      return this._items.slice();
    },

    /**
     * Returns the item at the specified index.
     *
     * @param {number} index - Zero-based index of the item in the Collection to retrieve.
     *                       
     * @return {*} The item in the Collection stored at the specifed index.     
     *             
     * @example 
     * //assigns the elevation layer at index 0 to elevLyr
     * var elevLyr = map.basemap.elevationLayers.getItemAt(0);
     */
    getItemAt: function(index) {
      // TODO throw errors?
      return this._items[index];
    },

    /**
     * @private
     */
    getNextIndex: function(index) {
      // Returns the index at which the next item will be added.
      var length = this.length;
      index = (index == null) ? length : index;
      if (index < 0) {
        index = 0;
      }
      else if (index > length) {
        index = length;
      }
      return index;
    },

    /**
     * Returns the index of an element in the collection.
     *
     * @param {*} searchItem - Item to search for in the collection.
     * @param {number=} fromIndex - Use if you don't want to search the whole
     *                                collection, or you don't want to search from the start.
     *
     * @return {number} The location of the first match found in the collection, or -1 if
     *                  there is no match.
     *
     * @see [Array.prototype.indexOf()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf)
     * 
     * @example 
     * //index is the index of the first graphic in the 
     * //graphics layer that matches the input graphic
     * var index = graphicsLayer.graphics.indexOf(graphic);
     */
    indexOf: function(item, fromIndex) {
      return this._items.indexOf(item, fromIndex);
    },

    /**
     * Passes each Collection item into the `callback` function and returns a new array of the
     * returned values. For example, if you have a Collection of numbers and would like to add each number
     * by 10, you can use `map()` to create a new Collection with the same numbers incremented by 10.
     *
     * @param {function} callback - The function that processes each item in the Collection and
     *                            returns a new value at the same index of the original item.
     *
     * @return {module:esri/core/Collection} Returns a new collection containing the new items generated from 
     *                                       the `callback`.
     *
     * @see [Array.prototype.map()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map)
     * 
     * @example 
     * //gets the geometries of the graphics and assigns them to a new Collection
     * var geoms = graphicsLayer.graphics.map(function(item, i){
     *   return item.geometry;
     * });
     */
    map: function(callback, thisArg) {
      return new Collection({
        items: this._items.map(callback, thisArg)
      });
    },

    /**
     * Moves an item in the Collection to a specified index. The [change event](#events) is fired after an item is moved in the Collection.
     * 
     * @param {*} item - The item to move.
     * @param {number} index - The index to move the item to. 
     *                       
     * @example 
     * //get the first two layers in a map
     * var lyr1 = map.layers.getItemAt(0);
     * var lyr2 = map.layers.getItemAt(1);
     * 
     * //moves the second layer to the first position in the map.layers Collection
     * //effectively swapping the positions of lyr1 and lyr2
     * map.layers.moveItem(lyr2, 0);
     */
    moveItem: function(item, index) {
      var oldIndex  = this.indexOf(item),
          lastIndex = this._items.length - 1;

      // Make sure the given item exists.
      if (oldIndex === -1) {
        return;
      }

      // Almost the same code as getNextIndex()
      // But we take in account that the items array
      // will be spliced in lastIndex.
      index = (index == null) ? lastIndex : index;
      if (index < 0) {
        index = 0;
      }
      else if (index > lastIndex) {
        index = lastIndex;
      }

      if (oldIndex !== index) {
        this._splice(oldIndex, 1);
        this._splice(index, 0, [item]);
      }
    },

    /**
     * Reduces all items in the collection (from left to right) into a single variable using `callback`. 
     *
     * @param {function} callback - The function that processes each item in the Collection and
     *                            appends it to the previous item. This function has three input parameters:
     *                            `previousValue`, `currentValue`, and `index`.
     * @param {*=} initialValue - Item to use as the first element to process in `callback`.                            
     *
     * @return {*} Returns the value representing the reduction of the Collection's items.
     *
     * @see [Array.prototype.reduce()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce)
     * @see {@link module:esri/core/Collection#reduceRight}
     */
    reduce: function(callback, initialValue) {
      return this._items.reduce(callback, initialValue);
    },

    /**
     * Reduces all items in the collection (from right to left) into a single variable using `callback`. 
     *
     * @param {function} callback - The function that processes each item in the Collection and
     *                            appends it to the previous item.
     * @param {*=} initialValue - Item to use as the first element to process in `callback`.                            
     *
     * @return {*} Returns the value representing the reduction of the Collection's items.
     *
     * @see [Array.prototype.reduceRight()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/ReduceRight)
     * @see {@link module:esri/core/Collection#reduce}
     */
    reduceRight: function(callback, initialValue) {
      return this._items.reduceRight(callback, initialValue);
    },

    /**
     * Removes an item from the collection. The [change event](#events) is fired after an item is removed from the Collection.
     *
     * @param {*} item - The item to remove.
     *                 
     * @example 
     * var lyr = map.layers.getItemAt(4);
     * //removes the fifth layer from the map
     * map.layers.removeItem(lyr);
     */
    removeItem: function(item) {
      var index = this.indexOf(item);
      return this.removeItemAt(index);
    },

    /**
     * Removes an item from the collection at a specified index. The [change event](#events) is fired after an item is removed from the Collection.
     *
     * @param {number} index - The index of the item to remove.
     *                       
     * @example 
     * //removes the layer at index 4 of the map
     * map.layers.removeItemAt(4);
     */
    removeItemAt: function(index) {
      if (index >= 0 && index < this.length) {
        return this._splice(index, 1)[0];
      }
    },
    
    /**
     * Removes each item in the input array.
     * If an item is present multiple times in the collection, only the first occurance is removed. The 
     * [change event](#events) is fired after an item is removed from the Collection.
     *
     * @param {Array<*>} items - The items to remove.
     *                         
     * @example 
     * var refLayers = [refLyr1, refLyr2, refLyr3];
     * //removes the reference layers in the refLayers
     * //array from the basemap's referenceLayers
     * map.basemap.referenceLayers.removeItems(refLayers);
     */
    removeItems: function(items) {
      if (!items || !items.length) {
        return items;
      }
      if (items && items.getAll) {
        items = items.getAll();
      }
      var _items = this._items,
          removed = [], i, n, idx,
          item;

      for (i = 0, n = items.length; i < n; i++) {
        item = items[i];
        idx = _items.indexOf(item);
        if (idx > -1) {
          removed.push(this._splice(idx, 1)[0]);
        }
      }
      return removed;
    },
    
    /**
     * Determines whether an item in the Collection passes a test defined by `callback`. Each item
     * in the Collection is passed into the callback until one returns a value of `true`.
     *
     * @param {function} callback - The function that defines the test for each Collection item.
     *
     * @return {boolean} Returns `true` if any of the items in the Collection pass the test defined in `callback`.
     *                   Returns `false` if all items fail the test.
     *
     * @see [Array.prototype.some()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some)
     * 
     * @example
     * //If at least one of the point graphics has a geometry whose
     * //elevation is above 1000m, then passes will have a value of true.
     * //Otherwise, it will be false.
     * var passes = graphicsLayer.graphics.some(function(item, i){
     *   if(item.geometry.z > 1000){
     *     return true;
     *   }
     * });
     */
    some: function(callback, thisArg) {
      return this._items.some(callback, thisArg);
    },
    
    //--------------------------------------------------------------------------
    //
    //  Private functions
    //
    //--------------------------------------------------------------------------

    /*
     * return the first range of consecutive values in an array.
     * @return an Array of 2 values. 1st value is the index, 2nd the count of consecutive values.
     * @usage
     *   var fn = function(a,b) {return b - a === 1};
     *   console.log(_getRange([2,3,4,5,10,18,19,20]), fn)    // [0, 4]
     *   console.log(_getRange([2,3,4,5,10,18,19,20]), fn, 4) // [4, 1]
     *   console.log(_getRange([2,3,4,5,10,18,19,20]), fn, 5) // [5, 3]
     *   console.log(_getRange([2,3,4,5,10,18,19,20]), fn, 8) // null
     
     //
     yann6817: not needed currently with the event format we have.
               I keep it around, just in case. Used in removeItems:

        var invSortFn = function invSortFn(a, b) {
          return b - a;
        },
        invCompareFn = function invCompareFn(a, b) {
          return a - b === 1;
        };
               
        // [2, 3, 4, 5, 10, 18, 19, 20]
        indexes.sort(invSortFn);
        // [20, 19, 18, 10, 5, 4, 3, 2]

        // Remove items by group of consecutive indexes.
        i = 0;
        removed = [];
        // 1st iter: range = [0,3]
        // 2nd iter: range = [3,1]
        // 3rd iter: range = [4,4]
        while(!!(range = this._getRange(indexes, invCompareFn, i))) {
          // 1st: _splice(18,3)
          // 2nd: _splice(10,1)
          // 3rd: _splice(2,4)
          removed = removed.concat(this._splice(indexes[range[0]+range[1]-1], range[1]));
          i += range[1];
        }
     //

    _getRange: function(arr, compareFn, fromIndex) {
      var idxStart, idxEnd,
          i;
      fromIndex = fromIndex == null ? 0 : fromIndex;
      if (fromIndex >= arr.length) {
        return null;
      }
      idxStart = idxEnd = i = fromIndex;      
      while (compareFn(arr[i], arr[i + 1])) {
        idxEnd = i + 1;
        i++;
      }
      return idxStart == idxEnd ? [idxStart, 1] : [idxStart, idxEnd - idxStart + 1];
    },

    */

    _splice: function(start, deleteCount, items) {
      var oldLength = this.length,
          notify = this.hasEventListener("change"),
          removed;

      if (notify && !this._notification) {
        this._notification = {
          listeners: this._chgListeners.slice(),
          items: this._items.slice(),
          changes: []
        };
        if (!this._timer) {
          this._timer = Scheduler.schedule(this._dispatchColChange);
        }
      }

      // apply removal
      if (deleteCount) {
        removed = this._items.splice(start, deleteCount);
        this._notifyColChange(null, removed);
      }

      // apply add
      if (items && items.length) {
        Array.prototype.splice.apply(this._items, [start, 0].concat(items));
        this._notifyColChange(items, null);
      }
      this.length = this._items.length;
      return removed || [];
    },

    _notifyColChange: function(added, removed) {
      var notify  = this.hasEventListener("change");

      if (!notify) {
        return;
      }
      this._notification.changes.push({
        added: added,
        removed: removed
      });
    },

    _dispatchColChange: function() {
      if (this._timer) {
        this._timer.remove();
        this._timer = null;
      }
      if (!this._notification) {
        return;
      }
      var notification = this._notification,
          oldItems = notification.items,
          changes = notification.changes,
          added = ArrayPool.get(), removed = ArrayPool.get(), moved = ArrayPool.get(),
          i, n, j,
          change, items,
          idx,
          listener;

      this._notification = null;
          
      for (i = 0, n = changes.length; i < n; i++) {
        change = changes[i];
        if (change.added) {
          items = change.added;
          if (removed.length > 0) {
            for (j = items.length - 1; j >= 0; j--) {
              // removed then added => moved
              idx = removed.indexOf(items[j]);
              if (idx !== -1) {
                items.splice(j, 1);
                moved.push(removed.splice(idx, 1)[0]);
              }
            }
          }
          added = added.concat(items);
        }
        if (change.removed) {
          items = change.removed;
          if (added.length > 0 || moved.length > 0) {
            for (j = items.length - 1; j >= 0; j--) {

              // added then removed => no op
              idx = added.indexOf(items[j]);
              if (idx !== -1) {
                added.splice(idx, 1);
                items.splice(j, 1);
              }
              else {
                // moved then removed => remove
                idx = moved.indexOf(items[j]);
                if (idx !== -1) {
                  moved.splice(idx, 1);
                }
              }
            }
          }
          removed = removed.concat(items);
        }
      }

      moved = moved.filter(function(item) {
        return oldItems.indexOf(item) !== this._items.indexOf(item);
      }, this);

      if (notification.listeners && (added.length || removed.length || moved.length)) {
        change = {
          target: this,
          added: added,
          removed: removed,
          moved: moved
        };
        for (i = 0, n = notification.listeners.length; i < n; i++) {
          listener = notification.listeners[i];
          // If a callback was removed after the notification was scheduled to
          // start, don't call it
          if (!listener.removed) {
            listener.callback.call(this, change);
          }
        }
      }
      ArrayPool.put(added);
      ArrayPool.put(removed);
      ArrayPool.put(moved);
    }

  });

  Collection.referenceSetter = function(value, cached) {
    if (!cached) {
      return new Collection(value);
    } else {
      cached.clear();
      cached.addItems(value);

      return cached;
    }
  };

  return Collection;
});
