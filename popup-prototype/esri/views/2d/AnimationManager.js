define(
[
  "../../core/declare",
  
  "../../core/Accessor",
  "../../core/Scheduler",
  "../../core/now",

  "../ViewAnimation",

  "./unitBezier",
  "./viewpointUtils"
],
function(
  declare,
  Accessor, Scheduler, now,
  ViewAnimation,
  unitBezier, vpUtils
) {

  var Transition = function(current, target, duration, easing) {
    var sGeom = current.targetGeometry,
        tGeom = target.targetGeometry;

    if (!easing) {
      easing = unitBezier.ease;
    }
    else if (typeof easing === "string") {
      easing = unitBezier.parse(easing) || unitBezier.ease;
    }
    this.easing = easing;
    this.duration = duration;

    this.sCenterX    = sGeom.x,
    this.sCenterY    = sGeom.y,
    this.sScale      = current.scale,
    this.sRotation   = current.rotation,

    this.tCenterX    = tGeom.x,
    this.tCenterY    = tGeom.y,
    this.tScale      = target.scale,
    this.tRotation   = target.rotation,

    this.dCenterX    = this.tCenterX - this.sCenterX,
    this.dCenterY    = this.tCenterY - this.sCenterY,
    this.dScale      = this.tScale - this.sScale,
    this.dRotation   = this.tRotation - this.sRotation;

    // Calculate the shortest angle
    if (this.dRotation > 180) {
      this.dRotation -= 360;
    }
    else if (this.dRotation < -180) {
      this.dRotation += 360;
    }
  };

  Transition.prototype.applyRatio = function(target, ratio) {
    var b = this.easing(ratio);
    var centerX, centerY, rotation, scale;

    if (ratio >= 1) {
      centerX  = this.tCenterX;
      centerY  = this.tCenterY;
      rotation = this.tRotation;
      scale    = this.tScale;
    } else {
      centerX  = this.sCenterX + b * this.dCenterX;
      centerY  = this.sCenterY + b * this.dCenterY;
      rotation = this.sRotation + b * this.dRotation;
      scale    = this.sScale + b * this.dScale;
    }
    
    target.targetGeometry.x = centerX;
    target.targetGeometry.y = centerY;
    target.scale = scale;
    target.rotation = rotation;
  };


  var AnimationManager = declare(Accessor, {

    //--------------------------------------------------------------------------
    //
    //  Constructor
    //
    //--------------------------------------------------------------------------

    constructor: function() {
      this._updateTask = Scheduler.addFrameTask({
        postRender: this._postRender.bind(this)
      });
      this._updateTask.pause();
    },

    getDefaults: function() {
      return {
        viewpoint: vpUtils.create()
      };
    },

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    duration: 200,

    transition: null,

    easing: unitBezier.ease,

    //--------------------------------------------------------------------------
    //
    //  Public function
    //
    //--------------------------------------------------------------------------

    animateTo: function(target, current, options) {
      var viewpoint = this.viewpoint;
      vpUtils.copy(viewpoint, current);

      this.transition = new Transition(
        this.viewpoint,
        target,
        (options && options.duration) || this.duration,
        (options && options.easing) || this.easing
      );

      if (this.animation) {
        this.animation.stop();
        this.animation = null;
      }

      var animation = this.animation = new ViewAnimation({
        target: target.clone()
      });

      animation.always(function() {
        if (this._updateTask) {
          this._updateTask.pause();
          this.animation = null;
        }
      }.bind(this));

      this._startTime = now();
      this._updateTask.resume();
      return animation;
    },


    //--------------------------------------------------------------------------
    //
    //  Event Handlers
    //
    //--------------------------------------------------------------------------

    _postRender: function(event) {
      var animation = this.animation;
      if (!animation || animation.state === ViewAnimation.STOPPED) {
        this._updateTask.pause();
        return;
      }

      var diff = now() - this._startTime,
          ratio = diff / this.transition.duration,
          ending = ratio >= 1;

      this.transition.applyRatio(this.viewpoint, ratio);
      this.animation._dfd.progress(this.viewpoint);

      if (ending) {
        this.animation.finish();
      }
    }

  });

return AnimationManager;

});
