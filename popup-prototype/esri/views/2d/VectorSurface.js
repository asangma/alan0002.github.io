define(
[
  "../../core/declare",
  "dojo/_base/array",

  "../../core/Accessor"
],
function(
  declare, array,
  Accessor
) {
  
var ID = 0;
function generateID() {
  return "vector-surface-" + ID++;
}

var VectorSurface = declare(Accessor, {
  
  //--------------------------------------------------------------------------
  //
  //  Lifecycle
  //
  //--------------------------------------------------------------------------
  
  constructor: function(properties) {
    this.id = generateID();

    this.vectors  = [];
    this.adding   = [];
    this.removing = [];
    this.updating = [];
  },


  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------
  
  //----------------------------------
  //  visible
  //----------------------------------
  
  visible: true,
  _visibleSetter: function(value, oldValue) {
    if (value !== oldValue) {
      this._visibleChanged = true;
      this.requestDraw();
    }
    return value;
  },
  
  //----------------------------------
  //  nestLevel
  //----------------------------------
  
//   nestLevel: 0,
  
//   _nestLevelSetter: function(value) {
//     if (value === 1) {
//       return;
//     }
    
//     if (this.nestLevel !== value) {
//       this.nestLevel = value;
//       // if 0, display object is removed or newly created
//       // if 1, display object is added to a container of level 0
//       if (value > 1) {
//         if (this.view) {
//           if (this._requestUpdateFlag) {
//             this.view.displayManager.requestUpdate(this);
//           }
//           if (this._requestDrawFlag) {
//             this.view.displayManager.requestDraw(this);
//           }
//         }
//       }
//     }
//   },
  
  //--------------------------------------------------------------------------
  //
  //  Public functions
  //
  //--------------------------------------------------------------------------
  
  // rendered: function() {},
  
  requestDraw: function() {
    if (!this._requestDrawFlag) {
      this._requestDrawFlag = true;
      if (this.nestLevel) {
        this.stage.requestDraw(this);
      }
    }
  },
  
  requestUpdate: function() {
    if (!this._requestUpdateFlag) {
      this._requestUpdateFlag = true;
      if (this.nestLevel) {
        this.stage.requestUpdate(this);
      }
    }
  },
  
  requestVectorDraw: function(vector) {
    this.updating.push(vector);
    this.requestDraw();
  },
  
  // destroy: function() {},
  
  addVector: function(vector) {
    return this.addVectorAt(vector, this.vectors.length);
  },
  
  addVectorAt: function(vector, index) {
//     if (this.contains(vector)) {
//       return vector;
//     }
    
    // insert the vector
    index = Math.min(this.get("numChildren"), index);
    this.vectors.splice(index, 0, vector);
    
    vector.set({
      parent   : this,
      view : this.view
    });
    
    // this.requestDraw();
    this.adding.push(vector);
    
    return vector;
  },
  
  removeVector: function(vector) {
    if (!this.vectors) {
      return vector;
    }
    
    var index = array.indexOf(this.vectors, vector);
    
    if (index > -1) {
      
      vector = this.vectors.splice(index, 1)[0];
      vector.set({
        parent:    null,
        view:  null
      });
      
      // this.requestDraw();
      // TODO say something to the vector: vector.removed()? vector.destroy();
    }
    
    return vector;
  }
  
});

return VectorSurface;

});
