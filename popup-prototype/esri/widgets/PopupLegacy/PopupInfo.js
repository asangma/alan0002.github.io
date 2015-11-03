/**
 * Mixin for PopupTemplate
 * 
 * @module esri/portal/PopupInfo
 * @mixin
 * @since 4.0
 * @see module:esri/widgets/PopupTemplate
 */
define(
[
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/Deferred",
  "dojo/sniff",
  "dojo/promise/all",
  
  "../../core/lang",
  "../../request",
  "../../tasks/support/Query",
  "../../tasks/QueryTask",
  "../../tasks/support/StatisticDefinition",
  "dojo/i18n!dojo/cldr/nls/number"
],
function(
  declare, lang, array, Deferred, sniff, all,
  esriLang, esriRequest, Query, QueryTask, StatisticDefinition, jsapiBundle
) {

  /*************************
   * esri.PopupInfoTemplate
   * 
   * Sub-classes MUST override getTitle and getContent methods
   * and can make use of helpers: getComponents and getAttachments
   *************************/
  
  var PopupInfo = declare(null, 
  /** @lends module:esri/portal/PopupInfo */                        
  {
    /*"-chains-": {
      // Incompatible constructor arguments. So let's cut-off
      // the inheritance chain. Note also that sub-classes have
      // to explicitly call the ctor of this class like this:
      // this.inherited(arguments);
      constructor: "manual"
    },*/
    
    declaredClass: "esri.PopupInfo",
    
    initialize: function(json, options) {
      // Spec for "json":
      // http://mediawikidev.esri.com/index.php/ArcGIS.com/V1.2#Popups
      // options:
      //  utcOffset (See: http://mediawikidev.esri.com/index.php/ArcGIS.com/V1.7spec)
  
      if (!json) {
        return;
      }
      
      lang.mixin(this, options);
      this.info = json;
      // InfoTemplate API defines title and content that
      // can be functions. Wire them up.
      this.title = this.getTitle;
      this.content = this.getContent;
      
      // Store field info in a dictionary for later use
      var flabels = (this._fieldLabels = {}),
          fmaps = (this._fieldsMap = {});
          
      if (json.fieldInfos) {
        array.forEach(json.fieldInfos, function(fieldInfo) {
          // Use lower case fieldName as key for the dictionaries.
          var fieldName = fieldInfo.fieldName.toLowerCase();
          
          flabels[fieldName] = fieldInfo.label;
          fmaps[fieldName] = fieldInfo;
        });
      }
      
      this._relatedFieldPrefix = "relationships/";
      
      this.titleHasRelatedFields = !!(
        json.title && 
        json.title.indexOf("{" + this._relatedFieldPrefix) !== -1
      );
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
      return JSON.parse(JSON.stringify(this.info));
    },
    
    getTitle: function(/* graphic */) {
      // To be implemented by sub-classes
    },
    
    getContent: function(/* graphic */) {
      // To be implemented by sub-classes
    },
    
    getFieldInfo: function(fieldName) {
      // Returns fieldInfo object describing the given fieldName.
      var fieldInfo,
          fieldInfos = this.info && this.info.fieldInfos;
      
      array.some(fieldInfos, function(info) {
        if (info.fieldName === fieldName) {
          fieldInfo = info;
        }
        
        return !!fieldInfo;
      });
      
      return fieldInfo;
    },
    
    getComponents: function(graphic) {
      /**
       * 1. create deferred for getComponents method
       * 2. read to see popupInfo has related records (by looking into realtionid/fieldName in fieldInfos)
       * 3. if yes , send related records requests
       * 4. or else, call format fill in values , move this to method
       * 5. when responses of 2 comes back do 3
       * 6. resolve the deferred for getComponents method
       */
      
      var popupInfo = this.info,
          //Step 1: create a deferred
          def = new Deferred(), 
          rdef,
          relatedFieldsInfo;
      
      //step 2: check if related queries need to be sent
      if(popupInfo.fieldInfos) {
        relatedFieldsInfo = array.filter(popupInfo.fieldInfos, function(fieldInfo){
          return fieldInfo.fieldName.indexOf(this._relatedFieldPrefix) !== -1;
        }, this);
      }
      
      //step 3
      if(relatedFieldsInfo && relatedFieldsInfo.length > 0) {
        rdef = this._getRelatedRecords({
          graphic: graphic,
          fieldsInfo: relatedFieldsInfo 
        });
      }
      
      //step 4, 5, 6
      if(rdef) {
        rdef.always(
          lang.hitch(this, function() {
            def.resolve(this._getPopupValues(graphic));
          }) 
        );
      }
      else {
        def.resolve(this._getPopupValues(graphic));
      }
      
      return def.promise;      
    },
  
    getAttachments: function(graphic) {
      var layer = graphic.layer, attributes = graphic.attributes;
    
      if (this.info.showAttachments && layer && layer.hasAttachments && layer.queryAttachmentInfos && layer.objectIdField) {
        var oid = attributes && attributes[layer.objectIdField];
        if (oid) {
          return layer.queryAttachmentInfos(oid);
        }
      }
    },
  
    /*******************
     * Internal Members
     *******************/

    _getPopupValues: function(graphic, returnTitleOnly) {
      var popupInfo = this.info,
          layer = graphic.layer,
          attributes = lang.clone(graphic.attributes) || {},
          formatted = lang.clone(attributes),
          fieldInfos = popupInfo.fieldInfos,
          titleText = "", descText = "", tableView, fieldName, value, 
          rid, key,
          properties = layer && layer._getDateOpts && layer._getDateOpts().properties,
          substOptions = {
            // FeatureLayer::_getDateOpts caches result, but we're going to
            // add "formatter" to it. So, lets create a new object
            dateFormat: {
              properties: properties,
              formatter: "DateFormat" + this._insertOffset(this._dateFormats.shortDateShortTime)
            }
          };
          
      if(this._relatedInfo) {
        for(rid in this._relatedInfo){
          if(this._relatedInfo.hasOwnProperty(rid)) {
            var rRecord = this._relatedInfo[rid],
                rInfo = this._relatedLayersInfo[rid];
            if(rRecord) {
              array.forEach(rRecord.relatedFeatures, function(relFeature) {
                for(key in relFeature.attributes) {
                  if(relFeature.attributes.hasOwnProperty(key)) {
                    if(rInfo.relation.cardinality === "esriRelCardinalityOneToOne") {
                      var rName = this._toRelatedFieldName([rInfo.relation.id, key]);
                      attributes[rName] = formatted[rName] = relFeature.attributes[key];
                    }
                  }
                }
              }, this);
              //to support multiple stats
              array.forEach(rRecord.relatedStatsFeatures, function(relStatsFeature) {
                for(key in relStatsFeature.attributes) {
                  if(relStatsFeature.attributes.hasOwnProperty(key)) {
                    var rName = this._toRelatedFieldName([rInfo.relation.id, key]);
                    attributes[rName] = formatted[rName] = relStatsFeature.attributes[key];
                  }
                }
              }, this);              
            }
          }
        }
      }
      
      if (fieldInfos) {
        //this._format(formatted, fieldInfos, substOptions, this._fieldLabels, this._fieldsMap);
  
        // Format values as per fieldInfos and keep them handy
        array.forEach(fieldInfos, function(fieldInfo) {
          fieldName = fieldInfo.fieldName;
          
          // Modify fieldName to match casing of field names in 
          // layer.fields.
          var lyrFieldInfo = this._getLayerFieldInfo(layer, fieldName);
          if (lyrFieldInfo) {
            fieldName = fieldInfo.fieldName = lyrFieldInfo.name;
          }
          
          var val = formatted[fieldName];
          
          // TODO
          // substOptions should contain info about date fields in related layer as well. 
          formatted[fieldName] = this._formatValue(val, fieldName, substOptions);
          
          // Let's not format this field twice, so remove it from the generic
          // "properties" list
          if (properties && fieldInfo.format && fieldInfo.format.dateFormat) {
            var pos = array.indexOf(properties, fieldName);
            if (pos > -1) {
              properties.splice(pos, 1);
            }
          }
          
        }, this);
      }
      
      // TODO
      // Need to do domain/type extraction for related layer fields as well.
      if (layer) {
        var types = layer.types,
            typeField = layer.typeIdField,
            typeId = typeField && attributes[typeField];
  
        for (fieldName in attributes) {
          if(
            attributes.hasOwnProperty(fieldName) && 
            // TODO
            // For related fields we need to use the related layer to find 
            // domain/type name.
            fieldName.indexOf(this._relatedFieldPrefix) === -1
          ) {
            value = attributes[fieldName];
            
            if (esriLang.isDefined(value)) {
              var domainName = this._getDomainName(layer, graphic, types, typeId, fieldName, value);
              if (esriLang.isDefined(domainName)) {
                formatted[fieldName] = domainName;
              }
              else if (fieldName === typeField) {
                var typeName = this._getTypeName(layer, graphic, value);
                if (esriLang.isDefined(typeName)) {
                  formatted[fieldName] = typeName;
                }
              }
            }
          }
        } // loop
      }
      
      // Main Section: title
      if (popupInfo.title) {
        // Substitute un-formatted values for fields used in link URLs.
        titleText = this._processFieldsInLinks(this._fixTokens(popupInfo.title, layer), attributes);
        
        titleText = lang.trim(esriLang.substitute(formatted, titleText, substOptions) || "");
        //console.log("Title text = ", titleText);
      }
      
      // This option used by PopupTemplate.getTitle
      if (returnTitleOnly) {
        return {
          title: titleText
        };
      }
      
      // Main Section: description
      if (popupInfo.description) {
        // Substitute un-formatted values for fields used in link URLs.
        descText = this._processFieldsInLinks(this._fixTokens(popupInfo.description, layer), attributes);
        
        descText = lang.trim(esriLang.substitute(formatted, descText, substOptions) || "");
        //console.log("Desc text = ", descText);
      }
      
      if (fieldInfos) {
        tableView = [];
        
        array.forEach(fieldInfos, function(fieldInfo) {
          fieldName = fieldInfo.fieldName;
          if (fieldName && fieldInfo.visible) {
            tableView.push([
              // Field Name:
              fieldInfo.label || fieldName,
  
              // Field Value:
              esriLang.substitute(formatted, "${" + fieldName + "}", substOptions) || ""
            ]);
          }
        });
      }
  
      // Filter out mediaInfos for which one of the following is true:
      // image:
      //  - no sourceURL (invalid mediaInfo)
      //  - feature does not have a value for sourceURL field
      // chart:
      //  - type not one of pie, line, column, bar
      //  - feature does not have values for any of the fields
      var filteredMedia, valid;
      
      if (popupInfo.mediaInfos) {
        filteredMedia = [];
        
        array.forEach(popupInfo.mediaInfos, function(minfo) {
          valid = 0;
          value = minfo.value;
          
          switch(minfo.type) {
            case "image":
              var url = value.sourceURL;
              url = url && lang.trim(esriLang.substitute(attributes, this._fixTokens(url, layer)));
              //console.log("URL = ", url);
              valid = !!url;
              break;
              
            case "piechart":
            case "linechart":
            case "columnchart":
            case "barchart":
              var lyrFieldInfo, normField = value.normalizeField;
              
              // Modify "fields" and "normalizaField" to match casing of field 
              // names in layer.fields.
              value.fields = array.map(value.fields, function(field) {
                lyrFieldInfo = this._getLayerFieldInfo(layer, field);
                return lyrFieldInfo ? lyrFieldInfo.name : field;
              }, this);
              
              if (normField) {
                lyrFieldInfo = this._getLayerFieldInfo(layer, normField);
                
                value.normalizeField = lyrFieldInfo 
                  ? lyrFieldInfo.name 
                  : normField;
              }
              
              valid = array.some(value.fields, function(field) {
                        return (
                          esriLang.isDefined(attributes[field]) || 
                          (field.indexOf(this._relatedFieldPrefix) !== -1 && this._relatedInfo)
                        );
                      }, this);
              break;
              
            default:
              return;
          }
          
          if (valid) {
            // Clone media info, make substitutions and push into the 
            // outgoing array
            minfo = lang.clone(minfo);
            value = minfo.value;
            
            // Substitute un-formatted values for fields used in link URLs.
            var mTitle = minfo.title 
                  ? this._processFieldsInLinks(this._fixTokens(minfo.title, layer), attributes) 
                  : "",
                mCaption = minfo.caption 
                  ? this._processFieldsInLinks(this._fixTokens(minfo.caption, layer), attributes) 
                  : "";
            
            minfo.title = mTitle ? lang.trim(esriLang.substitute(formatted, mTitle, substOptions) || "") : "";
            //console.log("Media title text = ", minfo.title);
            
            minfo.caption = mCaption ? lang.trim(esriLang.substitute(formatted, mCaption, substOptions) || "") : "";
            //console.log("Media caption text = ", minfo.caption);
            
            if (minfo.type === "image") {
              value.sourceURL = esriLang.substitute(attributes, this._fixTokens(value.sourceURL, layer));
              
              if (value.linkURL) {
                value.linkURL = lang.trim(esriLang.substitute(attributes, this._fixTokens(value.linkURL, layer)) || "");
              }
            }
            else { // chart
              var normalizer, fields;
              
              array.forEach(value.fields, function(fieldName, index) {
                if(fieldName.indexOf(this._relatedFieldPrefix) !== -1) {
                  fields = this._getRelatedChartInfos(fieldName, value, attributes, substOptions);
                  
                  if( fields instanceof Array) {
                    value.fields = fields;
                  }
                  else {
                    value.fields[index] = fields;
                  }
                }
                else {
                  var data = attributes[fieldName];
                  // NOTE
                  // Not clear why charting code does not equate
                  // undefined values to null
                  data = (data === undefined) ? null : data; 
                  normalizer = attributes[value.normalizeField] || 0;
                  if (data && normalizer) {
                    data = data / normalizer;
                    //console.log("[PIE] Normalized data = ", data);
                  }
                  
                  value.fields[index] = {
                    y: data,
                    
                    // We don't want to format the number of "places" in data if  
                    // we have a normalizer. For example if data=160, normalizer=1536
                    // and fieldFormat.places=0, the tooltip will essentially show 
                    // 0 as the data value which is not desirable
                    tooltip: (this._fieldLabels[fieldName.toLowerCase()] || fieldName) + ":<br/>" + 
                             this._formatValue(data, fieldName, substOptions, !!normalizer)
                  };
                }
              }, this);
            }
            
            filteredMedia.push(minfo);
          }
        }, this);
      }
      
      return {
        title: titleText,
        description: descText,
        fields: (tableView && tableView.length) ? tableView : null,
        mediaInfos: (filteredMedia && filteredMedia.length) ? filteredMedia : null,
        formatted: formatted,
        editSummary: (layer && layer.getEditSummary) ? layer.getEditSummary(graphic) : ""
      };
    },
    
    _getRelatedChartInfos: function(fieldName, value, attributes, substOptions) {
      //attributes are the current graphic attributes 
      var fields, rRecord, fInfos, normalizer, data, rid, rInfo, fieldNameArr;
      fields = [];
      fieldNameArr = this._fromRelatedFieldName(fieldName);
      rid = fieldNameArr[0];
      rRecord = this._relatedInfo[rid];
      rInfo = this._relatedLayersInfo[rid];
      if(rRecord) {
        array.forEach(rRecord.relatedFeatures, function(feature){
          var atrObj = feature.attributes, obj, key;
          for (key in atrObj) {
            if(atrObj.hasOwnProperty(key)) {
              if(key === fieldNameArr[1]) {
                obj = {};
                data = atrObj[key];
                if(value.normalizeField) {
                  if(value.normalizeField.indexOf(this._relatedFieldPrefix) !== -1) {
                    normalizer = atrObj[this._fromRelatedFieldName(value.normalizeField)[1]];
                  }
                  else {
                    normalizer = attributes[value.normalizeField];
                  }
                }
                if(data && normalizer) {
                  data = data/ normalizer;
                }              
                //tooltip
                if(value.tooltipField) {
                  if(value.tooltipField.indexOf(this._relatedFieldPrefix) !== -1) {
                    // tooltipField is also related record
                    var tooltipName = this._fromRelatedFieldName(value.tooltipField)[1];
                    obj.tooltip = atrObj[tooltipName] + ":<br/>" + 
                                  this._formatValue(data, atrObj[tooltipName], substOptions, !!normalizer);                    
                  }
                  else {
                    obj.tooltip =  (this._fieldLabels[fieldName.toLowerCase()] || fieldName) + ":<br/>" + this._formatValue(data, value.tooltipField, substOptions, !!normalizer);
                  }
                }
                else {
                  //related label is default tooltip when nothing is specified
                  obj.tooltip = data;
                }
                obj.y = data;
                fields.push(obj);
              }// if for key is in the field.y
            }//if for ownProperty check
          }// for
        }, this);
      }
      //spec change needed
      if(rInfo.relation.cardinality === "esriRelCardinalityOneToMany" || rInfo.relation.cardinality === "esriRelCardinalityManyToMany") {
        fInfos =  fields;
      }
      else {
        fInfos =  fields[0];
      }      
      return fInfos;
    },

    // See: http://en.wikipedia.org/wiki/Date_format_by_country
    _dateFormats: {
      "shortDate":            "(datePattern: 'M/d/y', selector: 'date')",
      "shortDateLE":          "(datePattern: 'd/M/y', selector: 'date')",
      "longMonthDayYear":     "(datePattern: 'MMMM d, y', selector: 'date')",
      "dayShortMonthYear":    "(datePattern: 'd MMM y', selector: 'date')", 
      "longDate":             "(datePattern: 'EEEE, MMMM d, y', selector: 'date')", 
      "shortDateShortTime":   "(datePattern: 'M/d/y', timePattern: 'h:mm a', selector: 'date and time')",
      "shortDateLEShortTime": "(datePattern: 'd/M/y', timePattern: 'h:mm a', selector: 'date and time')",
      "shortDateShortTime24": "(datePattern: 'M/d/y', timePattern: 'H:mm', selector: 'date and time')",
      "shortDateLEShortTime24": "(datePattern: 'd/M/y', timePattern: 'H:mm', selector: 'date and time')",
      "shortDateLongTime":    "(datePattern: 'M/d/y', timePattern: 'h:mm:ss a', selector: 'date and time')",
      "shortDateLELongTime":  "(datePattern: 'd/M/y', timePattern: 'h:mm:ss a', selector: 'date and time')",
      "shortDateLongTime24":  "(datePattern: 'M/d/y', timePattern: 'H:mm:ss', selector: 'date and time')",
      "shortDateLELongTime24":"(datePattern: 'd/M/y', timePattern: 'H:mm:ss', selector: 'date and time')",
      "longMonthYear":        "(datePattern: 'MMMM y', selector: 'date')", 
      "shortMonthYear":       "(datePattern: 'MMM y', selector: 'date')",
      "year":                 "(datePattern: 'y', selector: 'date')"
    },
    
    // Regular expression that matches "href" attributes of hyperlinks
    _reHref: /href\s*=\s*\"([^\"]+)\"/ig,
    
    // Same as _reHref but with single quotes around href value 
    // (instead of double quotes).
    _reHrefApos: /href\s*=\s*\'([^\']+)\'/ig,
    
    _fixTokens: function(template, layer) {
      // Replace {xyz} with ${xyz}
      var self = this;
      
      // Note: existing ${xyz} are retained. 
      // Update: We may not be able to support this case because a 
      // arcgis.com user might enter a monetary value like this: 
      // ${AMOUNT} where expected result is: $10000.
      // This means that a popupInfo constructed in an app built 
      // using the JSAPI cannot use the ${TOKEN} format either as it
      // gets ambiguous
      //return template.replace(/\$?(\{[^\{\r\n]+\})/g, "$$$1");
      return template.replace(/(\{([^\{\r\n]+)\})/g, function(match, token, fieldName) {
        var fieldInfo = self._getLayerFieldInfo(layer, fieldName);
        
        return "$" + (
          fieldInfo 
            // Use field name as defined in layer.fields in case 
            // field names used for popupInfo differ in casing. 
            ? ( "{" + fieldInfo.name + "}" ) 
            : token
        );
      });
    },
  
    _encodeAttributes: function(attributes) {
      // Clone given attributes and apply URL encoding and replace 
      // single quotes with its corresponsing HTML entity name.
      
      // Replacing single quotes with &apos; prevents malformed 
      // HTML markup in popup description of the form:
      //  "<a href='http://www.vresorts.com/FTBeta/tripPlanner/tripPlanner.html?ID::{Name}&amp;ADDRESS::{Address}&amp;URL::{URL}' target='_blank'>Add to Trip</a>"
      //  Note the single quotes around href value.
      
      // Note that double quotes are properly encoded during the
      // URL encoding phase.
      var encodedAttributes = lang.clone(attributes) || {},
          fieldName, value, encodedValue;
      
      for (fieldName in encodedAttributes) {
        value = encodedAttributes[fieldName];
    
        if (value && typeof value === "string") {
          encodedValue = encodeURIComponent(value)
            .replace(/\'/g, "&apos;");
          
          encodedAttributes[fieldName] = encodedValue;
      
          //console.log(fieldName, ":", value);
          //console.log(" ", encodedValue);
        }
      }
  
      return encodedAttributes;
    },
    
    _processFieldsInLinks: function(text, attributes) {
      // Replaces field names embedded within strings of the form: href="..." 
      // with the corresponding values.
      // This method expects that tokens in "text" have already been fixed using 
      // _fixTokens.
  
      var encodedAttributes = this._encodeAttributes(attributes),
          self = this;
      
      if (text) {
        text = text
          // Process hrefs with value surrounded by double quotes.
          .replace(this._reHref, function(hrefAttr, hrefValue) {
            //console.log("hrefAttr quote: ", hrefAttr, hrefValue);
    
            return self._addValuesToHref(hrefAttr, hrefValue, attributes, encodedAttributes);
          })
          
          // Process hrefs with value surrounded by single quotes.
          .replace(this._reHrefApos, function(hrefAttr, hrefValue) {
            //console.log("hrefAttr apos: ", hrefAttr, hrefValue);
    
            return self._addValuesToHref(hrefAttr, hrefValue, attributes, encodedAttributes);
          });
      }
      
      return text;
    },
    
    _addValuesToHref: function(hrefAttr, hrefValue, attributes, encodedAttributes) {
      // Substitutes field values into href. Field values will be
      // URL encoded in some cases. 
      hrefValue = hrefValue && lang.trim(hrefValue);
      
      return esriLang.substitute(
        // Is the entire URL provided by a field?
        (hrefValue ? (hrefValue.indexOf("${") === 0) : false)
          
          // The entire URL is provided by a field.
          // Do not use encoded field values.
          ? attributes 
          
          // We're adding pieces of the URL from field(s).
          // Use encoded field values.
          : encodedAttributes,
        
        hrefAttr
      );
    },
    
    _getLayerFieldInfo: function(layer, fieldName) {
      // Returns an object describing the field, only if the given layer 
      // is a "FeatureLayer". Graphics layers do not have getField method.
      return (layer && layer.getField) 
        ? layer.getField(fieldName) 
        : null;
    },
    
    _formatValue: function(val, fieldName, substOptions, preventPlacesFmt) {
      var fieldInfo = this._fieldsMap[fieldName.toLowerCase()], 
          fmt = fieldInfo && fieldInfo.format,
          
          // Forced LTR Wrap should only be applied to numbers, but NOT to 
          // numbers that represent date.
          // When not forced, minus sign of negative numbers is displayed after 
          // the number - we want to avoid this.
          isNumericField = (
            typeof val === "number" && 
            array.indexOf(substOptions.dateFormat.properties, fieldName) === -1 && 
            (!fmt || !fmt.dateFormat)
          );
      
      if (!esriLang.isDefined(val) || !fieldInfo || 
          !esriLang.isDefined(fmt)
      ) {
        return isNumericField ? this._forceLTR(val) : val;
      }
      
      var formatterFunc = "", options = [],
          isNumberFormat = fmt.hasOwnProperty("places") || fmt.hasOwnProperty("digitSeparator"),
          digitSep = fmt.hasOwnProperty("digitSeparator") ? fmt.digitSeparator : true;
      
      if (isNumberFormat) {
        formatterFunc = "NumberFormat";
        
        // preventPlacesFmt = true indicates that the value is normalized.
        // If so, we will format number of places for the chart tooltip only if 
        // the normalized field info has format.places greater than 0.
        // TODO
        // Feels like we need to let the popup author decide number of places 
        // for normalized data when displayed as chart tooltip
        
        options.push(
          "places: " + 
          (
            (esriLang.isDefined(fmt.places) && (!preventPlacesFmt || fmt.places > 0)) 
              ? Number(fmt.places) 
              : "Infinity"
          )
        );
        
        if (options.length) {
          formatterFunc += ("(" + options.join(",") + ")");
        }
      }
      else if (fmt.dateFormat) {
        // guard against unknown format string
        formatterFunc = "DateFormat" + this._insertOffset(
          this._dateFormats[fmt.dateFormat] || this._dateFormats.shortDateShortTime
        );
      }
      else {
        // unknown format definition
        return isNumericField ? this._forceLTR(val) : val;
      }
  
      //console.log("formatterFunc = ", formatterFunc);
      
      var formattedValue = esriLang.substitute(
        { "myKey": val }, 
        "${myKey:" + formatterFunc + "}", 
        substOptions
      ) || "";
      
      // Remove digit separator if not required
      if (isNumberFormat && !digitSep) {
        if (jsapiBundle.group) {
          formattedValue = formattedValue.replace(new RegExp("\\" + jsapiBundle.group, "g"), "");
        }
      }
      
      //console.log("Formatted: ", fieldName, ": ", formattedValue);
      
      return isNumericField ? this._forceLTR(formattedValue): formattedValue;
    },
    
    _forceLTR: function(value) {
      /*
       * We use esriNumericValue class when displaying numeric attribute field
       * values. We can use it to force LTR text direction - regardless of whether
       * the page is in LTR or RTL mode. Even in LTR mode, a number can be surrounded 
       * by English or RTL scripts - but we need the number to be displayed in LTR
       * direction. 
       * When not forced, minus sign of negative numbers is displayed after 
       * the number - we want to avoid this.
       */
      
      var ieVersion = sniff("ie");
      
      // We dont want to apply LTR for IE versions 10 or earlier. When applied,
      // IE shows regression in a scenario.
      // https://devtopia.esri.com/WebGIS/arcgis-js-api/issues/517#issuecomment-83181
      // Note: has(ie) ideally returns undefined starting from IE 11.
      
      return (ieVersion && ieVersion <= 10) 
        ? value
        : ("<span class='esri-numeric-value'>" + value + "</span>");
    },
    
    _insertOffset: function(formatString) {
      if (formatString) {
        // Insert utcOffset into the format string if available
        // See: http://mediawikidev.esri.com/index.php/ArcGIS.com/V1.7spec
        formatString = esriLang.isDefined(this.utcOffset) ?
                       formatString.replace(/\)\s*$/, ", utcOffset:" + this.utcOffset + ")") :
                       formatString;
      }
      
      return formatString;
    },
  
    _getDomainName: function(layer, graphic, types, typeId, fieldName, value) {
      var domain = layer.getDomain && layer.getDomain(fieldName, {
        feature: graphic
      });
      
      return (domain && domain.codedValues) 
        ? domain.getName(value)
        : null;
    },
    
    _getTypeName: function(layer, graphic, id) {
      var type = layer.getType && layer.getType(graphic);
      
      return type && type.name;
    },
    
    _getRelatedRecords: function(params) {
      var graphic= params.graphic,
          def = new Deferred(),
          key;
      
      if(!this._relatedLayersInfo) {
        this._getRelatedLayersInfo(params).then(lang.hitch(this, function(response) {
          for(key in response) {
            if(response.hasOwnProperty(key)) {
              if(response[key]) {
                this._relatedLayersInfo[key].relatedLayerInfo = response[key];  
              }
            }
          }
          //send queries on the relatedlayers for this feature
          this._queryRelatedLayers(graphic).then(lang.hitch(this, function(res){
            this._setRelatedRecords(graphic, res);
            def.resolve(res);
          }), lang.hitch(this, this._handlerErrorResponse, def));
          
        }), lang.hitch(this, this._handlerErrorResponse, def));
      }
      else {
        //send queries on the relatedlayers for this feature
        this._queryRelatedLayers(graphic).then(lang.hitch(this, function(res){
          this._setRelatedRecords(graphic, res);
          def.resolve(res);
        }), lang.hitch(this, this._handlerErrorResponse, def));        
      }
      
      return def.promise;
    },
    
    _getRelatedLayersInfo: function(params) {
      var graphic= params.graphic,
          fieldsInfo = params.fieldsInfo,
          layer, key,
          defList = {};
          
      layer = graphic.layer;
      
      if(!this._relatedLayersInfo) {
        this._relatedLayersInfo = {};
      }
      
      array.forEach(fieldsInfo, function(fInfo) {
        var fieldNameArr, relationId, fieldName, statisticDefinition, matchedReltn;
        fieldNameArr = this._fromRelatedFieldName(fInfo.fieldName);
        relationId = fieldNameArr[0];
        fieldName = fieldNameArr[1];
        if(relationId) {
          if(!this._relatedLayersInfo[relationId]) {
            array.some(layer.relationships, function(rel) {
              if(rel.id == relationId) {
                matchedReltn = rel;
                return true;
              }
            });
            if(matchedReltn) {
              this._relatedLayersInfo[relationId] = {
                relation: matchedReltn,
                relatedFields: [],
                outStatistics: []
              };
            }
          }
          if(this._relatedLayersInfo[relationId]) {
            this._relatedLayersInfo[relationId].relatedFields.push(fieldName);
            if(fInfo.statisticType) {
              statisticDefinition = new StatisticDefinition();
              statisticDefinition.statisticType = fInfo.statisticType;
              statisticDefinition.onStatisticField = fieldName;
              statisticDefinition.outStatisticFieldName = fieldName;
              this._relatedLayersInfo[relationId].outStatistics.push(statisticDefinition);
            }
          }
        }
      }, this);
      
      //get the layer definition (meta data) about the related layers
      for(key in this._relatedLayersInfo) {
        if(this._relatedLayersInfo.hasOwnProperty(key)) {
          var relation, relatedLayerUrl;
          if(this._relatedLayersInfo[key]) {
            relation = this._relatedLayersInfo[key].relation;
            relatedLayerUrl = (layer.url).replace(/[0-9]+$/, relation.relatedTableId);
            this._relatedLayersInfo[key].relatedLayerUrl = relatedLayerUrl;
            defList[key] = esriRequest({
              url: relatedLayerUrl, 
              content: {f: "json"},
              callbackParamName: "callback"
            });
          }
        }
      }
      
      return all(defList);
    },
    
    _queryRelatedLayers: function(graphic) {
      var defList = {}, key;
      
      for(key in this._relatedLayersInfo) {
        if(this._relatedLayersInfo.hasOwnProperty(key)) {
          defList[key] = this._queryRelatedLayer({
                           graphic: graphic,
                           relatedInfo: this._relatedLayersInfo[key]
                         });
        }
      }
      
      return all(defList);
    },
    
    _queryRelatedLayer: function(params) {
      var graphic, layer, layerPos, destinationRelation, qry, qryTask, whereExp, destKeyFieldType, statsQry, layerInfo, qList, rInfo, relatedLayerUrl, relation;
      graphic = params.graphic;
      layer = graphic.layer;
      layerPos = layer.url.match(/[0-9]+$/g)[0];      
      rInfo = params.relatedInfo;
      layerInfo = rInfo.relatedLayerInfo;
      relatedLayerUrl = rInfo.relatedLayerUrl;
      relation = rInfo.relation;
      array.some(layerInfo.relationships, function(destnRelation) {
        if(destnRelation.relatedTableId === parseInt(layerPos, 10)) {
          destinationRelation = destnRelation;
          return true;
        }
      }, this);            
      if(destinationRelation) {
        qry = new Query();
        array.some(layerInfo.fields, function(field) {
          if(field.name === destinationRelation.keyField) {
            if(array.indexOf(["esriFieldTypeSmallInteger", "esriFieldTypeInteger", "esriFieldTypeSingle", "esriFieldTypeDouble"], field.type) !== -1 ) {
              destKeyFieldType = "number";
            }
            else {
              destKeyFieldType = "string";
            }
            return true;
          }
        });
        if(destKeyFieldType === "string") {
          whereExp = destinationRelation.keyField + "='" + graphic.attributes[relation.keyField] + "'";
        }
        else {
          whereExp = destinationRelation.keyField + "=" + graphic.attributes[relation.keyField];
        }
        qry.where = whereExp;
        qry.outFields =  rInfo.relatedFields; //["*"];
        if(rInfo.outStatistics && rInfo.outStatistics.length > 0 && layerInfo.supportsStatistics) {
          //create new stats query
          statsQry = new Query();
          statsQry.where = qry.where;
          statsQry.outFields = qry.outFields;
          statsQry.outStatistics = rInfo.outStatistics;
        }
        qryTask = new QueryTask(relatedLayerUrl);
        qList = [];
        qList.push(qryTask.execute(qry));
        if(statsQry) {
          qList.push(qryTask.execute(statsQry));  
        }
      }
      return all(qList);
    },
    
    _setRelatedRecords: function(graphic, response) {
      /**
        response is a hashtable , key is relationId
        response : {
          relationId: [
            0: queryResponse,
            1: <optional> statsQueryResponse
          ],
          ...
        }
      * @private
      */
      this._relatedInfo = [];// to store related information for the clicked graphic{relation: <relationobj>, feature: <fetaure>, relatedRecords: <relatedRecords>
      
      var rid;
      
      for(rid in response) {
        if(response.hasOwnProperty(rid)) {
          if(response[rid]) {
            var resObj = response[rid];
            this._relatedInfo[rid] = {};
            this._relatedInfo[rid].relatedFeatures = resObj[0].features; 
            if(esriLang.isDefined(resObj[1])) {
              this._relatedInfo[rid].relatedStatsFeatures = resObj[1].features;
            }
          }
        }
      }
    },
      
    _handlerErrorResponse: function(def, error) {
      def.reject(error);
      //console.log(error);
    }, 
    
    _fromRelatedFieldName: function(fieldName) {
      var fieldNameArr = [], temp;
      if(fieldName.indexOf(this._relatedFieldPrefix) !== -1) {
        temp = fieldName.split("/");
        fieldNameArr = temp.slice(1);
      }
      return fieldNameArr;
    },
    
    _toRelatedFieldName: function(fieldArr) {
      var rName = "";
      if(fieldArr && fieldArr.length > 0 ) {
        rName = this._relatedFieldPrefix + fieldArr[0] + "/" + fieldArr[1];  
      }
      return rName;
    }
    
  });

  

  return PopupInfo;  
});
