define(
[
  "dojo/has"
],
function(
  has
) {
  var TRANSFORM_ORIGIN = "transform-origin";

  var isFF     = has("ff");
  var isIE     = has("ie");
  var isWebKit = has("webkit");
  var isOpera  = has("opera");

  var transformStyleName = (isWebKit && "-webkit-transform") ||
    (isFF && "-moz-transform") || 
    (isOpera && "-o-transform") || (isIE && "-ms-transform") ||
    "transform";

  var supports3DTransforms = !isIE || (isIE > 9);

  var cssUtils = {
    supports3DTransforms: supports3DTransforms,

    transformStyleName:  transformStyleName,

    clip: function(style, clip) {
      if (clip) {
        // rect(<top>, <right>, <bottom>, <left>)
        style.clip = "rect("+ clip.top +"px, " + clip.right + "px, "+ clip.bottom +"px," + clip.left + "px)";
      }
      else {
        style.clip = null;
      }
    },

    setTransform: function setTransform(style, arr) {
      var target = null;

      if (arr.length === 2) {
        target = cssUtils.translate(arr);
      }
      if (arr.length === 6) {
        target = cssUtils.matrix3d(arr);
      }
      cssUtils.setTransformStyle(style, target);
    },

    setTransformStyle: function (style, transformValue) {
      style.transform = style[transformStyleName] = transformValue;
    },

    setOrigin: (function() {
      return supports3DTransforms
        ? function(style, origin) {
          style[TRANSFORM_ORIGIN] = origin[0] + "px " + origin[1] + "px";
        }
        : function(style, origin) {
          style[TRANSFORM_ORIGIN] = origin[0] + "px " + origin[1] + "px 0";
        };
    })(),

    matrix: function(mat) {
      return "matrix(" + mat[0].toFixed(10) + "," + mat[1].toFixed(10) + ","
                       + mat[2].toFixed(10) + "," + mat[3].toFixed(10) + ","
                       + mat[4] + "," + mat[5] + ")";
    },
    
    matrix3d: (function() {
      return supports3DTransforms
        ? function(mat) {
            if (mat.length === 6) {
              return "matrix3d("+mat[0].toFixed(10)+","+mat[1].toFixed(10)+",0,0,"
                                +mat[2].toFixed(10)+","+mat[3].toFixed(10)+",0,0,0,0,1,0,"
                                +mat[4].toFixed(10)+","+mat[5].toFixed(10)+",0,1)";
            }
          }
        : function(mat) {
            return "matrix(" + mat[0].toFixed(10) + "," + mat[1].toFixed(10) + ","
                             + mat[2].toFixed(10) + "," + mat[3].toFixed(10) + ","
                             + mat[4] + "," + mat[5] + ")";
          };
    })(),
    
    translate: function(vec) {
      return "translate(" + Math.round(vec[0]) + "px, " + Math.round(vec[1]) + "px)";
    },
    
    rotate: function(deg) {
      return cssUtils.rotateZ(deg.toFixed(3));
    },
    
    rotateZ: (function() {
      return supports3DTransforms
      ? function(deg) {
          return "rotateZ(" + deg + "deg)"; 
        }
      : function(deg) {
          return "rotate(" + deg + "deg)";
        };
    })()
  };

  return cssUtils;

});
