/**
 * A Filter that adds a parent property to each item in the input collection
 */
define([
  "../../core/declare",
  "dojo/_base/array",
  "dojo/_base/lang",

  "esri/processors/Filter"
], function(declare, array, lang,
            Filter){
  /**
   * extends module:esri/processors/Filter
   * constructor esri/processors/filters/TrackFilter
   * @param {Object|string} properties The trackIdField used to group items into tracks is required.
   * It can be in an object or a string.
   */
  var TrackFilter = declare([Filter], {

    //------------------------------
    //
    // Lifecycle
    //
    //------------------------------

    declaredClass: "esri.processors.filters.TrackFilter",

    //the only required argument is a trackIdField name. It might be passed in as a string
    normalizeCtorArgs: function(properties){
      if(typeof properties === "string"){
        properties = {
          trackIdField: properties
        };
      }
      return properties;
    },

    getDefaults: function(){
      return lang.mixin(this.inherited(arguments), {
        idField: "id",
        parentField: "parent"
      });
    },

    //------------------------------
    //
    // Properties
    //
    //------------------------------

    /**
     * The name of the field containing the value used to group items into tracks
     * @type {string}
     */
    trackIdField: null,

    /**
     * The name of the field containing the unique id of the item. Default is `id`
     * @type {string}
     */
    idField: null,

    /**
     * The name of the field containing the parent id attribute of the item. Default is `parent`
     * @type {string}
     */
    parentField: null,

    //------------------------------
    //
    // Public Methods
    //
    //------------------------------

    /**
     * Adds trackId value to all added items
     * @param {Object} changes Has an `added` and `removed` property.
     */
    run: function(changes){
      if(!this.trackIdField || !changes){
        return;
      }
      var removed = changes.removed || [],
        added = changes.added || [],
        item,
        itemInfo,
        i, n;

      //Remove items from output collection.
      if(removed.length){
        //console.log("removed: ", removed);
        for(i = 0, n = removed.length; i < n; i++){
          item = removed[i];
          itemInfo = this._removeItemFromOutput(item, this.idField);
          //console.log("itemInfo: ", itemInfo);
        }
      }

      //Add the trackId value to the item so it can be used for grouping. Add item to output collection
      if(added.length){
        //console.log("added: ", added);
        for(i = 0, n = added.length; i < n; i++){
          item = added[i];
          item[this.parentField] = item.attributes[this.trackIdField];
          //console.log("added: ", item);
        }
        this.output.addItems(added);
      }
      //console.log("output: ", this.output);
    },

    //------------------------------
    //
    // Private Methods
    //
    //------------------------------

    /**
     *
     * @param {Object} item Collection item to get index of
     * @param {string} idField The name of the field that contains the id
     * @param {Collection} collection The collection to search
     * @returns {Object}
     * @private
     */
    _getIndexOfItem: function(item, idField, collection){
      var id = item[idField],
        findFunction = function(collectionItem){
          return collectionItem[idField] === id;
        },
        index = collection.findIndex(findFunction, this);
      return index;

    },

    /**
     * Removes an item from the output collection using the idField.
     * @param {Object} item The collection item to get the index for
     * @param {string} idField The name of the field that contains the id
     * @returns {Object} An object.
     * ```
     * {
     *  index: index of item in output collection,
     *  id: value of item's idField,
     *  parent: parent of the item
     * }
     * ```
     * @private
     */
    _removeItemFromOutput: function(item, idField){
      var id = item[idField],
        index;

      index = this._getIndexOfItem(item, idField, this.output);
      if(index !== -1){
        this.output.removeItemAt(index);
      }
      return {
        index: index,
        id: id,
        parent: item[this.parentField]
      };
    },

    /**
     *
     * @param {string|number} parent parent Id
     * @returns {Collection}
     * @private
     */
    _getItemsByParent: function(parent, collection){
      var filterFunction = function(collectionItem){
          return collectionItem[this.parentField] === parent;
        },
        items;

      items = collection.filter(filterFunction, this);
      return items;
    },

    /**
     * Makes array of trackIds affected by the collection changes
     * @param changes The changes made to a Collection.
     * @returns {Array}
     * @private
     */
    _getTracksAffectedByChanges: function(changes){
      changes = changes || {};

      var removed = changes.removed || [],
        added = changes.added || [],
        item,
        affectedTracks = [];

      //concatenate adds and deletes so can loop once to see what tracks affected
      added = added.concat(removed);

      //loop and get tracks affected.
      if(added.length){
        for(var i = 0, n = added.length; i < n; i++){
          item = added[i];
          if(array.indexOf(affectedTracks, item[this.parentField]) === -1){
            affectedTracks.push(item[this.parentField]);
          }
        }
      }
      return affectedTracks;
    }
  });
  return TrackFilter;
});
