define([
  "dojo/_base/array",
  "dojo/Deferred",
  "dojo/when"
], function(djArray, Deferred, when){
  "use strict";

  // module:
  //    esri/promiseList

  var forEach = djArray.forEach;

  return function promiseList(objectOrArray){
    // summary:
    //    Takes multiple promises and returns a new promise that is "resolved"
    //    when all promises have been either resolved or rejected. This promise
    //    is never "rejected". Also, progress callback of the returned promise
    //    will be called when one of the given promises is resolved or rejected.
    //    Note: This is a replacement for the deprecated dojo/DeferredList
    //    module, based on dojo/promise/all.
    // objectOrArray: Object|Array?
    //    The promise will be fulfilled with a list of results if invoked with an
    //    array, or an object of results when passed an object (using the same
    //    keys). If passed neither an object or array it is resolved with an
    //    undefined value.
    // returns: dojo/promise/Promise

    var object, array;
    if(objectOrArray instanceof Array){
      array = objectOrArray;
    }else if(objectOrArray && typeof objectOrArray === "object"){
      object = objectOrArray;
    }

    var results;
    var keyLookup = [];
    if(object){
      array = [];
      for(var key in object){
        if(Object.hasOwnProperty.call(object, key)){
          keyLookup.push(key);
          array.push(object[key]);
        }
      }
      results = {};
    }else if(array){
      results = [];
    }

    if(!array || !array.length){
      return new Deferred().resolve(results);
    }

    var deferred = new Deferred();
    deferred.promise.always(function(){
      results = keyLookup = null;
    });

    var waiting = array.length;

    function addResult(result, i){
      results[i] = result;

      deferred.progress([ result, i ]);

      if(--waiting === 0){
        deferred.resolve(results);
      }
    }

    forEach(array, function(valueOrPromise, index){
      if(!object){
        keyLookup.push(index);
      }

      when(
        valueOrPromise,

        function(result) {
          addResult(result, keyLookup[index]);
        },

        function(error) {
          addResult(error, keyLookup[index]);
        }
      );
    });

    return deferred.promise;  // dojo/promise/Promise
  };
});
