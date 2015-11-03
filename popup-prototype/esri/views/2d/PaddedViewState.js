define(
[
  "./viewpointUtils",
  "./ViewState",

  "./math/vec2",
  "./math/mat2d",
  "./math/common",

  "../../core/Accessor"
],
function(
  vpUtils, ViewState,
  vec2, mat2d, common,
  Accessor
) {

  var Padding = Accessor.createSubclass({
    classMetadata: {
      properties: {
        left:   {},
        top:    {},
        right:  {},
        bottom: {}
      }
    },
    left: 0,
    top: 0,
    right: 0,
    bottom: 0
  });
  
  Padding.copy = function(a, b) {
    a.left   = b.left;
    a.top    = b.top;
    a.right  = b.right;
    a.bottom = b.bottom;
  };

  //--------------------------------------------------------------------------
  //
  //  PaddedViewState
  //
  //--------------------------------------------------------------------------

  var PaddedViewState = ViewState.createSubclass({
    declaredClass: "esri.views.2d.PaddedViewState",

    classMetadata: {
      properties: {
        padding: {
          type: Padding,
          copy: Padding.copy
        },
        transform: {
          dependsOn: ["padding"]
        },
        paddedScreenCenter: {
          dependsOn: ["size", "padding"],
          readOnly: true,
          copy: vec2.copy
        },
        clipRect: {
          dependsOn: ["worldScreenWidth", "rotation", "paddedScreenCenter", "screenCenter"],
          readOnly: true,
          copy: function(a, b) {
            a.top = b.top;
            a.left = b.left;
            a.right = b.right;
            a.bottom = b.bottom;
          }
        }
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecyle
    //
    //--------------------------------------------------------------------------

    getDefaults: function() {
      return {
        content: new ViewState(),
        padding: new Padding(),
        size: vec2.fromValues(0, 0)
      };
    },

    _clipRectGetter: (function() {
      var cen = vec2.create();
      var mat = mat2d.create();

      return function(cached) {
        var world = this.worldScreenWidth;

        // the size of the world in pixel is 0 because the SR is not wrappable.
        if (!world) {
          return null;
        }

        // Compute the size of the screen.
        var rad = common.toRadian(this.rotation);
        var cos = Math.abs(Math.cos(rad));
        var sin = Math.abs(Math.sin(rad));
        var screen = this.width * cos + this.height * sin;

        // the size of the world in pixel is bigger than the screen.
        if (world > screen) {
          return null;
        }

        // compute the position of the clip rectangle by rotating the padded center around the center of the view.
        vec2.copy(cen, this.screenCenter);
        mat2d.fromTranslation(mat, cen);
        mat2d.rotate(mat, mat, rad);
        vec2.negate(cen, cen);
        mat2d.translate(mat, mat, cen);
        vec2.transformMat2d(cen, this.paddedScreenCenter, mat);

        if (!cached) {
          cached = {};
        }

        cached.top    = -Math.round(screen);
        cached.left   =  Math.round(cen[0] - world * 0.5);
        cached.right  =  Math.round(cen[0] + world * 0.5);
        cached.bottom = +Math.round(screen);

        return cached;
      };
    })(),

    //----------------------------------
    //  padding
    //----------------------------------

    _padding: null,

    _paddingSetter: function(value) {
      this._padding = value || new Padding();
      this._updateContent();
      return value;
    },

    //----------------------------------
    //  size
    //----------------------------------

    _size: null,

    _sizeSetter: function(value) {
      this._size = value;
      this._updateContent();
      return value;
    },

    //----------------------------------
    //  size
    //----------------------------------

    /**
     * center of the padded content in pixels
     *
     * type {number[2]}
     * @name paddedScreenCenter
     */

    _paddedScreenCenterGetter: function(cached) {
      var size = this.content.size;
      var padding = this.padding;
      if (!cached) {
        cached = vec2.create();
      }
      vec2.scale(cached, size, 0.5);
      cached[0] = cached[0] + padding.left;
      cached[1] = cached[1] + padding.top;
      return cached;
    },

    //----------------------------------
    //  viewpoint
    //----------------------------------

    /**
     * esri/Viewpoint
     */
    viewpoint: null,

    _viewpointSetter: (function() {
      var copy;
      return function(value, cached) {
        if (!copy) {
          copy = value.clone();
        }
        this.content.viewpoint = value;
        vpUtils.addPadding(copy, value, this._size, this._padding);
        if (!cached) {
          return vpUtils.addPadding(copy.clone(), value, this._size, this._padding);
        }
        return vpUtils.addPadding(cached, value, this._size, this._padding);
      };
    })(),

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _updateContent: (function() {
      var tmp = vec2.create();
      return function _updateContent() {
        var size = this._size;
        var padding = this._padding;
        if (!size || !padding) {
          return;
        }
        var content = this.content;
        vec2.set(tmp, padding.left + padding.right, padding.top + padding.bottom);
        vec2.subtract(tmp, size, tmp);
        content.size = tmp;

        var vp = content.viewpoint;
        if (vp) {
          this.viewpoint = vp;
        }
      };
    })()

  });

  return PaddedViewState;

});
