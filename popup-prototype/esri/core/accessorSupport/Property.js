define([
  "dojo/has"
],
function(has) {

  var isDebug = has("dojo-debug-messages");

  //--------------------------------------------------------------------------
  //
  //  Property
  //
  //--------------------------------------------------------------------------
  
  var Property = function(name, meta) {
    this.name = name;
    if (meta) {
      this.mixIn(meta);
    }
  };

  
  Property.prototype = {
    name: null,
    getter: null,
    setter: null,
    reader: null,
    getterArity: 0,
    setterArity: 0,
    dependsOn: null,
    chain: null,
    value: undefined,
    readOnly: false,
    copy: null,
    type: null,

    mixIn: function(prop) {
      if (prop.hasOwnProperty("getter")) {
        this.getter = prop.getter;
        this.getterArity = prop.getter.length;
      }
      if (prop.hasOwnProperty("setter")) {
        this.setter = prop.setter;
        this.setterArity = prop.setter.length;
      }
      prop.hasOwnProperty("reader") && (this.reader = prop.reader);
      prop.hasOwnProperty("value") && (this.value = prop.value);
      prop.hasOwnProperty("readOnly") && (this.readOnly = prop.readOnly);
      prop.hasOwnProperty("copy") && (this.copy = prop.copy);
      prop.hasOwnProperty("type") && (this.type = prop.type);

      if (prop.hasOwnProperty("dependsOn")) {
        this.dependsOn = this.dependsOn ? this.dependsOn.concat(prop.dependsOn) : prop.dependsOn.concat();
      }
      if (prop.hasOwnProperty("chain")) {
        if (this.chain){
          this.chain = this.chain.concat(
            prop.chain.filter(function(key) {
              return this.chain.indexOf(key) === -1; 
            }, this)
          );
        }
        else {
          this.chain = prop.chain.concat();
        }
      }
    },

    getDescriptor: function() {
      var prop = this;

      var desc = {
        // list in the keys of the object
        enumerable: true,
        // redefinition is possible
        configurable: true
      };

      desc.get = function() {
        return this._accessorProps ? this._accessorProps.get(prop.name) : undefined;
      };

      desc.set = function(value) {
        var props = this._accessorProps;
        var name = prop.name;

        // When subclassing, the super prototype is newed.
        // Then values from the proto are set on the super prototype copy.
        //
        // We need to remove the temporary the ES5 descriptor, to capture
        // the prototype values. in the example below, the value of one.
        //
        // var SuperClazz = Accessor.createSubclass({
        //   _oneGetter: function(oldValue) {
        //     return oldValue;
        //   }
        // });
        // obj = new SuperClazz();
        // var Clazz = SuperClazz.createSubclass({
        //   one: 1
        // });
        // obj2 = new Clazz();
        if (!props) {
          // console.log("[Property::set] redefining property '%s' on '%s' with value %s", name, this.declaredClass, value);
          Object.defineProperty(this, name, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: value
          });
          return;
        }

        if (Object.isFrozen(this)) {
          return;
        }

        // In an obj, we call the setter
        if (prop.readOnly) {
          throw new TypeError("Cannot assign to read only property '" + name + "' of " + this.declaredClass);
        }
        
        if (isDebug && props.access[name]) {
          throw new Error("[" + this.declaredClass + "] _" + name + "Setter function is trying to write the property");
        }
        
        if (!prop.setter && props.get(name) === value) {
          return value;
        }

        props.access[name] = true;
        props.set(name, value);
        props.access[name] = false;
      };

      return desc;
    }
    
  };

  return Property;
});
