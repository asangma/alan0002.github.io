define([
  "intern!object", 
  "intern/chai!assert", 
  "esri/identity/Credential",
  "esri/core/Accessor"
], function(
  registerSuite, assert,
  Credential, Accessor
){

  registerSuite({
    name: "esri/identify/Credential",

    "token binding": function() {
      var Clazz = Accessor.createSubclass({
        classMetadata: {
          computed: {
            token: ["credential.token"]
          }
        },
        _tokenGetter: function() {
          return this.get("credential.token") || null;
        }
      });

      var o = new Clazz();
      assert.isNull(o.token, "Token shouldn't be computed");
      o.credential = new Credential();
      assert.isNull(o.token, "Token shouldn't be computed");
      o.credential.token = "test";
      assert.equal(o.credential.token, "test", "Token should be computed");
      
    }
  });

});