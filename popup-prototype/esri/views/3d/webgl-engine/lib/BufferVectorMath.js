define([
], function(
) {

  var Vec3Compact = {
    length: function(buffer, index) {
      var x = buffer[index],
        y = buffer[index+1],
        z = buffer[index+2];
      return Math.sqrt(x*x + y*y + z*z);
    },

    normalize: function(buffer, index) {
      var x = buffer[index],
        y = buffer[index+1],
        z = buffer[index+2];
      var f = 1/Math.sqrt(x*x + y*y + z*z);
      buffer[index] *= f;
      buffer[index+1] *= f;
      buffer[index+2] *= f;
    },

    scale: function(buffer, srcIndex, scale) {
      buffer[srcIndex] *= scale;
      buffer[srcIndex+1] *= scale;
      buffer[srcIndex+2] *= scale;
    },

    add: function(srcBuffer1, srcIdx1, srcBuffer2, srcIdx2, destBuffer, destIdx) {
      destBuffer = destBuffer || srcBuffer1;
      if (destIdx == null) {
        destIdx = srcIdx1;
      }
      destBuffer[destIdx]   = srcBuffer1[srcIdx1]   + srcBuffer2[srcIdx2];
      destBuffer[destIdx+1] = srcBuffer1[srcIdx1+1] + srcBuffer2[srcIdx2+1];
      destBuffer[destIdx+2] = srcBuffer1[srcIdx1+2] + srcBuffer2[srcIdx2+2];
    },
    
    subtract: function(srcBuffer1, srcIdx1, srcBuffer2, srcIdx2, destBuffer, destIdx) {
      destBuffer = destBuffer || srcBuffer1;
      if (destIdx == null) {
        destIdx = srcIdx1;
      }
      destBuffer[destIdx]   = srcBuffer1[srcIdx1]   - srcBuffer2[srcIdx2];
      destBuffer[destIdx+1] = srcBuffer1[srcIdx1+1] - srcBuffer2[srcIdx2+1];
      destBuffer[destIdx+2] = srcBuffer1[srcIdx1+2] - srcBuffer2[srcIdx2+2];
    }

  };

  return {
    Vec3Compact: Vec3Compact
  };
});