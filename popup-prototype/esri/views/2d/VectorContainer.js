/*jslint browser: true, continue: true, eqeq: true, nomen: true, plusplus: true, regexp: true, unparam: true, sloppy: true, todo: true, vars: true, white: true */
/*global define */

define(
[
  "../../core/declare",
  "dojo/_base/array",
  
  "./engine/DisplayObject"
],
function(
  declare, array,
  DisplayObject
) {

var VectorContainer = declare(DisplayObject, {
  
  //--------------------------------------------------------------------------
  //
  //  Public function
  //
  //--------------------------------------------------------------------------
  
  constructor: function(properties) {
    this.children = [];
  },
  
  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------
  
  type: "vector-container",
  
  //--------------------------------------------------------------------------
  //
  //  Public functions
  //
  //--------------------------------------------------------------------------
  
  addChild: function(child) {
    return this.addChildAt(child, this.children.length);
  },
  
  addChildAt: function(child, index) {
    if (this.contains(child)) {
      return child;
    }
    
    // insert the child
    index = Math.min(this.get("numChildren"), index);
    this.children.splice(index, 0, child);
    
    child.set({
      parent   : this,
      view : this.view
    });
    
    this.requestDraw();
    
    return child;
  },
  
  removeChild: function(child) {
    if (!this.children) {
      return child;
    }
    
    var index = array.indexOf(this.children, child);
    
    if (index > -1) {
      
      child = this.children.splice(index, 1)[0];
      child.set({
        parent:    null,
        view:  null
      });
      
      this.requestDraw();
      // TODO say something to the child: child.removed()? child.destroy();
    }
    
    return child;
  },
  
  contains: function(child) {
    return this.getChildIndex(child) > -1;
  },
  
  getChildIndex: function(child) {
    return array.indexOf(this.children, child);
  },
  
  destroy: function() {
    // TODO
  },
  
  requestVectorUpdate: function(child) {
    this.requestUpdate();
  },
  
  requestVectorDraw: function(child) {
    this.requestDraw();
  }
    
});

return VectorContainer;

});