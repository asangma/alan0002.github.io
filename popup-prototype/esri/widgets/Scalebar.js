define(
[
  "../core/declare", // declare  
  "dojo/_base/lang", // hitch, mixin  
  "dojo/_base/array", // forEach, map, filter
  "dojo/dom-class", // add replaces dojo.addClass; contains replaces hasClass
  "dojo/dom-construct", // create
  "dojo/dom-geometry", // position
  "dojo/dom-style", //set replaces dojo.style
  "dojo/query", // query

  "../core/lang",
  "../core/domUtils",
  "../geometry/support/units",
  "../geometry/SpatialReference",
  "../geometry/support/WKIDUnitConversion",
  
  "../geometry/Point",
  "../geometry/ScreenPoint",
  "../geometry/Polyline",
  "../geometry/support/geodesicUtils",
  "../geometry/support/webMercatorUtils",
  "../geometry/support/screenUtils",
  "../geometry/support/normalizeUtils",
  "dojo/i18n!../nls/jsapi"
],

function(
  declare, lang, array, domClass, domConstruct, domGeom, domStyle, query,
  esriLang, domUtils, esriUnits, SpatialReference, WKIDUnitConversion,
  Point, ScreenPoint, Polyline, geodesicUtils, wmUtils, screenUtils, normalizeUtils,
  jsapiBundle
) {
  var scalebar = declare(null, {
    declaredClass: "esri.widgets.Scalebar",
    
    map: null,
    mapUnit: null,
    scalebarUnit: null,
    unitsDictionary: [],
    domNode: null,
    screenPt1: null,
    screenPt2: null,
    localStrings: jsapiBundle.widgets.scalebar,

    constructor: function (params, srcNodeRef) {
      this.metricScalebar = domConstruct.create("div", {
        innerHTML: "<div class='esriScaleLabelDiv'><div class='esriScalebarLabel esriScalebarLineLabel esriScalebarSecondNumber'></div></div><div class='esriScalebarLine esriScalebarMetricLine'></div>"
      });
      this.englishScalebar = domConstruct.create("div", {
        innerHTML: "<div class='esriScalebarLine esriScalebarEnglishLine'></div><div class='esriScaleLabelDiv'><div class='esriScalebarLabel esriScalebarLineLabel esriScalebarSecondNumber'></div></div>"
      });
      this.domNode = domConstruct.create("div");
      
      params = params || {};
      if (!params.map) {
        console.error("scalebar: unable to find the 'map' property in parameters");
        return;
      }
      // Unit setting
      if (!params.scalebarUnit) {
        this.scalebarUnit = "english";        
      } else {
        //If users provide wrong scalebar unit other than english or metric
        if (params.scalebarUnit !== "english" && params.scalebarUnit !== "metric" && params.scalebarUnit !== "dual") {
          console.error("scalebar unit only accepts english or metric or dual");
          return;
        } else {
          this.scalebarUnit = params.scalebarUnit;
        }
      }
      // Style
      if (!params.scalebarStyle) {
        this.scalebarStyle = "ruler";
      }
      else {
        if (params.scalebarStyle !== "ruler" && params.scalebarStyle !== "line") {
          console.error("scalebar style must be ruler or line");
          return;
        }
        else {
          this.scalebarStyle = params.scalebarStyle;
        }
      }
      
      this.background = params.background;      
      
      switch (this.scalebarUnit) {
        case "english":
          if (this.scalebarStyle === "ruler" ) {
            this.englishScalebar.innerHTML = "<div class='esriScalebarRuler'><div class='esriScalebarRulerBlock upper_firstpiece'></div><div class='esriScalebarRulerBlock upper_secondpiece'></div><div class='esriScalebarRulerBlock lower_firstpiece'></div><div class='esriScalebarRulerBlock lower_secondpiece'></div></div><div class='scaleLabelDiv'><div class='esriScalebarLabel' style='left: -3%'>0</div><div class='esriScalebarLabel esriScalebarFirstNumber'></div><div class='esriScalebarLabel esriScalebarSecondNumber'></div></div>";            
          }
          this.domNode.appendChild(this.englishScalebar);
          break;
        case "metric":
          if (this.scalebarStyle === "ruler" ) {
            this.metricScalebar.innerHTML = "<div class='esriScalebarRuler'><div class='esriScalebarRulerBlock upper_firstpiece'></div><div class='esriScalebarRulerBlock upper_secondpiece'></div><div class='esriScalebarRulerBlock lower_firstpiece'></div><div class='esriScalebarRulerBlock lower_secondpiece'></div></div><div class='scaleLabelDiv'><div class='esriScalebarLabel' style='left: -3%'>0</div><div class='esriScalebarLabel esriScalebarFirstNumber'></div><div class='esriScalebarLabel esriScalebarSecondNumber'></div></div>";            
          }
          this.domNode.appendChild(this.metricScalebar);
          break;
        case "dual":
          this.domNode.appendChild(this.metricScalebar);
          this.domNode.appendChild(this.englishScalebar);          
          break;
      }          
      
      this.map = params.map;
      // Place the scalebar in a user-defined element, otherwise put it in the bottom left corner of the map by default
      if (srcNodeRef) {
        srcNodeRef.appendChild(this.domNode);
      } else {
        this.map.container.appendChild(this.domNode);
        // Define the postion
        if (params.attachTo) {
          domClass.add(this.domNode, "scalebar_" + params.attachTo);
        }
        // Default position
        else {
          domClass.add(this.domNode, "scalebar_bottom-left");
        }
      }
      domClass.add(this.domNode, "esriScalebar");
      
      // Draw the scalebar initially
      if (this.map.loaded) {
        this._getDistance(this.map.extent);

        // Check if overlapped with bing logo initially if the scalebar is at default position
        this._checkBingMaps();
      }
      else {
        var loadHandle = this.map.on("load", function() {
          loadHandle.remove();
          loadHandle = null;
          
          this._getDistance(this.map.extent);
          this._checkBingMaps();
        });
      }
      
      // Wire to map events    
      this._mapOnPan = this.map.on("pan", this._getDistance.bind(this));
      this._mapOnExtentChange = this.map.on("extent-change", this._getDistance.bind(this));
      
      // If Bing maps present and visible,
      // And at the same time, if the scalebar is at bottom left corner,
      // move the scalebar towards right a little
      array.forEach(this.map.layerIds, function (layerId, idx) {
        if (this.map.getLayer(layerId).declaredClass === "esri.virtualearth.VETiledLayer") {
          this.map.getLayer(layerId).on("visibility-change", lang.hitch(this, function (visbility) {
            this._checkBingMaps();
          }));
        }
      }, this);

      this._mapOnLayerAdd = this.map.on("layer-add", lang.hitch(this, function (layer) {
        if (layer.declaredClass === "esri.virtualearth.VETiledLayer") {
          layer.on("visibility-change", lang.hitch(this, function (visbility) {
            this._checkBingMaps();
          }));
        }
        this._checkBingMaps();
      }));
      
      this._mapOnLayerRemove = this.map.on("layer-remove", lang.hitch(this, this._checkBingMaps));
    },

    hide: function () {
      this._hidden = true;
      domUtils.hide(this.domNode);
    },

    show: function () {
      this._hidden = false;
      domUtils.show(this.domNode);
    },

    destroy: function () {
      this._mapOnPan.remove();
      this._mapOnExtentChange.remove();
      this._mapOnLayerAdd.remove();
      this._mapOnLayerRemove.remove();
      this.hide();
      this.map = null;
      domConstruct.destroy(this.domNode);
    },

    _checkBingMaps: function () {
      if (domClass.contains(this.domNode, "scalebar_bottom-left")) {
        // Honor the default position first
        domStyle.set(this.domNode, "left", "25px");
        array.forEach(this.map.layerIds, function (layerId, idx) {
          if (this.map.getLayer(layerId).declaredClass === "esri.virtualearth.VETiledLayer" && this.map.getLayer(layerId).visible) {
            var positionX = "95px";
            if (this.map._mapParams.nav) {
              positionX = "115px";
            }
            domStyle.set(this.domNode, "left", positionX);
          }
        }, this);
      }
    },

    _getDistance: function (extent) {
      // Define the points to calculate the scale value based on where the scalebar is
      var position = domGeom.position(this.domNode, true);
      var screenPtY = position.y - this.map.position.y;
      // If the scalebar is outside the map, use the bottom or top line
      screenPtY = (screenPtY > this.map.height) ? this.map.height : screenPtY;
      screenPtY = (screenPtY < 0) ? 0 : screenPtY;
      var screenPt1 = new ScreenPoint(0, screenPtY);
      var screenPt2 = new ScreenPoint(this.map.width, screenPtY);
      var distance, midDistance, metricDistance, englishDistance;
      this.mapUnit = "esriDecimalDegrees";
      // Convert to map point to calculate scale value	
      var pt1 = screenUtils.toMapPoint(extent, this.map.width, this.map.height, screenPt1);
      var pt2 = screenUtils.toMapPoint(extent, this.map.width, this.map.height, screenPt2);
      var midPt1 = new Point(extent.xmin, (extent.ymin + extent.ymax) / 2, this.map.spatialReference);
      var midPt2 = new Point(extent.xmax, (extent.ymin + extent.ymax) / 2, this.map.spatialReference);
      if (this.map.spatialReference.wkid === 3857 || this.map.spatialReference.wkid === 102100 || this.map.spatialReference.wkid === 102113 || (this.map.spatialReference.wkt && this.map.spatialReference.wkt.indexOf("WGS_1984_Web_Mercator") != -1)) {
        //if the map projection is web mercator, convert to lat/lon first
        pt1 = wmUtils.webMercatorToGeographic(pt1, true);
        pt2 = wmUtils.webMercatorToGeographic(pt2, true);
        midPt1 = wmUtils.webMercatorToGeographic(midPt1, true);
        midPt2 = wmUtils.webMercatorToGeographic(midPt2, true);
      } else if (esriLang.isDefined(WKIDUnitConversion[this.map.spatialReference.wkid]) || (this.map.spatialReference.wkt && this.map.spatialReference.wkt.indexOf("PROJCS") === 0)) {
        //it's a PCS other than web mercator
        // for those PCSs, it doesn't take scale distortion into account
        this.mapUnit = "linearUnit";
        distance = Math.abs(extent.xmax - extent.xmin);
        var coeff;
        if (esriLang.isDefined(WKIDUnitConversion[this.map.spatialReference.wkid])) {
          coeff = WKIDUnitConversion.values[WKIDUnitConversion[this.map.spatialReference.wkid]];
        } else {
          var wkt = this.map.spatialReference.wkt;
          var start = wkt.lastIndexOf(",") + 1;
          var end = wkt.lastIndexOf("]]");
          coeff = parseFloat(wkt.substring(start, end));
        }
        distance *= coeff; //in meters
        englishDistance = distance/1609;
        metricDistance = distance/1000;
        distance /= 1000;
      }
      if (this.mapUnit === "esriDecimalDegrees") {
        //if the map is geographic coordinate system, including web mercator as it's been converted
        var line = new Polyline(new SpatialReference({
          wkid: 4326
        }));
        line.addPath([pt1, pt2]);
        var densifiedLine = normalizeUtils._straightLineDensify(line, 10); //densify the line to get the straight line distance and prevent the great circle less than half of the perimeter
        distance = geodesicUtils.geodesicLengths([densifiedLine], esriUnits.KILOMETERS)[0];
        var midLine = new Polyline(new SpatialReference({
          wkid: 4326
        }));
        midLine.addPath([midPt1, midPt2]);
        var densifiedMidLine = normalizeUtils._straightLineDensify(midLine, 10); //densify the line to get the straight line distance and prevent the great circle less than half of the perimeter
        midDistance = geodesicUtils.geodesicLengths([densifiedMidLine], esriUnits.KILOMETERS)[0];
        englishDistance = distance/1.609;
        midDistance /= 1.609;
        metricDistance = distance;
      }
      /*if (midDistance) {
        if (distance / midDistance > 0.1) {
          if (!this._hidden) {
            domUtils.show(this.domNode);
          }
        } else {
          domUtils.hide(this.domNode);
        }
      }*/
      if (this.scalebarUnit === "english") {
        this._getScaleBarLength(englishDistance, "mi");
      }
      else if (this.scalebarUnit === "metric") {
        this._getScaleBarLength(metricDistance, "km");
      }
      else if (this.scalebarUnit === "dual") {
        this._getScaleBarLength(englishDistance, "mi");
        this._getScaleBarLength(metricDistance, "km");
      }
    },

    _getScaleBarLength: function (distance, unit) {
      var iniScaleBarLength = 50;
      var adjustedLength = iniScaleBarLength * distance / this.map.width;
      var i = 0;
      var adjustedUnit = unit;
      // Adjust it to the nearest values as the round number of 1,1.5, 2,3, 5 or 10	
      if (adjustedLength < 0.1) {
        // If it's in very small area, convert to feet or meters
        if (unit === "mi") {
          adjustedLength *= 5280;
          adjustedUnit = "ft";
        } else if (unit === "km") {
          adjustedLength *= 1000;
          adjustedUnit = "m";
        }
      }
      while (adjustedLength >= 1) {
        adjustedLength /= 10;
        i++;
      }
      var maxValue, minValue;
      if (adjustedLength > 0.5) {
        maxValue = 1;
        minValue = 0.5;
      } else if (adjustedLength > 0.3) {
        maxValue = 0.5;
        minValue = 0.3;
      } else if (adjustedLength > 0.2) {
        maxValue = 0.3;
        minValue = 0.2;
      } else if (adjustedLength > 0.15) {
        maxValue = 0.2;
        minValue = 0.15;
      } else if (adjustedLength >= 0.1) {
        maxValue = 0.15;
        minValue = 0.1;
      }
      // If it's closer to the minvalue area, move it to the minvalue;	  
      var closerValue = ((maxValue / adjustedLength) >= (adjustedLength / minValue)) ? minValue : maxValue;
      var adjustedFactor = closerValue / adjustedLength;
      var adjustedScaleBarLength = iniScaleBarLength * adjustedFactor;
      var scaleValue = Math.pow(10, i) * closerValue;
      this._drawScaleBar(adjustedScaleBarLength, scaleValue, adjustedUnit);
    },

    _drawScaleBar: function (adjustedScaleBarLength, scaleValue, adjustedUnit) {
      var mainwid = 2 * Math.round(adjustedScaleBarLength),
          firstScalebarLabels, secondScalebarLabels, backgrounds;
      if (adjustedUnit === "mi" || adjustedUnit === "ft") {
        this.englishScalebar.style.width = mainwid + "px";
         // If there are multiple scalebars on the same page, it has to query within the current instance
        firstScalebarLabels = query(".esriScalebarFirstNumber", this.englishScalebar);
        secondScalebarLabels = query(".esriScalebarSecondNumber", this.englishScalebar);
        backgrounds = query(".esriScalebarMetricLineBackground", this.englishScalebar);
      }
      else {
        this.metricScalebar.style.width = mainwid + "px";
        firstScalebarLabels = query(".esriScalebarFirstNumber", this.metricScalebar);
        secondScalebarLabels = query(".esriScalebarSecondNumber", this.metricScalebar);
        backgrounds = query(".esriScalebarMetricLineBackground", this.metricScalebar);
      }
      array.forEach(backgrounds, function (background, idx) {
        background.style.width = mainwid-2 + "px";
        //domClass.remove(background, "esriScalebarMetricLineBackground");
      }, this);
      array.forEach(firstScalebarLabels, function (firstNumber, idx) {
        firstNumber.innerHTML = scaleValue;
      }, this);
      array.forEach(secondScalebarLabels, function (secondNumber, idx) {
        if (this.mapUnit !== "esriUnknown") {
          secondNumber.innerHTML = 2 * scaleValue + this.localStrings[adjustedUnit];
        } else {
          secondNumber.innerHTML = 2 * scaleValue + "Unknown Unit";
        }
      }, this);
    }
  });

  return scalebar;
});
