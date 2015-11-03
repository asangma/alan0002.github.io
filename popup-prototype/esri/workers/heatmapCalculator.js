/* global postMessage: true */

(function(root, factory) {
  if (typeof define === "function" && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else {
    // Browser globals (root is window)
    root.HeatmapCalculator = factory();
  }
  if (root.importScripts && (typeof root.importScripts === "function")) {
    //in a worker
    var calculator;
    function handleMessage(evt) {
      var msg = evt.data;
      var action = msg.action,
        id = msg.msgId;
      if (action && id) {
        if (action == "initialize") {
          calculator = new root.HeatmapCalculator(msg);
          postMessage({
            msgId: id
          });
        } else if (action == "calculate") {
          var imgData = calculator.calculateImageData(msg);
          postMessage({
            msgId: id,
            imageData: imgData
          }, imgData);
        }
      }
    }
    root.addEventListener("message", handleMessage, false);
  }
}(this, function() {

  function HeatmapCalculator(options) {
    options = options || {};  
    this.radius = options.blurRadius || 10;
    this.maxVal = options.maxPixelIntensity;
    this.minVal = options.minPixelIntensity;
    this.field = options.field;
    this.fieldOffset = options.fieldOffset;
    this.width = options.width;
    this.height = options.height;
    this.gradient = options.gradient;
    this.stats = null;
  }

  var supportTypedArray = (window.ArrayBuffer) ? true : false;

  HeatmapCalculator.prototype.calculateImageData = function(params) {
    //sticky parameters, passing them sets them for future operations
    var radius = this.radius = params.blurRadius || this.blurRadius;
    //zero is a valid value for the next 2 items, so have to compare to null & undef
    this.maxVal = (params.maxPixelIntensity != null) ? params.maxPixelIntensity : this.maxPixelIntensity;
    this.minVal = (params.minPixelIntensity != null) ? params.minPixelIntensity : this.minPixelIntensity;
    //if a field value is passed, respect it, regardless of "truthiness"
    var field = this.field = ("field" in params) ? params.field : this.field;
    var offset = this.fieldOffset = ("fieldOffset" in params) ? params.fieldOffset : this.fieldOffset;
    var screenPoints = params.screenPoints;
    var gradient = params.gradient;
    if (gradient) {
      this.gradient = gradient;
    } else if (this.gradient) {
      gradient = this.gradient;
    } else {
      return false;
    }

    //non sticky
    var mapPoints = params.features;
    var mapinfo = params.mapinfo;

    if (!screenPoints) {
      if (mapPoints && mapinfo) {
        screenPoints = this.screenPoints = this._calculateScreenPoints(mapPoints, mapinfo);
      } else if (!mapinfo && this.screenPoints) {
        var useCached = true;
        if (params.width && params.width != this.width) {
          useCached = false;
          this.width = params.width;
        }
        if (params.height && params.height != this.height) {
          useCached = false;
          this.height = params.height;
        }
        if (useCached) {
          screenPoints = this.screenPoints;
        } else {
          this.screenPoints = null;
        }
      }
    }
    
    if (!screenPoints) {
      return false;
    }
    
    var w = mapinfo.width || params.width || this.width;
    var h = mapinfo.height || params.height || this.height;
    
    var intensityInfo = this._calculateIntensityMatrix(screenPoints, w, h, radius, field, offset);
    
    this._lastMatrix = intensityInfo.matrix;
    this._maxIntVal = intensityInfo.max;
    
    var imageData = this._createImageData(w, h, this._lastMatrix, gradient);
    
    return imageData;
  };

  HeatmapCalculator.prototype._calculateScreenPoints = function(mapPoints, mapinfo) {
    var resolution = mapinfo.resolution,
      width = mapinfo.width,
      height = mapinfo.height,
      extent = mapinfo.extent;
    var spoints = [];
    if (!extent) {
      return false;
    } else if (!resolution) {
      resolution = (height) ? Math.abs(extent[3] - extent[1]) / height :
        Math.abs(extent[2] - extent[0]) / width;
    }
    for (var i = 0, len = mapPoints.length; i < len; i++) {
      var pt = mapPoints[i];
      spoints[i] = {
        x: Math.round((pt.geometry.x - extent[0]) / resolution),
        y: Math.round((extent[3] - pt.geometry.y) / resolution),
        attributes: pt.attributes
      };
    }
    return spoints;
  };

  HeatmapCalculator.prototype._calculateIntensityMatrix = function(points, width, height, radius, field, offset) {
    // NOTE
    // This function is used by FeatureLayerStatistics plugin.
    // Update the plugin if this function is modified.
    // Keep this function stateless i.e. do not modify class members.
    var matrix = init2DArray(height, width);
    var blurSize = Math.round(radius * 4.5);
    var sigma_sqr = radius * radius;
    var kernel = [];
    var kernelSize = blurSize * 2 + 1;
    var i = -1, val = 1;
    var max = -Infinity, intensity;

    offset = offset || 0;
    
    var valFunc = (function vfunc(field){
        if(typeof(field) == "function"){
          return field;
        } else if(field){
          if(offset == "abs"){
            return function avfld(point){
              return +point.attributes[field] * -1;
            };
          } else {
            return function vfld(point){
              return +point.attributes[field] + offset;
            };
          }
        } else {
          return function vone(){
            return 1;
          };
        }
    })(field);
    
    while (++i < kernelSize) {
      kernel[i] = Math.exp(-Math.pow(i - blurSize, 2) / (2 * sigma_sqr)) / Math.sqrt(2 * Math.PI) * (radius/2);
    }
    
    // single windowed pass over data
    for (i = 0; i < points.length; i++) {
      var point = points[i],
        x = point.x - blurSize,
        y = point.y - blurSize,
        ur = {
          "x": x,
          "y": y
        };
      val = +valFunc(point);
      //starting at top right of kernel
      var ymax = Math.min(point.y + blurSize, height - 1),
        xmax = Math.min(point.x + blurSize, width - 1);
      while (y <= ymax) {
        var ykrn = kernel[y - ur.y];
        while (x <= xmax) {
          if (x > -1 && y > -1) {
            intensity = matrix[y][x] += (ykrn * kernel[x - ur.x] * val);
            if(intensity > max){ max = intensity; }
          }
          x++;
        }
        y++;
        x = ur.x;
      }
    }
    
    return {
      matrix: matrix,
      max: max
    };
  };

  HeatmapCalculator.prototype._createImageData = function(width, height, intensities, gradient) {
    if(!supportTypedArray){
      return this._createPixelData(width, height, intensities, gradient);
    }
    var data = new Uint32Array(width*height);
    gradient = (gradient.buffer) ? new Uint32Array(gradient.buffer) : new Uint32Array(new Uint8Array(gradient).buffer);
    var max = this.maxVal;
    var min = this.minVal;
    var slope = gradient.length / (max-min);
    for (var i = 0; i < height; i++) {
      var r = intensities[i];
      for (var n = 0; n < width; n++) {
        var value = r[n];
        var idx = (i * width + n);
        var gidx = Math.floor((value-min) * slope);
        data[idx] = (gidx < 0) ? gradient[0] : (gidx < gradient.length) ? gradient[gidx] : gradient[gradient.length - 1];
      }
    }
    return data;
  };

  HeatmapCalculator.prototype._createPixelData = function(width, height, intensities, gradient) {
    var data = new Array(width * height * 4);
    var max = this.maxVal;
    var min = this.minVal;
    var slope = gradient.length/4 / (max-min);
    var c = 3;
    for (var i = 0; i < height; i++) {
      var r = intensities[i];
      for (var n = 0; n < width; n++) {
        var value = r[n];
        var idx = (i * width + n) * 4 + 3;
        var gidx = (Math.floor((value-min) * slope ) * 4) + 3;
        if(gidx < 3){
          gidx = 3;
        } else if (gidx > gradient.length-1){
          gidx = gradient.length - 1;
        }
        c = 4;
        while(c--){
          data[idx-c] = gradient[gidx-c];
        }
      }
    }
    return data;
  };

  HeatmapCalculator.calculateStats = function(matrix, filter){
    // NOTE
    // This function is used by FeatureLayerStatistics plugin.
    // Update the plugin if this function is modified.
    // Keep this function stateless i.e. do not modify class members.
    
    //just return if no matrix was passed
    if(!matrix){
      return false;
    }
    
    var r = matrix.length,
        sum = 0, sumSqr = 0, n = 0, s = 0,
        min = Infinity, max = -Infinity,
        c, v, row, v0, val, stats;
    
    while (r--) {
      row = matrix[r];
      c = row.length;
      while (c--) {
        val = row[c];
        if (!filter || filter(val)) {
          if(!v0){v0 = val;}
          v = val - v0;
          s += val;
          sum += v;
          sumSqr += (v * v);
          if (val < min) {
            min = val;
          }
          if (val > max) {
            max = val;
          }
          n++;
        }
      }
    }
    
    if (n > 0) {
      stats = {
        mean: s / n,
        stdDev: Math.sqrt((sumSqr - (sum * sum / n)) / n),
        min: min,
        max: max,
        mid: (max - min) / 2
      };
    } else {
      stats = {
        mean: 0,
        stdDev: 0,
        min: 0,
        max: 0,
        mid: 0
      };
    }

    return stats;
  };

  HeatmapCalculator.getBinnedValues = function(options){
    options = options || {};
    var stats = options.stats,
        min = options.min,
        max = options.max,
        bins = options.bins,
        count = options.count,
        size = options.size,
        values = options.values;
    //without values, there is nothing to calculate
    if(!values){
      console.log("values are required for HeatmapCalculator.getBinnedValues function");
      return false;
    }
    if(stats && stats.max != null && stats.min != null){
      min = stats.min;
      max = stats.max;
    }
    //given bins, we don't need any other information
    if(!bins){
      //given bin size, we need a starting point and a count or end point
      if(size){
        if(min == null){
          min = 0;
        }
        if(max == null){
          if(count == null){
            logMoreInfo();
            return false;
          } else {
            max = min + (count * size);
          }
        }
        bins = buildBins(min, max, size);
      }
      //given only the bin count, we need min and max to determine size 
      else if(count){
        if(stats && stats.min != null && stats.max != null){
          min = stats.min;
          max = stats.max;
        } else if(max != null && max > 0 && min == null){
          min = 0;
        }
        if(min == null || max == null){
          logMoreInfo();
          return false;
        }
        size = (max - min) / count;
        bins = buildBins(min, max, size); 
      }
    }
    count = bins.length;
    var buckets = init2DArray(count, 0);
    var r = values.length;
    var c, row, val, b, i;
    while (r--) {
      row = values[r];
      c = row.length;
      while (c--) {
        val = row[c];
        for(i=1;i<count;i++){
          b = bins[i];
          if(val < b){
            break;
          }
        }
        buckets[i-1].push(val);
      }
    }

    var sorted = buckets.map(function(b){
        return b.sort(numSort);
      });

    return sorted;

    function logMoreInfo(){
      console.log("not enough information to determine bins for HeatmapCalculator.getBinnedValues");
    }

    function buildBins(min, max, size){
      var b = [];
      for (var i = min; i < max; i = i + size) {
        b.push(i);
      }
      return b;
    }

  };

  HeatmapCalculator.getHistogramData = function(options){
    options = options || {};
    var binnedData = options.binnedData,
        stats = options.stats,
        byStdDev = options.byStdDev,
        matrix = options.matrix,
        binOptions = options.binOptions || {};
    if(!binnedData){
      if(!matrix){
        console.log("no data provided to HeatmapCalculator.getHistogramData");
        return false;
      } else {
        binOptions.values = matrix;
        if(byStdDev){
          if(!stats){
            stats = HeatmapCalculator.calculateStats(matrix);
          }
          binOptions.size = stats.stdDev;
        }
        binOptions.stats = stats;
        binnedData = HeatmapCalculator.getBinnedValues(binOptions);
        if(!binnedData){
          return false;
        }
      }
    }
    var binCount, i, limit, b, bins, counts;
    binCount = binnedData.length;
    if(!binOptions.bins){
      bins = [];
      for (i = 0; i < binnedData.length; i++) {
        b = binnedData[i];
        bins.push(b[0]);
      }
    } else {
      bins = binOptions.bins;
    }

    counts = [];
    for (i = 0; i < bins.length-1; i++) {
      b = bins[i];
      counts[i] = {
        range: [b, bins[i+1]],
        count: b.length
      };
    }
    if(stats){
      limit = stats.max;
    } else {
      b = binnedData[i];
      limit = b[b.length - 1];
    }
    b = bins[i];
    counts[i] = {
      range: [b, limit],
      count: b.length
    };

    return counts;
  };

  function init2DArray(height, width) {
    var matrix = new Array(height);
    for (var i = 0; i < height; i++) {
      var row = matrix[i] = new Array(width);
      for (var j = 0; j < width; j++) {
        row[j] = 0;
      }
    }
    return matrix;
  }

  function numSort(a,b){
    return a-b;
  }

  return HeatmapCalculator;
}));