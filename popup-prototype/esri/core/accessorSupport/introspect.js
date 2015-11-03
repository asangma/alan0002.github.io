define([
  "dojo/_base/lang",
  
  "./Property",
  "./PropertyNotifier",
  "./merge"
], function(
  lang,
  Property, PropertyNotifier, merge
) {

  var create = function(proto) {
    return Object.create(proto === undefined ? null : proto);
  };

  /**
   * regexp of known functions name syntaxes
   * @private
   */
  var PROPERTY_REGEXP = /^_([a-zA-Z0-9]+)(Getter|Setter|Reader)$/;

  var canIntrospect = function(obj) {
    return obj && getDojoMeta(obj) != null;
  };

  var getCtor = function(obj) {
    var ctor = obj._meta ? obj : obj.constructor;
    return ctor;
  };

  var getDojoMeta = function(obj) {
    return getCtor(obj)._meta;
  };

  var isIntrospected = function(obj) {
    return getCtor(obj)._esriMeta != null;
  };
  
  var getProperties = function(obj) {
    return getMeta(obj).classMetadata.properties;
  };

  var hasProp = Object.prototype.hasOwnProperty;

  /**
   * Get or create the metadata for a mixin.
   * metadata from multiple mixins are mixed together
   * when the class is instrospected
   */
  var getMixinMetadata = function(ctor) {
    if (!canIntrospect(ctor)) {
      return null;
    }
    var meta = getMeta(ctor);
    var mixinMeta = meta.mixin;
    if (mixinMeta) {
      return mixinMeta;
    }

    var proto = ctor.prototype;
    var classMetadata = hasProp.call(proto, "classMetadata") ? proto.classMetadata : create();
    
    mixinMeta = meta.mixin = {
      declaredClass: proto.declaredClass,
      properties: classMetadata.properties ? merge(create(), classMetadata.properties) : create(),
      reader: classMetadata.reader ? merge(create(), classMetadata.reader) : create(),
      notifiers: []
    };

    var properties = mixinMeta.properties;

    var getProp = function(name) {
      name = name.split(".")[0];
      if (!properties[name]) {
        properties[name] = {};
      }
      return properties[name];
    };

    // introspect the prototype
    Object.getOwnPropertyNames(proto).forEach(function(key) {
      var value = proto[key],
          regxprResult = PROPERTY_REGEXP.exec(key),
          name, type, prop;
      if (regxprResult) {
        name = regxprResult[1];
        type = regxprResult[2];
        prop = getProp(name);
        // type: getter, setter, reader
        prop[type.toLowerCase()] = value;
      }
    });

    // look for the computed properties shortcut
    //
    // classMetadata: {
    //   computed: {
    //     prop: ["test"]
    //   }
    // }
    meta = classMetadata.computed;
    if (meta) {
      Object.getOwnPropertyNames(meta).forEach(function(name) {
        var prop = getProp(name);
        merge(prop, {
          dependsOn: Array.isArray(meta[name]) ? meta[name] : [meta[name]]
        });
        prop.dependsOn.forEach(getProp);
      });
    }

    resolveComputingChains(ctor);
    
    // Inspect the properties metadata to find if we have a value in the prototype
    Object.getOwnPropertyNames(properties).forEach(function(name) {
      if (ownsProperty(proto, name)) {
        properties[name].value = proto[name];
      }
    });

    // Create Properties instances
    mixinMeta.properties = Object.getOwnPropertyNames(properties).reduce(function(props, name) {
      props[name] = new Property(name, properties[name]);
      return props;
    }, {});

    return mixinMeta;
  };

  var resolveComputingChains = function(ctor) {
    var meta = getMeta(ctor),
      mixinMeta = meta.mixin,
      properties = mixinMeta.properties,
      dependencies = create(), 
      dependsOn, name, dep, chain, queue, 
      discovered, adjacentEdges, i;
    
    if (!properties) {
      return;
    }

    // Calculate the dependency chain.
    // 
    // The dependencies can be seen as a tree structure.
    //
    //   A ─ B ─ D     If A is set, compute B, then C, then D
    //       └ ─ C
    //
    // uses a breadth-first search to resolve the chain
    // http://en.wikipedia.org/wiki/Breadth-first_search
    // http://en.wikipedia.org/wiki/Dependency_graph

    // inverse the dependencies
    // A: ["B", "C"] => B: ["A"], C: ["A"]

    /*jshint -W089 */
    for (name in properties) {
      dependsOn = properties[name].dependsOn;
      if (dependsOn) {
        for (i = 0; (dep = dependsOn[i]); i++) {
          if (!dependencies[dep]) {
            dependencies[dep] = [name];
          } 
          else {
            if (dependencies[dep].indexOf(name) === -1) {
              dependencies[dep].push(name);
            }
          }
        }
      }
    }
    
    queue = [];
    /*jshint -W089 */
    for (name in dependencies) {
      chain = [];
      discovered = create();
      
      queue.push(name);
      
      while (queue.length) {
        dep = queue.shift();
        if (!discovered[dep]) {
          discovered[dep] = true;
          chain.push(dep);
          adjacentEdges = dependencies[dep];
          if (adjacentEdges) {
            Array.prototype.push.apply(queue, adjacentEdges);
          }
        }
      }
      
      chain.shift();

      if (name.indexOf(".") > -1) {
        if (!mixinMeta.notifiers) {
          mixinMeta.notifiers = [];
        }
        mixinMeta.notifiers.push(new PropertyNotifier(name, chain));
        name = name.split(".")[0];
      }

      if (!properties[name]) {
        // Define the property if it wasn't before.
        // A {
        //   a: 10 
        // }
        // B {
        //   classMetadata: {
        //     computed: {
        //       b: ['a']
        //     }
        //   }
        //   ...
        // }
        
        var owner = getPropertyOwner(ctor, name);
        if (owner) {
          if (!getMeta(owner).mixin.properties[name]) {
            getMeta(owner).mixin.properties[name] = new Property(name, {
              value: getPropertyOwnerValue(ctor, name),
              chain: chain
            });
          }
        }
        else {
          mixinMeta.properties[name] = new Property(name, {
            chain: chain
          });
        }
      }
      else {
        // set the chain on the property
        properties[name].chain = chain;
      }
    }
  };

  var getMeta = function(obj) {
    if (!canIntrospect(obj)) {
      return null;
    }
    var ctor = getCtor(obj),
        meta = ctor._esriMeta;
    if (meta) {
      return meta;
    }

    meta = ctor._esriMeta = {};
    
    // Go through all the base mixins and create the metadata for each of them if they don't exist.
    var bases = getDojoMeta(obj).bases;
    var mixins = meta.mixins = [];
    var mixin;
    for (i = bases.length - 1; i >= 0; i--) {
      // console.log(padText("get mixin metadata " + bases[i].prototype.declaredClass));
      mixin = getMixinMetadata(bases[i]);
      if (mixin) {
        mixins.unshift(mixin);
      }
    }

    // Merge
    var cmeta = meta.classMetadata = {
      declaredClass: ctor.prototype.declaredClass,
      notifiers: [],
      properties: {},
      reader: {}
    };

    var props = cmeta.properties;
    var name, i;

    // console.log("merging mixins for class %s", cmeta.declaredClass);

    for (i = mixins.length - 1; i >= 0; i--) {
      mixin = mixins[i];
      for (name in mixin.properties) {
        defineProperty(ctor, name);
        if (!props[name]) {
          props[name] = new Property(name, mixin.properties[name]);
          if (!props[name].hasOwnProperty("value") && getPropertyOwner(ctor, name)) {
            props[name].value = getPropertyOwnerValue(ctor, name);
          }
          // console.log("define prop on " + ctor.prototype.declaredClass)
          Object.defineProperty(ctor.prototype, name, props[name].getDescriptor());
        }
        else {
          props[name].mixIn(mixin.properties[name]);
        }
      }
      cmeta.notifiers = cmeta.notifiers.concat(meta.mixins[i].notifiers);
      cmeta.reader = merge(cmeta.reader, meta.mixins[i].reader);
    }

    // console.log(ctor.prototype.declaredClass, meta);

    return meta;
  };

  var getPropertyValue = function(ctor, name) {
    if (!ctor) {
      return undefined;
    }
    var descriptor = Object.getOwnPropertyDescriptor(ctor.prototype, name);
    if (descriptor) {
      return descriptor.value;
    }
    return ctor.prototype[name];
  };

  var installPropertyNotifiers = function(obj) {
    var notifiers = getMeta(obj).classMetadata.notifiers;
    if (notifiers) {
      return notifiers.map(function(notifier) {
        return notifier.install(this);
      }, obj);
    }
    return [];
  };

  var getPropertyOwnerValue = function(obj, name) {
    if (hasProp.call(obj, name)) {
      return obj[name];
    }
    var ctor = getPropertyOwner(obj, name);
    return getPropertyValue(ctor, name);
  };

  var ownsProperty = function(proto, name) {
    var desc;
    return hasProp.call(proto, name) &&
      (!(desc = Object.getOwnPropertyDescriptor(proto, name)) || hasProp.call(desc, "value"));
  };

  var getPropertyOwner = function(obj, name) {
    var dojoMeta = getDojoMeta(obj);
    var bases = dojoMeta.bases;
    var ctor, meta, prop;
    for (var i = 0, n = bases.length; i < n; i++) {
      ctor = bases[i];
      meta = getMeta(ctor);
      prop = meta && meta.mixin.properties[name];

      // check if the prototype has the property defined as a value
      if (ownsProperty(ctor.prototype, name)) {
        return ctor;
      }

      // check if the property is defined with classMetadata or accessor functions
      else if (prop && hasProp.call(prop, "value")) {
        return ctor;
      }
    }
    return null;
  };

  var defineProperty = function(obj, name) {
    var ctor = getCtor(obj);
    var props = getMeta(ctor).classMetadata.properties;

    // A property can be defined in a mixin but the property value is in another one.
    // Ensure that other mixin has the property.
    var owner = getPropertyOwner(ctor, name) || ctor;
    var mixinProps = owner ? getMeta(owner).mixin.properties : {};

    var prop = mixinProps[name];
    var protoProps;

    // owner && console.log(getMeta(owner).mixin !== mixin, getMeta(owner).mixin.declaredClass, prop, mixin.declaredClass);
    if (owner && !prop) {            
      prop = mixinProps[name] = new Property(name, {
        value: getPropertyValue(owner, name)
      });

      // Save the property in the mixin
      // console.log("defining property %s on mixin %s with value %s", name, getMeta(owner).mixin.declaredClass, name, prop.value);
      getMeta(owner).mixin.properties[name] = new Property(name, prop);

      // the proto of owner has the property, inherited from a mixin
      // update the value.
      protoProps = getMeta(owner).classMetadata.properties;
      if (protoProps[name]) {
        protoProps[name].value = prop.value;
      }
      else {
        protoProps[name] = prop;
        // console.log("defining property '%s' on mixin '%s' with value %s", name, owner.prototype.declaredClass, prop.value);
        Object.defineProperty(owner.prototype, name, prop.getDescriptor());
      }
    }

    if (ctor !== owner) {
      if (props[name]) {
        props[name].value = prop.value;
      }
      else {
        props[name] = new Property(name, prop);
        // console.log("defining property '%s' on mixin '%s' with value %s", name, owner.prototype.declaredClass, prop.value);
        Object.defineProperty(ctor.prototype, name, prop.getDescriptor());
      }
    }

    return prop;
  };

  return lang.mixin(
    function introspect(obj) {
      return getMeta(obj);
    }, {
      getProperties: getProperties,
      isIntrospected: isIntrospected,
      getPropertyOwnerValue: getPropertyOwnerValue,
      getPropertyOwner: getPropertyOwner,
      installPropertyNotifiers: installPropertyNotifiers,
      defineProperty: defineProperty
    });

});