define([
  "intern!object",
  "intern/chai!assert",
  "require"
], function(registerSuite, assert, require) {

  var url = "./Ripple.html";

  registerSuite(function() {
    var session;

    return {
      name: "esri/widgets/Ripple (functional)",

      setup: function() {
        session = this.remote.get(require.toUrl(url));
      },

      "verify widget placement": function() {
        return session
          .sleep(100)
          .findById("viewDiv")
          .click()
          .sleep(100)
          .findByClassName("esri-ripple")
          .getProperty("className")
          .then(function(className){
            assert.include(className, "esri-ripple-visible");
            assert.include(className, "esri-ripple-start");
          });
      }
    };
  });
});
