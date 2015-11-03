define(
[
  "dojo/_base/array",
  "../core/declare",
  "dojo/_base/lang",

  "dojox/gfx/_base",

  "../core/lang",

  "../geometry/Extent",
  "../geometry/Point",
  "../geometry/support/webMercatorUtils",

  "../Graphic",

  "../renderers/SimpleRenderer",

  "../symbols/ShieldLabelSymbol",
  "../symbols/TextSymbol",

  "./GraphicsLayer",

  "./labelLayerUtils/DynamicLabelClass",
  "./labelLayerUtils/StaticLabelClass",

  "./support/LabelClass"
],
function(
  array, declare, lang,
  gfxBase,
  esriLang,
  Extent, Point,  webMercatorUtils,
  Graphic,
  SimpleRenderer,
  ShieldLabelSymbol, TextSymbol,
  GraphicsLayer,
  DynamicLabelClass, StaticLabelClass,
  LabelClass
) {

  function sizeInfoFinder(visVariable) {
    return (visVariable.type === "sizeInfo");
  }

  var dlLayer = declare(GraphicsLayer, {

  declaredClass: "esri.layers.LabelLayer",
  
  constructor: function(parameters) {
    this.id = "labels";
    this.featureLayers = [];
    this._featureLayerInfos = []; // it holds FeatureLayer + LabelRenderer,LabelExpressionInfo,LabelingOptions
    this._preparedLabels = [];
    this._engineType = "STATIC";
    this._mapEventHandlers = [];
    if(parameters) {
      if(parameters.id) {
        this.id = parameters.id;
      }
      if(parameters.mode) {
        this._engineType = (parameters.mode.toUpperCase() === "DYNAMIC") ? "DYNAMIC" : "STATIC";
      }
    }
  },
  
  _setMap: function(map) {
    var retVal = this.inherited(arguments);
    // add map event listeners
    if(this._map) {
      this._mapEventHandlers.push(this._map.on("extent-change", lang.hitch(this, "refresh")));
    }
    this.refresh();
    return retVal;
  },
  
  _unsetMap: function() {
    // remove map event listeners
    var i;
    for(i = 0; i < this._mapEventHandlers.length; i++) {
      this._mapEventHandlers[i].remove();
    }
    this.refresh();
    this.inherited(arguments);    
  },
  
  setAlgorithmType: function(algorithm) {
    this._engineType = (algorithm && algorithm.toUpperCase() === "DYNAMIC") ? "DYNAMIC" : "STATIC";
    this.refresh();
  },
  
  addFeatureLayer: function(featureLayer, labelRenderer, labelExpressionInfo, labelingOptions) {
    // checking for layer already exist in collection
    if(this.getFeatureLayer(featureLayer.layerId)) {
      return;
    }

    var eventHandlers = [];
    eventHandlers.push(featureLayer.on("update-end", lang.hitch(this, "refresh"))); // ok
    eventHandlers.push(featureLayer.on("suspend", lang.hitch(this, "refresh"))); // not develop yet in FeatureLayer
    eventHandlers.push(featureLayer.on("resume", lang.hitch(this, "refresh"))); // ok
    eventHandlers.push(featureLayer.on("edits-complete", lang.hitch(this, "refresh"))); // ok
    eventHandlers.push(featureLayer.on("labeling-info-change", lang.hitch(this, "refresh"))); // ok
    eventHandlers.push(featureLayer.on("time-extent-change", lang.hitch(this, "refresh"))); // ok
    eventHandlers.push(featureLayer.on("show-labels-change", lang.hitch(this, "refresh"))); // ok

    this._featureLayerInfos.push({
      "FeatureLayer" : featureLayer,
      "LabelExpressionInfo" : labelExpressionInfo,
      "LabelingOptions": labelingOptions,
      "LabelRenderer": labelRenderer,
      "EventHandlers" : eventHandlers
      });

    this.featureLayers.push(featureLayer);
    
    this.refresh();
  },
  
  getFeatureLayer: function(layerId) {
    var i, fl;
    for(i = 0; i < this.featureLayers.length; i++) {
      fl = this.featureLayers[i];
      if(fl !== undefined) {
        if(fl.id == layerId) {
          return fl;
        }
      }
    }
    return null;
  },
  
  removeFeatureLayer: function(layerId) {
    var i, fl, index;
    fl = this.getFeatureLayer(layerId);
    if(fl !== undefined) {
      index = array.indexOf(this.featureLayers, fl);
      if (index > -1) {
        // remove FeatureLayer from featureLayers 
        this.featureLayers.splice(index, 1);
        // disconnect all eventHandlers for this FeatureLayer
        for(i = 0; i < this._featureLayerInfos[index].EventHandlers.length; i++) {
          this._featureLayerInfos[index].EventHandlers[i].remove();
        }
        // remove FeatureLayer from private structure
        this._featureLayerInfos.splice(index, 1);

        this.refresh();
      }
    }
  },
  
  removeAllFeatureLayers: function() {
    var index;
    for(index = 0; index < this.featureLayers.length; index++) {
      // disconnect all eventHandlers for this FeatureLayer
      for(var i = 0; i < this._featureLayerInfos[index].EventHandlers.length; i++) {
        this._featureLayerInfos[index].EventHandlers[i].remove();
      }
      // remove FeatureLayer from featureLayers 
      this.featureLayers = [];
      // remove FeatureLayer from private structure
      this._featureLayerInfos = [];
    }
    this.refresh();
  },
  
  getFeatureLayers: function() {
    return this.featureLayers;
  },
  
  getFeatureLayerInfo: function(layerId) {
    var i, fl;
    for(i = 0; i < this.featureLayers.length; i++) {
      fl = this.featureLayers[i];
      if(fl !== undefined) {
        if(fl.id == layerId) {
          return this._featureLayerInfos[i];
        }
      }
    }
    return null;
  },
  

  // overloaded method
  refresh: function(value) {
    //console.log("LabelLayer:refresh()");
    
    var i, l;
    var featureLayer;
    var featureLayerInfo;
    var labelRenderer, labelExpression, options;
    var labelingInfos = [];
    var labelingInfo;
    //var f, graphic, geometry, text;

    // instantiate engine type
    var engine = (this._engineType === "DYNAMIC") ? new DynamicLabelClass() : new StaticLabelClass();

    // check if we can continue
    if(!this._map) {
      return;
    }
    
    // set reference to map
    engine.setMap(this._map, this);

    // loop layers
    this._preparedLabels = [];
    for(l = 0; l < this.featureLayers.length; l++) {
      featureLayer = this.featureLayers[l];
      if(!featureLayer.visible || !featureLayer.showLabels || !featureLayer.visibleAtMapScale || featureLayer._suspended) {
        continue;
      }
      featureLayerInfo = this._featureLayerInfos[l];

      // customize labels if LabelRenderer was specified
      if(featureLayerInfo.LabelRenderer) {
        // take default 'labelExpression' and 'options' from first labelingInfo object
        labelingInfos = featureLayer.labelingInfo;
        if(labelingInfos) {
          labelingInfo = labelingInfos[0]; // very first LabelingInfo object
          if(labelingInfo) {
            labelExpression = labelingInfo.getLabelExpression();
            options = this._convertOptions(labelingInfo);
          }
        }
        labelRenderer = featureLayerInfo.LabelRenderer;
        if(featureLayerInfo.LabelExpressionInfo) { // customize labelExpression
          labelExpression = featureLayerInfo.LabelExpressionInfo;
        }
        // still support old API
        if(featureLayerInfo.LabelingOptions) {
          options = this._convertOptions(null); // default
          // pointPriorities
          if(featureLayerInfo.LabelingOptions.pointPriorities !== undefined) {
            var pp = featureLayerInfo.LabelingOptions.pointPriorities;
            if(pp == "above-center" || pp == "AboveCenter" || pp == "esriServerPointLabelPlacementAboveCenter" ) {
              options.pointPriorities = "AboveCenter";
            } else if(pp == "above-left" || pp == "AboveLeft" || pp == "esriServerPointLabelPlacementAboveLeft" ) {
              options.pointPriorities = "AboveLeft";
            } else if(pp == "above-right" || pp == "AboveRight" || pp == "esriServerPointLabelPlacementAboveRight" ) {
              options.pointPriorities = "AboveRight";
            } else if(pp == "below-center" || pp == "BelowCenter" || pp == "esriServerPointLabelPlacementBelowCenter" ) {
              options.pointPriorities = "BelowCenter";
            } else if(pp == "below-left" || pp == "BelowLeft" || pp == "esriServerPointLabelPlacementBelowLeft" ) {
              options.pointPriorities = "BelowLeft";
            } else if(pp == "below-right" || pp == "BelowRight" || pp == "esriServerPointLabelPlacementBelowRight" ) {
              options.pointPriorities = "BelowRight";
            } else if(pp == "center-center" || pp == "CenterCenter" || pp == "esriServerPointLabelPlacementCenterCenter" ) {
              options.pointPriorities = "CenterCenter";
            } else if(pp == "center-left" || pp == "CenterLeft" || pp == "esriServerPointLabelPlacementCenterLeft" ) {
              options.pointPriorities = "CenterLeft";
            } else if(pp == "center-right" || pp == "CenterRight" || pp == "esriServerPointLabelPlacementCenterRight" ) {
              options.pointPriorities = "CenterRight";
            } else {
              options.pointPriorities = "AboveRight"; // default
            }
          }          
          // lineLabelPlacement
          if(featureLayerInfo.LabelingOptions.lineLabelPlacement !== undefined) {
            options.lineLabelPlacement = featureLayerInfo.LabelingOptions.lineLabelPlacement;
          }
          if(featureLayerInfo.LabelingOptions.lineLabelPosition !== undefined) {
            options.lineLabelPosition = featureLayerInfo.LabelingOptions.lineLabelPosition;
          }
          if(featureLayerInfo.LabelingOptions.labelRotation !== undefined) {
            options.labelRotation = featureLayerInfo.LabelingOptions.labelRotation;
          }
          if(featureLayerInfo.LabelingOptions.howManyLabels !== undefined) {
            options.howManyLabels = featureLayerInfo.LabelingOptions.howManyLabels;
          }
        }
        // overwrite LabelRenderer/LabelExpressionInfo/LabelingOptions if labelRenderer was specified as LabelClass
        if(labelRenderer instanceof LabelClass) {
          labelExpression = labelRenderer.getLabelExpression();
          labelRenderer = new SimpleRenderer(labelRenderer.symbol);
          options = this._convertOptions(labelRenderer);
        }
        this._addLabels(featureLayer, labelRenderer, labelExpression, options);
      }
      else
      { // take labels from labelingInfo object
        labelingInfos = featureLayer.labelingInfo;
        if(labelingInfos) {
          for (i = labelingInfos.length - 1; i >= 0; i--) { // LIFO order
            labelingInfo = labelingInfos[i];
            if(labelingInfo) {
              labelRenderer = new LabelClass(
                (labelingInfo instanceof LabelClass) ? labelingInfo.toJSON() : labelingInfo
              );
              
              labelExpression = labelingInfo.getLabelExpression();
              options = this._convertOptions(labelingInfo);
              this._addLabels(featureLayer, labelRenderer, labelExpression, options);
            }
          }
        }
      }
      
    } // loop layers
    //
    var placedLabels = engine._process(this._preparedLabels);
    this.clear(); // function from GraphicsLayer to clear screen
    this.drawLabels(this._map, placedLabels);
    //console.log("refresh");
  },
  
  drawLabels: function(map, placedLabels) {
    this._scale = (map.extent.xmax - map.extent.xmin) / map.width;
    var i;
    for (i = 0; i < placedLabels.length; i++) {
      var placedLabel = placedLabels[i];
      var layer = placedLabel.layer;
      //var graphic = layer.graphic;
      var x = placedLabel.x;
      var y = placedLabel.y;
      //var width = placedLabel.width;
      //var height = placedLabel.height;
      var text = placedLabel.text;
      var angle = placedLabel.angle;
      //
      var labelSymbol = placedLabel.layer.labelSymbol;
      /*
      var labelSymbol = labelRenderer.getSymbol(layer.graphic);
      if(labelSymbol instanceof TextSymbol) {
        labelSymbol = new TextSymbol(labelSymbol.toJSON()); // TextSymbol
      } else if(labelSymbol instanceof ShieldLabelSymbol) {
        labelSymbol = new ShieldLabelSymbol(labelSymbol.toJSON()); // ShieldLabelSymbol
      } else {
        labelSymbol = new TextSymbol(); // get default TextSymbol
      }
      */
      // set angle only for polyline for other types takes angle from symbol
      if(layer.geometry.type == "polyline" && placedLabel.layer.options.labelRotation) {
        labelSymbol.setAngle(angle * (180 / Math.PI)); // radians -> degrees because labelSymbol hold degree
      } else {
        labelSymbol.setAngle(0);
      }
      labelSymbol.setText(text);
      var xx = x;
      var yy = y;
      // correction textSymbol(only) - shift to middle line
      if(labelSymbol instanceof TextSymbol) {
        var sz = labelSymbol.getHeight();
        var sin = Math.sin(angle);
        //var cos = Math.cos(angle);
        xx = xx - 0.25*sz * this._scale * sin;
        yy = yy - 0.33*sz * this._scale;
      }
      var newGr = new Graphic(new Point(xx, yy, map.extent.spatialReference));
      newGr.setSymbol(labelSymbol);
      this.add(newGr);
      //this.drawTestBox(xx, yy, labelSymbol.getWidth() * this._scale, labelSymbol.getHeight() * this._scale, angle, this._map.spatialReference); // debug text rectangle
    }
  },
  
  //////////////////////////////////////////////////////////////////
  // private methods
  //////////////////////////////////////////////////////////////////
  
  _addLabels : function(featureLayer, labelRenderer, labelExpression, options) {
    var f, graphic, geometry, text;
    
    // out of scale range
    var minScale = labelRenderer.minScale;
    var maxScale = labelRenderer.maxScale;
    if(!this._isWithinScaleRange(minScale, maxScale)) {
      return;
    }
    
    // empty textExpression
    if(!labelExpression || labelExpression === "") {
      return;
    }

    /*
     * Check if need to project geometries. Projection done if layer based on Feature Collection
     *   and if the layer spatial reference is not the same as the map spatial reference
     */ 
    var map = this._map;
    var doprj = !featureLayer.url && (!map.spatialReference.equals(featureLayer.spatialReference));

    // loop features
    for(f = 0; f < featureLayer.graphics.length; f++) {
      graphic = featureLayer.graphics[f];
      if(graphic.visible === false) {
        continue;
      }

      geometry = graphic.geometry;
      if (doprj){
        //try to project geometry to map spatial reference
        if (!webMercatorUtils.canProject(geometry, map)){
          continue;
        }
        geometry = webMercatorUtils.project(geometry, map);
      }

      // ignore invalid geometry
      if(!geometry) {
        continue;
      }

      // 'where' filter
      if(!LabelClass.evaluateWhere(labelRenderer.where, graphic.attributes)) {
        continue;
      }

      // exclude if geometry out of screen are
      if(!this._isWithinScreenArea(geometry)) {
        continue;
      }
      
      // get label text
      text = LabelClass.buildLabelText(labelExpression, graphic.attributes, featureLayer.fields, options);
      
      // add label
      this._addLabel(text, labelRenderer, featureLayer.renderer, graphic, options, geometry, map);
    }
  },
  
  // the method return true if geometry is within screen
  // consider 'around180' option
  _isWithinScreenArea: function(geometry) {
    var extent;
    if(geometry.type === "point") { // point geometry has no getExtent() method
      extent = new Extent(geometry.x, geometry.y,geometry.x, geometry.y, geometry.spatialReference);
    } else {
      extent = geometry.getExtent();
    }
    if(extent === undefined) { // ignore empty or wrong geometry
      return false;
    }
    var onScreen = this._intersects(this._map, extent); // it returns null or array
    if (onScreen === null || onScreen.length === 0) {
      return false;
    }
    return true;
  },
  
  _isWithinScaleRange: function(min, max) {
    //var currentScale1 = ((this._map.extent.xmax - this._map.extent.xmin) / this._map.width) * 10000; // TODO koeff depends on map/screen units
    var currentScale = this._map.getScale();
    //console.log("currentScale1=" + currentScale1 + " currentScale=" + currentScale);
    if((min > 0 && currentScale >= min)) {
      return false;
    }
    if((max > 0 && currentScale <= max)) {
      return false;
    }
    return true;
  },

  
  _getSizeInfo: function(renderer) {
    // Returns "sizeInfo" or a visual variable with type="sizeInfo"
    return renderer ? (renderer.sizeInfo ||
        // Just use the first size variable defined in visual variables.
        array.filter(renderer.visualVariables, sizeInfoFinder)[0]
      ) 
      : null;
  },
  
  /**
   * add label into this._preparedLabels array for conflict detection analysis
   * @private
   */
  _addLabel: function(text, labelRenderer, symbolRenderer, graphic, options, geometry, map) {
    var labelSymbol, featureSymbol;
    var symbolWidth, symbolHeight;
    //
    if(!text || lang.trim(text) === "" || !labelRenderer) {
      return;
    }
    // replace series whitespaces for one
    text = text.replace(/\s+/g, " ");
    //
    labelSymbol = labelRenderer.getSymbol(graphic);
    if(labelSymbol instanceof TextSymbol) {
      labelSymbol = new TextSymbol(labelSymbol.toJSON()); // TextSymbol
      labelSymbol.setVerticalAlignment("baseline"); // set to default to ignore it when labeling
      labelSymbol.setHorizontalAlignment("center"); // set to default to ignore it when labeling
    } else if(labelSymbol instanceof ShieldLabelSymbol) {
      labelSymbol = new ShieldLabelSymbol(labelSymbol.toJSON()); // ShieldLabelSymbol
    } else {
      labelSymbol = new TextSymbol(); // get default TextSymbol
    }
    labelSymbol.setText(text);
    labelRenderer.symbol = labelSymbol;
    
    // if 'sizeInfo' defined we will change symbol size proportionally
    
    var size = this._getProportionalSize(labelRenderer.sizeInfo, graphic.attributes);
    if(size) { // apply if valid
      if(labelSymbol instanceof TextSymbol) {
        labelSymbol.setSize(size);
      } else if(labelSymbol instanceof ShieldLabelSymbol) {
        labelSymbol.setWidth(size);
        labelSymbol.setHeight(size);
      }
    }
    
    //
    // find width/height for symbol
    symbolWidth  = 0;
    symbolHeight = 0;
    if(symbolRenderer) {
      featureSymbol = symbolRenderer.getSymbol(graphic);
      
      var rendererSizeInfo = this._getSizeInfo(symbolRenderer),
          dynamicSize;
      
      if(rendererSizeInfo) { // get width/height from renderer(for proportional symbols, etc)
        dynamicSize = symbolRenderer.getSize(graphic, {
          sizeInfo: rendererSizeInfo,
          resolution: map.getResolutionInMeters()
        });
      } 
      
      if (dynamicSize != null) {
        symbolWidth = symbolHeight = dynamicSize;
      }
      else if(featureSymbol) { // get width/height from symbol
        if(featureSymbol.type == "simplemarkersymbol") {
          symbolWidth = featureSymbol.size;
          symbolHeight = featureSymbol.size;
        } else if(featureSymbol.type == "picturemarkersymbol") {
          symbolWidth = featureSymbol.width;
          symbolHeight = featureSymbol.height;
        } else if(featureSymbol.type == "simplelinesymbol" || featureSymbol.type == "cartographiclinesymbol") {
          symbolWidth = featureSymbol.width;
        }
      }
    }    // push in _preparedLabels
    var preparedLabel = {};
    preparedLabel.graphic = graphic;
    preparedLabel.options = options;
    preparedLabel.geometry = geometry;
    preparedLabel.labelRenderer = labelRenderer;
    preparedLabel.labelSymbol = labelSymbol;
    preparedLabel.labelWidth = labelSymbol.getWidth() / 2;
    preparedLabel.labelHeight = labelSymbol.getHeight() / 2;
    preparedLabel.symbolWidth = gfxBase.normalizedLength(symbolWidth) / 2;
    preparedLabel.symbolHeight = gfxBase.normalizedLength(symbolHeight) / 2;
    preparedLabel.text = text;
    preparedLabel.angle = labelSymbol.angle;
    this._preparedLabels.push(preparedLabel);
  },

  /**
   * use labelRenderer.sizeInfo to calc size
   * new in JS API (not defined in ArcGIS REST API)
   * 
   * "sizeInfo": {
   *   "field": "POP_RANK",
   *   "minSize": 10,
   *   "maxSize": 20,
   *   "minDataValue": 1,
   *   "maxDataValue": 7
   * }
   * return size or 'null' if not valid
   * @private
   */
  _getProportionalSize: function(psi, attributes) {
    if(!psi) {
      return null;
    }
    var value = esriLang.substitute(attributes, "${" + psi.field + "}", {first: true});
    if(!psi.minSize || !psi.maxSize || !psi.minDataValue || !psi.maxDataValue || !value ||
        (psi.maxDataValue - psi.minDataValue) <= 0) {
      return null;
    }
    var d = (psi.maxSize - psi.minSize) / (psi.maxDataValue - psi.minDataValue);
    var size = d * (value - psi.minDataValue) + psi.minSize;
    // but this method is used in ArcGIS
    //var size = Math.pow((value / psi.minDataValue), 0.5) * psi.minSize;
    //var size = 1.00083 * Math.pow((value / psi.minDataValue), 0.5516) * psi.minSize; // with Flannery compensation
    return size;
  },
  
  /**
   * convert options from rest API http://sampleserver3.arcgisonline.com/ArcGIS/SDK/REST/index.html?label.html
   * to js API http://mediawikidev.esri.com/index.php/JSAPI/LabelLayer
   * @private
   */
  _convertOptions: function(labelingInfo) {
    // date format
    var dateFormat = "shortDate"; // default
    // number format
    var numberFormat = null; // default
    // placement
    var labelPlacement = ""; // default
    //
    var pointPriorities = "AboveRight"; // default
    var lineLabelPlacement = "PlaceAtCenter"; // default
    var lineLabelPosition = "Above"; // default
    var labelRotation = true; // default
    var howManyLabels = "OneLabel"; // default
    //
    if(labelingInfo) {
      if(labelingInfo.format !== undefined) {
        dateFormat = labelingInfo.format.dateFormat; //{ dateFormat: 'shortDateShortTime' } //dateFormat = labelingInfo.dateFormat;
        numberFormat = { places: labelingInfo.format.places, digitSeparator: labelingInfo.format.digitSeparator }; //{ places: 0, digitSeparator: true } //numberFormat = labelingInfo.numberFormat;
      }
      labelPlacement = labelingInfo.labelPlacement;
    }
    //
    if(labelPlacement == "above-center" || labelPlacement == "esriServerPointLabelPlacementAboveCenter" ) {
      pointPriorities = "AboveCenter";
    } else if(labelPlacement == "above-left" || labelPlacement == "esriServerPointLabelPlacementAboveLeft" ) {
      pointPriorities = "AboveLeft";
    } else if(labelPlacement == "above-right" || labelPlacement == "esriServerPointLabelPlacementAboveRight" ) {
      pointPriorities = "AboveRight";
    } else if(labelPlacement == "below-center" || labelPlacement == "esriServerPointLabelPlacementBelowCenter" ) {
      pointPriorities = "BelowCenter";
    } else if(labelPlacement == "below-left" || labelPlacement == "esriServerPointLabelPlacementBelowLeft" ) {
      pointPriorities = "BelowLeft";
    } else if(labelPlacement == "below-right" || labelPlacement == "esriServerPointLabelPlacementBelowRight" ) {
      pointPriorities = "BelowRight";
    } else if(labelPlacement == "center-center" || labelPlacement == "esriServerPointLabelPlacementCenterCenter" ) {
      pointPriorities = "CenterCenter";
    } else if(labelPlacement == "center-left" || labelPlacement == "esriServerPointLabelPlacementCenterLeft" ) {
      pointPriorities = "CenterLeft";
    } else if(labelPlacement == "center-right" || labelPlacement == "esriServerPointLabelPlacementCenterRight" ) {
      pointPriorities = "CenterRight";
    } else {
      pointPriorities = "AboveRight"; // default
    }
    // lineLabelPlacement
    if(labelPlacement == "above-start" || labelPlacement == "below-start" || labelPlacement == "center-start") {
      lineLabelPlacement = "PlaceAtStart";
    } else if(labelPlacement == "above-end" || labelPlacement == "below-end" || labelPlacement == "center-end") {
      lineLabelPlacement = "PlaceAtEnd";
    } else {
      lineLabelPlacement = "PlaceAtCenter"; // default
    }
    // lineLabelPosition
    if(labelPlacement == "above-after" || labelPlacement == "esriServerLinePlacementAboveAfter" ||
       labelPlacement == "above-along" || labelPlacement == "esriServerLinePlacementAboveAlong" ||
       labelPlacement == "above-before" || labelPlacement == "esriServerLinePlacementAboveBefore" ||
       labelPlacement == "above-start" || labelPlacement == "esriServerLinePlacementAboveStart" ||
       labelPlacement == "above-end"  || labelPlacement == "esriServerLinePlacementAboveEnd" )
    {
      lineLabelPosition = "Above";
    } else if(labelPlacement == "below-after" || labelPlacement == "esriServerLinePlacementBelowAfter" ||
              labelPlacement == "below-along" || labelPlacement == "esriServerLinePlacementBelowAlong" ||
              labelPlacement == "below-before" || labelPlacement == "esriServerLinePlacementBelowBefore" ||
              labelPlacement == "below-start" || labelPlacement == "esriServerLinePlacementBelowStart" ||
              labelPlacement == "below-end" || labelPlacement == "esriServerLinePlacementBelowEnd" )
    {
      lineLabelPosition = "Below";
    } else if(labelPlacement == "center-after" || labelPlacement == "esriServerLinePlacementCenterAfter" ||
              labelPlacement == "center-along" || labelPlacement == "esriServerLinePlacementCenterAlong" ||
              labelPlacement == "center-before" || labelPlacement == "esriServerLinePlacementCenterBefore" ||
              labelPlacement == "center-start" || labelPlacement == "esriServerLinePlacementCenterStart" ||
              labelPlacement == "center-end" ||  labelPlacement == "esriServerLinePlacementCenterEnd" )
    {
      lineLabelPosition = "OnLine";
    } else {
      lineLabelPosition = "Above"; // default
    }
    // polygon
    if(labelPlacement == "always-horizontal" || labelPlacement == "esriServerPolygonPlacementAlwaysHorizontal") {
      labelRotation = false;
    }
    return { "dateFormat" : dateFormat,
      "numberFormat" : numberFormat,
      "pointPriorities" : pointPriorities,
      "lineLabelPlacement" : lineLabelPlacement, 
      "lineLabelPosition" : lineLabelPosition,
      "labelRotation" : labelRotation,
      "howManyLabels" : howManyLabels };
  }
  
  /*
  drawTestBox: function(x0, y0, w2, h2, angle, sr) {
    var w = w2/2;
    var h = h2/2;
    // draw line
    //var rad = angle * this._PI / 180;
    var x1 = x0 + (-w * Math.cos(angle)) + (-h * Math.sin(angle));
    var y1 = y0 - (-w * Math.sin(angle)) + (-h * Math.cos(angle)) + h/2;
    var x2 = x0 + (+w * Math.cos(angle)) + (-h * Math.sin(angle));
    var y2 = y0 - (+w * Math.sin(angle)) + (-h * Math.cos(angle)) + h/2;
    var x3 = x0 + (+w * Math.cos(angle)) + (+h * Math.sin(angle));
    var y3 = y0 - (+w * Math.sin(angle)) + (+h * Math.cos(angle)) + h/2;
    var x4 = x0 + (-w * Math.cos(angle)) + (+h * Math.sin(angle));
    var y4 = y0 - (-w * Math.sin(angle)) + (+h * Math.cos(angle)) + h/2;
    var p1 = new Point(x1, y1, sr);
    var p2 = new Point(x2, y2, sr);
    var p3 = new Point(x3, y3, sr);
    var p4 = new Point(x4, y4, sr);
    var line = new Polyline(sr);
    line.addPath([p1, p2, p3, p4, p1]);
    var newLine = new Graphic(line, sr);
    var sym = new SimpleLineSymbol();
    //sym.setColor(new Color([255,0,0,1.0]));
    sym.setWidth(0.3);
    newLine.setSymbol(sym);
    this.add(newLine);
  }
  */
  
  
  
  //////////////////////////////////////////////////////////////
  
  });

  return dlLayer;
});
