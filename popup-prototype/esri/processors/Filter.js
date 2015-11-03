/**
 * A Filter performs one small unit of work. It has an input Collection and an output Collection.
 * The work is performed using information from the input Collection and modifies the output Collection.
 * Filters can be chained together using {@link module:esri/processors/Pipeline|Pipelines}.
 * New filters can be created by extending this class and implementing the `run()` method.
 * @module esri/processors/Filter
 */
define([
  "../core/declare",

  "esri/core/Accessor",
  "esri/core/Collection"
],
function(
  declare,
  Accessor, Collection
){

  /**
   * @extends module:esri/core/Accessor
   * @constructor module:esri/processors/Filter
   * @param {Object=} properties An object with configuration properties for the Filter
   */
  var Filter = declare([Accessor], {

    declaredClass: "esri.processors.Filter",

    //--------------------------------------------------------------------------
    //
    //  Variables
    //
    //--------------------------------------------------------------------------

    /**
     * handler for input collection changes
     *
     * @private
     */
    _changeHandler: null,


    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  input
    //----------------------------------

    /**
     * The input collection.
     * @type {module:esri/core/Collection}
     */
    input: null,

    _inputSetter: function(value, oldValue){
      if (Array.isArray(value)) {
        value = new Collection(value);
      }

      if (this._changeHandler){
        //clear change handler
        this._changeHandler.remove();
        this._changeHandler = null;
      }
      
      if(value && value.isInstanceOf(Collection)){
        //bind the change event to the filter's run method
        this._changeHandler = value.on("change", this.run.bind(this));
      }
      else if (!value) {
        return null;
      }
      else {
        return oldValue;
      }
    },

    //----------------------------------
    //  output
    //----------------------------------

    /**
     * The output collection. This must be set. It is not created by default.
     * @type {module:esri/core/Collection}
     */
    output: null,
    

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    /**
     * The process that updates the output Collection.
     * This must be implemented by modules extending Filter. By default,
     * objects are passed through; added and removed objects are applied
     * to the output Collection.
     * @param {Object} changes Has an `added` and `removed` property. See {module:esri/coreCollection|Collection}
     *   for more information.
     */
    run: function(changes){
      if(!this.output){
        return;
      }
      //console.log("Filter run. changes: ", changes);
      if(changes.added.length){
        this.output.addItems(changes.added);
      }
      if(changes.removed.length){
        this.output.removeItems(changes.removed);
      }
    }
  });
  return Filter;
});
