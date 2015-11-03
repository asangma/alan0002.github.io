define([
  "./Util"
], function (Util){

return function Float32ArrayList(initialCapacity) {
  if (initialCapacity === undefined) {
    initialCapacity = 16;
  }
  else {
    initialCapacity = Util.nextHighestPowerOfTwo(initialCapacity);
  }
  
  var array = new Float32Array(initialCapacity);
  var size = 0;
  
  this.resize = function(newSize, copy) {
    size = newSize;
    
    var newLength;
    var newArray;

    if (size > array.length) {
      newLength = array.length || 1;
      
      while (newLength < size) {
        newLength *= 2;
      }
      
      newArray = new Float32Array(newLength);
      
      if (copy) {
        newArray.set(array);
      }
      
      array = newArray;
      return true;
    } else if (size <= array.length / 2) {      
      newLength = array.length;
      var size2 = 2 * size;
      
      while (newLength >= size2) {
        newLength /= 2;
      }
      
      newArray = new Float32Array(newLength);
      
      if (copy) {
        newArray.set(array.subarray(0, newLength));
      }

      array = newArray;
      return true;            
    }
    return false;
  };
  
  this.append = function (arr) {
    var oldSize = size;
    this.resize(size + arr.length, true);
    array.set(arr, oldSize);
  };
  
  this.erase = function(from, to) {
    for (var i = from; i < to; ++i) {
      array[i] = 0.0;
    }
  };
  
  this.getArray = function() {
    return array;
  };
  
  this.getSize = function() {
    return size;
  };
};
});