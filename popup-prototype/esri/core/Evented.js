/**
 *  @see [Evented](http://dojotoolkit.org/reference-guide/dojo/Evented.html)
 *  @private
 */
define( [
  "./declare",

  "dojo/Evented"
],
function(
  declare,
  Evented
) {

  return declare(Evented, {

    declaredClass: "esri.Evented",

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    hasEventListener: function hasEventListener(type) {
      type = "on" + type;
      return !!(this[type] && this[type].after);
    },

    //--------------------------------------------------------------------------
    //
    //  Overridden methods
    //
    //--------------------------------------------------------------------------

    emit: function(type, event) {
      if (!this.hasEventListener(type)) {
        return;
      }

      event = event || {};

      if (!event.target) {
        event.target = this;
      }

      return this.inherited(arguments, [type, event]);
    }

  });
});
