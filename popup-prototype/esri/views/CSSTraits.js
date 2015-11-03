define([
  "../core/Accessor",
  "../core/ArrayPool",
  "../core/HandleRegistry",

  "dojo/_base/lang",

  "dojo/dom-class"
],
function(
  Accessor, ArrayPool, HandleRegistry,
  lang,
  domClass
) {

  var Traits = Accessor.createSubclass({

    classMetadata: {
      properties: {
        width: {},
        orientation: {}
      }
    }

  });

  var SUPPORTED_TRAITS = {

    width: {

      getValue: function(props) {
        var width     = props.viewSize[0],
            maxWidths = props.maxWidths,
            values      = this.values;

        return width <= maxWidths.xsmall ? values.xsmall :
               width <= maxWidths.small ? values.small :
               width <= maxWidths.medium ? values.medium :
               width <= maxWidths.large ? values.large : values.xlarge;
      },

      values: {
        xsmall: "xsmall",
        small: "small",
        medium: "medium",
        large: "large",
        xlarge: "xlarge"
      },

      valueToClassName: {
        xsmall: "esri-view-width-xsmall esri-view-width-smaller-than-small esri-view-width-smaller-than-medium esri-view-width-smaller-than-large esri-view-width-smaller-than-xlarge",
        small: "esri-view-width-small esri-view-width-larger-than-xsmall esri-view-width-smaller-than-medium esri-view-width-smaller-than-large esri-view-width-smaller-than-xlarge",
        medium: "esri-view-width-medium esri-view-width-larger-than-xsmall esri-view-width-larger-than-small esri-view-width-smaller-than-large esri-view-width-smaller-than-xlarge",
        large: "esri-view-width-large esri-view-width-larger-than-xsmall esri-view-width-larger-than-small esri-view-width-larger-than-medium esri-view-width-smaller-than-xlarge",
        xlarge: "esri-view-width-xlarge esri-view-width-larger-than-xsmall esri-view-width-larger-than-small esri-view-width-larger-than-medium esri-view-width-larger-than-large"
      }

    },

    orientation: {

      getValue: function(props) {
        var size   = props.viewSize,
            width  = size[0],
            height = size[1],
            values   = this.values;

        return height >= width ?
               values.portrait :
               values.landscape;
      },

      values: {
        portrait: "portrait",
        landscape: "landscape"
      },

      valueToClassName: {
        portrait: "esri-view-orientation-portrait",
        landscape: "esri-view-orientation-landscape"
      }

    }
  };

  var DEFAULT_MAX_WIDTHS = {
    xsmall: 544,
    small: 768,
    medium: 992,
    large: 1200
  };

  function hasValidMaxWidths(maxWidths) {
    var mw = maxWidths;

    return mw &&
           mw.xsmall < mw.small &&
           mw.small < mw.medium &&
           mw.medium < mw.large;
  }

  var CSSTraits = Accessor.createSubclass({

    classMetadata: {
      properties: {
        active: {
          type: Traits,
          readOnly: true
        }
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function() {
      this._handles = new HandleRegistry();
    },

    getDefaults: function() {
      return lang.mixin(this.inherited(arguments), {
        maxWidths: DEFAULT_MAX_WIDTHS,
        active: {}
      });
    },

    initialize: function() {
      this._handles.add(this.watch("view.size", this._updateClassNames));
    },

    destroy: function() {
      this._removeActiveClassNames();

      this._handles.destroy();

      this._handles = null;
      this.view = null;
    },

    //--------------------------------------------------------------------------
    //
    //  Public Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  active
    //----------------------------------

    /**
     * Currently active CSS traits
     * @private
     */
    active: null,

    //----------------------------------
    //  enabled
    //----------------------------------

    /**
     * Whether CSS traits are enabled or not.
     * @private
     */
    enabled: true,

    //----------------------------------
    //  maxWidths
    //----------------------------------

    /**
     * Defines the max-widths used for width breakpoints.
     * @type {object}
     * @private
     */
    _maxWidthsSetter: function(value, oldValue) {
      if (value === oldValue) {
        return value;
      }

      var maxWidthsValid = hasValidMaxWidths(value),
          prettyDefaultMaxWidths;

      if (!maxWidthsValid) {
        prettyDefaultMaxWidths = JSON.stringify(DEFAULT_MAX_WIDTHS, null, 2);
        console.warn("provided max widths are not valid, using defaults:" + prettyDefaultMaxWidths);
      }

      value = maxWidthsValid ? value : DEFAULT_MAX_WIDTHS;

      return lang.mixin({}, value);
    },

    //----------------------------------
    //  view
    //----------------------------------

    /**
     * @private
     */
    view: null,

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _updateClassNames: function() {
      if (!this.get("view.container") || !this.enabled) {
        return;
      }

      var active             = this.active,
          classNamesToAdd    = ArrayPool.get(),
          classNamesToRemove = ArrayPool.get(),
          anyPropChanged     = false,
          name,
          prevValue,
          currValue;

      for (name in SUPPORTED_TRAITS) {
        prevValue = active[name];
        currValue = SUPPORTED_TRAITS[name].getValue({
          viewSize: this.get("view.size"),
          maxWidths: this.maxWidths
        });

        if (prevValue !== currValue) {
          anyPropChanged = true;
          active[name] = currValue;
          classNamesToRemove.push(SUPPORTED_TRAITS[name].valueToClassName[prevValue]);
          classNamesToAdd.push(SUPPORTED_TRAITS[name].valueToClassName[currValue]);
        }
      }

      if (anyPropChanged) {
        this._applyClassNameChanges(classNamesToAdd, classNamesToRemove);
      }

      ArrayPool.put(classNamesToAdd);
      ArrayPool.put(classNamesToRemove);
    },

    /**
     * Removes/Adds CSS classes to the view container.
     * This method is also useful to know whether classes were updated or not (e.g., testing).
     * @param {Array} toAdd – array of class names to add
     * @param {Array} toRemove – array of class names to remove
     * @private
     */
    _applyClassNameChanges: function(toAdd, toRemove) {
      var container = this.get("view.container");
      domClass.remove(container, toRemove);
      domClass.add(container, toAdd);
    },

    _removeActiveClassNames: function() {
      var container = this.get("view.container"),
          active;

      if (container) {
        active = this.active;
        active.keys().forEach(function(name) {
          domClass.remove(container, SUPPORTED_TRAITS[name].valueToClassName[active[name]]);
        });
      }
    }

  });

  var Mixin = Accessor.createSubclass({

    classMetadata: {
      properties: {
        cssTraits: {
          type: CSSTraits
        }
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    getDefaults: function() {
      return lang.mixin(this.inherited(arguments), {
        cssTraits: {}
      });
    },

    destroy: function() {
      this.cssTraits = null;
    },

    //--------------------------------------------------------------------------
    //
    //  Public Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  cssTraits
    //----------------------------------

    cssTraits: null,

    _cssTraitsSetter: function(value, oldValue) {
      if (value === oldValue) {
        return value;
      }

      if (oldValue) {
        oldValue.destroy();
      }

      if (value) {
        value.view = this;
      }

      return value;
    }

  });

  return Mixin;

});
