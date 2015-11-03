define(
[
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  
  "../../core/lang",
  
  "../../symbols/support/jsonUtils",
  
  "./RangeDomain",
  "./CodedValueDomain",
  "./InheritedDomain",
  "./FeatureTemplate"
],
function(
  declare, lang, array,
  esriLang, 
  jsonUtils,
  RangeDomain, CodedValueDomain, InheritedDomain, FeatureTemplate
) {

  /**************************
   * esri.layers.FeatureType
   **************************/
  
  var FeatureType = declare(null, {
    declaredClass: "esri.layers.support.FeatureType",
    
    constructor: function(json) {
      if (json && lang.isObject(json)) {
        this.id = json.id;
        this.name = json.name;
  
        var symbol = json.symbol;
        
        if (symbol) {
          this.symbol = jsonUtils.fromJSON(symbol);
        }
        
        // domains
        var domains = json.domains, field, i;
        var domainObjs = this.domains = {};
        for (field in domains) {
          if (domains.hasOwnProperty(field)) {
            var domain = domains[field];
            switch(domain.type) {
              case "range":
                domainObjs[field] = new RangeDomain(domain);
                break;
              case "codedValue":
                domainObjs[field] = new CodedValueDomain(domain);
                break;
              case "inherited":
                domainObjs[field] = new InheritedDomain(domain);
                break;
            }
          } // if
        }
        
        // templates
        var templates = json.templates;
        if (templates) {
          var templateObjs = this.templates = [];
          for (i = 0; i < templates.length; i++) {
            templateObjs.push(new FeatureTemplate(templates[i]));
          }
        }
        
      } // json
    },

    toJson: function() {
      try {
        throw new Error("toJson is deprecated, use toJSON instead");
      }
      catch (e) {
        console.warn(e.stack);
      }

      return this.toJSON();
    },

    toJSON: function() {
      var json = {
        id: this.id,
        name: this.name,
        symbol: this.symbol && this.symbol.toJSON()
      };
      
      var field, domains = this.domains, templates = this.templates, sanitize = esriLang.fixJson;
      if (domains) {
        var newCopy = json.domains = {};
        for (field in domains) {
          if (domains.hasOwnProperty(field)) {
            newCopy[field] = domains[field] && domains[field].toJSON();
          }
        }
        sanitize(newCopy);
      }
      if (templates) {
        json.templates = array.map(templates, function(template) {
          return template.toJSON();
        });
      }
      
      return sanitize(json);
    }
  });
  
  return FeatureType;  
});
