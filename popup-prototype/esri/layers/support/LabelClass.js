define(
[
  "../../core/declare",
  "dojo/_base/lang",

  "dojo/number",
  "../../widgets/Popup/PopupRenderer",
  
  "../../core/lang",
  "../../core/screenUtils",

  "../../symbols/TextSymbol",
  "../../symbols/LabelSymbol3D",
  "../../symbols/ShieldLabelSymbol"
],
function(
  declare, lang,
  number, PopupRenderer,
  esriLang, screenUtils,
  TextSymbol, LabelSymbol3D, ShieldLabelSymbol
) {

  var LabelClass = declare(null, {
    declaredClass: "esri.layers.support.LabelClass",
    
    labelPlacement: null,
    labelExpression: null,
    useCodedValues: null,
    symbol: null,
    maxScale: 0,
    minScale: 0,
    where: null,
    sizeInfo: null, // new in JS API (not defined in ArcGIS REST API)
    
    _labelPlacementLookup: {
      "above-center": "esriServerPointLabelPlacementAboveCenter",
      "above-left": "esriServerPointLabelPlacementAboveLeft",
      "above-right": "esriServerPointLabelPlacementAboveRight",
      "below-center": "esriServerPointLabelPlacementBelowCenter",
      "below-left": "esriServerPointLabelPlacementBelowLeft",
      "below-right": "esriServerPointLabelPlacementBelowRight",
      "center-center": "esriServerPointLabelPlacementCenterCenter",
      "center-left": "esriServerPointLabelPlacementCenterLeft",
      "center-right": "esriServerPointLabelPlacementCenterRight",
      "above-after": "esriServerLinePlacementAboveAfter",
      "above-along": "esriServerLinePlacementAboveAlong",
      "above-before": "esriServerLinePlacementAboveBefore",
      "above-start": "esriServerLinePlacementAboveStart",
      "above-end": "esriServerLinePlacementAboveEnd",
      "below-after": "esriServerLinePlacementBelowAfter",
      "below-along": "esriServerLinePlacementBelowAlong",
      "below-before": "esriServerLinePlacementBelowBefore",
      "below-start": "esriServerLinePlacementBelowStart",
      "below-end": "esriServerLinePlacementBelowEnd",
      "center-after": "esriServerLinePlacementCenterAfter",
      "center-along": "esriServerLinePlacementCenterAlong",
      "center-before": "esriServerLinePlacementCenterBefore",
      "center-start": "esriServerLinePlacementCenterStart",
      "center-end": "esriServerLinePlacementCenterEnd",
      "always-horizontal": "esriServerPolygonPlacementAlwaysHorizontal"
    },
    
    constructor: function(/*Object*/ json) {
      if (json) {
        lang.mixin(this, json);
        
        if (!this._labelPlacementLookup.hasOwnProperty(this.labelPlacement)) {
          this.labelPlacement = esriLang.valueOf(this._labelPlacementLookup, json.labelPlacement);
        }
        
        if (json.symbol) {
          if(json.symbol.declaredClass) {
            this.symbol = json.symbol;
          }
          else if(json.symbol.type === "LabelSymbol3D"){
            this.symbol = LabelSymbol3D.fromJSON(json.symbol);
          }
          else if(json.symbol.type === "esriSHD") {
            this.symbol = new ShieldLabelSymbol(json.symbol);
          }
          else {
            this.symbol = TextSymbol.fromJSON(json.symbol);
          }
        }
        
        var sizeInfo = this.sizeInfo;
        
        // Convert size values from points to pixels
        if (sizeInfo) {
          if (sizeInfo.minSize) {
            sizeInfo.minSize = screenUtils.pt2px(sizeInfo.minSize);
          }
          
          if (sizeInfo.maxSize) {
            sizeInfo.maxSize = screenUtils.pt2px(sizeInfo.maxSize);
          }
        }
      }

    },
    
    getSymbol: function() {
      return this.symbol;
    },

    getRequiredFields: function() {
      var required = Object.create(null);
      this.collectRequiredFields(required);
      return Object.keys(required);
    },

    collectRequiredFields: function(fields) {
      LabelClass.collectLabelExpressionRequiredFields(this.getLabelExpression(), fields);
      LabelClass.collectWhereRequiredFields(this.where, fields);
    },

    /**
     * this method read labelExpression from labelingInfo
     * we can get label text from two sources:
     * 1 labelExpressionInfo.value, syntax like "{CITY_NAME}"
     * 2 labelExpression, syntax like "[NAME]blabla[NAME]"
     *
     * the method also change syntax from [CITY_NAME] to {CITY_NAME}
     * @private
     */
    getLabelExpression: function() {
      if(this.labelExpressionInfo) {
        return this.labelExpressionInfo.value;
      } else if(LabelClass.isValidLabelExpression(this.labelExpression)) {
        return LabelClass._convertLabelExpression(this.labelExpression); // convert [...] -> {...}
      }
      return "";
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
      var sizeInfo = this.sizeInfo;
      
      if (sizeInfo) {
        sizeInfo = lang.mixin({}, sizeInfo);

        // Convert size values from pixels to points
        if (sizeInfo.minSize) {
          sizeInfo.minSize = screenUtils.px2pt(sizeInfo.minSize);
        }
        
        if (sizeInfo.maxSize) {
          sizeInfo.maxSize = screenUtils.px2pt(sizeInfo.maxSize);
        }
      }

      var json = {
        labelExpression:     this.labelExpression,
        
        // labelExpressionInfo.value is similar to PopupInfo.description 
        // as defined in WebMap spec:
        // http://resources.arcgis.com/en/help/arcgis-rest-api/#/popupInfo/02r300000042000000/
        labelExpressionInfo: this.labelExpressionInfo && lang.clone(this.labelExpressionInfo),
        
        useCodedValues: this.useCodedValues,
        maxScale:       this.maxScale,
        minScale:       this.minScale,
        where:          this.where,
        sizeInfo:       sizeInfo,
        
        labelPlacement: this._labelPlacementLookup.hasOwnProperty(this.labelPlacement)
          ? this._labelPlacementLookup[this.labelPlacement]
          : this.labelPlacement,

        symbol: this.symbol && this.symbol.toJSON()
      };

      return esriLang.fixJson(json);
    }
  });

  /**
   * the only syntax allowed:
   * POP_RANK = 1
   * or
   * POP_RANK > 2 AND POP_RANK < 4
   */
  LabelClass.evaluateWhere = function(where, attributes) {
    // only support simple SQL:  'POP_RANK = 1'
    var _sqlEquation = function(a1, sign, a2) {
      switch(sign) {
        case "=": return (a1 == a2) ? true : false;
        case "<>": return (a1 != a2) ? true : false;
        case ">": return (a1 > a2) ? true : false;
        case ">=": return (a1 >= a2) ? true : false;
        case "<": return (a1 < a2) ? true : false;
        case "<=": return (a1 <= a2) ? true : false;
      }
      return false;
    };

    try {
      // no apply filter
      if(where == null) {
        return true;
      }
      // apply filter
      var res = where.split(" "); // split SQL string in parts
      if(res.length === 3) { // SQL syntax: 'POP_RANK = 1'
        return _sqlEquation(attributes[res[0]], res[1], res[2]);
      }
      if(res.length === 7) { // SQL syntax: 'POP_RANK > 2 AND POP_RANK < 4'
        var b1 = _sqlEquation(attributes[res[0]], res[1], res[2]);
        var sign = res[3];
        var b2 = _sqlEquation(attributes[res[4]], res[5], res[6]);
        switch(sign) {
          case "AND": return b1 && b2;
          case "OR": return b1 || b2;
        }
      }
      return false;
    } catch(error) {
      console.log("Error.: can't parse = " + where);
    }
  };

  LabelClass.collectWhereRequiredFields = function(where, fields) {
    if (where == null) {
      return;
    }
    var res = where.split(" "); // split SQL string in parts
    if(res.length === 3) { // SQL syntax: 'POP_RANK = 1'
      fields[res[0]] = true;
    }
    if(res.length === 7) { // SQL syntax: 'POP_RANK > 2 AND POP_RANK < 4'
      fields[res[0]] = true;
      fields[res[4]] = true;
    }
  };

  LabelClass.collectLabelExpressionRequiredFields = function(labelExpression, fields) {
    var matches = labelExpression.match(/{[^}]*}/g);
    if (matches) {
      matches.forEach(function (bracedName) {
        fields[bracedName.slice(1, -1)] = true;
      });
    }
  };

  LabelClass.buildLabelText = function(labelExpression, attributes, fields, options) {
    // replace {fieldname} for real value
    var result = labelExpression.replace(/{[^}]*}/g, function (bracedName) {
      return LabelClass.formatField(bracedName.slice(1,-1), bracedName, attributes, fields, options); // use {NAME} as default
    });
    return result;
  };

  LabelClass.formatField = function(name, defaultValue, attributes, fields, options) {
    var i, k;
    var text = defaultValue;
    for (i = 0; i < fields.length; i++) {
      if (fields[i].name == name) {
        // get field text
        text = attributes[fields[i].name]; // esriLang.substitute(attributes, bracedName, {first: true});
        // support domain
        var domain = fields[i].domain;
        if (domain && lang.isObject(domain)) {
          if (domain.type == "codedValue") {
            for (k = 0; k < domain.codedValues.length; k++) {
              if (domain.codedValues[k].code == text) {
                text = domain.codedValues[k].name; // replace text for value from domain
              }
            }
          } else if (domain.type == "range") {
            if (domain.minValue <= text && text <= domain.maxValue) { // TODO '<=' or '<' ?
              text = domain.name; // replace text for value from domain
            }
          }
          return (text == null) ? "" : text;
        }
        //
        // support DateFormat
        var fieldType = fields[i].type;
        if (fieldType == "esriFieldTypeDate") {
          var dateFormat = options && options.dateFormat || "shortDate"; // default "shortDate"
          var formatString = "DateFormat" + PopupRenderer.prototype._dateFormats[dateFormat];
          if (formatString) {
            text = esriLang.substitute({"myKey": text}, "${myKey:" + formatString + "}");//, substOptions); // format text
          }
        } else if (fieldType == "esriFieldTypeInteger" ||
            fieldType == "esriFieldTypeSmallInteger" ||
            fieldType == "esriFieldTypeLong" ||
            fieldType == "esriFieldTypeDouble") {
          if (options && options.numberFormat && options.numberFormat.digitSeparator && options.numberFormat.places) {
            text = number.format(text, {"places": options.numberFormat.places}); // format text
          }
        }
        //
      }
    }
    return (text == null) ? "" : text;
  };

  /**
   * when textExptression taken from labelRenderer.labelExpression
   * the only syntax is allowed '[abcd] [abcd] [abcd] ....'
   * @private
   */
  LabelClass.isValidLabelExpression = function(expr) {
    var reSupportedSyntax = /^(\s*\[[^\]]+\]\s*)+$/i;
    return reSupportedSyntax.test(expr);
  };

  /**
   * convert syntax [NAME] => "{NAME}"
   * @private
   */
  LabelClass._convertLabelExpression = function(expr) {
    return expr.replace(new RegExp("\\[", "g"), "{").replace(new RegExp("\\]", "g"), "}");
  };

  return LabelClass;
});
