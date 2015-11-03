/**
 * The renderer object contains drawing information for the layer. The base class for all renderers. Renderer has no constructor. 
 * Use {@link module:esri/renderers/SimpleRenderer SimpleRenderer}, 
 * {@link module:esri/renderers/ClassBreaksRenderer ClassBreaksRenderer}, {@link module:esri/renderers/UniqueValueRenderer UniqueValueRenderer} instead.
 * 
 * @module esri/renderers/Renderer
 * @noconstructor
 * @since 4.0
 * @see module:esri/renderers/SimpleRenderer
 * @see module:esri/renderers/UniqueValueRenderer
 * @see module:esri/renderers/ClassBreaksRenderer
 */

/**
* Object specification for the **colorInfo** object.
*
* @typedef {Object} colorInfo
*
* @property {module:esri/Color[]} colors - An array of colors that defines the color ramp. The first color will be used to render the minimum data value, 
* and the last color will be used to render the maximum data value. At least two colors are required. If there are three or more colors, the 
* intermediate colors will be placed proportionally between the first and the last to create a multi-color ramp. You must specify either `colors` or `stops` 
* to construct the color ramp.
* @property {string} type - **Required.** Value is always `colorInfo`.
* @property {string} field - **Required.** Indicates the name of the feature attribute field that contains the data value to render.
* @property {number} maxDataValue - Maximum data value.
* @property {number} minDataValue - Minimum data value.
* @property {string} normalizationField - Name of the feature attribute field by which the data value will be normalized. 
* @property {Object[]} stops - An array of objects that define the color ramp. At least two stops are required. Each stop object has the following specification:
* @property {number} stops.value - **Required**. Specifies the value for the data range.
* @property {module:esri/Color} stops.color - The {@link module:esri/Color Color} used to render the value.
* @property {number} stops.transparency - A number ranging from 0-100 representing a transparancy value, where `0` is opaque and `100` is 100% transparent.
* @property {string} stops.label - A string value if a label is needed on the legend for a stop.
* @property {string} theme - Indicates the theme to use when working with continuous color data. 
* <br><br>**Possible Values:** high-to-low | above-and-below | centered-on | extremes | group-similar
*/

/**
* Object specification for the **sizeInfo** object.
*
* @typedef {Object} sizeInfo
*
* @property {string} type - **Required.** Value is always `sizeInfo`.
* @property {string} field - **Required.** Indicates the name of the feature attribute field that contains the data value to render.
* @property {string} axis - Defines which axis of a {@link module:esri/symbols/Symbol3DLayer symbol layer} is controlled by the visual
*                           variable. `all` is the default. `axis` is only available when rendering inside a {@link module:esri/views/SceneView SceneView}.
* <br><br>**Possible Values:** width | depth | height | widthAndDepth | all
* @property {string} expression - Allows a size to be defined based on the scale. `view.scale` is the only expression currently supported.
* @property {number} maxDataValue - Maximum data value.
* @property {number} minDataValue - Minimum data value.
* @property {Object} maxSize - The symbol size to use for a feature for a maximum data value. 
*                              This is required if `valueUnit = 'unknown'`. See table below for object specification.
* @property {string} maxSize.type - Indicates the type of rendering. This is always `sizeInfo`.
* @property {string} maxSize.expression - **Required.** A string value that allows a size to be defined based on the scale. 
*                                         `view.scale` is the only expression currently supported.
* @property {Object[]} maxSize.stops - **Required.** An array of objects that define the size of the symbol. Each object has 
*                                                       the following specification: `{ value: <Number>, size: <Number> }` where `size` 
*                                                       indicates the size of the symbol in pixels and `value` indicates the value the symbol represents.
* @property {Object} minSize - The symbol size to use for a feature for a minimum data value. 
*                              This is required if `valueUnit = 'unknown'`. See table below for object specification.
* @property {string} minSize.type - Indicates the type of rendering. This is always `sizeInfo`.
* @property {string} minSize.expression - **Required.** A string value that allows a size to be defined based on the scale. 
*                                         `view.scale` is the only expression currently supported.
* @property {Object[]} minSize.stops - **Required.** An array of objects that define the size of the symbol. Each object has 
*                                                       the following specification: `{ value: <Number>, size: <Number> }` where `size` 
*                                                       indicates the size of the symbol in pixels and `value` indicates the value the symbol represents.
* @property {string} valueUnit - Indicates the required unit of measurement if the data represents a real world distance quantity. 
*                               If the data value represents a non-distance quantity, e.g. traffic count, census data, etc., `valueUnit` 
*                               should be set to `unknown`. <br><br>**Possible Values:** unknown | inches | feet | yards | miles | nautical-miles | 
*                               millimeters | centimeters | decimeters | meters | kilometers | decimal-degrees
* @property {string} normalizationField - Name of the feature attribute field by which the data value will be normalized.
* @property {Object[]} stops - An array of objects that define the size of the symbol. Each object has 
*                             the following specification: `{ value: <Number>, size: <Number> }` where `size` 
*                            indicates the size of the symbol in pixels and `value` indicates the value the symbol represents.
*/

