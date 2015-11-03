define(
[
  "../../../core/Accessor",
  "../../../core/HandleRegistry",

  "./cssUtils",
  "./Container",
  "./RenderContext"

],
function(
  Accessor, HandleRegistry,
  cssUtils, Container, RenderContext
) {

  //--------------------------------------------------------------------------
  //
  //  Stage
  //
  //--------------------------------------------------------------------------

  var Stage = Accessor.createSubclass({

    classMetadata: {
      properties: {
        clipVisible: {}
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecyle
    //
    //--------------------------------------------------------------------------

    constructor: function() {
      this._handles = new HandleRegistry();
    },

    getDefaults: function(kwArgs) {
      return {
        context: new RenderContext(),
        root: new Container(),
        wrapper: new Container({
          stage: this,
          parent: this,
          surface: kwArgs.container
        })
      };
    },

    initialize: function() {
      this._handles.add(this.watch("clipVisible", this.rerender.bind(this)));
    },
    
    destroy: function() {
      this.stop();
      this._handles.destroy();
      this._handles = null;
    },


    //--------------------------------------------------------------------------
    //
    //  Variables
    //
    //--------------------------------------------------------------------------

    _rerender: false,


    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  clipVisible
    //----------------------------------

    clipVisible: true,

    //----------------------------------
    //  state
    //----------------------------------

    _stateSetter: function(value, oldValue) {
      if (oldValue) {
        this._handles.remove("version");
      }
      if (value) {
        this._handles.add(value.watch("version", this.rerender.bind(this)), "version");
      }
      return value;
    },


    //--------------------------------------------------------------------------
    //
    //  Public Methods: rendering
    //
    //--------------------------------------------------------------------------

    rerender: function() {
      if (!this._rerender) {
        this._rerender = true;
        if (this._running && this.task.isPaused()) {
          this.task.resume();
        }
      }
    },

    run: function() {
      if (this._running) { return; }
      this.wrapper.addChild(this.root);
      this.task = this.scheduler.addFrameTask({
        render: this._render.bind(this)
      });
      this._running = true;
    },

    stop: function() {
      if (!this._running) { return; }
      this.wrapper.removeChild(this.root);
      this.task.remove();
      this.task = null;
      this._running = false;
    },


    //--------------------------------------------------------------------------
    //
    //  Public Methods: Child management
    //
    //--------------------------------------------------------------------------

    addChild: function(child) {
      return this.root.addChild(child);
    },

    addChildAt: function(child, index) {
      return this.root.addChildAt(child, index);
    },

    removeChild: function(child) {
      return this.root.removeChild(child);
    },

    removeChildAt: function(index) {
      return this.root.removeChildAt(index);
    },

    contains: function(child) {
      return this.root.contains(child);
    },

    getChildIndex: function(child) {
      return this.root.getChildIndex(child);
    },

    getChildAt: function(index) {
      return this.root.getChildAt(index);
    },

    setChildIndex: function(child, index) {
      return this.root.setChildIndex(child, index);
    },

    requestChildRender: function(child) {
      this.rerender();
    },


    //--------------------------------------------------------------------------
    //
    //  Internal function
    //
    //--------------------------------------------------------------------------

    _render: function() {
      if (!this._rerender) {
        return;
      }
      
      var context = this.context;
      var state = this.state;
      var wrapper = this.wrapper;
      var root = this.root;

      this._rerender = false;

      context.setViewTransform(state.transformNoRotation);

      // Reflow
      // context.reflowChild(this.root);
      wrapper.reflow(context);
      wrapper.render(context);

      // Repaint
      root.render(context);
      
      var style = root.surface.style;
      var center = state.screenCenter;
      var clip = this.clipVisible && state.clipRect;

      cssUtils.setOrigin(style, center);
      cssUtils.setTransformStyle(style, cssUtils.rotateZ(state.rotation));
      cssUtils.clip(style, clip);

      context.reset();

      if (!this._rerender) {
        this.task.pause();
      }
    }
    

  });

  return Stage;

});
