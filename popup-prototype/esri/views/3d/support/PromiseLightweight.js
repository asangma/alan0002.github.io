/*
 *  Copyright 2012-2013 (c) Pierre Duquesne <stackp@online.fr>
 *  Licensed under the New BSD License.
 *  https://github.com/stackp/promisejs
 */

//extended by markus with errbacks

(function(exports) {

  function Promise(cancelCallback) {
    this._callbacks = [];
    this._errbacks = [];

    this._cancelCallback = cancelCallback;

    this._iscancelled = false;
    this._isdone = false;
    this._iserr = false;
  }

  Promise.prototype.cancel = function(reason) {
    this._callbacks = [];
    this._errbacks = [];
    this._iscancelled = true;

    if (this._cancelCallback) {
      this._cancelCallback(reason);
    }
  };

  Promise.prototype.then = function(func, err, context) {
    var p;

    if (this._iscancelled) {
      return;
    }

    if (this._isdone) {
      p = func.apply(context, this.result);
    } else if (this._iserr && err) {
      p = err.apply(context, this.result);
    }
    else {
      this._callbacks.push(function () {
        return func.apply(context, arguments);
      });

      if (err) {
        this._errbacks.push(function () {
          return err.apply(context, arguments);
        });
      }
    }

    return p;
  };

  Promise.prototype.done = function() {
    this.result = arguments;
    this._isdone = true;

    for (var i = 0; i < this._callbacks.length; i++) {
      this._callbacks[i].apply(null, arguments);
    }

    this._callbacks = [];
    this._errbacks = [];
  };

  Promise.prototype.resolve = Promise.prototype.done;
  
  Promise.prototype.reject = function() {
    if (this._iscancelled) {
      return;
    }

    this.result = arguments;
    this._iserr = true;

    for (var i = 0; i < this._errbacks.length; i++) {
      this._errbacks[i].apply(null, arguments);
    }

    this._callbacks = [];
    this._errbacks = [];
  };
  
  Promise.prototype.isRejected = function() {
    return this._iserr;
  };

  Promise.prototype.isFulfilled = function() {
    return this._isdone || this._iserr;
  };

  Promise.prototype.isCancelled = function() {
    return this._iscancelled;
  };

  function join(promises) {
    var p = new Promise();
    var total = promises.length;
    var numdone = 0;
    var results = [];
    
    var isError = false;

    function notifier(i,err) {
      return function() {
        
        if (err) {
          isError = true;
        }
          
        numdone += 1;
        results[i] = Array.prototype.slice.call(arguments);
        if (numdone === total) {
          if (!isError) {
            p.done(results);
          }
          else {
            p.reject();
          }
        }
      };
    }

    for (var i = 0; i < total; i++) {
      promises[i].then(notifier(i,false),notifier(i,true));
    }
    
    if (promises.length===0) {
      p.done();
    }
      
    return p;
  }

  function chain(funcs, args) {
    var p = new Promise();
    if (funcs.length === 0) {
      p.done.apply(p, args);
    } else {
      funcs[0].apply(null, args).then(function() {
        funcs.splice(0, 1);
        chain(funcs, arguments).then(function() {
          p.done.apply(p, arguments);
        });
      });
    }
    return p;
  }

  var promise = {
    Promise: Promise,
    join: join,
    chain: chain
  };

  if (typeof define === "function" && define.amd) {
    /* AMD support */
    define(function() {
      return promise;
    });
  } else {
    exports.promise = promise;
  }

})(this);