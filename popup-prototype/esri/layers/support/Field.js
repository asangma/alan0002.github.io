/**
 * Information about each field in a layer. This class has no constructor.
 * 
 * @module esri/layers/support/Field
 * @noconstructor
 * @since 4.0
 * @see module:esri/layers/Layer
 * @see module:esri/layers/FeatureLayer
 */
define(
[
  "../../core/declare",
  "dojo/_base/lang",
  
  "./RangeDomain",
  "./CodedValueDomain"
],
function(declare, lang, RangeDomain, CodedValueDomain) {

  /**
  * @constructor module:esri/layers/support/Field
  */
  var Field = declare(null, 
  /** @lends module:esri/layers/support/Field.prototype */                    
  {
    declaredClass: "esri.layers.support.Field",
    
    constructor: function(json) {
      if (json && lang.isObject(json)) {
        this.name = json.name;
        this.type = json.type;
        this.alias = json.alias;
        this.length = json.length;
        this.editable = json.editable;
        this.nullable = json.nullable;
        var domain = json.domain;
        if (domain && lang.isObject(domain)) {
          switch(domain.type) {
            case "range":
              this.domain = new RangeDomain(domain);
              break;
            case "codedValue":
              this.domain = new CodedValueDomain(domain);
              break;
          }
        } // domain
      }
    }
      
    /**
    * The alias name for the field.
    *
    * @name alias
    * @type {string}
    * @instance
    */
      
    /**
    * The domain associated with the field.
    *
    * @name domain
    * @type {module:esri/layers/support/Domain}
    * @instance
    */
      
    /**
    * Indicates whether the field is editable.
    *
    * @name editable
    * @type {boolean}
    * @instance
    */
      
    /**
    * The field length.
    *
    * @name length
    * @type {number}
    * @instance
    */
      
    /**
    * The name of the field.
    *
    * @name name
    * @type {string}
    * @instance
    */
      
    /**
    * Indicates if the field can accept `null` values. *Requires ArcGIS Server version 10.1 or greater.*
    *
    * @name nullable
    * @type {boolean}
    * @instance
    */
      
    /**
    * The data type of the field.
    * 
    * **Possible Values:** esriFieldTypeSmallInteger | esriFieldTypeInteger | esriFieldTypeSingle | esriFieldTypeDouble | 
    * esriFieldTypeString | esriFieldTypeDate | esriFieldTypeOID | esriFieldTypeGeometry | esriFieldTypeBlob | esriFieldTypeRaster | 
    * esriFieldTypeGUID | esriFieldTypeGlobalID | esriFieldTypeXML
    *
    * @name type
    * @type {string}
    * @instance
    */  
  });
  
  return Field;  
});
