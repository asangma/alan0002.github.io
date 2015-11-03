/*jslint browser: true, continue: true, eqeq: true, nomen: true, plusplus: true, regexp: true, unparam: true, sloppy: true, todo: true, vars: true, white: true */
/*global define */

define([], function() {

return (function () {
  var nowOffset,
      performance = window.performance || {},
      nativeNow   = performance.now       ||
                    performance.webkitNow ||
                    performance.msNow     ||
                    performance.oNow      ||
                    performance.mozNow;
  if (nativeNow !== undefined) {
    return function() {
      return nativeNow.call(performance);
    };
  }
  
  if (window.performance && window.performance.timing && window.performance.timing.navigationStart){
    nowOffset = window.performance.timing.navigationStart;
  }
  else {
    nowOffset = Date.now();
  }
  return function() {
    return Date.now() - nowOffset;
  };
  
})();

});