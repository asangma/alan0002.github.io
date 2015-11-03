define([
  "../../../core/declare",
  "../../../core/Accessor",
  "../../../core/Promise",
  "dojo/Deferred",
  "dojo/aspect",
  "dojo/_base/lang"
], function(
  declare, Accessor, Promise,
  Deferred, aspect, lang
) {
  var ExternalRenderer = declare([Accessor, Promise], {
    "-chains-": lang.mixin(Accessor._meta.chains, {
      setup: "after",
      initializeRenderContext: "after"
    }),

    classMetadata: {
      properties: {
        gl: {
          readOnly: true,

          getter: function() {
            return this._gl;
          }
        },

        needsRender: {
          value: true
        },

        visible: {
          value: true
        },

        needsDepthMap: {
          value: false
        }
      }
    },

    //--------------------------------------------------------------------------
    //
    //  LifeCycle
    //
    //--------------------------------------------------------------------------

    constructor: function() {
      this.didRender = false;
      this.renderContext = null;

      this.watch("visible", function() {
        this.needsRender = true;
      }.bind(this));

      this._contextDfd = new Deferred();
    },

    initialize: function() {
      this.addResolvingPromise(this._contextDfd.promise);

      aspect.around(this, "render", function(originalRender) {
        return function() {
          if (this.isRejected()) {
            // Won't ever render, mark it as has-rendered so it suspends
            this.didRender = true;
            return true;
          }

          // Do not consider ourselves rendered until at least the first time
          // we resolve.
          if (!this.isResolved()) {
            return false;
          }

          // If the renderer is invisible, then we simply skip calling the
          // render method. We return `true` because we consider ourselves
          // "rendering" an empty frame when we are invisible.
          if (!this.visible || originalRender.apply(this, arguments)) {
            this.didRender = true;
            return true;
          }

          return false;
        }.bind(this);
      }.bind(this));

      this.then(function() {
        this.setup(this.renderContext);
      }.bind(this));
    },

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  needsRender
    //----------------------------------

    /**
     * Set this property to true if there was a change that should cause a
     * render. This property is automatically set to `false` after a render
     * frame if the external renderer rendered a frame (returned `true` from
     * the #render method). You can override this reset behavior by implementing
     * a #resetNeedsRender method.
     *
     * @type {boolean}
     */
    needsRender: true,

    //----------------------------------
    //  visible
    //----------------------------------

    /**
     * Enables/disables rendering.
     *
     * @type {boolean}
     */
    visible: true,

    /**
     * Whether the renderer needs access to the scene depth.
     * @type {boolean}
     */
    needsDepthMap: false,

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    /**
     * Called by the webgl engine to set the render context. Subclasses usually
     * do not need to override this, instead doing their initialization in
     * #setup.
     *
     * @param {Object} context - the engine rendering context.
     * @param {Object} context.gl - the webgl context.
     * @param {Object} context.shaderSnippets - the shader snippets.
     * @param {Object} context.shaderRep - the shader repository.
     * @param {Object} context.programRep - the program repository.
     * @param {Object} context.textureRep - the texture repository
     */
    initializeRenderContext: function(context) {
      this.renderContext = context;
      this._contextDfd.resolve();
    },

    /**
     * Called when the renderer is resolved. Subclasses usually
     * override this to do their own setup. This call is automatically chained
     * ("after") so subclasses do not need to explicitly call this.inherited.
     *
     * @param {Object} context - the engine rendering context.
     * @param {Object} context.gl - the webgl context.
     * @param {Object} context.shaderSnippets - the shader snippets.
     * @param {Object} context.shaderRep - the shader repository.
     * @param {Object} context.programRep - the program repository.
     * @param {Object} context.textureRep - the texture repository.
     */
    setup: function(context) {
    },

    /**
     * Called by the webgl engine when rendering. The external renderer
     * automatically
     *
     * @param {Object} context - the engine render context
     * @param {number} context.slot - the current render slot
     * @param {string} context.pass - the current render pass
     * @param {Camera} context.camera - the engine camera
     * @param {ShadowMap} context.shadowMap - the shadow map instance
     * @param {SSAOHelper} context.ssaoHelper - the ssao helper instance
     * @param {FBO} context.depth - the FBO for the scene depth
     * @param {FBO} context.normals - the FBO for the scene normal
     * @param {Texture} context.framebufferTex - the color buffer texture
     * @param {LightingData} context.lightingData - the lighting data
     *
     * @returns {boolean} true if something rendered, or false otherwise. When
     *                    returning false, the #needsRender property will not
     *                    be cleared and a render is attempted again the next
     *                    frame, until an actual render happened.
     */
    render: function(context) {
      return false;
    },
  });

  return ExternalRenderer;
});
