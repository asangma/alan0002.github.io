/**
 * The base class for widgets.
 * 
 * @module esri/widgets/Widget
 * @noconstructor
 * @since 4.0
 */
define([
  "dijit/_WidgetBase",

  "dojo/dom-class"
],
function(
  _WidgetBase,
  domClass
) {

  var css = {
    hidden: "esri-hidden"
  };

  /**
   * @constructor module:esri/widgets/Widget
   */
  return _WidgetBase.createSubclass(
    /** @lends module:esri/widgets/Widget.prototype */
    {

      declaredClass: "esri.widgets.Widget",

      //--------------------------------------------------------------------------
      //
      //  Public Properties
      //
      //--------------------------------------------------------------------------

      //----------------------------------
      //  visible
      //----------------------------------

      /**
      * Indicates whether the widget is visible.
      *
      * @type {boolean}
      * @default
      */
      visible: true,

      _setVisibleAttr: function(value) {
        this._set("visible", value);
        domClass.toggle(this.domNode, css.hidden, !value);
      }
        
      //--------------------------------------------------------------------------
      //
      //  Public Methods
      //
      //--------------------------------------------------------------------------
        
      //----------------------------------
      //  destroy
      //---------------------------------- 
        
      /**
      * Destroys the widget instance. Call this method when the widget is no longer
      * needed by the application.
      *
      * @method destroy
      * @instance
      *                  
      * @example
      * widget.destroy();
      */    

      //----------------------------------
      //  set
      //---------------------------------- 
        
      /**
      * Sets any property of this class (that's not read only) to a new value.
      *
      * @method set
      * @instance
      * 
      * @param {string} name - The name of the property to set.
      * @param {*} value - The value to set in the property identified in `name`.  
      *                  
      * @example
      * //Sets the visibility of the widget to false so it
      * //is no longer visible in the View
      * widget.set("visible", false);
      */ 
        
      //----------------------------------
      //  startup
      //----------------------------------     
        
      /**
      * Finalizes the creation of the widget. Call this method when the widget is
      * ready for use in the application.
      *
      * @method startup
      * @instance
      *                  
      * @example
      * widget.startup();
      */     

    });
});
