define(
[
  "dojo/dom-construct",

  "../math/mat2d",
  "../math/vec2",

  "./cssUtils"
],
function(
  domConstruct,
  mat2d, vec2,
  cssUtils
) {

  //--------------------------------------------------------------------------
  //
  //  Lifecycle
  //
  //--------------------------------------------------------------------------
  
  /**
   *
   */
  var RenderContext = function RenderContext() {
    // parent display object
    this._parentStack = [];

    // matrix stack
    this._tStack = [];
    this._tStackSize = 0;

    this._tmpMat2d = mat2d.create();
    this._tmpVec2 = vec2.create();

    this.transform = mat2d.create();
    this.viewTransform = mat2d.create();
  };

  RenderContext.prototype = {

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    reset: function() {
      this._parentStack.length = 0;
      this._tStackSize = 0;
      this.child = null;
      mat2d.identity(this.transform);
    },

    //--------------------------------------------------------------------------
    //
    //  Public Methods: Display Objects
    //
    //--------------------------------------------------------------------------

    setSize: function(width, height) {
      this.surface.style.width = width + "px";
      this.surface.style.height = height + "px";
    },

    setOpacity: function(opacity) {
      this.surface.style.opacity = opacity;
    },
    
    setVisibility: function(visible) {
      this.surface.style.display = visible ? "block" : "none";
    },
    
    setBlendMode: function(blendMode) {
      this.surface.style["mix-blend-mode"] = blendMode ? blendMode : "normal";
    },

    setViewTransform: function(transform) {
      mat2d.copy(this.transform, transform);
      mat2d.copy(this.viewTransform, transform);
    },

    reflowChild: function(child, index) {
      this.child = child;
      this.placeChild(child, index);
      child.reflow(this);
    },

    renderChild: function(child, index) {
      this.child = child;
      this.surface = child.surface;
      this.setChildTransform(child);
      child.render(this);
    },

    placeChild: function(child, index) {
      var parent       = this._parentStack[this._parentStack.length-1],
          surface      = parent.surface,
          childNodes   = surface.childNodes,
          childSurface = child.createSurface();
      if (!childNodes[index]) {
        surface.appendChild(childSurface);
      }
      else if (childNodes[index] !== childSurface) {
        surface.insertBefore(childSurface, childNodes[index]);
      }
    },

    setChildTransform: function(child) {
      var transform = child.transform,
          tmp = null;
      if (transform) {
        if (transform.length === 6) {
          tmp = mat2d.invert(this._tmpMat2d, transform);
          mat2d.multiply(tmp, this.transform, tmp);
          cssUtils.setTransform(this.surface.style, tmp);
          mat2d.copy(this.transform, transform);
        }
        else if (transform.length === 2) {
          tmp = vec2.transformMat2d(this._tmpVec2, transform, this.transform);
          cssUtils.setTransform(this.surface.style, tmp);
        }
      }
    },

    pushParent: function(container) {
      this._parentStack.push(container);
    },

    popParent: function() {
      this._parentStack.pop();
    },

    pushMatrix: function() {
      var stack = this._tStack;
      if (stack.length < this._tStackSize + 1) {
        stack.push(mat2d.create());
      }
      mat2d.copy(stack[this._tStackSize++], this.transform);
    },

    popMatrix: function() {
      mat2d.copy(this.transform, this._tStack[--this._tStackSize]);
    },

    emptyTrash: function(child) {
      if (!child.trash || !child.trash.children.length) { return; }
      var trash = child.trash,
          children = trash.children,
          i, n;
      for (i = 0, n = children.length; i < n; i++) {
        domConstruct.destroy(children[i].surface);
      }
      children.length = 0;
      trash.ids = {};
    }

  };

  return RenderContext;

});