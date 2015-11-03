define([
  "intern!object", 
  "intern/chai!assert", 
  "intern/order!sinon",

  "esri/core/Accessor",

  "esri/widgets/Widget"
], function(
  registerSuite, assert, sinon, 
  Accessor,
  Widget
) {

  var assertWatcher = function(instance, property, newValue, expectedNewValue) {
    var oldValue = instance[property],
        callback = sinon.spy();

    if (arguments.length < 4) {
      expectedNewValue = newValue;
    }

    var hdl = instance.watch(property, callback);
    instance[property] = newValue;
    instance._accessorProps.dispatch();
    hdl.remove();

    assert(callback.calledOnce, "watch callback should be called after property changed");
    assert(callback.calledWith(expectedNewValue, oldValue, property), "watch callback should be newValue, oldValue and property name");
  };  
  
  registerSuite({
    name: "esri/core/Accessor",

    "property class introspection": {
      "by getter": function() {
        var Clazz = Accessor.createSubclass({
          _oneGetter: function() {
            return 1;
          }
        });
        var instance = new Clazz();
        assert.equal(instance.one, 1, "getter function should define a property");
      },
      "by getter + prototype value": function() {
        var Clazz = Accessor.createSubclass({
          one: 1,
          _oneGetter: function(oldValue) {
            return oldValue;
          }
        });
        var instance = new Clazz();
        assert.equal(instance.one, 1, "getter function should define a property");
      },
      "by setter": function() {
        var Clazz = Accessor.createSubclass({
          _dividedByTwoSetter: function(value) {
            return value * 0.5;
          }
        });
        var instance = new Clazz();
        instance.dividedByTwo = 10;
        assert.equal(instance.dividedByTwo, 5, "setter should be called");
      },
      "by setter + prototype value": function() {
        var Clazz = Accessor.createSubclass({
          one: 0,
          _oneSetter: function(value) {
            return value;
          }
        });
        var instance = new Clazz();
        assert.equal(instance.one, 0, "the prototype should initialize the property");
        instance.one = 1;
        assert.equal(instance.one, 1, "the property should be overridden");
      }
    },

    "read-only properties": {
      "w/o getter, by value": function() {
        var Clazz = Accessor.createSubclass({
          declaredClass: "Clazz",
          classMetadata: {
            properties: {
              value: {
                readOnly: true
              }
            }
          },
          value: 10
        });

        var instance = new Clazz();
        assert.equal(instance.value, 10, "read only properties should be initialized with prototype value");
        assert.throws(
          function() {
            instance.value = 11;
          }, TypeError,
          "Cannot assign to read only property 'value' of Clazz", "setting read only properties should throw an error"
        );
        assert.notEqual(instance.value, 11, "read only properties shouldn't be writable");
      },

      "w/ getter": function() {
        var Clazz = Accessor.createSubclass({
          declaredClass: "Clazz",
          classMetadata: {
            properties: {
              value: {
                readOnly: true
              }
            }
          },
          _valueGetter: function() {
            return 10;
          }
        });

        var instance = new Clazz();
        assert.equal(instance.value, 10, "read only properties should be initialized with prototype value");
        assert.throws(
          function() {
            instance.value = 11;
          }, TypeError,
          "Cannot assign to read only property 'value' of Clazz", "setting read only properties should throw an error"
        );
        assert.notEqual(instance.value, 11, "read only properties shouldn't be writable");
      }
    },

    "inheritance chain": {
      "value from superclass, getter from subclass": function() {
        var SuperClazz = Accessor.createSubclass({
          one: 1
        });
        var instance = new SuperClazz();
        var Clazz = SuperClazz.createSubclass({
          _oneGetter: function(oldValue) {
            return oldValue;
          }
        });
        instance = new Clazz();
        assert.equal(instance.one, 1, "getter function should define a property");
      },

      "value from superclass, getter from subclass": function() {
        var SuperClazz = Accessor.createSubclass({
          one: 1
        });
        var instance = new SuperClazz();
        var Clazz = SuperClazz.createSubclass({
          _oneGetter: function(oldValue) {
            return oldValue;
          }
        });
        instance = new Clazz();
        assert.equal(instance.one, 1, "getter function should define a property");
      },

      "property values inheritance": function() {
        var A = Accessor.createSubclass({ 
          classMetadata: { 
            properties: { 
              visible: {} 
            }
          },
          visible: true
        });
        var B = A.createSubclass();
        var b = new B();
        
        assert.equal(b.visible, true, "a subclass should inherit its superclass properties");
      },

      "property values dynamically defined": function() {
        var A = Accessor.createSubclass({ 
          value: { value: 10 }
        });
        
        var B = A.createSubclass();
        var b = new B();

        var C = A.createSubclass();
        var c = new C();
        c._accessorProps.setDefault("value", { value: 20 });

        assert.equal(b.value.value, 10, "a subclass should inherit its superclass properties");
      },

      "overridden default values across multiple mixins": function() {
        // B -> A
        // D -> C -> A 
        // "type"" is defined by A
        // B defines a value for "type"
        // C defines a value for "type"
        // D defines a value for "type"

        var A = Accessor.createSubclass({
          declaredClass: "A",
          type: null,
          _typeReader: function() {
            return "A";
          }
        });

        var B = A.createSubclass({
          declaredClass: "B",
          type: "B"
        });
        var b = new B();

        var C = A.createSubclass({
          declaredClass: "C",
          type: "C"
        });
        var D = C.createSubclass({
          declaredClass: "D",
          type: "D"
        });
        var d = new D();

        assert.equal(d.type, "D", "default values should be redefined by mixins");
      },

      "overridden default values": function() {
        var A = Accessor.createSubclass({
          prop: "A",
          _propReader: function(value) {
            return value;
          }
        });
        var B = A.createSubclass({
          prop: "B"
        });
        var b = new B();
        
        assert.equal(b.prop, "B", "subclass should override the default values");
      },
      
      "value from superclass, getter from subclass": function() {
        var SuperClazz = Accessor.createSubclass({
          one: 1
        });
        var instance = new SuperClazz();
        var Clazz = SuperClazz.createSubclass({
          _oneGetter: function(oldValue) {
            return oldValue;
          }
        });
        instance = new Clazz();
        assert.equal(instance.one, 1, "getter function should define a property");
      },

      "getter from superclass, value from subclass": function() {
        var SuperClazz = Accessor.createSubclass({
          _oneGetter: function(oldValue) {
            return oldValue;
          }
        });
        var instance = new SuperClazz();
        var Clazz = SuperClazz.createSubclass({
          one: 1
        });
        instance = new Clazz();
        assert.equal(instance.one, 1, "getter function should define a property");
      },

      "properties from multiple mixins": function() {
        var oneGetter = sinon.spy();
        var twoGetter = sinon.spy();
        var threeGetter = sinon.spy();

        var A = Accessor.createSubclass({
          declaredClass: "A",
          _oneGetter: oneGetter,
          _threeGetter: threeGetter
        });
        var B = Accessor.createSubclass({
          declaredClass: "B",
          _twoGetter: twoGetter,
          _threeGetter: function() {
            this.inherited(arguments);
            return 3;
          }
        });
        var C = Accessor.createSubclass([A, B], {
          declaredClass: "C",
          _threeGetter: function() {
            return this.inherited(arguments);
          }
        });

        instance = new C();
        instance.one;
        instance.two;
        instance.three;

        assert(oneGetter.calledOnce, "inherited getter not called");
        assert(twoGetter.calledOnce, "inherited getter not called");
        assert(threeGetter.calledOnce, "inherited getter not called");
        assert.equal(instance.three, "3", "inheritance not working");

        instance = new B();
        assert.equal(instance.three, 3, "creating a subclass before its superclass shouldn't affect the superclass");
      },

      "overridden prototype defaults": function() {
        var SuperClazz = Accessor.createSubclass({
          classMetadata: {
            properties: {
              fullName: {
                dependsOn: ["firstName", "lastName"]
              }
            }
          },

          firstName: "John",

          lastName: "Doe",

          _fullNameGetter: function() {
            return this.firstName + " " + this.lastName;
          }
        });

        var Clazz = SuperClazz.createSubclass({
          classMetadata: {
            properties: {
              fullName: {
                dependsOn: ["firstName", "lastName"]
              }
            }
          },

          firstName: "Jane",

          lastName: "Doe",

          _fullNameGetter: function() {
            return this.lastName + " " + this.firstName;
          }
        });

        var instance = new Clazz();
        assert.equal(instance.firstName, "Jane", "properties should be initialized with the prototype");
        assert.equal(instance.fullName, "Doe Jane", "properties should be initialized with the prototype");
      },

      "overridden computed chain": function() {
        var DOMContainer = Accessor.createSubclass({
          classMetadata: {
            computed: {
              width: ["size"],
              height: ["size"]
            }
          }
        });

        var View = DOMContainer.createSubclass({
          classMetadata: {
            computed: {
              ready: ["size"]
            }
          },

          _readyGetter: function() {
            return this.size != null;
          }
        });

        var instance = new View({ size: null });
        instance.ready;
        instance.size = [0, 0];
        assert(instance.ready, "computed chain should be merged");
      },

      "call inherited in getter": function() {
        var SuperClazz = Accessor.createSubclass({
          classMetadata: {
            properties: {
              fullName: {
                dependsOn: ["firstName", "lastName"]
              }
            }
          },
          firstName: "John",
          lastName: "Doe",
          _fullNameGetter: function() {
            return this.firstName + " " + this.lastName;
          }
        });

        var Clazz = SuperClazz.createSubclass({        
          _fullNameGetter: function() {
            return this.inherited(arguments) + "!!!!";
          }
        });

        var instance = new Clazz();
        assert.equal(instance.fullName, "John Doe!!!!", "a getter should be able to call the superclass getter");
      }
    },

    "property computing": {
      "one way computing": function() {
        var Clazz = Accessor.createSubclass({
          classMetadata: {
            properties: {
              fullName: {
                readOnly: true,
                dependsOn: ["firstName", "lastName"]
              }
            }
          },

          _fullNameGetter: function() {
            return this.firstName + " " + this.lastName;
          }
        });

        var instance = new Clazz({
          firstName: "John",
          lastName: "Doe"
        });
        assert.equal(instance.get("fullName"), "John Doe", "Computed property should be computed duh!");

        instance = new Clazz({
          firstName: "John",
          lastName: "Doe"
        });
        assert.equal(instance.fullName, "John Doe", "Computed property should be computed duh!");

        instance.firstName = "Jane";
        assert.equal(instance.fullName, "Jane Doe", "Computed property should be re-computed when a dependency change");
      },

      "chained dependencies": function() {
        var Clazz = Accessor.createSubclass({
          classMetadata: {
            properties: {
              hours: {
                dependsOn: ["time"]
              },
              minutes: {
                dependsOn: ["hours"]
              },
              seconds: {
                dependsOn: ["minutes"]
              }
            }
          },
          _hoursGetter: function() {
            return Math.floor(this.time / 3600);
          },
          _minutesGetter: function() {
            return Math.floor((this.time - this.hours * 3600) / 60);
          },
          _secondsGetter: function() {
            return Math.floor(this.time - this.hours * 3600 - this.minutes * 60);
          }
        });
        var instance = new Clazz({
          time: 12 * 3600 + 45 * 60 + 30
        });
        assert.equal(instance.time, 45930, "property with no setters should be set");
        assert.equal(instance.hours, 12, "computed property not computed");
        assert.equal(instance.minutes, 45, "computed property not computed");
        assert.equal(instance.seconds, 30, "computed property not computed");


        instance.watch("time", function(newValue) {
          assert.equal(newValue, 10000, "watcher should be called");
        });
        instance.watch("hours", function(newValue) {
          assert.equal(newValue, 2, "watcher should be called");
        });
        instance.watch("minutes", function(newValue) {
          assert.equal(newValue, 46, "watcher should be called");
        });
        instance.watch("seconds", function(newValue) {
          assert.equal(newValue, 40, "watcher should be called");
        });

        instance.time = 10000;
      },

      "deep properties": function() {
        var obj = new (Accessor.createSubclass({
          classMetadata: {
            computed: {
              aDeepProperty: ["a.deep.property"]
            }
          },
          _aDeepPropertyGetter: function() {
            return this.get("a.deep.property");
          }
        }));

        obj.a = new Accessor({
          deep: new Accessor({
            property: "test"
          })
        });

        assert.equal(obj.aDeepProperty, "test", "deep computing chains should be evaluated");
      },

      "writable computed property": function() {
        var Clazz = Accessor.createSubclass({
          classMetadata: {
            properties: {
              fullName: {
                dependsOn: ["firstName", "lastName"]
              }
            }
          },

          _fullNameGetter: function() {
            return this.firstName + " " + this.lastName;
          },

          _fullNameSetter: function(value, oldValue) {
            var split = value.split(" ");
            this.firstName = split[0];
            this.lastName = split[1] + "e";
          }
        });
        var instance = new Clazz({
          firstName: "John",
          lastName: "Doe"
        });
        instance.fullName = "Jane Do";
        assert.equal(instance.fullName, "Jane Doe", "Setting a computed property should call the setter");
        assert.equal(instance.lastName, "Doe", "Setting a computed property should call the setter");
      },
      
      "initialized with dependencies from getDefaults()": function() {
        var Clazz = Accessor.createSubclass({
          classMetadata: {
            properties: {
              fullName: {
                dependsOn: ["firstName", "lastName"]
              }
            }
          },

          getDefaults: function() {
            return {
              firstName: "John",
              lastName: "Doe"
            };
          },

          _fullNameGetter: function() {
            return this.firstName + " " + this.lastName;
          }
        });
        var instance = new Clazz();
        assert.equal(instance.firstName, "John", "getDefaults() should set the default values");
        assert.equal(instance.fullName, "John Doe", "getDefaults() should compute dependencies");
      },

      "initialized with dependencies from the prototype": function() {
        var Clazz = Accessor.createSubclass({
          classMetadata: {
            properties: {
              fullName: {
                dependsOn: ["firstName", "lastName"]
              }
            }
          },

          firstName: "John",

          lastName: "Doe",

          _fullNameGetter: function() {
            return this.firstName + " " + this.lastName;
          }
        });
        var instance = new Clazz();
        assert.equal(instance.firstName, "John", "properties should be initialized with the prototype");
        assert.equal(instance.fullName, "John Doe", "properties should be initialized with the prototype");
      },

      "computed read-only property w/ getter": function() {
        var Clazz = Accessor.createSubclass({
          declaredClass: "Clazz",
          classMetadata: {
            properties: {
              valueTimesTen: {
                readOnly: true,
                dependsOn: ["value"]
              }
            }
          },
          value: 0,
          _valueTimesTenGetter: function() {
            return this.value * 10;
          }
        });

        var instance = new Clazz();
        assert.equal(instance.valueTimesTen, 0, "read only properties should be computed if necessary");
        assert.throws(function() {
          instance.valueTimesTen = 11;
        }, TypeError, "Cannot assign to read only property 'valueTimesTen' of Clazz", "setting read only properties should throw an error");
        assert.notEqual(instance.valueTimesTen, 11, "read only properties shouldn't be writable");
        instance.value = 10;
        assert.equal(instance.valueTimesTen, 100, "read only properties should be re-computed when a dependency changes");

        var cb1 = sinon.spy();
        var hdl1 = instance.watch("valueTimesTen", cb1);
        instance.value = 10;
        instance._accessorProps.dispatch();
        assert(!cb1.called, "watcher shouldn't be called when the property has the same value");
        instance.value = 100;
        instance._accessorProps.dispatch();
        assert(cb1.calledOnce, "watcher should be called when the computed property has changed");
        assert(cb1.calledWith(1000, 100, "valueTimesTen", instance), "watcher shouldn't be called when the computed property has changed");
      },

      "computed read-only property, manually notified": function() {
        var Clazz = Accessor.createSubclass({
          declaredClass: "TheClazz",
          classMetadata: {
            properties: {
              valueTimesTen: {
                readOnly: true
              }
            }
          },
          _value: 0,
          _valueGetter: function(value) {
            return this._value;
          },
          _valueSetter: function(value) {
            if (this._value !== value) {
              this._value = value;
              this.notifyChange("valueTimesTen");
            }
          },
          _valueTimesTenGetter: function() {
            return this._value * 10;
          }
        });

        var instance = new Clazz();
        assert.equal(instance.valueTimesTen, 0, "read only properties should be computed if necessary");
        assert.throws(function() {
          instance.valueTimesTen = 11;
        }, TypeError, "Cannot assign to read only property 'valueTimesTen' of TheClazz", "setting read only properties should throw an error");
        assert.notEqual(instance.valueTimesTen, 11, "read only properties shouldn't be writable");
        instance.value = 10;
        assert.equal(instance.valueTimesTen, 100, "read only properties should be re-computed when a dependency changes");

        var cb1 = sinon.spy();
        var hdl1 = instance.watch("valueTimesTen", cb1);
        instance.value = 10;
        instance._accessorProps.dispatch();
        assert(!cb1.called, "watcher shouldn't be called when the property has the same value");
        instance.value = 100;
        instance._accessorProps.dispatch();
        assert(cb1.calledOnce, "watcher should be called when the computed property has changed");
        assert(cb1.calledWith(1000, 100, "valueTimesTen", instance), "watcher shouldn't be called when the computed property has changed");
      }
    },

    "watch": {
      "getDefaults does not interfere": function() {
        var watcherSpy = sinon.spy();
        var Clazz = Accessor.createSubclass({
          constructor: function() {
            this.watch("someProp", watcherSpy)
          },
          getDefaults: function() {
            return {
              someProp: "foo"
            };
          }
        });

        var instance = new Clazz();

        instance._accessorProps.dispatch();
        instance.someProp = "bar";
        instance._accessorProps.dispatch();

        assert(watcherSpy.calledOnce, "callback should be called if it has a default defined");
      },

      "deepWatch getDefaults": function() {
        var watcherSpy = sinon.spy();

        var UIProps = Accessor.createSubclass({
          _componentsSetter: function(value) {
            return value || null;
          },
        });

        var Clazz = Accessor.createSubclass({
          classMetadata: {
            properties: {
              ui: {
                type: UIProps
              }
            }
          },
          constructor: function() {
            this.watch("ui.components", watcherSpy);
          },
          getDefaults: function() {
            return {
              ui: {
                components: "bar"
              }
            };
          }
        });

        var instance = new Clazz();
        assert(watcherSpy.notCalled, "callback shouldn't be called if it has a default defined");
      },

      "property created at runtime": function() {
        var Clazz = Accessor.createSubclass({
        });
        var instance = new Clazz();
        assert(!instance.hasOwnProperty("eleven"), "property created at runtime should not be defined");
        assertWatcher(instance, "eleven", 11);
        assert(instance.hasOwnProperty("eleven"), "property created at runtime should be defined after watch()");
      },

      "instance in cache reuse - getter": function() {
        var Clazz = Accessor.createSubclass({
          classMetadata: {
            properties: {
              center: {
                dependsOn: ["value"],
                copy: function(a, b) {
                  a[0] = b[0];
                  a[1] = b[1];
                }
              }
            }
          },
          value: 0,
          _centerGetter: function(cached) {
            if (!cached) {
              cached = [this.value, this.value];
            }
            cached[0] = this.value;
            cached[1] = this.value;
            return cached;
          }
        });

        instance = new Clazz();

        var cb1 = sinon.spy();
        var hdl1 = instance.watch("center", cb1);
        instance.value = 10;

        var cb2 = sinon.spy();
        var hdl2 = instance.watch("center", cb2);
        instance.value = 20;

        var cb3 = sinon.spy();
        var hdl3 = instance.watch("center", cb3);
        instance.value = 30;

        instance._accessorProps.dispatch();

        assert.deepEqual(cb1.getCall(0).args[0], [30, 30], "1: watch callback should be called after property changed");
        assert.deepEqual(cb1.getCall(0).args[1], [0, 0], "1: old value should store the value of the property when the watcher is added");

        assert.deepEqual(cb2.getCall(0).args[0], [30, 30], "2: watch callback should be called after property changed");
        assert.deepEqual(cb2.getCall(0).args[1], [10, 10], "2: old value should store the value of the property when the watcher is added");

        assert.deepEqual(cb3.getCall(0).args[0], [30, 30], "3: watch callback should be called after property changed");
        assert.deepEqual(cb3.getCall(0).args[1], [20, 20], "3: old value should store the value of the property when the watcher is added");
      },

      "instance in cache reuse - setter": function() {
        var Clazz = Accessor.createSubclass({
          classMetadata: {
            properties: {
              currentDate: {
                copy: function(a, b) {
                  a.setTime(b.getTime());
                }
              }
            }
          },
          getDefaults: function() {
            return {
              currentDate: 0
            };
          },
          _currentDateSetter: function(value, cached) {
            if (value == null) {
              return value;
            }
            if (!cached) {
              cached = new Date();
            }
            cached.setTime(value);
            return cached;
          }
        });

        instance = new Clazz();
        
        assert.equal(instance.currentDate.getTime(), 0, "setter should initialize the property with the default value");

        var cb1 = sinon.spy();
        var hdl1 = instance.watch("currentDate", cb1);
        instance.currentDate = 10;

        var cb2 = sinon.spy();
        var hdl2 = instance.watch("currentDate", cb2);
        instance.currentDate = 20;

        var cb3 = sinon.spy();
        var hdl3 = instance.watch("currentDate", cb3);
        instance.currentDate = 30;

        instance._accessorProps.dispatch();

        assert.deepEqual(cb1.getCall(0).args[0].getTime(), 30, "watch callback should be called after property changed");
        assert.deepEqual(cb1.getCall(0).args[1].getTime(), 0, "old value should store the value of the property when the watcher is added");

        assert.deepEqual(cb2.getCall(0).args[0].getTime(), 30, "watch callback should be called after property changed");
        assert.deepEqual(cb2.getCall(0).args[1].getTime(), 10, "old value should store the value of the property when the watcher is added");

        assert.deepEqual(cb3.getCall(0).args[0].getTime(), 30, "watch callback should be called after property changed");
        assert.deepEqual(cb3.getCall(0).args[1].getTime(), 20, "old value should store the value of the property when the watcher is added");

        assert.equal(instance.currentDate.getTime(), 30, "setter should set the value");

        hdl1.remove();
        hdl2.remove();
        hdl3.remove();

        instance.currentDate = null;

        var cb4 = sinon.spy();
        var hdl4 = instance.watch("currentDate", cb4);

        instance.currentDate = 0;

        instance.currentDate = null;
        assert.equal(instance.currentDate, null, "setter should set the value");

        instance.currentDate = 10;
        instance._accessorProps.dispatch();

        assert.deepEqual(cb4.getCall(0).args[0].getTime(), 10, "watch callback should be called after property changed");
        assert.deepEqual(cb4.getCall(0).args[1], null, "old value should store the value of the property when the watcher is added");
      },

      "watch chain": function() {
        var instance = new Accessor();
        var a = new Accessor({
          deep: new Accessor({
            property: "test"
          })
        });

        var spy = sinon.spy();
        var hdl = instance.watch("a.deep.property", spy);
        assert(!instance.hasOwnProperty("a.deep.property"), "watching a chain like 'a.deep.property' should not create a property named 'a.deep.property' on the instance");
        
        instance.a = a;
        instance._accessorProps.dispatch();
        a.deep = "test";
        instance.a._accessorProps.dispatch();

        assert(spy.calledTwice, "callback should be called when a property in the chain has changed");
        assert(spy.getCall(0).calledWith("test", undefined, "a.deep.property", instance), "watcher should be called when a deep property has changed");
        assert(spy.getCall(1).calledWith(undefined, "test", "a.deep.property", instance), "a property undefined in the chain should notify with undefined");

        // assert(hdl.getValue(), 
        // hdl.remove();
      },

      "watch chain on a widget": function() {
        var SubWidget = Widget.createSubclass({
          visible: false,
          _getVisibleAttr: function() {
            return this._get("visible");
          },
          _setVisibleAttr: function(value) {
            return this._set("visible", value);
          }
        });

        var Popup = Widget.createSubclass({
          prop: new SubWidget()
        });
        var View = Accessor.createSubclass({
          classMetadata: {
            properties: {
              popup: { type: Popup }
            }
          }
        });
        var view = new View({
          popup: {}
        });

        assert.equal(view.get("popup.prop.visible"), false, "Accessor::get should be able to get a property in a widget");

        var spy = sinon.spy();
        var hdl = view.watch("popup.prop.visible", spy);
        view.popup.prop.set("visible", !view.get("popup.prop.visible"));
        view._accessorProps.dispatch();

        assert(spy.getCall(0).calledWith(true, false, "popup.prop.visible", view), "watcher should be called when a deep property has changed");

        hdl.remove();
        view.popup.prop.set("visible", !view.get("popup.prop.visible"));
        view._accessorProps.dispatch();
        
        assert(spy.calledOnce, "removing the handle should avoid multiple callback calls");
      }
    },

    "set()": function() {
      var Clazz = Accessor.createSubclass({
        _dividedByTwoSetter: function(value) {
          return value * 0.5;
        }
      });
      var instance = new Clazz();
      instance.set({
        value1: 5,
        dividedByTwo: 5
      });
      instance.set("value2", 5);
      assert.equal(instance.value1, 5, "setter should be called");
      assert.equal(instance.dividedByTwo, 2.5, "setter should be called");
      assert.equal(instance.value2, 5, "setter should be called");
    },
    
    "get()": function() {
      var Clazz = Accessor.createSubclass({
        _dividedByTwoSetter: function(value) {
          return value * 0.5;
        },
        
        dividedByFour: 10,
        _dividedByFourSetter: function(value) {
          return value * 0.25;
        }
      });
      var instance = new Clazz();
      assert.equal(instance.get("dividedByTwo"), undefined, "get should return undefined if a property as no initial value");
      assert.equal(instance.get("dividedByFour"), 10, "get should return the default property value");
    },

    "hasOwnProperty()": {
      "with a property defined by getter": function() {
        var Clazz = Accessor.createSubclass({
          _valueGetter: function(value) {
            return 0.5;
          }
        });
        var instance = new Clazz();
        assert.isFalse(instance.hasOwnProperty("value"));
        assert.equal(instance.value, 0.5);
        // computed properties are cached so they are owned as soon as accessed the first time
        assert.isTrue(instance.hasOwnProperty("value"));
      },

      "with a property defined in the prototype": function() {
        var Clazz = Accessor.createSubclass({
          value: 0.5
        });
        var instance = new Clazz();
        assert.equal(instance.value, 0.5);
        assert.isFalse(instance.hasOwnProperty("value"));
        instance.value = 1;
        assert.isTrue(instance.hasOwnProperty("value"));
      },

      "with a property defined by getDefaults()": function() {
        var Clazz = Accessor.createSubclass({
          getDefaults: function() {
            return {
              value: 0.5
            };
          }
        });
        var instance = new Clazz();
        assert.equal(instance.value, 0.5);
        assert.isTrue(instance.hasOwnProperty("value"));
      }
    },

    "getDefaults" : {
      "should call setter": function() {
        var Clazz = Accessor.createSubclass({
          getDefaults: function() {
            return {
              value: 0.5
            };
          },
          _valueSetter: function(value) {
            return value * 2;
          }
        });
        var instance = new Clazz();
        assert.equal(instance.value, 1);
      }
    },

    "Type Class": {
      "should convert on construct": function() {
        var ValueClass = function ValueClass(value) {
          this.value = value;
        };

        var Clazz = Accessor.createSubclass({
          classMetadata: {
            properties: {
              value: {
                type: ValueClass
              }
            }
          }
        });

        var instance = new Clazz({
          value: 2
        });

        assert.instanceOf(instance.value, ValueClass);
        assert.equal(instance.value.value, 2);
      },

      "should convert defaults": function() {
        var ValueClass = function ValueClass(value) {
          this.value = value;
        };

        var Clazz = Accessor.createSubclass({
          classMetadata: {
            properties: {
              value: {
                type: ValueClass
              }
            }
          },

          getDefaults: function() {
            return {
              value: 2
            };
          }
        });

        var instance = new Clazz();

        assert.instanceOf(instance.value, ValueClass);
        assert.equal(instance.value.value, 2);
      },

      "should convert on set": function() {
        var ValueClass = function ValueClass(value) {
          this.value = value;
        };

        var Clazz = Accessor.createSubclass({
          classMetadata: {
            properties: {
              value: {
                type: ValueClass
              }
            }
          }
        });

        var instance = new Clazz();
        instance.value = 2;

        assert.instanceOf(instance.value, ValueClass);
        assert.equal(instance.value.value, 2);
      },

      "ignores destroy() after destruction": function() {
        var instance = new Accessor();

        assert.doesNotThrow(function() {
          instance.destroy();
          instance.destroy();
        });
      }
    }
  });
});
