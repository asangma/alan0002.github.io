define(
[],
function() {
  
  var dfdUtils = {
    _dfdCanceller: function(dfd) {
      dfd.canceled = true;
      
      var pending = dfd._pendingDfd;
      if (!dfd.isResolved() && pending && !pending.isResolved()) {
        //console.log("Cancelling... ", pending.ioArgs);
        pending.cancel();
        // In our arch, by the time "cancel" returns
        // "dfd" would have been deemed finished because
        // "pending"s rejection is wired to reject "dfd"
      }
      dfd._pendingDfd = null;
    },
    
    _fixDfd: function(dfd) {
      // Use this method only if your deferred supports
      // more than one result arguments for its callback
      
      // Refer to dojo/_base/Deferred.js::notify() for context
      // before reading this function
      
      // TODO
      // Are there better/alternative solutions?
      
      var saved = dfd.then;
      
      // Patch "then"
      dfd.then = function(resolvedCallback, b, c) {
        if (resolvedCallback) {
          var resolved = resolvedCallback;
          
          // Patch "resolved callback"
          resolvedCallback = function(result) {
            if (result && result._argsArray) {
              return resolved.apply(null, result);
            }
            return resolved(result);
          };
        }
        
        return saved.call(this, resolvedCallback, b, c);
      };
      
      return dfd;
    },
    
    _resDfd: function(dfd, /*Anything[]*/ args, isError) {
      var count = args.length;
      
      if (count === 1) {
        if (isError) {
          dfd.reject(args[0]);
        }
        else {
          dfd.resolve(args[0]);
        }
      }
      else if (count > 1) {
        // NOTE
        // See esri._fixDfd for context
        args._argsArray = true;
        dfd.resolve(args);
      }
      else {
        dfd.resolve();
      }
    }
  };
  
  return dfdUtils;
});
