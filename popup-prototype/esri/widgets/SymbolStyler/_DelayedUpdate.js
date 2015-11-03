define([
    "../../core/declare"
  ],
  function (declare) {

    return declare(null, {

      declaredClass: "esri.widgets._DelayedUpdate",

      createUpdateTrigger: function (callback, context) {
        var updateIntervalId = -1;

        return function () {
          if (updateIntervalId > -1) {
            return;
          }

          updateIntervalId = setTimeout(function () {
            updateIntervalId = -1;
            callback.call(context);
          }, 0);
        };
      }

    });

  });
