define(
[
  "./DisplayObject"
],
function(
  DisplayObject
) {

  var Container = DisplayObject.createSubclass({

    declaredClass: "esri.views.2D.engine.Container",
    
    "-chains-": {
      childAdded:   "after",
      childRemoved: "after"
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------
    
    constructor: function() {
      this.children = [];
      this.trash = {
        children: [],
        ids: {}
      };
    },

    // TODO YCA: remove all the children
    //   destroy: function() {
    //     this.inherited(arguments);
    //   },

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------
    
    tag:  "inherit",

    //----------------------------------
    //  stage
    //----------------------------------

    _stageSetter: function(value, oldValue) {
      var oldValue = this.stage,
          children = this.children,
          child, i, n;
      this.inherited(arguments);
      if (oldValue === value) { return oldValue; }
      if (children) {
        for(i = 0, n = children.length; i < n; i++) {
          child = children[i];
          child.stage = value;
        }
      }
      return value;
    },

    //----------------------------------
    //  numChildren
    //----------------------------------

    _numChildrenGetter: function() {
      return this.children.length;
    },


    //--------------------------------------------------------------------------
    //
    //  Public function
    //
    //--------------------------------------------------------------------------

    addChild: function(child) {
      return this.addChildAt(child, this.children.length);
    },

    addChildAt: function(child, index) {
      var formerParent;
      // child is already here
      if (this.contains(child)) {
        return child;
      }
      // remove the child from the other parent
      formerParent = child.parent;
      if (formerParent) {
        formerParent.removeChild(child);
      }
      // insert the child
      index = Math.min(this.children.length, index);
      this.children.splice(index, 0, child);
      // restore from the trash
      if (this.trash.ids[child.id]) {
        this.trash.ids[child.id] = null;
        this.trash.children.splice(this.trash.children.indexOf(child), 1);
      }
      // notify that the child has been added
      this.childAdded(child, index);
      this.notifyChange("numChildren");
      return child;
    },

    childAdded: function(child, index) {
      child.set({
        parent:   this,
        stage:    this.stage
      });
      this.requestRender();
    },

    removeAllChildren: function() {
      var numChildren = this.numChildren;
      while (numChildren--) {
        this.removeChildAt(0);
      }
    },

    removeChild: function(child) {
      var index = this.children.indexOf(child);
      if (index > -1) {
        return this.removeChildAt(index);
      }
      return child;
    },

    removeChildAt: function(index) {
      var child;
      if (index < 0 || index >= this.children.length) {
        return null;
      }
      child = this.children.splice(index, 1)[0];
      // put in the trash
      this.trash.ids[child.id] = child;
      this.trash.children.push(child);
      // notify that the child has been removed
      this.childRemoved(child);
      this.notifyChange("numChildren");
      return child;
    },

    childRemoved: function(child) {
      child.parent = null;
      child.stage  = null;
      this.requestRender();
    },

    contains: function(child) {
      return this.getChildIndex(child) > -1;
    },

    getChildIndex: function(child) {
      return this.children.indexOf(child);
    },

    getChildAt: function(index) {
      if (index < 0 || index > this.children.length) {
        return null;
      }
      return this.children[index];
    },

    setChildIndex: function(child, index) {
      var oldIndex = this.getChildIndex(child);
      if (oldIndex > -1) {
        this.children.splice(oldIndex, 1);
        this.children.splice(index, 0, child);
        this.requestRender();
      }
    },


    //--------------------------------------------------------------------------
    //
    //  Public function
    //
    //--------------------------------------------------------------------------

    requestChildRender: function(child) {
      if (child && child.parent === this) {
        this.requestRender();
      }
    },


    //--------------------------------------------------------------------------
    //
    //  Public function: Rendering
    //
    //--------------------------------------------------------------------------

    reflow: function(context) {
      var children = this.children,
          numChildren = children.length,
          i;
      context.emptyTrash(this);
      context.pushParent(this);
      for (i = 0; i < numChildren; i++) {
        context.reflowChild(children[i], i);
      }
      context.popParent();
    },

    render: function(context) {
      this.inherited(arguments);
      var children = this.children,
          numChildren = children.length,
          i;
      context.pushParent(this);
      for (i = 0; i < numChildren; i++) {
        context.pushMatrix();
        context.renderChild(children[i]);
        context.popMatrix();
      }
      context.popParent();
    }
    
  });

  return Container;

});
