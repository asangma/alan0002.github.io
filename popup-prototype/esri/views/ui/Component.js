define([
  "../../core/Accessor",

  "dojo/dom",
  "dojo/dom-class"
  ],
function(
  Accessor,
  dom, domClass
) {

  return Accessor.createSubclass({

    declaredClass: "esri.views.ui.Component",

    /**
     * Hash of CSS classes used by this widget
     * @type {Object}
     * @private
     */
    css: {
      component: "esri-component"
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    destroy: function () {
      if (this._widget) {
        this._widget.destroy();
        return;
      }

      this.node = null;
    },

    //--------------------------------------------------------------------------
    //
    //  Private Properties
    //
    //--------------------------------------------------------------------------

    /**
     * The associated node's widget.
     * @type {_WidgetBase}
     * @private
     */
    _widget: null,  // TODO: find a better way to expose the associated widget

    //--------------------------------------------------------------------------
    //
    //  Public Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  node
    //----------------------------------

    /**
     * The component's node.
     * @param node {(HTMLElement|_WidgetBase)}
     * @private
     */
    node: null,

    _nodeSetter: function(node, oldNode) {
      if (node === oldNode) {
        return node;
      }

      this._widget = null;

      if (node) {
        var isWidget = !!node.domNode;

        this._widget = isWidget ? node : null;

        node = node.domNode || dom.byId(node);
        domClass.add(node, this.css.component);
      }

      if (oldNode) {
        domClass.remove(oldNode, this.css.component);
      }

      return node;
    }

  });
});
