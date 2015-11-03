/**
 * Contains a [state](#state) property used for checking the state of the animation.
 * The view animation is resolved when the animation has either `finished` or
 * `stopped`.
 *
 * @module esri/views/ViewAnimation
 * @since 4.0
 * @see {@link module:esri/views/SceneView#animateTo SceneView.animateTo()}
 * @see {@link module:esri/views/MapView#animation MapView.animation}
 */
define([
  "../core/declare",
  
  "dojo/Deferred",

  "../core/Accessor",
  "../core/Promise"
], function(
  declare,
  Deferred,
  Accessor, Promise
) {

  var State = {
    RUNNING: "running",
    FINISHED: "finished",
    STOPPED: "stopped"
  };

  /**
   * @extends module:esri/core/Accessor
   * @mixes module:esri/core/Promise
   * @constructor module:esri/views/ViewAnimation
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var ViewAnimation = declare([Accessor, Promise],
  /** @lends module:esri/views/ViewAnimation.prototype */
  {
    declaredClass: "esri.views.ViewAnimation",

    classMetadata: {
      properties: {
        state: {}
      }
    },

    constructor: function() {
      this._dfd = new Deferred();
      this.addResolvingPromise(this._dfd.promise);
    },

    initialize: function() {
      this.state = State.RUNNING;
    },

    /**
     * Stops the view animation at its current state and sets the state of
     * the animation to `stopped`.
     */
    stop: function() {
      this.state = State.STOPPED;
      this._dfd.resolve();
    },

    /**
     * Finishes the view animation by immediately going to the target and sets
     * the state of the animation to `finished`.
     */
    finish: function() {
      this.state = State.FINISHED;
      this._dfd.resolve();
    },
    
    /**
    * The state of the animation.
    *
    * The animation terminates when the state is either `finished` or `stopped`
    * and cannot transition again to `running`. The `finished` state
    * indicates the animation has successfully ended, while the `stopped`
    * state indicates that the animation was interrupted before it reached
    * its final target.
    * 
    * **Known Values:** running | finished | stopped
    * 
    * @type {string}
    * @default running
    * @readOnly
    */  
    state: null,

    /**
     * The target of the animation.
     *
     * @type {module:esri/Viewpoint}
     */
    target: null
  });

  ViewAnimation.State = State;

  return ViewAnimation;
});
