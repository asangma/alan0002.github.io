define([
  "intern!object", 
  "intern/chai!assert", 
  "intern/order!sinon",

  "esri/core/JSONSupport"
], function(
  registerSuite, assert, sinon, 
  JSONSupport
) {
  
  registerSuite({
    name: "esri/core/JSONSupport",

    "property class introspection": {
      "by reader": function() {
        var Clazz = JSONSupport.createSubclass({
          _timesTenReader: function(value) {
            return value * 10;
          }
        });
        var instance = Clazz.fromJSON({
          timesTen: 1
        });
        assert.equal(instance.timesTen, 10, "The property reader should be called when reading the JSON");
      },

      "added properties in the metadata": function() {
        var Clazz = JSONSupport.createSubclass({
          classMetadata: {
            reader: {
              add: ["timesTen"]
            }
          },
          _timesTenReader: function(value, source) {
            return source.value * 10;
          }
        });
        var instance = Clazz.fromJSON({
          value: 1
        });
        assert.equal(instance.timesTen, 10, "The property reader should be called when reading the JSON");
      },

      "exclusion by metadata": function() {
        var Clazz = JSONSupport.createSubclass({
          classMetadata: {
            reader: {
              exclude: ["value"]
            }
          }
        });

        var instance = Clazz.fromJSON({
          value: "test"
        });

        assert.notEqual(instance.value, "test", "excluded properties shouldn't be read from JSON");
      }
    },

    "read-only property": function() {
      var Clazz = JSONSupport.createSubclass({
        declaredClass: "Clazz",
        classMetadata: {
          properties: {
            value: {
              readOnly: true
            }
          }
        }
      });

      var instance = new Clazz();

      var callback = sinon.spy();
      var hdl = instance.watch("value", callback);

      assert.doesNotThrow(
        function() {
          instance.read({
            value: 11
          });
        }, TypeError,
        "Cannot assign to read only property 'value' of Clazz", "setting read only properties should throw an error"
      );
      
      instance._accessorProps.dispatch();
      hdl.remove();

      assert.equal(instance.value, 11, "read only property should be read from JSON");
      assert(callback.calledOnce, "watch callback should be called after property changed");
      assert(callback.calledWith(11, undefined, "value"), "watch callback should be newValue, oldValue and property name");
    }
  
  });
});
