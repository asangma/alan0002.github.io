/*jslint browser: true, continue: true, eqeq: true, nomen: true, plusplus: true, regexp: true, unparam: true, sloppy: true, todo: true, vars: true, white: true */
/*global define */

define([], function() {
  
  return {
    
    isSet: function(flags, flagMask) {
      return flagMask == (flags & flagMask);
    },

    set: function(flags, flagMask, value) {
      if (value) {
        if ((flags & flagMask) === flagMask) {
          return flags;
        }
        flags |= flagMask;
      }
      else {
        if ((flags & flagMask) === 0) {
          return flags;
        }
        flags &= ~flagMask;
      }
      return flags;
    }
  };
  
});