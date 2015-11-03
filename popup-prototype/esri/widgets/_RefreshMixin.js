define(["../core/declare", "dojo/_base/lang", "dojo/_base/Deferred", "dojo/on", "dojo/has", "../kernel"], function (declare, lang, Deferred, on, has, esriNS) {

  function emitError(err) {
    if (typeof err !== "object") {
      err = new Error(err);
    }
    err.grid = this;

    if (on.emit(this.domNode, "dgrid-error", {
      grid: this,
      error: err,
      cancelable: true,
      bubbles: true })) {
      console.error(err);
    }
  }

  var _RefreshMixin = declare(null, {

    _trackError: function (func) {
      var result;

      if (typeof func === "string") {
        func = lang.hitch(this, func);
      }

      try {
        result = func();
      } catch (err) {
        emitError.call(this, err);
      }
      return Deferred.when(
        result,
        // success callback instead of `null` in _StoreMixin:
        lang.hitch(this, function () {
          // fire 'refresh' event
          on.emit(this.domNode, "refresh", {
            cancelable: true,
            bubbles: true
          });
        }),
        lang.hitch(this, emitError)
      );
    }
  });
  return _RefreshMixin;

});