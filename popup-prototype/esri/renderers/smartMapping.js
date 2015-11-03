define([
  "require",
  "module",
  "dojo/_base/array",
  "dojo/_base/lang",
  "dojo/Deferred",
  
  "../Color",
  "../core/numberUtils",
  "../styles/type",
  "../styles/size",
  "../styles/choropleth",
  "../styles/heatmap",
  "../symbols/SimpleMarkerSymbol",
  "../symbols/SimpleLineSymbol",
  "../symbols/SimpleFillSymbol",
  
  "./UniqueValueRenderer",
  "./ClassBreaksRenderer",
  "./HeatmapRenderer",
  "./support/utils",
  
  "dojo/i18n!../nls/jsapi"
], 
function(
  require, module, array, lang, Deferred,
  esriColor, numberUtils, typeStyle, sizeStyle, choroplethStyle, heatmapStyle, SMS, SLS, SFS,
  UVRenderer, CBRenderer, HMRenderer, utils,
  nlsJsapi
) {
  
  // Based on Smart Mapping specification:
  // http://servicesbeta.esri.com/jerome/esri-color-browser/index.html
  // https://devtopia.esri.com/jero6957/esri-color-browser/blob/master/data/schemes.json
  
  var smartMapping = {};
  
  //////////////////////
  // Internal functions
  //////////////////////
  
  ////////////////////
  // Utility functions
  ////////////////////
  
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER
  // Number.MAX_VALUE causes JSON parser error in iOS.
  var bigNumber = Math.pow(2, 53) - 1,
      
      i18n = nlsJsapi.smartMapping,
      defaultTypeTheme = "default",
      defaultColorTheme = "high-to-low",
      defaultSizeTheme = "default",
      defaultHeatmapTheme = "default",
      maxNoiseRatio = 0.01;
  
  function getAbsMid(relativeMid) {
    return require.toAbsMid
      
      // Dojo loader has toAbsMid
      ? require.toAbsMid(relativeMid)
      
      // RequireJS loaded does not support toAbsMid but we can use 
      // module.id
      // http://wiki.commonjs.org/wiki/Modules/1.1
      : (
        module.id.replace(/\/[^\/]*$/ig, "/") + // returns folder containing this module
        relativeMid
      );
  }
  
  function rejectDfd(dfd, errorMsg) {
    dfd.reject(new Error(errorMsg));
  }
  
  function createSymbol(scheme, color, geomType, size) {
    var symbol, outline;
    
    switch(geomType) {
      case "point":
        symbol = new SMS();
        symbol.setColor(color);
        symbol.setSize(size != null ? size : scheme.size);

        outline = new SLS();
        outline.setColor(scheme.outline.color);
        outline.setWidth(scheme.outline.width);
        
        symbol.setOutline(outline);
        break;
        
      case "line":
        symbol = new SLS();
        symbol.setColor(color);
        symbol.setWidth(size != null ? size : scheme.width);
        break;

      case "polygon":
        symbol = new SFS();
        symbol.setColor(color);
        
        outline = new SLS();
        outline.setColor(scheme.outline.color);
        outline.setWidth(scheme.outline.width);
        
        symbol.setOutline(outline);
        break;
    }
    
    return symbol;
  }
  
  function getGeometryType(layer) {
    var geomType = layer.geometryType;
    
    if (geomType === "esriGeometryPoint" || geomType === "esriGeometryMultipoint") {
      geomType = "point";
    }
    else if (geomType === "esriGeometryPolyline") {
      geomType = "line";
    }
    else if (geomType === "esriGeometryPolygon") {
      geomType = "polygon";
    }
    
    return geomType;
  }
  
  ////////////////////
  // Types
  ////////////////////
  
  function getTypeScheme(params, geomType) {
    var scheme = params.scheme;
    
    // If scheme is not provided, use the primary scheme
    // available for the given theme/basemap/geomType
    // combination.
    if (scheme) {
      scheme = typeStyle.cloneScheme(scheme);
    }
    else {
      scheme = typeStyle.getSchemes({
        theme: params.theme || defaultTypeTheme,
        basemap: params.basemap,
        geometryType: geomType
      });
      
      scheme = scheme && scheme.primaryScheme;
    }
    
    return scheme;
  }
  
  function sortUVByLabel(a, b) {
    var diff;
    
    // "label ASC"
    if (a.label < b.label) { 
      diff = -1; 
    } 
    else if (a.label > b.label) { 
      diff = 1;
    }
    else {
      diff = 0;
    } 
    
    return diff;
  }
  
  function sortUVByValue(a, b) {
    var diff;
    
    // "value ASC"
    if (a.value < b.value) { 
      diff = -1; 
    } 
    else if (a.value > b.value) { 
      diff = 1;
    }
    else {
      diff = 0;
    } 
    
    return diff;
  }
  
  function sortUVByCountLabel(a, b) {
    // "count DESC"
    var diff = b.count - a.count; 
    
    // If both counts are identical, then "label ASC" 
    if (diff === 0) {
      diff = sortUVByLabel(a, b);
    }
    
    return diff;
  }
  
  function sortUVByCountValue(a, b) {
    // "count DESC"
    var diff = b.count - a.count; 
    
    // If both counts are identical, then "value ASC"
    if (diff === 0) {
      diff = sortUVByValue(a, b);
    }
    
    return diff;
  }
  
  function sortUVInfos(uvInfos, sortBy, domain) {
    var sortFunc;
    
    if (sortBy === "count") {
      sortFunc = sortUVByCountValue;
      
      if (domain && domain.codedValues)  {
        sortFunc = sortUVByCountLabel;
      }
    }
    else if (sortBy === "value") {
      sortFunc = sortUVByValue;
      
      if (domain && domain.codedValues) {
        sortFunc = sortUVByLabel;
      }
    }
    
    if (sortFunc) {
      uvInfos.sort(sortFunc);
    }
  }
  
  function rendererFromUV(response, params, dfd) {
    // Pick a style scheme, and create the renderer
    var uvInfos = response.uniqueValueInfos,
        layer = params.layer,
        field = params.field,
        fieldInfo = layer.getField(field),
        domain = layer.getDomain(fieldInfo.name),
        i, uvInfo, colors,
        nullIndex = -1, nullInfo,
        
        numTypes = (params.numTypes == null) 
          ? 10 
          // -1 implies we need to show all available types
          : (params.numTypes === -1) ? uvInfos.length : params.numTypes,
        
        showOthers = (params.showOthers == null) ? true : params.showOthers,
        sortBy = (params.sortBy == null) ? "count" : params.sortBy,

        // For TESTING only!
        labelCallback = params && params.labelCallback,
        
        geomType = getGeometryType(layer),
        scheme = getTypeScheme(params, geomType),
        
        renderer = new UVRenderer(null, field);
    
    ////////////////////
    // Unique values
    ////////////////////
    
    // To avoid creating objects in loops below.
    var labelParams = {
      domain:    domain,
      fieldInfo: fieldInfo
    };
  
    // Add label for all unique values. Labels are required to perform
    // sorting of non-date values.
    // Find the unique value info with <null> value.
    array.forEach(uvInfos, function(uvInfo, idx) {
      labelParams.value = uvInfo.value;
      uvInfo.label = utils.createUniqueValueLabel(labelParams);
  
      // For TESTING only!
      if (labelCallback) {
        uvInfo.label = labelCallback(uvInfo);
      }
      
      if (uvInfo.value === null) {
        nullIndex = idx;
      }
    });
    
    // Remove info with <null> value. We'll add it back later.
    if (nullIndex > -1) {
      nullInfo = uvInfos.splice(nullIndex, 1)[0];
    }
    
    // Sort uvInfos
    sortUVInfos(uvInfos, sortBy, domain);
    
    // Calculate optimal interval to format date values with.
    labelParams.dateFormatInterval = utils.calculateDateFormatInterval(
      array.map(
        // Use a subset of the unique values for this calculation - it might 
        // be expensive to use all unique values.
        array.filter(uvInfos, function(uvInfo, idx) {
          return (idx < numTypes);
        }),
        
        // Extract just the date values.
        function(uvInfo) {
          return uvInfo.value;
        }
      )
    );
    
    // Get colors for all available unique values
    colors = smartMapping.createColors(scheme.colors, uvInfos.length);
    
    // Add symbol to all unique values.
    // We need to return everything to the caller.
    // Also, re-create labels for date values now that we have the sorted 
    // unique values list.
    array.forEach(uvInfos, function(uvInfo, idx) {
      labelParams.value = uvInfo.value;
      uvInfo.label = utils.createUniqueValueLabel(labelParams);
  
      // For TESTING only!
      if (labelCallback) {
        uvInfo.label = labelCallback(uvInfo);
      }

      uvInfo.symbol = createSymbol(scheme, colors[idx], geomType);
    });
    
    ////////////////////
    // Create renderer
    ////////////////////

    // Make sure we have enough colors to support numTypes.
    colors = smartMapping.createColors(scheme.colors, numTypes);
    
    // Add UniqueValueInfos to renderer
    for (i = 0; i < numTypes; i++) {
      uvInfo = uvInfos[i];
      
      // [1] uvInfos.length may be less than numTypes. Lets make sure we have uvInfo.
      // [2] Do not include null here - it should be displayed as part of "others"
      if (uvInfo) {
        renderer.addValue({
          value: uvInfo.value,
          label: uvInfo.label,
          symbol: createSymbol(scheme, colors[i], geomType)
        });
      }
    }
    
    // Add default symbol and label if required.
    if (showOthers) {
      renderer.defaultSymbol = createSymbol(scheme, scheme.noDataColor, geomType);
      renderer.defaultLabel = i18n.other;
    }
    
    // Add null value to the end of the list.
    if (nullInfo) {
      nullInfo.symbol = createSymbol(scheme, scheme.noDataColor, geomType);
      uvInfos.push(nullInfo);
    }

    dfd.resolve({ 
      renderer: renderer,
      uniqueValueInfos: uvInfos,
      source: response.source,
      othersStartIndex: (renderer.infos.length === uvInfos.length) ? -1 : renderer.infos.length,
  
      // Return a copy of the scheme to the caller.
      scheme: getTypeScheme(params, geomType)
    });
  }
  
  ////////////////////
  // Color functions
  ////////////////////
  
  function getColorScheme(params, geomType, enforcedTheme) {
    var scheme = params.scheme;
    
    // If scheme is not provided, use the primary scheme
    // available for the given theme/basemap/geomType
    // combination.
    if (scheme) {
      scheme = choroplethStyle.cloneScheme(scheme);
    }
    else {
      scheme = choroplethStyle.getSchemes({
        theme: enforcedTheme || params.theme || defaultColorTheme,
        basemap: params.basemap,
        geometryType: geomType
      });
      
      scheme = scheme && scheme.primaryScheme;
    }
    
    return scheme;
  }
  
  ////////////////////
  // Unclassed color
  ////////////////////
  
  // TODO
  // Export this function?
  function createStopValues(stats) {
    var avg = stats.avg,
        
        // We want stops to cover 1 stddev on either side of data average.
        minValue = avg - stats.stddev,
        maxValue = avg + stats.stddev,
        values;
    
    // Make sure we're within the data range
    if (minValue < stats.min) {
      minValue = stats.min;
    }
    
    if (maxValue > stats.max) {
      maxValue = stats.max;
    }
    
    // Round min and max values before creating intermediate stop values - 
    // for better looking sequence.
    values = numberUtils.round([ minValue, maxValue ]);
    minValue = values[0];
    maxValue = values[1];
    
    // TODO
    // Support user defined values:
    // [ minValue, midValue, maxValue ]
    
    values = [
      minValue,
      minValue + ((avg - minValue) / 2),
      avg,
      avg + ((maxValue - avg) / 2),
      maxValue
    ];
    
    return numberUtils.round(values);
  }
  
  function createDefaultStops(min, max, numStops) {
    // Returns an array of <numStops> values - starting from <min> 
    // and ending at <max>
    var interval = (max - min) / (numStops - 1),
        i, stops = [ min ];
  
    // Generate values between <min> and <max>.
    for (i = 1; i <= numStops - 2; i++) {
      stops.push(min + (i * interval));
    }
    
    stops.push(max);
  
    return numberUtils.round(stops);
  }
  
  function getDefaultDataRange(stats, checkAvgSD) {
    // Returns an array of min and max values *if* stats are invalid or 
    // not optimal.
    var min, max;
  
    if (stats.min == null) {
      // No features.
      // Or, all features have null value for the field.
      min = 0;
      max = 100;
    }
    else if (stats.min === stats.max) {
      // Only one feature has data value.
      // Or, all features have the same data value.
      if (stats.min < 0) {
        // Ex: min = max = -10
        min = 2 * stats.min;
        max = 0;
      }
      else if (stats.min > 0) {
        // Ex: min = max = 10
        min = 0;
        max = 2 * stats.min;
      }
      else {
        // min = max = 0
        min = 0;
        max = 100;
      }
    }
    else if (
      checkAvgSD && 
      (stats.avg == null || stats.stddev == null)
    ) {
      // It is possible that stats derived from generate renderer operation
      // have min and max but not avg and stddev.
      // Let's use the min and max available (and ignore avg and stddev) if 
      // caller has asked us to check avg and stddev.
      // Example:
      // http://services.arcgis.com/V6ZHFr6zdgNZuVG0/ArcGIS/rest/services/CHSI2009USCounties/FeatureServer/0
      // ALE normalized by Toxic_Chem
      // TODO
      // Investigate why generate renderer returns stddev breaks without one 
      // where we can derive avg and stddev from.
      min = stats.min;
      max = stats.max;
    }
    
    return (min != null) ? [ min, max ] : null;
  }
  
  function colorRendererFromStats(stats, cbResponse, normType, normField, params, dfd) {
    var useDefaults = (params.useDefaultStatistics == null) ? true : params.useDefaultStatistics;
                    
    // Make sure we have usable statistics before proceeding further.
    if (stats) {
      if (!stats.count && !useDefaults) {
        rejectDfd(dfd, "smartMapping.createColorRenderer: cannot create renderer when statistics.count is 0.");
        return;
      }
    }

    var layer = params.layer,
        field = params.field,
        geomType = getGeometryType(layer),
        showOthers = (params.showOthers == null) ? true : params.showOthers,
        scheme = getColorScheme(params, geomType),
        labelIndices, values,
        
        // 5 colors
        // 6 colors (spectral), if group-similar theme
        colors = smartMapping.createColors(scheme.colors, scheme.colors.length),
        
        // We need ClassBreaksRenderer so that we can support the case where 
        // showOthers is set to false i.e. we still need to provide a 
        // base symbol that ColorInfo can override for features that have data. 
        // We'll use a single class break for this purpose - see below.
        renderer = new CBRenderer(null, field);
  
    // Symbol for features with NULL value
    if (showOthers) {
      renderer.defaultSymbol = createSymbol(scheme, scheme.noDataColor, geomType);
      renderer.defaultLabel = i18n.other;
    }
    
    // Symbol for features that have data.
    renderer.addBreak({
      minValue: -bigNumber,
      maxValue: bigNumber,
      symbol:   createSymbol(scheme, scheme.noDataColor, geomType)
    });
    
    // theme = group-similar
    if (cbResponse) {
      // Use the mid value from each break, so that the break color 
      // dissipates on either side of the mid value and blends with the 
      // nearby break. Whereas before, a break color for a group would 
      // spill over into the nearby group which is not ideal.
      values = array.map(cbResponse.classBreakInfos, function(cbInfo) {
        return (cbInfo.minValue + cbInfo.maxValue) / 2;
      });
      
      values = numberUtils.round(values);
  
      // Display labels for all stops
      labelIndices = [0, 1, 2, 3, 4, 5];
    }
    // theme != group-similar
    else {
      var defaultRange = useDefaults ? getDefaultDataRange(stats, true) : null;
      
      // Get 5 stop values
      values = defaultRange
        ? createDefaultStops(defaultRange[0], defaultRange[1], 5)
        : createStopValues(stats);

      // All themes: display min, avg and max labels.
      labelIndices = [0, 2, 4];
    }
    
    renderer.normalizationType = normType;
    renderer.normalizationField = normField;
    
    // ColorInfo
    renderer.setVisualVariables([
      {
        type: "colorInfo",
        field: field,
        normalizationField: normField,
        
        stops: utils.createColorStops({
          values: values,
          colors: colors,
          labelIndexes: labelIndices
        })
      }
    ]);
  
    dfd.resolve({
      renderer: renderer,
      statistics: stats,
      classBreaks: cbResponse,

      // Return a copy of the scheme to the caller.
      scheme: getColorScheme(params, geomType)
    });
  }
  
  ////////////////////
  // Opacity Info
  ////////////////////
  
  function opacityInfoFromStats(stats, normField, params, dfd) {
    var useDefaults = (params.useDefaultStatistics == null) ? true : params.useDefaultStatistics;
    
    // Make sure we have usable statistics before proceeding further.
    if (stats) {
      if (!stats.count && !useDefaults) {
        rejectDfd(dfd, "smartMapping.createOpacityInfo: cannot create opacityInfo when statistics.count is 0.");
        return;
      }
    }

    var useStdDev = params.useStdDev,
        values = useStdDev ? createStopValues(stats) : null,
        defaultDataRange = useDefaults ?  getDefaultDataRange(stats, useStdDev) : null,

        // If <stats> not optimal, then:
        //  - use default range
        // If <stats> optimal for usage, then:
        //  - Use just min and max. Or min, max, avg and stddev
        dataRange = (
          defaultDataRange ||
          (
            useStdDev
              ? [ values[0], values[4] ]
              : [ stats.min, stats.max ]
          )
        ),
        
        opacityInfo = {
          
          type: "opacityInfo",
          field: params.field,
          normalizationField: normField,
          
          stops: [
            {
              value:   dataRange[0],
              opacity: 0.3 // 70% transparency
            },
            { 
              value:   dataRange[1],
              opacity: 0.7 // 30% transparency
            }
          ]
        };
  
    dfd.resolve({
      opacityInfo: opacityInfo,
      statistics: stats,
      defaultStatistics: !!defaultDataRange
    });
  }
  
  ////////////////////
  // Unclassed size
  ////////////////////
  
  function getSizeScheme(params, geomType) {
    var scheme = params.scheme;
    
    // If scheme is not provided, use the primary scheme
    // available for the given theme/basemap/geomType
    // combination.
    if (scheme) {
      scheme = sizeStyle.cloneScheme(scheme);
    }
    else {
      scheme = sizeStyle.getSchemes({
        theme: params.theme || defaultSizeTheme,
        basemap: params.basemap,
        geometryType: geomType
      });
      
      scheme = scheme && scheme.primaryScheme;
    }
    
    return scheme;
  }
  
  function getSizeRange(scheme, geomType) {
    var range;
    
    switch(geomType) {
      case "point":
        range = [ scheme.minSize, scheme.maxSize ];
        break;
        
      case "line":
        range = [ scheme.minWidth, scheme.maxWidth ];
        break;

      case "polygon":
        range = [ scheme.marker.minSize, scheme.marker.maxSize ];
        break;
    }
    
    return range;
  }
  
  function sizeRendererFromStats(stats, suggestedSizeRange, normType, normField, params, dfd) {
    var useDefaults = (params.useDefaultStatistics == null) ? true : params.useDefaultStatistics;
    
    // Make sure we have usable statistics before proceeding further.
    if (stats) {
      if (!stats.count && !useDefaults) {
        rejectDfd(dfd, "smartMapping.createSizeRenderer: cannot create renderer when statistics.count is 0.");
        return;
      }
    }

    var layer = params.layer,
        field = params.field,
        geomType = getGeometryType(layer),
        showOthers = (params.showOthers == null) ? true : params.showOthers,
        
        scheme = getSizeScheme(params, geomType),
        sizeRange = suggestedSizeRange || getSizeRange(scheme, geomType),

        isPolygon = (geomType === "polygon"),
        geomScheme = isPolygon ? scheme.marker : scheme,
        backgroundScheme = isPolygon ? scheme.background : null,
        noDataSize = (geomType === "line") ? geomScheme.noDataWidth : geomScheme.noDataSize,

        useStdDev = params.useStdDev,
        values = useStdDev ? createStopValues(stats) : null,

        defaultDataRange = useDefaults ?  getDefaultDataRange(stats, useStdDev) : null,

        // If <stats> not optimal, then:
        //  - use default range
        // If <stats> optimal for usage, then:
        //  - Use just min and max. Or min, max, avg and stddev
        dataRange = (
          defaultDataRange ||
          (
            useStdDev 
              ? [ values[0], values[4] ] 
              : [ stats.min, stats.max ]
          )
        ),
        
        // Reason for choice of ClassBreaksRenderer is same as colorRendererFromStats
        renderer = new CBRenderer(null, field);
    
    // Symbol for features with NULL value
    if (showOthers) {
      renderer.defaultSymbol = createSymbol(
        geomScheme, 
        // TODO
        // noDataColor looks identical to features with data for secondary schemes of light basemaps
        geomScheme.noDataColor, 
        isPolygon ? "point" : geomType,
        noDataSize
      );
      
      renderer.defaultLabel = i18n.other;
    }
    
    // Symbol for features that have data.
    renderer.addBreak({
      minValue: -bigNumber,
      maxValue: bigNumber,
      
      symbol: createSymbol(
        geomScheme, 
        geomScheme.color,
        isPolygon ? "point" : geomType
      )
    });
  
    if (backgroundScheme) {
      renderer.backgroundFillSymbol = createSymbol(backgroundScheme, backgroundScheme.color, geomType);
    }
    
    renderer.normalizationType = normType;
    renderer.normalizationField = normField;
    
    // SizeInfo
    renderer.setVisualVariables([
      {
        type: "sizeInfo",
        field: field,
        valueUnit: "unknown",
        normalizationField: normField,
        
        minSize: sizeRange[0],
        
        // TODO
        // Calculate based on feature count
        maxSize: sizeRange[1],
        
        minDataValue: dataRange[0],
        maxDataValue: dataRange[1]
      }
    ]);
    
    // TODO
    // Legend does not interpolate when minDataValue = 0
  
    dfd.resolve({
      renderer: renderer,
      statistics: stats,
      defaultStatistics: !!defaultDataRange,
  
      // Return a copy of the scheme to the caller.
      scheme: getSizeScheme(params, geomType)
    });
  }
  
  ////////////////////
  // Classed color
  ////////////////////

  function interpolateColors(start, end, numColors) {
    // Returns <numColors> colors in the given color range - excluding start
    // and end
    var i, colors = [], ratio = 1 / (numColors + 1);

    for (i = 1; i <= numColors; i++) {
      colors.push(
        esriColor.blendColors(start, end, ratio * i)
      );
    }

    return colors;
  }

  function getSDColors(colors, numColors) {
    // There are always 3 colors.
    // First color is always the avg color.
    // numColors can be in range 1 to N depending on number of stddev breaks.
    var outColors = [];

    if (numColors === 1) {
      // Use avg color
      outColors = [ colors[0] ];
    }
    else if (numColors === 2) {
      // Use the avg color and extreme color
      outColors = [ colors[0], colors[2] ];
    }
    else if (numColors === 3) {
      // Use avg, mid and extreme colors
      outColors = colors;
    }
    else {
      var diff = numColors - colors.length,
          half = diff / 2,
          bottomColors, topColors;

      if (diff % 2 === 0) {
        // Equal halves
        bottomColors = interpolateColors(colors[0], colors[1], half);
        topColors = interpolateColors(colors[1], colors[2], half);
      }
      else {
        // Unequal halves: one of them may have 0 colors.
        bottomColors = interpolateColors(colors[0], colors[1], Math.floor(half));
        topColors = interpolateColors(colors[1], colors[2], Math.ceil(half));
      }

      outColors = [ colors[0] ]
        .concat(bottomColors)
        .concat([ colors[1] ])
        .concat(topColors)
        .concat([ colors[2] ]);
    }

    return outColors;
  }
  
  function getColorsForBreaks(scheme, breaks, isStdDev) {
    // Returns colors for the given breaks based on the scheme:
    // We'll use colors from scheme.colors for "standard-deviation", and
    // scheme.colorsForClassBreaks for all other classification methods.

    var colors, numClasses = breaks.length, indexOfAvg = -1;

    if (isStdDev) {
      // Find the break info that contains the average data value.
      array.some(breaks, function(brk, idx) {
        if (brk.hasAvg) {
          indexOfAvg = idx;
        }

        return (indexOfAvg > -1);
      });
    }

    if (indexOfAvg > -1) {
      // scheme = "above-and-below"
      // Assign "below" colors for breaks before break-with-avg.
      // Assign the middle color for break-with-avg.
      // Assign "above" colors for breaks after break-with-avg.

      // 5 colors: 3rd color is neutral and should be used for break-with-avg
      var stopColors = scheme.colors,

          // Calculate num of colors above and below the avg color
          // (including the avg color).
          numBelow = indexOfAvg + 1,
          numAbove = numClasses - indexOfAvg,

          // Split stopColors into two arrays: below, above
          belowColors = stopColors.slice(0, 3), // last color is avg color
          aboveColors = stopColors.slice(2);    // first color is avg color

      belowColors.reverse(); // first color is avg color

      // console.log(indexOfAvg, numBelow, numAbove, belowColors, aboveColors);

      belowColors = getSDColors(belowColors, numBelow);
      aboveColors = getSDColors(aboveColors, numAbove);

      belowColors.reverse(); // last color is avg color

      colors = []
        // last color is avg color
        .concat(belowColors)

        // Exclude the first color since avg color is already included at the
        // end of belowColors
        .concat(aboveColors.slice(1));
    }
    else {
      var colorsForBreaks = scheme.colorsForClassBreaks;
      
      if (colorsForBreaks && colorsForBreaks.length > 0) {
        // Method is NOT stddev, or
        // Method is stddev, but break-with-avg cannot be found for some reason.
        array.some(colorsForBreaks, function(clrInfo) {
          if (clrInfo.numClasses === numClasses) {
            colors = clrInfo.colors;
          }
    
          return !!colors;
        });
  
        // We don't have enough handpicked colors to cover all breaks.
        // TODO
        // Let's repeat the last color for now - until the strategy is 
        // finalized for 3.14.
        if (!colors) {
          var maxColorsInfo = colorsForBreaks[colorsForBreaks.length - 1],
              deficit = numClasses - maxColorsInfo.numClasses;
    
          if (deficit > 0) {
            var lastColor = maxColorsInfo.colors[maxColorsInfo.numClasses - 1],
                i;
      
            colors = maxColorsInfo.colors.splice(0);
      
            // Use the last color to cover the deficit.
            for (i = 1; i <= deficit; i++) {
              colors.push(lastColor);
            }
          }
        }
      }
    }

    // Copy/clone colors
    if (colors) {
      colors = smartMapping.createColors(colors, colors.length);
    }
    
    return colors;
  }
  
  /*function getClassLabel(cbInfo, params) {
    var min = cbInfo.minValue, max = cbInfo.maxValue,
        suffix = "";
    
    if (params.normalizationType === "percent-of-total") {
      suffix = specialChars.pct;
    }
    
    return min + suffix + " - " + max + suffix;
  }*/
  
  function colorRendererFromCB(cbResponse, params, dfd) {
    var layer = params.layer,
        field = params.field,
        geomType = getGeometryType(layer),
        showOthers = (params.showOthers == null) ? true : params.showOthers,

        classMethod = params.classificationMethod || "equal-interval",
        isStdDev = (classMethod === "standard-deviation"),
        normType = params.normalizationType,
        
        // Enforce theme based on classification method.
        // Other themes are not supported.
        // TODO
        // We will switch to above-and-below for stddev at 3.14.
        enforcedTheme = /*isStdDev ? "above-and-below" :*/ "high-to-low",
          
        scheme, colors, renderer, breaks = cbResponse.classBreakInfos;

    scheme = getColorScheme(params, geomType, enforcedTheme);
    
    if (!scheme) {
      rejectDfd(dfd, "smartMapping.createClassedColorRenderer: unable to find suitable style scheme.");
      return;
    }
    
    // TODO
    // Let's not use the special strategy for stddev - until it is finalized
    // by Mark H for 3.14. 
    colors = getColorsForBreaks(scheme, breaks /*, isStdDev*/);
    
    if (!colors || colors.length != breaks.length) {
      rejectDfd(dfd, "smartMapping.createClassedColorRenderer: unable to find suitable colors for number of classes.");
      return;
    }
    
    ////////////////////
    // Create renderer
    ////////////////////

    renderer = new CBRenderer(null, field);

    // Metadata
    renderer.classificationMethod = classMethod;
    renderer.normalizationType = normType;
    renderer.normalizationField = (normType === "field") ? params.normalizationField : undefined;
    renderer.normalizationTotal = (normType === "percent-of-total") ? cbResponse.normalizationTotal : undefined;

    // Symbol for features with NULL value
    if (showOthers) {
      renderer.defaultSymbol = createSymbol(scheme, scheme.noDataColor, geomType);
      renderer.defaultLabel = i18n.other;
    }

    // Add class break infos with varying colors.
    array.forEach(breaks, function(brk, idx) {
      renderer.addBreak({
        minValue: brk.minValue,
        maxValue: brk.maxValue,
        symbol:   createSymbol(scheme, colors[idx], geomType),
        label:    brk.label
      });
    });
  
    // For methods other than stddev, we need to round and format the labels:
    // We will discard the given labels and create them afresh using  
    // utils.setLabelsForClassBreaks.
    if (!isStdDev) {
      utils.setLabelsForClassBreaks({
        classBreaks: renderer.infos,
        classificationMethod: classMethod,
        normalizationType: normType,
        round: true
      });
    }
        
    cbResponse.renderer = renderer;

    // Return a copy of the scheme to the caller.
    cbResponse.scheme = getColorScheme(params, geomType, enforcedTheme);
    
    dfd.resolve(cbResponse);
  }
  
  function getDefaultClassBreaks(defaultDataRange, params, dfd) {
    // Returns class break infos for the given default data range.
    params.layer
      .statisticsPlugin
      .getClassBreaks(
        lang.mixin(params, {
          classificationMethod: "equal-interval",
          numClasses: 1,
          analyzeData: false,
          minValue: defaultDataRange[0],
          maxValue: defaultDataRange[1],
          normalizationTotal: defaultDataRange[0] + defaultDataRange[1]
        })
      )

      .then(function(cbResponse) {
        cbResponse.defaultStatistics = true;
        dfd.resolve(cbResponse);
      })

      .otherwise(function(error) {
        rejectDfd(dfd, "smartMapping: error when calculating default class breaks.");
      });
  }
  
  function getClassBreaks(params) {
    // Returns class breaks to be used for color or size renderer.
    // Factors affecting class breaks are:
    //  - No features in the layer
    //  - All features have the same data value
    //  - useDefaultBreaks parameter
    var dfd = new Deferred(),
        layer = params.layer,
        useDefaults = (params.useDefaultBreaks == null) ? true : params.useDefaultBreaks;
    
    layer
      .statisticsPlugin
      .getClassBreaks(params)
      
      .then(function(cbResponse) {
        var defaultDataRange = useDefaults 
          ? getDefaultDataRange({
              min: cbResponse.minValue,
              max: cbResponse.maxValue
            }) 
          : null;
        
        if (defaultDataRange) {
          getDefaultClassBreaks(defaultDataRange, params, dfd);
        }
        else {
          cbResponse.defaultStatistics = false;
          dfd.resolve(cbResponse);
        }
      })
    
      .otherwise(function(error) {
        if (layer.graphics.length || !useDefaults) {
          rejectDfd(dfd, "smartMapping: error when calculating class breaks.");
        }
        else {
          // This *could* be the case where there are no matching features for 
          // generation renderer operation to succeed.
          getDefaultClassBreaks(getDefaultDataRange({}), params, dfd);
        }
      });
  
    return dfd.promise;
  }
  
  ////////////////////
  // Classed size
  ////////////////////
  
  function interpolateSize(scheme, geomType, numClasses, suggestedSizeRange) {
    // Return <numClasses> size values.
    var range = suggestedSizeRange || getSizeRange(scheme, geomType),
        minSize = range[0], maxSize = range[1],
        
        // Make sure we reach maxSize when numClasses = 4 or more. Hence 
        // the divisor below.
        interval = (maxSize - minSize) / (numClasses >= 4 ? (numClasses - 1) : numClasses),
        
        i, sizeBreaks = [];
   
    for (i = 0; i < numClasses; i++) {
      sizeBreaks.push(minSize + (interval * i));
    }
    
    /*if (numClasses === 1) {
      sizeBreaks = [ minSize ];
    }
    else if (numClasses === 2) {
      sizeBreaks = [ minSize, maxSize ];
    }
    else {
      var numInterpolated = numClasses - 2, // exclude minSize and maxSize since we already got them
          ratio = 1 / (numInterpolated + 1),
          i;
      
      range = maxSize - minSize;
      
      sizeBreaks.push(minSize);
      
      for (i = 1; i <= numInterpolated; i++) {
        sizeBreaks.push(minSize + (range * ratio * i));
      }
      
      sizeBreaks.push(maxSize);
    }*/
    
    return sizeBreaks;
  }

  function sizeRendererFromCB(cbResponse, suggestedSizeRange, params, dfd) {
    var layer = params.layer,
        field = params.field,
        geomType = getGeometryType(layer),
        showOthers = (params.showOthers == null) ? true : params.showOthers,
        classMethod = params.classificationMethod || "equal-interval",
        normType = params.normalizationType,
        breaks = cbResponse.classBreakInfos,
        
        scheme = getSizeScheme(params, geomType),
        sizeValues = interpolateSize(scheme, geomType, breaks.length, suggestedSizeRange),

        isPolygon = (geomType === "polygon"),
        geomScheme = isPolygon ? scheme.marker : scheme,
        backgroundScheme = isPolygon ? scheme.background : null,
        
        renderer;
    
    ////////////////////
    // Create renderer
    ////////////////////

    renderer = new CBRenderer(null, field);

    // Metadata
    renderer.classificationMethod = classMethod;
    renderer.normalizationType = normType;
    renderer.normalizationField = (normType === "field") ? params.normalizationField : undefined;
    renderer.normalizationTotal = (normType === "percent-of-total") ? cbResponse.normalizationTotal : undefined;

    // Symbol for features with NULL value
    if (showOthers) {
      renderer.defaultSymbol = createSymbol(
        geomScheme, 
        geomScheme.noDataColor, 
        isPolygon ? "point" : geomType
      );
      
      renderer.defaultLabel = i18n.other;
    }
  
    if (backgroundScheme) {
      renderer.backgroundFillSymbol = createSymbol(backgroundScheme, backgroundScheme.color, geomType);
    }

    // Add class break infos with varying size.
    array.forEach(breaks, function(brk, idx) {
      renderer.addBreak({
        minValue: brk.minValue,
        maxValue: brk.maxValue,
        symbol:   createSymbol(
          geomScheme, 
          geomScheme.color, 
          isPolygon ? "point" : geomType, 
          sizeValues[idx]
        ),
        label:    brk.label
      });
    });
  
    // For methods other than stddev, we need to round and format the labels:
    // We will discard the given labels and create them afresh using  
    // utils.setLabelsForClassBreaks.
    if (classMethod !== "standard-deviation") {
      utils.setLabelsForClassBreaks({
        classBreaks: renderer.infos,
        classificationMethod: classMethod,
        normalizationType: normType,
        round: true
      });
    }
        
    cbResponse.renderer = renderer;
  
    // Return a copy of the scheme to the caller.
    cbResponse.scheme = getSizeScheme(params, geomType);
    
    dfd.resolve(cbResponse);
  }
  
  ////////////////////
  // Heatmap
  ////////////////////
  
  function getHeatmapScheme(params) {
    var scheme = params.scheme;
    
    // If scheme is not provided, use the primary scheme
    // available for the given theme/basemap/geomType
    // combination.
    if (scheme) {
      scheme = heatmapStyle.cloneScheme(scheme);
    }
    else {
      scheme = heatmapStyle.getSchemes({
        theme: params.theme || defaultHeatmapTheme,
        basemap: params.basemap
      });
      
      scheme = scheme && scheme.primaryScheme;
    }
    
    return scheme;
  }
  
  function heatmapRenderer(stats, params, dfd) {
    var useDefaults = (params.useDefaultStatistics == null) ? true : params.useDefaultStatistics;
  
    // Make sure we have usable statistics before proceeding further.
    if (!stats.count && !useDefaults) {
      rejectDfd(dfd, "smartMapping.createHeatmapRenderer: cannot create renderer when statistics.count is 0.");
      return;
    }

    var fieldOffset = stats.fieldOffset,
        blurRadius = (params.blurRadius == null) ? 10 : params.blurRadius,
        minRatio = (params.minRatio == null) ? 0.01 : params.minRatio,
        maxRatio = (params.maxRatio == null) ? 1 : params.maxRatio,
        fadeToTransparent = (params.fadeToTransparent == null) ? true : params.fadeToTransparent,
        scheme = getHeatmapScheme(params),
        colors = scheme.colors,
        numColors = colors.length,
        
        applyDefaults = (!stats.count && useDefaults),
        dataRange = applyDefaults ? [ 0, 100 ] : [ stats.min, stats.max],
        
        renderer = new HMRenderer();
    
    renderer.setBlurRadius(blurRadius);
    renderer.setField(params.field);
    
    if (fieldOffset != null) {
      renderer.setFieldOffset(fieldOffset);
    }
    
    renderer.setMinPixelIntensity(dataRange[0]);
    renderer.setMaxPixelIntensity(dataRange[1]);

    // Add colorStops
    var firstColor = colors[0],
        colorStops = [
          // The first color needs to be fully transparent to avoid solid background 
          // color everywhere.
          { ratio: 0,    color: new esriColor([ firstColor.r, firstColor.g, firstColor.b, 0 ]) },
          
          // All pixels with <maxNoiseRatio> or less are considered noise.
          { ratio: maxNoiseRatio, color: new esriColor([ firstColor.r, firstColor.g, firstColor.b, 0 ]) },
          
          { 
            ratio: fadeToTransparent ? minRatio : maxNoiseRatio, 
            color: firstColor  // opacity = 0.7
          }
        ],
        interval = (maxRatio - minRatio) / (numColors - 1);
    
    colors = smartMapping.createColors(colors, numColors);
    
    array.forEach(colors, function(color, idx) {
      colorStops.push({
        ratio: minRatio + (interval * idx),
        color: color
      });
    });

    renderer.setColorStops(colorStops);
    
    dfd.resolve({
      renderer: renderer,
      statistics: stats,
      defaultStatistics: applyDefaults,
  
      // Return a copy of the scheme to the caller.
      scheme: getHeatmapScheme(params)
    });
  }
  
  ////////////////////
  // Module value
  ////////////////////
  
  var statsPluginUrl = getAbsMid("../plugins/FeatureLayerStatistics");
  
  lang.mixin(smartMapping, {
    
    createColors: function(colors, numColors) {
      // Returns <numColors> colors - repeats colors if necessary.
      var outColors = [], maxColors = colors.length, i;
      
      for (i = 0; i < numColors; i++) {
        outColors.push(
          new esriColor(colors[i % maxColors])
        );
      }
      
      return outColors;
    },
    
    createTypeRenderer: function(parameters) {
      // parameters:
      //  layer, field, theme, basemap, scheme?
      //  numTypes(10), showOthers(true)
      //  sortBy(count [value])
      //  labelCallback
      var dfd = new Deferred();
      
      // Reject if parameters are missing.
      if (
        !(
          parameters &&
          parameters.layer && 
          parameters.field && 
          (
            parameters.scheme || parameters.basemap
          )
        )
      ) {
        rejectDfd(dfd, "smartMapping.createTypeRenderer: missing parameters.");
        return dfd.promise;
      }

      var layer = parameters.layer;
      
      layer
        .addPlugin(statsPluginUrl)
        
        .then(function() {
          layer.statisticsPlugin
               .getUniqueValues({
                 field: parameters.field,
                 includeAllCodedValues: parameters.includeAllCodedValues
               })
               
               .then(function(response) {
                 rendererFromUV(response, parameters, dfd);
               })
               
               .otherwise(function(error) {
                 rejectDfd(dfd, "smartMapping.createTypeRenderer: error when calculating unique values.");
               });
        })
        
        .otherwise(function(error) {
          rejectDfd(dfd, "smartMapping.createTypeRenderer: error when adding feature layer statistics plugin.");
        });
      
      return dfd.promise;
    },
    
    createColorRenderer: function(parameters) {
      var dfd = new Deferred();
      
      // Reject if parameters are missing.
      if (
        !(
          parameters &&
          parameters.layer && 
          parameters.field
        )
      ) {
        rejectDfd(dfd, "smartMapping.createColorRenderer: missing parameters.");
        return dfd.promise;
      }

      var layer = parameters.layer,
          normField = parameters.normalizationField,
          normType = normField ? "field" : undefined;
      
      // TODO
      // We cannot support percent-of-total and log normalization until 
      // ColorInfo and SizeInfo support them.
      
      if (parameters.statistics) {
        colorRendererFromStats(parameters.statistics, null, normType, normField, parameters, dfd);
      }
      else {
        layer
          .addPlugin(statsPluginUrl)
          
          .then(function() {
            // Use class breaks for group-similar.
            // Use field statistics for other themes.
            
            if (
              parameters.theme === "group-similar" || 
              (parameters.scheme && parameters.scheme.id.indexOf("group-similar/") === 0)
            ) {
              layer.statisticsPlugin
                   .getClassBreaks({ 
                     field: parameters.field,
                     classificationMethod: "natural-breaks",
                     
                     // TODO
                     // Number of colors in the scheme should determine numClasses
                     numClasses: 6,
                     
                     normalizationType: normType,
                     normalizationField: normField,
                     minValue: parameters.minValue,
                     maxValue: parameters.maxValue
                   })
                   
                   .then(function(cbResponse) {
                     colorRendererFromStats(null, cbResponse, normType, normField, parameters, dfd);
                   })
                   
                   .otherwise(function(error) {
                     rejectDfd(dfd, "smartMapping.createColorRenderer: error when calculating class breaks.");
                   });
            }
            else {
              layer.statisticsPlugin
                   .getFieldStatistics({
                     field: parameters.field,
                     normalizationType: normType,
                     normalizationField: normField,
                     minValue: parameters.minValue,
                     maxValue: parameters.maxValue
                   })
                   
                   .then(function(stats) {
                     colorRendererFromStats(stats, null, normType, normField, parameters, dfd);
                   })
                   
                   .otherwise(function(error) {
                     rejectDfd(dfd, "smartMapping.createColorRenderer: error when calculating field statistics.");
                   });
            }
            
          })
          
          .otherwise(function(error) {
            rejectDfd(dfd, "smartMapping.createColorRenderer: error when adding feature layer statistics plugin.");
          });
      }
      
      return dfd.promise;
    },
    
    createOpacityInfo: function(parameters) {
      var dfd = new Deferred();
      
      // Reject if parameters are missing.
      if (
        !(
          parameters &&
          parameters.layer && 
          parameters.field
        )
      ) {
        rejectDfd(dfd, "smartMapping.createOpacityInfo: missing parameters.");
        return dfd.promise;
      }

      var layer = parameters.layer,
          normField = parameters.normalizationField,
          normType = normField ? "field" : undefined;
            
      if (parameters.statistics) {
        opacityInfoFromStats(parameters.statistics, normField, parameters, dfd);
      }
      else {
        layer
          .addPlugin(statsPluginUrl)
          
          .then(function() {
            layer.statisticsPlugin
                 .getFieldStatistics({
                   field: parameters.field,
                   normalizationType: normType,
                   normalizationField: normField,
                   minValue: parameters.minValue,
                   maxValue: parameters.maxValue
                 })

                 .then(function(stats) {
                   opacityInfoFromStats(stats, normField, parameters, dfd);
                 })

                 .otherwise(function(error) {
                   rejectDfd(dfd, "smartMapping.createOpacityInfo: error when calculating field statistics.");
                 });
          })
          
          .otherwise(function(error) {
            rejectDfd(dfd, "smartMapping.createOpacityInfo: error when adding feature layer statistics plugin.");
          });
      }
      
      return dfd.promise;
    },
    
    createSizeRenderer: function(parameters) {
      var dfd = new Deferred();
      
      // Reject if parameters are missing.
      if (
        !(
          parameters &&
          parameters.layer && 
          parameters.field
        )
      ) {
        rejectDfd(dfd, "smartMapping.createSizeRenderer: missing parameters.");
        return dfd.promise;
      }

      var layer = parameters.layer,
          normField = parameters.normalizationField,
          normType = normField ? "field" : undefined;
      
      // TODO
      // We cannot support percent-of-total and log normalization until 
      // ColorInfo and SizeInfo support them.
      
      if (parameters.statistics) {
        sizeRendererFromStats(parameters.statistics, null, normType, normField, parameters, dfd);
      }
      else {
        layer
          .addPlugin(statsPluginUrl)
          
          .then(function() {
            layer.statisticsPlugin
                 .getFieldStatistics({
                   field: parameters.field,
                   normalizationType: normType,
                   normalizationField: normField,
                   minValue: parameters.minValue,
                   maxValue: parameters.maxValue
                 })
                 
                 .then(function(stats) {
                   if (parameters.optimizeForScale) {
                     // Use suggested size range if available.
                     layer
                       .statisticsPlugin
                       .getSuggestedSizeRange()
                     
                       .then(function(response) {
                         var suggestedSizeRange = [ response.minSize, response.maxSize ];
                         sizeRendererFromStats(stats, suggestedSizeRange, normType, normField, parameters, dfd);
                       })

                       .otherwise(function(error) {
                         sizeRendererFromStats(stats, null, normType, normField, parameters, dfd);
                       });
                   }
                   else {
                     sizeRendererFromStats(stats, null, normType, normField, parameters, dfd);
                   }
                 })
                 
                 .otherwise(function(error) {
                   rejectDfd(dfd, "smartMapping.createSizeRenderer: error when calculating field statistics.");
                 });
          })
          
          .otherwise(function(error) {
            rejectDfd(dfd, "smartMapping.createSizeRenderer: error when adding feature layer statistics plugin.");
          });
      }
      
      return dfd.promise;
    },
    
    createClassedColorRenderer: function(parameters) {
      var dfd = new Deferred(),
          minValue = parameters.minValue,
          maxValue = parameters.maxValue,
          hasCustomMinMax;
      
      // Reject if parameters are missing.
      if (
        !(
          parameters &&
          parameters.layer && 
          parameters.field
        )
      ) {
        rejectDfd(dfd, "smartMapping.createClassedColorRenderer: missing parameters.");
        return dfd.promise;
      }
  
      // Have custom min/max values?
      hasCustomMinMax = (minValue != null && maxValue != null);
  
      // Make sure we have both minValue and maxValue
      if (!hasCustomMinMax && (minValue != null || maxValue != null)) {
        rejectDfd(dfd, "smartMapping.createClassedColorRenderer: both minValue and maxValue are required when specifying custom data range.");
        return dfd.promise;
      }
  
      parameters = lang.mixin({ analyzeData: !hasCustomMinMax }, parameters);
  
      var layer = parameters.layer;
      
      layer
        .addPlugin(statsPluginUrl)
        
        .then(function() {
          getClassBreaks(parameters)
            
            .then(function(cbResponse) {
              colorRendererFromCB(cbResponse, parameters, dfd);
            })
           
            .otherwise(function(error) {
              rejectDfd(dfd, "smartMapping.createClassedColorRenderer: error when calculating class breaks.");
            });
        })
        
        .otherwise(function(error) {
          rejectDfd(dfd, "smartMapping.createClassedColorRenderer: error when adding feature layer statistics plugin.");
        });
    
      return dfd.promise;
    },
    
    createClassedSizeRenderer: function(parameters) {
      var dfd = new Deferred(),
          minValue = parameters.minValue,
          maxValue = parameters.maxValue,
          hasCustomMinMax;
      
      // Reject if parameters are missing.
      if (
        !(
          parameters &&
          parameters.layer && 
          parameters.field
        )
      ) {
        rejectDfd(dfd, "smartMapping.createClassedSizeRenderer: missing parameters.");
        return dfd.promise;
      }
  
      // Have custom min/max values?
      hasCustomMinMax = (minValue != null && maxValue != null);
  
      // Make sure we have both minValue and maxValue
      if (!hasCustomMinMax && (minValue != null || maxValue != null)) {
        rejectDfd(dfd, "smartMapping.createClassedColorRenderer: both minValue and maxValue are required when specifying custom data range.");
        return dfd.promise;
      }
      
      parameters = lang.mixin({ analyzeData: !hasCustomMinMax }, parameters);

      var layer = parameters.layer;
      
      layer
        .addPlugin(statsPluginUrl)
        
        .then(function() {
          getClassBreaks(parameters)
               
            .then(function(cbResponse) {
              if (parameters.optimizeForScale) {
                // Use suggested size range if available.
                layer
                  .statisticsPlugin
                  .getSuggestedSizeRange()

                  .then(function(response) {
                    var suggestedSizeRange = [ response.minSize, response.maxSize ];
                    sizeRendererFromCB(cbResponse, suggestedSizeRange, parameters, dfd);
                  })

                  .otherwise(function(error) {
                    sizeRendererFromCB(cbResponse, null, parameters, dfd);
                  });
              }
              else {
                sizeRendererFromCB(cbResponse, null, parameters, dfd);
              }
            })
           
            .otherwise(function(error) {
              rejectDfd(dfd, "smartMapping.createClassedSizeRenderer: error when calculating class breaks.");
            });
        })
        
        .otherwise(function(error) {
          rejectDfd(dfd, "smartMapping.createClassedSizeRenderer: error when adding feature layer statistics plugin.");
        });
    
      return dfd.promise;
    },
    
    createHeatmapRenderer: function(parameters) {
      var dfd = new Deferred();
      
      // Reject if parameters are missing.
      if (
        !(
          parameters &&
          parameters.layer
        )
      ) {
        rejectDfd(dfd, "smartMapping.createHeatmapRenderer: missing parameters.");
        return dfd.promise;
      }

      var layer = parameters.layer;
      
      if (parameters.statistics) {
        heatmapRenderer(parameters.statistics, parameters, dfd);
      }
      else {
        layer
          .addPlugin(statsPluginUrl)
          
          .then(function() {
            layer
              .statisticsPlugin
              .getHeatmapStatistics(parameters)
      
              .then(function(stats) {
                heatmapRenderer(stats, parameters, dfd);
              })
      
              .otherwise(function(error) {
                rejectDfd(dfd, "smartMapping.createHeatmapRenderer: error when calculating heatmap statistics.");
              });
          })

          .otherwise(function(error) {
            rejectDfd(dfd, "smartMapping.createHeatmapRenderer: error when adding feature layer statistics plugin.");
          });
      }
      
      return dfd.promise;
    },
    
    applyHeatmapScheme: function(parameters) {
      // Check if parameters are missing.
      if (
        !(
          parameters &&
          parameters.renderer &&
          parameters.scheme
        )
      ) {
        console.log("smartMapping.applyHeatmapScheme: missing parameters.");
        return;
      }
      
      var scheme = getHeatmapScheme({ scheme: parameters.scheme }),
          renderer = parameters.renderer,
          currentStops = renderer.colorStops,
          colors = scheme.colors;
      
      // See "heatmapRenderer" function in this module to understand why we 
      // need to perform this length check:
      // heatmapRenderer prepends 3 more colors to the colors in a given 
      // scheme to get the desired visual effect.
      if (currentStops.length !== (colors.length + 3)) {
        console.log("smartMapping.applyHeatmapScheme: incompatible number of colors in 'colors' and 'renderer.colorStops'.");
        return;
      }
      
      var i, 
          
          // Make a copy of the first color.
          firstColor = new esriColor(colors[0]),
          
          // Make a copy of the existing color stops.
          colorStops = array.map(currentStops, function(stop) {
            return lang.mixin({}, stop);
          });
      
      // Update colors in color stops. Do not touch ratio or value.
      colorStops[0].color = new esriColor([ firstColor.r, firstColor.g, firstColor.b, 0 ]);
      colorStops[1].color = new esriColor([ firstColor.r, firstColor.g, firstColor.b, 0 ]);
      colorStops[2].color = firstColor;
      
      for (i = 3; i < colorStops.length; i++) {
        colorStops[i].color = colors[i - 3];
      }

      renderer.setColorStops(colorStops);
    }
    
  });

  
  
  return smartMapping;
});