/**
* Object specification for the **opacityInfo** object.
*
* @typedef {Object} opacityInfo
*
* @property {string} type - **Required.** Value is always `opacityInfo`.
* @property {string} field - **Required.** Indicates the name of the feature attribute field that contains the data value to render.
* @property {number} maxDataValue - Maximum data value.
* @property {number} minDataValue - Minimum data value.
* @property {string} normalizationField - Name of the feature attribute field by which the data value will be normalized. 
* @property {number[]} opacityValues - An array of opacity values. Each value must be a number ranging from `0.0` to `1.0`. 
*                                       The first value is used for features with a minimum data value (or lower), the last 
*                                       value is used for features with a maximum data value (or higher). At least two values 
*                                       are required. If there are three or more values, the intermediate ones are applied proportionally 
*                                       between the first and last values. You need to specify either `opacityValues` or `stops`.
* @property {Object[]} stops - An array of objects, each with two properties: `value` and `opacity`. At least two stops are required. 
*                             You need to specify `opacityValues` or `stops`. If you specify `stops`, then you do not 
*                               need `minDataValue` nor `maxDataValue`.
*/

define(
[
  "../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "../Color"
],
function(declare, lang, array, esriColor) {
  
  var PI = Math.PI;

  /**
   * @constructor module:esri/renderers/Renderer
   */
  var Renderer = declare(null, 
  /** @lends module:esri/renderers/Renderer.prototype */
  {
    declaredClass: "esri.renderer.Renderer",
    
    constructor: function(json) {
      this._ipDataCache = {};

      if (json && !json.declaredClass) {
        // RotationInfo properties:
        // - type
        // - field
        // - expression
        this.rotationInfo = json.rotationInfo;

        if (!this.rotationInfo) {
          // Current REST Spec
          var type = json.rotationType,
              expr = json.rotationExpression;

          if (type || expr) {
            this.rotationInfo = {
              type:       type,
              expression: expr
            };
          }
        }
        
        this.setRotationInfo(this.rotationInfo);
        
        this.setSizeInfo(json.sizeInfo);
        this.setColorInfo(this._readColorInfo(json.colorInfo));
        this.setOpacityInfo(this._readOpacityInfo(json.transparencyInfo));
        this.setVisualVariables(this._readVariables(json.visualVariables));
        this.setAuthoringInfo(json.authoringInfo);
      }
      
      this.getSymbol = lang.hitch(this, this.getSymbol);
    },
  
    /**
     * Returns the symbol used by the input graphic.
     * 
     * @param   {module:esri/Graphic} graphic - A graphic from which to get a symbol.
     * @return {module:esri/symbols/Symbol} Returns the symbol used to render the input graphic.
     */
    getSymbol: function(graphic) {
      //to be implemented by Renderer
    },

    _readColorInfo: function(colorInfo) {
      // Pre-process colorInfo:
      // Convert Color array in ArcGIS REST format to Web Color format.
      // ArcGIS Color has alpha in the range of 0 to 255, whereas web supports 
      // 0 to 1.
      if (colorInfo) {
        array.forEach(colorInfo.colors, function(color, idx) {
          if (lang.isArray(color)) {
            colorInfo.colors[idx] = esriColor.fromJSON(color);
          }
          else {
            colorInfo.colors[idx] = new esriColor(color);
          }
        });
        
        array.forEach(colorInfo.stops, function(stop, idx) {
          if (stop.color && lang.isArray(stop.color)) {
            colorInfo.stops[idx].color = esriColor.fromJSON(stop.color);
          }
          else if (stop.color) {
            colorInfo.stops[idx].color = new esriColor(stop.color);
          }
        });
      }

      return colorInfo;
    },
    
    _readOpacityInfo: function(transparencyInfo) {
      var opacityInfo;
      
      // Convert transparency values to opacity values.
      if (transparencyInfo) {
        opacityInfo = lang.mixin({}, transparencyInfo);
        
        // Convert opacity values to transparency values.
        if (opacityInfo.transparencyValues) {
          opacityInfo.opacityValues = array.map(
            opacityInfo.transparencyValues, 
            function(transparency) {
              return (1 - (transparency / 100));
            }
          );
          
          delete opacityInfo.transparencyValues;
        }
        
        if (opacityInfo.stops) {
          opacityInfo.stops = array.map(opacityInfo.stops, function(stop) {
            stop = lang.mixin({}, stop);
            
            stop.opacity = 1 - (stop.transparency / 100);
            delete stop.transparency;
            
            return stop;
          });
        }
      }
      
      return opacityInfo;
    },
    
    _readVariables: function(variables) {
      if (variables) {
        variables = array.map(variables, function(variable) {
          if (variable.type === "colorInfo") {
            variable = this._readColorInfo(variable);
          }
          else if (variable.type === "transparencyInfo") {
            // We expect transparency in serialized variables, not opacity.
            // Let us convert it to opacityInfo for our users.
            variable = this._readOpacityInfo(variable);
            variable.type = "opacityInfo";
          }
           
          return variable;
        }, this);
      }
      
      return variables;
    },
  
    setAuthoringInfo: function(info) {
      this.authoringInfo = info;
    },
    
    // Documentation for rotationType and rotationExpression:
    // http://nil/rest-docs/02ss/02ss0000002v000000.htm
    // http://blogs.esri.com/esri/arcgis/2013/07/17/displaying-speed-and-direction-symbology-from-u-and-v-vectors/
    
    // Geographic angle notation:
    // - 0 degree line points North
    // - Positive value indicates clockwise rotation
    // Arithmetic angle notation:
    // - 0 degree line points East
    // - Positive value indicates counter-clockwise rotation
    // References:
    // http://resources.arcgis.com/en/help/main/10.2/00q8/00q80000002s000000.htm
    // http://blogs.esri.com/esri/arcgis/2007/11/17/using-rotation-angles-for-markers-lines-or-polygon-fills/
    // http://stackoverflow.com/questions/8673137/calculating-wind-direction-from-u-and-v-components-of-the-wind-using-lapply-or-i/12632531#12632531
    // http://www.cactus2000.de/uk/unit/masswin.shtml
    // http://tornado.sfsu.edu/geosciences/classes/m430/Wind/WindDirection.html

    // Browser notation:
    // - Matches geographic notation
    // - Not clear on whether 0 deg points North or East
    // - CSS Transform docs not clear
    // - SVG docs certainly indicate "East", but Dojo GFX docs not clear:
    //   http://commons.oreilly.com/wiki/index.php/SVG_Essentials/Transforming_the_Coordinate_System#The_rotate_Transformation
    //   http://www.learnsvg.com/books/learnsvg/html/bitmap/chapter06/page06-03.php
    setRotationInfo: function(arg) {
      // arg: field name or rotationInfo object
      
      var info = this.rotationInfo = (typeof arg === "string") ? 
                                       { field: arg } : 
                                       arg;
                            
      if (info && info.expression && !info.field) {
        // Let's parse the expression and extract the rotation field
        var match = info.expression.match(this.rotationRE);
        
        if (match && match[1]) {
          info.field = match[1];
        }
      }
      
      return this;
    },
    
    // This regular expression matches expressions of the form:
    // "[rotationField]"
    rotationRE: /^\[([^\]]+)\]$/i,
    
    getRotationAngle: function(graphic) {
      // Returns rotation angle in geographic notation in degrees.
      
      var info = this.rotationInfo,
          arithmetic = (info.type === "arithmetic"),
          field = info.field,
          attr = graphic.attributes,
          angle = 0;
      
      if (field) {
        if (lang.isFunction(field)) {
          // Call user-defined expression function to get the 
          // angle. The function is expected to return angle in
          // "geographic" notation.
          angle = field.apply(this, arguments);
        }
        else if (attr) {
          angle = attr[field] || 0;
        }
        
        angle = (angle + (arithmetic ? -90 : 0)) * (arithmetic ? -1 : 1);
      }

      // Normalize angle value into a range between 0 and 360
      // Note: normalized angle would lose "number of rotations"
      /*if (angle < 0) {
        while (angle < 0) angle += 360;
      }
      
      if (angle > 360) {
        while (angle > 360) angle -= 360;
      }*/
      
      //console.log("R-Angle = ", angle);
      
      return angle;
    },
      
    /**
     * This property allows you to define how to render values in a layer. It is composed of an array of objects (called "visual variables"), each of which contains 
     * the type of drawing property, the axis the variable is applied to, and additional properties for the variable. Variables (or data values)
     * may be visualized in one of three ways: color, size, and opacity. The following bullet points outline how each visual variable may be
     * defined:
     * 
     * * **Color** - To visualize values by color, set the `type` property of the visual variable object to `colorInfo`. Then define the rest of the object
     * using the {@link module:esri/renderers/Renderer~colorInfo colorInfo object specification table}.
     * 
     * * **Size** - To visualize values by size, set the `type` property of the visual variable object to `sizeInfo`. Then define the rest of the object 
     * using the {@link module:esri/renderers/Renderer~sizeInfo sizeInfo object specification table}.
     * 
     * * **Opacity** - To visualize values by opacity, set the `type` property of the visual variable object to `opacityInfo`. Then define the rest of the object 
     * using the {@link module:esri/renderers/Renderer~opacityInfo opacityInfo object specification table}.
     * 
     * See the [Extrude Polygons sample](../sample-code/3d/polygon-extrusion-3d/) for an example of using multiple visual variables to visualize your data.
     * 
     * @name visualVariables
     * @instance
     * @type {Object[]}
     */
    
    setVisualVariables: function(variables) {
      var ipDataCache = this._ipDataCache;
      
      // Clear cache of old variables
      array.forEach(this.visualVariables, function(variable, idx) {
        if (ipDataCache.hasOwnProperty(idx)) {
          ipDataCache[idx] = null;
        }
      }, this);
      
      this.visualVariables = variables;
      
      // Pre-process
      array.forEach(variables, function(variable, idx) {
        if (variable.type === "colorInfo") {
          ipDataCache[idx] = this._processColorInfo(variable);
        }
        else if (variable.type === "opacityInfo") {
          // We expect users to set opacity, not transparency.
          ipDataCache[idx] = this._processOpacityInfo(variable);
        }
      }, this);
      
      return this;
    },
    
    getVisualVariableValues: function(graphic) {
      var variables = this.visualVariables,
          retVal;
      
      if (variables) {
        retVal = array.map(variables, function(variable) {
          var value;
          
          switch (variable.type) {
            case "sizeInfo":
              value = this.getSize(graphic, { sizeInfo: variable });
              break;
              
            case "colorInfo":
              value = this.getColor(graphic, { colorInfo: variable });
              break;
              
            case "opacityInfo":
              value = this.getOpacity(graphic, { opacityInfo: variable });
              break;
          }
          
          return {
            variable: variable,
            value: value
          };
        }, this);
      }
      
      return retVal;
    },

    /**
     * Indicates if the renderer has defined [visualVariables](#visualVariables).
     * 
     * @return {boolean} If `true`, then the renderer has at least one visual variable.
     */
    hasVisualVariables: function() {
      return !!(this.getVisualVariablesForType("sizeInfo") ||
          this.getVisualVariablesForType("colorInfo") ||
          this.getVisualVariablesForType("opacityInfo"));
    },

    /**
     * Returns the visual variable of the specified type.
     * 
     * @param   {string} type - The type of visual variable desired. **Supported Values:** colorInfo | sizeInfo | opacityInfo
     * @return {Object} Returns the visual variable.
     *                  
     * @see [visualVariables](#visualVariables)
     * @example
     * var colorVisVar = renderer.getVisualVariablesForType('colorInfo');
     */
    getVisualVariablesForType: function(type) {
      // "type" can be: sizeInfo, colorInfo or opacityInfo
      // returns undefined or Object[]
      // looks for Renderer.<type> or Renderer.visualVariables[type="<type>"]
      var variables = this.visualVariables,
          retVal;

      if (this[type]) {
        retVal = [this[type]];
      }
      else if (variables) {
        retVal = array.filter(variables, function(variable) {
          return (variable.type === type);
        });
        if (retVal && retVal.length === 0) {
          retVal = undefined;
        }
      }

      return retVal;
    },

    // http://resources.arcgis.com/en/help/main/10.1/index.html#/Using_proportional_symbols/00s500000005000000/
    // This article has some incorrect information. See ArcObjects reference:
    // http://edndoc.esri.com/arcobjects/9.2/ComponentHelp/esriCarto/IProportionalSymbolRenderer.htm
    // http://en.wikipedia.org/wiki/Units_of_measurement
    // http://en.wikipedia.org/wiki/Quantitative_property
    setSizeInfo: function(info) {
      // Set proportionalSymbolInfo for backwards compatibility only.
      this.sizeInfo = this.proportionalSymbolInfo = info;
      return this;
    },

    setProportionalSymbolInfo: function(info) {
      this.setSizeInfo(info);
      return this;
    },
   
    /**
     * Returns the symbol size (in pixels) for the input graphic.
     * 
     * @param   {module:esri/Graphic} graphic - The graphic for which you want to calculate the symbol size.
     *                                        
     * @return {number} Returns the size of the input graphic's symbol in pixels.
     */
    getSize: function(graphic, options) {
      var attr = graphic.attributes, // will be undefined if a value is passed instead of graphic
          sizeInfo = (options && options.sizeInfo) || this.sizeInfo,
          field = sizeInfo && sizeInfo.field,
          size = 0,
          userDefValue = (typeof graphic === "number"),
          value = userDefValue ? graphic : null;
    
      if (field) {
        var minSize = sizeInfo.minSize,
            maxSize = sizeInfo.maxSize,
            minDataValue = sizeInfo.minDataValue,
            maxDataValue = sizeInfo.maxDataValue,
            unit = sizeInfo.valueUnit || "unknown",
            representation = sizeInfo.valueRepresentation,
            featureRatio,
            scaleBy = sizeInfo.scaleBy,
            normField = sizeInfo.normalizationField,
            normValue = attr ? parseFloat(attr[normField]) : undefined,
            shape = options && options.shape;

        // If we already got the value, move on.
        if (typeof value !== "number") {
          if (lang.isFunction(field)) {
            value = field.apply(this, arguments);
          }
          else if (attr) {
            value = attr[field];
          }
        }
        
        // Do we have valid values (value, normalized value) to proceed?
        if (
          value == null || 
          ( 
            normField && 
            (!userDefValue && (isNaN(normValue) || normValue === 0))
          )
        ) {
          return null;
        }
        
        // Normalize feature value
        if (
          !isNaN(normValue) &&
          
          // Caller has provided the "value" which is considered already normalized - 
          // especially when sizeInfo has normalizationField.
          !userDefValue
        ) {
          value = value / normValue;
        }
        
        if (
          minSize != null && maxSize != null && 
          minDataValue != null && maxDataValue != null
        ) {
          // Equal interval mapping of input value to output size
          // Implicitly unit is assumed "unknown"
          if (value <= minDataValue) {
            size = minSize;
          }
          else if (value >= maxDataValue) {
            size = maxSize;
          }
          else {
            featureRatio = (value - minDataValue) / (maxDataValue - minDataValue);
            
            // Marker "area" will be proportional to its value.
            if (scaleBy === "area" && shape) {
              var isCircle = (shape === "circle"),
                  minArea = isCircle 
                    ? (PI * Math.pow(minSize / 2, 2)) 
                    : (minSize * minSize),
                  maxArea = isCircle 
                    ? (PI * Math.pow(maxSize / 2, 2)) 
                    : (maxSize * maxSize),
                  area = minArea + (featureRatio * (maxArea - minArea));
              
              size = isCircle 
                ? (2 * Math.sqrt(area / PI)) 
                : Math.sqrt(area);
            }
            // Feature "size" will be proportional to its value.
            else {
              size = minSize + (featureRatio * (maxSize - minSize));
            }
          }
        }
        // http://edndoc.esri.com/arcobjects/9.2/ComponentHelp/esriCarto/IProportionalSymbolRenderer.htm
        else if (unit === "unknown") {
          if (minSize != null && minDataValue != null) {
            if (minSize && minDataValue) {
              // A feature with value that is twice the minDataValue value will  
              // have a symbol with an area twice as big as minSize
              // i.e. Feature's "area" will be proportional to its value.
              featureRatio = (value / minDataValue);

              // If ValueUnit = esriUnknownUnits, then marker symbols are 
              // proportional by "area" and line symbols are proportional 
              // by "width".
              // http://edndoc.esri.com/arcobjects/9.2/ComponentHelp/esriCarto/IProportionalSymbolRenderer_ValueRepresentation.htm
              if (shape === "circle") {
                // Area = PI * (size/2) * (size/2)
                size = 2 * Math.sqrt( featureRatio * Math.pow(minSize / 2, 2) );
              }
              else if (
                shape === "square" || 
                shape === "diamond" || 
                shape === "image"
              ) {
                // Area = size * size
                size = Math.sqrt( featureRatio * Math.pow(minSize, 2) );
              }
              else { // applies to line width as well
                size = featureRatio * minSize;
              }
            }
            else { // minSize or minDataValue is 0
              size = value + (minSize || minDataValue);
            }
            
            // Check minSize and maxSize limits
            size = (size < minSize) ? minSize : size;
            
            if (maxSize != null && size > maxSize) {
              size = maxSize;
            }
          }
          else {
            // Just return the field value. The value should be interpreted 
            // as size in screen "points". ArcGIS Pro can author such
            // visual variables: with just "field", "axis" and 
            // valueUnit = unknown.
            // Why not add additional enumerations for valueUnit for 
            // this use-case? Ex: "points", "pixels" etc.
            size = value;
          }
        }
        else {
          var mapResolution = (
                                (options && options.resolution) ? 
                                  options.resolution : 
                                  1
                              ) * 
                              this._meterIn[unit];
          
          // http://edndoc.esri.com/arcobjects/9.2/ComponentHelp/esriCarto/esriValueRepresentations.htm
          if (representation === "area") {
            // value represents area. get radius in screen units.
            size = Math.sqrt(value / PI) / mapResolution;
            
            // Callers expect size
            size *= 2;
          }
          else {
            // value represents radius, distance, width or diameter in "valueUnit"
            // convert to screen units
            size = value / mapResolution;
            
            if (representation === "radius" || representation === "distance") {
              // Callers expect size, not half size
              size *= 2;
            }
          }

          // Check minSize
          if (minSize != null && size < minSize) {
            size = minSize;
          }
          
          // Check maxSize
          if (maxSize != null && size > maxSize) {
            size = maxSize;
          }
          
          // Useless to display sub-pixel sizes for markers
          // Lines seem to be okay though - no crazy browser behavior
          //size = (size < 1) ? 0 : size;
        }
        
        //console.log("prop size = ", value, size, shape);
      }
      else if (sizeInfo) {
        size = sizeInfo.minSize;
      }
      
      size = isNaN(size) ? 0 : size;
      
      return size;
    },
    
    setColorInfo: function(info) {
      this.colorInfo = info;
      
      // Cache interpolated data values
      this._ipDataCache.colorInfo = this._processColorInfo(info);
      
      return this;
    },
    
    _processColorInfo: function(colorInfo) {
      // Pre-process colors:
      // Users may have specified color as RGBA array (alpha: 0 to 1) or 
      // an instance of esri/Color
      if (colorInfo) {
        array.forEach(colorInfo.colors, function(color, idx) {
          if (!(color instanceof esriColor)) {
            colorInfo.colors[idx] = new esriColor(color);
          }
        });
        
        array.forEach(colorInfo.stops, function(stop, idx) {
          if (stop.color && !(stop.color instanceof esriColor)) {
            colorInfo.stops[idx].color = new esriColor(stop.color);
          }
        });
      }

      // Cache interpolated data values
      return this._interpolateData(colorInfo);
    },
    
    /**
     * Gets the color for the input Graphic.
     * 
     * @param {module:esri/Graphic} graphic - The graphic from which to get color.
     *                             
     * @return {module:esri/Color} The color used in rendering the input graphic.
     */
    getColor: function(graphic, options) {
      var cacheKey, info = options && options.colorInfo;
      
      if (info && info.type === "colorInfo") {
        cacheKey = array.indexOf(this.visualVariables, info);
        info = this.visualVariables[cacheKey]; // null if key is -1
      }
      else {
        cacheKey = "colorInfo";
        info = this.colorInfo;
      }
      
      return this._getColorComponent(graphic, info, this._ipDataCache[cacheKey]);
    },
    
    setOpacityInfo: function(info) {
      this.opacityInfo = info;
      
      // Cache interpolated data values
      this._ipDataCache.opacityInfo = this._processOpacityInfo(info);
      
      return this;
    },
    
    _processOpacityInfo: function(opacityInfo) {
      return this._interpolateData(opacityInfo);
    },
    
    /**
     * Returns the opacity value for the specified graphic. 
     * 
     * @param {module:esri/Graphic} graphic - The graphic from which to get an opacity value.
     *                             
     * @return {number} Returns the opacity value of the input graphic.
     */
    getOpacity: function(graphic, options) {
      var cacheKey, info = options && options.opacityInfo;
      
      if (info && info.type === "opacityInfo") {
        cacheKey = array.indexOf(this.visualVariables, info);
        info = this.visualVariables[cacheKey]; // null if key is -1
      }
      else {
        cacheKey = "opacityInfo";
        info = this.opacityInfo;
      }
      
      return this._getColorComponent(graphic, info, this._ipDataCache[cacheKey], true);
    },
    
    _getColorComponent: function(graphic, info, ipData, returnOpacity) {
      var attr = graphic.attributes, // will be undefined if a value is passed instead of graphic
          field = info && info.field,
          value = (typeof graphic === "number") ? graphic : null,
          colorComponent;
      
      if (field) {
        var normField = info.normalizationField,
            normValue = attr ? parseFloat(attr[normField]) : undefined;

        // If we already got the value, move on.
        if (typeof value !== "number") {
          if (lang.isFunction(field)) {
            value = field.apply(this, arguments);
          }
          else if (attr) {
            value = attr[field];
          }
        }
        
        if (value != null) {
          // Normalize feature value
          if (normField && !isNaN(normValue) && normValue !== 0) {
            value = value / normValue;
          }
          
          // Assuming _interpolateData has been called already
          colorComponent = returnOpacity 
            ? this._getOpacity(value, info, ipData) 
            : this._getColor(value, info, ipData);
          
          //console.log("colorComponent = ", value, colorComponent);
        }
      }
      else if (info) {
        var stops = info.stops;
        
        if (returnOpacity) {
          colorComponent = (stops && stops[0] && stops[0].opacity);
          
          if (colorComponent == null) {
            colorComponent = info.opacityValues && info.opacityValues[0];
          }
        }
        else {
          colorComponent = (
            (stops && stops[0] && stops[0].color) || 
            (info.colors && info.colors[0])
          );
        }
      }
      
      return colorComponent;
    },
    
    _interpolateData: function(info) {
      // Calculate (and cache) data values corresponding to colors in  
      // colorInfo.colors, or to opacityValues in opacityInfo.opacityValues.
      // - Linear interpolation method is used between minDataValue and maxDataValue
      // - This function should be called every time colorInfo changes
      var interpolatedValues;
      
      // Calculate interpolated data values
      if (info && info.field) {
        if (info.colors || info.opacityValues) {
          var i, numPoints = (info.colors || info.opacityValues).length,
              minDataValue = info.minDataValue,
              // Ex: given 5 color components, there will be a total of 4 intervals.
              // Each interval is a "step" apart.
              step = (info.maxDataValue - minDataValue) / (numPoints - 1);
          
          interpolatedValues = [];
          
          for (i = 0; i < numPoints; i++) {
            interpolatedValues[i] = minDataValue + (i * step);
          }
        }
        else if (info.stops) {
          interpolatedValues = array.map(info.stops, function(stop) {
            return stop.value;
          });
        }
      }
      
      return interpolatedValues;
    },
    
    _getOpacity: function(dataValue, opacityInfo, ipData) {
      var range = this._lookupData(dataValue, ipData),
          opacity;
          
      opacityInfo = opacityInfo || this.opacityInfo;
      
      if (range) {
        var startIndex = range[0], endIndex = range[1],
            alphaStart, alphaEnd;
        
        if (startIndex === endIndex) {
          // For data values less than minDataValue or greater than maxDataValue
          opacity = this._getOpacValue(opacityInfo, startIndex);
        }
        else {
          alphaStart = this._getOpacValue(opacityInfo, startIndex);
          alphaEnd = this._getOpacValue(opacityInfo, endIndex);

          // Linear interpolation between from and to opacity values
          opacity = alphaStart + (alphaEnd - alphaStart) * range[2];
        }
      }
      
      return opacity;
    },
    
    _getOpacValue: function(opacityInfo, index) {
      // Extracts opacity from "opacityValues" or "stops" at the given
      // index
      return opacityInfo.opacityValues 
        ? opacityInfo.opacityValues[index] 
        : opacityInfo.stops[index].opacity;
    },
    
    _getColor: function(dataValue, colorInfo, ipData) {
      var range = this._lookupData(dataValue, ipData),
          color;
      
      colorInfo = colorInfo || this.colorInfo;
      
      if (range) {
        var startIndex = range[0], endIndex = range[1];
        
        color = (startIndex === endIndex) ?
                  // For data values less than minDataValue or greater than maxDataValue
                  this._getColorObj(colorInfo, startIndex) :
                  
                  // Linear interpolation between from and to colors
                  esriColor.blendColors(
                    this._getColorObj(colorInfo, startIndex), 
                    this._getColorObj(colorInfo, endIndex),
                    range[2] 
                  );
      }
      
      return color;
    },
    
    _getColorObj: function(colorInfo, index) {
      // Extracts the dojo.Color instance from "colors" or "stops" at the given
      // index
      return colorInfo.colors 
        ? colorInfo.colors[index] 
        : colorInfo.stops[index].color;
    },
    
    _lookupData: function(dataValue, interpolatedValues) {
      var range;
      
      if (interpolatedValues) {
        // We'll pick some color based on the data value. 
        // Hence the initial start and end indices below.
        // The array.some loop below will fine-tune the actual range.
        var startIndex = 0,
            endIndex = interpolatedValues.length - 1;
        
        array.some(interpolatedValues, function(value, idx) {
          if (dataValue < value) {
            endIndex = idx;
            return true;
          }

          // Advance startIndex in case the next iteration is a match
          startIndex = idx;
          
          return false;
        });
        
        range = [
          // Index of "from" color
          startIndex,
          
          // Index of "to" color 
          endIndex,
          
          // Relative weight of the data value w.r.t "from" and "to" data points
          (dataValue - interpolatedValues[startIndex]) / 
            (interpolatedValues[endIndex] - interpolatedValues[startIndex])
        ];
      }
      
      return range;
    },

    /**
     * @private
     */
    getRequiredFields: function() {
      var fields = Object.create(null);
      this.collectRequiredFields(fields);
      return Object.keys(fields);
    },

    collectRequiredFields: function(fields) {
      var infos = [this.colorInfo, this.sizeInfo, this.opacityInfo, this.rotationInfo];

      if (this.visualVariables) {
        infos = infos.concat(this.visualVariables);
      }

      infos.forEach(function(info) {
        if (info) {
          fields[info.field] = true;
        }
      });
    },
    
    // http://edndoc.esri.com/arcobjects/9.2/ComponentHelp/esriCarto/IProportionalSymbolRenderer_ValueUnit.htm
    // http://edndoc.esri.com/arcobjects/9.2/ComponentHelp/esriSystem/esriUnits.htm
    _meterIn: {
      "inches":          39.3701,
      "feet":            3.28084,
      "yards":           1.09361,
      "miles":           0.000621371,
      "nautical-miles":  0.000539957,
      "millimeters":     1000,
      "centimeters":     100,
      "decimeters":      10,
      "meters":          1,
      "kilometers":      0.001,
      "decimal-degrees": 180 / 20015077
    },
    
    _writeSizeInfo: function(sizeInfo) {
      if (sizeInfo) {
        sizeInfo = lang.mixin({}, sizeInfo);

        var val = sizeInfo.legendOptions;
        
        if (val) {
          // Clone (shallow) legend properties
          sizeInfo.legendOptions = lang.mixin({}, val);
          
          val = val.customValues;
          
          if (val) {
            // Clone customValues array
            sizeInfo.legendOptions.customValues = val.slice(0);
          }
        }
      }

      return sizeInfo;
    },
    
    _writeColorInfo: function(colorInfo) {
      // Serialize colorInfo
      if (colorInfo) {
        colorInfo = lang.mixin({}, colorInfo);
        
        // We cannot give out internal objects (refs) to the caller.
        // Serialize each color as an array, not as an object
        if (colorInfo.colors) {
          colorInfo.colors = array.map(colorInfo.colors, function(color) {
            return esriColor.toJSON(color);
          });
        }

        if (colorInfo.stops) {
          colorInfo.stops = array.map(colorInfo.stops, function(stop) {
            stop = lang.mixin({}, stop);
            
            if (stop.color) {
              stop.color = esriColor.toJSON(stop.color);
            }
            
            return stop;
          });
        }
      }

      return colorInfo;
    },
    
    _writeOpacityInfo: function(opacityInfo) {
      var transparencyInfo;
      
      if (opacityInfo) {
        transparencyInfo = lang.mixin({}, opacityInfo);
        
        // Convert opacity values to transparency values.
        if (transparencyInfo.opacityValues) {
          transparencyInfo.transparencyValues = array.map(
            transparencyInfo.opacityValues, 
            function(opacity) {
              return (1 - opacity) * 100;
            }
          );
          
          delete transparencyInfo.opacityValues;
        }
        
        if (transparencyInfo.stops) {
          transparencyInfo.stops = array.map(transparencyInfo.stops, function(stop) {
            stop = lang.mixin({}, stop);
            
            stop.transparency = (1 - stop.opacity) * 100;
            delete stop.opacity;
            
            return stop;
          });
        }
      }
      
      return transparencyInfo;
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
      var variables = this.visualVariables,
          rotInfo = this.rotationInfo,
          rotField = rotInfo && rotInfo.field,
          authInfo = lang.clone(this.authoringInfo),
          expr = rotInfo && (
            rotInfo.expression || 
            // Convert field to expression
            (
              rotField && 
              (
                lang.isFunction(rotField) ? rotField : 
                  ("[" + rotField + "]")
              )
            ) 
          );

      if (variables) {
        variables = array.map(variables, function(variable) {
          if (variable.type === "sizeInfo") {
            variable = this._writeSizeInfo(variable);
          }
          else if (variable.type === "colorInfo") {
            variable = this._writeColorInfo(variable);
          }
          else if (variable.type === "opacityInfo") {
            variable = this._writeOpacityInfo(variable);
            variable.type = "transparencyInfo";
          }
           
          return variable;
        }, this);
      }
      
      if (authInfo) {
        array.forEach(authInfo.visualVariables, function(info) {
          if (info.type === "opacityInfo") {
            info.type = "transparencyInfo";
          }
        });
      }

      return {
        // Cannot serialize rotationInfo as is. REST API is aware of
        // rotationType and rotationExpression
        
        // For the dev OM, we assume geographic to be default for rotationType
        // But we cannot assume the same for other SDKs and server
        rotationType:           expr && (rotInfo.type || "geographic"),
        rotationExpression:     expr,
        
        colorInfo: this._writeColorInfo(this.colorInfo),
        transparencyInfo: this._writeOpacityInfo(this.opacityInfo),
        sizeInfo: this._writeSizeInfo(this.sizeInfo),
        visualVariables: variables,
        authoringInfo: authInfo
      };
    }
  });

  return Renderer;
});
