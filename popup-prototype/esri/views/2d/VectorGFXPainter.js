/*jslint browser: true, continue: true, eqeq: true, nomen: true, plusplus: true, regexp: true, unparam: true, sloppy: true, todo: true, vars: true, white: true */
/*global define */

define(
[
  "../../core/declare",
  "dojo/_base/lang",
  
  "dojox/gfx"
],
function(
  declare, lang,
  gfx
) {

var VectorGFXPainter = declare(null, {

  //--------------------------------------------------------------------------
  //
  //  Constructor
  //
  //--------------------------------------------------------------------------

  constructor: function(properties) {
    lang.mixin(this, properties);
  },
  
  //--------------------------------------------------------------------------
  //
  //  Public Methods
  //
  //--------------------------------------------------------------------------
  
  render: function(displayObject) {
    var type = displayObject.type;    
    
    switch(type) {
      case "vector-container":
        this.renderContainer(displayObject);
        break;
      case "vector-group":
        this.renderGroup(displayObject);
        break;
      case "vector":
        this.renderVector(displayObject);
        break;
    }
  },
  
  renderContainer: function(displayObject) {
    var parentSurface = displayObject.parent.surface,
        surface       = displayObject.surface,
        add           = displayObject._addBucket,
        remove        = displayObject._removeBucket,
        i, n;
    if (!surface) {
      displayObject.surface = surface = gfx.createSurface(parentSurface, this.view.width, this.view.height);
    }
    
    // Add children
    if (add && add.length) {
      for (i = 0, n = add.length; i < n; i++) {
        this.render(add[i]);
      }
      add.length = 0;
    }

    // Remove children
    if (remove && remove.length) {
      for (i = 0, n = remove.length; i < n; i++) {
        if (remove[i].surface) {
          remove[i].surface.destroy();
          remove[i].surface = null;
        }
        this._transforms.remove(remove[i]._uid);
      }
      remove.length = 0;
    }
  },
  
  renderGroup: function(displayObject) {
    var parentSurface = displayObject.parent.surface,
        surface       = displayObject.surface,
        add           = displayObject._addBucket,
        remove        = displayObject._removeBucket,
        i, n;
    
    if (!surface) {
      parentSurface.createGroup();
      displayObject.surface = surface;
    }
    
    // Add children
    if (add && add.length) {
      for (i = 0, n = add.length; i < n; i++) {
        this.render(add[i]);
      }
      add.length = 0;
    }

    // Remove children
    if (remove && remove.length) {
      for (i = 0, n = remove.length; i < n; i++) {
        if (remove[i].surface) {
          remove[i].surface.destroy();
          remove[i].surface = null;
        }
        this._transforms.remove(remove[i]._uid);
      }
      remove.length = 0;
    }
  },
  
  renderVector: function(vector) {
    var surface = vector.surface,
        isSurfaceValid = this.isSurfaceValid(vector);
    
    if (!isSurfaceValid) {
      if (surface) {
        surface.destroy();
        vector.surface = surface = null;
      }
      if (!surface) {
        this.createVectorSurface(vector);
      }
    }
    
    if (vector._requestDrawFlag) {
      vector._requestDrawFlag = false;
      this.udpateVectorSurface(vector);
    }
  },

  isSurfaceValid: function(vector) {
    if (!vector.surface) {
      return false;
    }
    return true;
  },
  
  createVectorSurface: function(vector) {
    
  },
  
  udpateVectorSurface: function(vector) {
    
  }
  
});

return VectorGFXPainter;

});