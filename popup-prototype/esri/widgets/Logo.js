define([
  "./Widget",

  "dijit/_TemplatedMixin",
  "dijit/a11yclick",

  "dojo/dom-class",

  "dojo/text!./Logo/templates/Logo.html"
],
function(
  Widget,
  TemplatedMixin, a11yclick,
  domClass,
  logoTemplate
) {

  return Widget.createSubclass([TemplatedMixin], {

    declaredClass: "esri.widgets.Logo",

    baseClass: "esri-logo",

    templateString: logoTemplate,

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    postCreate: function() {
      this.inherited(arguments);

      this.on(a11yclick, function() {
        window.open(this._link, "_blank");
      }.bind(this));
    },

    //--------------------------------------------------------------------------
    //
    //  Variables
    //
    //--------------------------------------------------------------------------

    _link: "http://www.esri.com",

    //--------------------------------------------------------------------------
    //
    //  Public Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  size
    //----------------------------------

    size: "medium",

    _setSizeAttr: function(size) {
      if (size !== "medium" && size !== "small") {
        return;
      }

      domClass.toggle(this.domNode, "is-small", size === "small");

      this._set("size", size);
    }

  });

});
