/**
 * JSONSupport provides an Accessor subclass,
 * which offers the capability of hydrating objects from a JSON object.
 * 
 * It includes support methods for working with JSON. 
 * 
 * @module esri/core/JSONSupport
 * @mixin
 * @since 4.0
 */
define([
  "dojo/has",
  "dojo/_base/lang",

  "./declare",
  "./Accessor",

  "./accessorSupport/introspect"
], 
function(
  has,
  lang,
  declare, Accessor,
  introspect
) {

  var isDebug = has("dojo-debug-messages");

  var msgPropAddAndExclude = function(name, modName) {
    return "[JSONSupport] property '" + name + "' in module '" +  modName + "' cannot be both read and excluded from JSON.";
  };

  var msgPropExcluded = function(name, modName) {
    return "[JSONSupport] property '" + name + "' in module '" +  modName + "' cannot be excluded from JSON and have a _" + name + "Reader function.";
  };

  var msgReaderMissing = function(name, modName) {
    return "[JSONSupport] property '" + name + "' in module '" +  modName + "' won't be read from JSON, reader function _" + name + "Reader is missing.";
  };

  var error = Function.prototype.bind.call(console.error, console);

  var JSONSUPPORT = "esri.core.JSONSupport";
 
  var JSONSupport = declare(Accessor, 
  /** @lends module:esri/core/JSONSupport */                          
  {

    declaredClass: JSONSUPPORT,

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    /**
     * Set properties with default values from a JSON object.
     *
     * @param {object} obj - a JSON representation of the instance.
     * @return {this}
     * @private
     */
    read: function(json) {
      var meta = introspect(this).classMetadata;
      var props = this._accessorProps;
      var properties = meta.properties;
      var config = meta.reader;
      var add = config && config.add;
      var exclude = config && config.exclude;
      var name, value, reader;

      var toRead = Object.getOwnPropertyNames(json);

      if (exclude) {
        toRead = toRead.filter(function(name) {
          return exclude.indexOf(name) === -1;
        });
      }

      if (add) {
        toRead = toRead.concat(add);
      }

      for (var i = 0; (name = toRead[i]); i++) {
        value = json[name];
        reader = properties[name] && properties[name].reader;
        props.setDefault(name, reader ? reader.call(this, value, json) : value);
      }

      return this;
    },

    toJson: function() {
      try {
        throw new Error("toJson is deprecated, use toJSON instead");
      }
      catch (e) {
        console.warn(e.stack);
      }

      return this.toJSON.apply(this, arguments);
    }
  });

  /**
   * Creates a new instance of [this class]() and initializes it with values from a JSON object
   * generated from a product in the ArcGIS platform. The object passed into the input `json` 
   * parameter often comes from a response to a query operation in the REST API or a 
   * [toJSON()](http://pro.arcgis.com/en/pro-app/tool-reference/conversion/features-to-json.htm) 
   * method from another ArcGIS product. See the [Using fromJSON()](../guide/using-fromjson) 
   * topic in the Guide for details and examples of when and how to use this function.
   * 
   * @method fromJSON 
   * @memberof module:esri/core/JSONSupport
   * @static
   * @param {Object} json - A JSON representation of the instance in the ArcGIS format. See
   *                      the [ArcGIS REST API documentation](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Classification_objects/02r30000019z000000/) for examples of the structure of
   *                       various input JSON objects.
   *                      
   * @return {*} Returns a new instance of this class.
   */
  var fromJSON = function(json) {
    if (!json) {
      return null;
    }
    if (json.declaredClass) {
      throw new Error("JSON object is already hydrated");
    }
    var Ctor = this;
    var instance = new Ctor();
    instance.read(json);
    return instance;
  };

  declare.after(function(ctor) {
    if (!declare.hasMixin(ctor, JSONSUPPORT)) {
      return;
    }
    // add JSON static methods
    ctor.fromJSON = fromJSON.bind(ctor);

    // Validate the metadata configuration
    // by looking at incompatibilities:
    //   - Property excluded from reading, but reader defined.
    var meta = lang.getObject("_esriMeta.classMetadata", false, ctor);
    var properties = meta.properties;
    var add = lang.getObject("reader.add", false, meta);
    var exclude = lang.getObject("reader.exclude", false, meta);

    if (isDebug) {
      if (add && exclude) {
        add.slice().filter(function(name) {
          return exclude.indexOf(name) !== -1;
        }).forEach(function(name) {
          error(msgPropAddAndExclude(name, this.declaredClass));
        }, this);
      }
      if (exclude && properties) {
        exclude.slice().filter(function(name) {
          return !!properties[name] && properties.reader;
        }).forEach(function(name) {
          error(msgPropExcluded(name, this.declaredClass));
        }, this);
      }
      if (add && !properties) {
        add.forEach(function(name) {
          error(msgReaderMissing(name, this.declaredClass));
        }, this);
      }
    }

    if (add && properties) {
      add.slice().filter(function(name) {
        return !properties[name] || !properties[name].reader;
      }).forEach(function(name) {
        add.splice(add.indexOf(name), 1);
        if (isDebug) {
          error(msgReaderMissing(name, this.declaredClass));
        }
      }, this);
    }
  });
  
  return JSONSupport;
});
