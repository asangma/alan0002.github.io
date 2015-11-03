define([
  "dojo/_base/array",
  "dojo/_base/lang",
  "../Color"
], 
function(array, lang, esriColor) {

  // Based on styling specs from:
  // http://servicesbeta.esri.com/jerome/esri-color-browser/index.html
  // https://devtopia.esri.com/jero6957/esri-color-browser/blob/master/data/schemes.json
  
  // All size and width values are specified in pixel units.
  // All alpha values specified in the range 0.0 to 1.0.

  ////////////////////
  // Theme dictionary
  ////////////////////
  
  var noDataColorLight = [128,128,128,1],
      noDataColorDark = [128,128,128,1],
      noDataColorLight_8 = [128,128,128,0.8],
      noDataColorDark_8 = [128,128,128,0.8];
  
  var pointLight = {
    primary: {
      color: [227,139,79,0.8],
      noDataColor: noDataColorLight_8,
      outline: {
        color: [255,255,255,1.0],
        width: 1
      },
      noDataSize: 4,
      // Big enough for a nice legend. On the map, it will be superseded 
      // by minSize and maxSize for features that have data.
      size: 12,
      minSize: 8,
      maxSize: 50
    },
    
    secondary: [
      {
        color: [128,128,128,0.8],
        noDataColor: noDataColorLight_8,
        outline: {
          color: [255,255,255,1.0],
          width: 1
        },
        noDataSize: 4,
        size: 12,
        minSize: 8,
        maxSize: 50
      },
  
      {
        color: [255,255,255,0.8],
        noDataColor: noDataColorLight_8,
        outline: {
          color: [128,128,128,1.0],
          width: 1
        },
        noDataSize: 4,
        size: 12,
        minSize: 8,
        maxSize: 50
      }
    ]
  };
  
  var pointDark = {
    primary: {
      color: [227,139,79,0.8],
      noDataColor: noDataColorDark_8,
      outline: {
        color: [51,51,51,1.0],
        width: 1
      },
      noDataSize: 4,
      size: 12,
      minSize: 8,
      maxSize: 50
    },
    
    secondary: [
      {
        color: [178,178,178,0.8],
        noDataColor: noDataColorDark_8,
        outline: {
          color: [51,51,51,1.0],
          width: 1
        },
        noDataSize: 4,
        size: 12,
        minSize: 8,
        maxSize: 50
      },
  
      {
        color: [26,26,26,0.8],
        noDataColor: noDataColorDark_8,
        outline: {
          color: [128,128,128,1.0],
          width: 1
        },
        noDataSize: 4,
        size: 12,
        minSize: 8,
        maxSize: 50
      }
    ]
  };
  
  var transparentFill = { r: 0, g: 0, b: 0, a: 0 },
      bgOutlineLight = {
        color: transparentFill,
        outline: {
          color: { r: 166, g: 166, b: 166, a: 1 },
          width: 1
        }
      },
      bgOutlineDark = {
        color: transparentFill,
        outline: {
          color: { r: 166, g: 166, b: 166, a: 1 },
          width: 1
        }
      };
  
  var themes = {
    
    "default": {
      
      name:        "default",
      label:       "Default",
      description: "Default theme for visualizing features by varying their size to show data.",
      
      // Abstract groups to simplify defining common schemes for 
      // multiple basemaps. 
      basemapGroups: {
        light: [
          "streets", 
          "gray", 
          "topo", 
          "terrain", 
          "national-geographic", 
          "oceans", 
          "osm"
        ],
        
        dark: [
          "satellite",
          "hybrid",
          "dark-gray"
        ]
      },
      
      // Schemes per basemap group
      
      ////////////////////
      // Point schemes
      ////////////////////
      
      pointSchemes: {
        light: pointLight,
        dark: pointDark
      },
      
      ////////////////////
      // Line schemes
      ////////////////////
      
      lineSchemes: {
        light: {
          primary: {
            color: [226,119,40,1],
            noDataColor: noDataColorLight,
            noDataWidth: 1,
            // For nice legend. Picking the same value as minWidth.
            width: 1,
            minWidth: 1,
            maxWidth: 18
          },
          
          secondary: [
            {
              color: [77,77,77,1],
              noDataColor: noDataColorLight,
              noDataWidth: 1,
              width: 1,
              minWidth: 1,
              maxWidth: 18
            },
        
            {
              color: [153,153,153,1],
              noDataColor: noDataColorLight,
              noDataWidth: 1,
              width: 1,
              minWidth: 1,
              maxWidth: 18
            }
          ]
        },
        
        dark: {
          primary: {
            color: [226,119,40,1],
            noDataColor: noDataColorDark,
            noDataWidth: 1,
            width: 1,
            minWidth: 1,
            maxWidth: 18
          },
          
          secondary: [
            {
              color: [255,255,255,1],
              noDataColor: noDataColorDark,
              noDataWidth: 1,
              width: 1,
              minWidth: 1,
              maxWidth: 18
            },
        
            {
              color: [153,153,153,1],
              noDataColor: noDataColorDark,
              noDataWidth: 1,
              width: 1,
              minWidth: 1,
              maxWidth: 18
            }
          ]
        }
      },
      
      ////////////////////
      // Polygon schemes
      ////////////////////
      
      polygonSchemes: {
        light: {
          primary: {
            marker: pointLight.primary,
            background: bgOutlineDark
          },
          
          secondary: [
            {
              marker: pointLight.secondary[0],
              background: bgOutlineDark
            },
        
            {
              marker: pointLight.secondary[1],
              background: bgOutlineDark
            }
          ]
        },
        
        dark: {
          primary: {
            marker: pointDark.primary,
            background: bgOutlineLight
          },
          
          secondary: [
            {
              marker: pointDark.secondary[0],
              background: bgOutlineLight
            },
        
            {
              marker: pointDark.secondary[1],
              background: bgOutlineLight
            }
          ]
        }
      }
      
    }
    
  };

  ////////////////////
  // Pre-processing
  ////////////////////
  
  var index = {};
  
  function createIndex() {
    var themeName, theme, groups, groupName,
        themeIndex, basemapsInGroup, i, basemap;
    
    for (themeName in themes) {
      theme = themes[themeName];
      groups = theme.basemapGroups;
      
      themeIndex = index[themeName] = {
        // Basemaps supported by this theme
        basemaps: [].concat(groups.light)
                    .concat(groups.dark),
        point:   {},
        line:    {},
        polygon: {}
      };
      
      for (groupName in groups) {
        basemapsInGroup = groups[groupName];
        
        for (i = 0; i < basemapsInGroup.length; i++) {
          basemap = basemapsInGroup[i];
          
          if (theme.pointSchemes) {
            themeIndex.point[basemap] = theme.pointSchemes[groupName];
          }

          if (theme.lineSchemes) {
            themeIndex.line[basemap] = theme.lineSchemes[groupName];
          }

          if (theme.polygonSchemes) {
            themeIndex.polygon[basemap] = theme.polygonSchemes[groupName];
          }
        }
      }
    }
  }
  
  function copyScheme(scheme, geomType) {
    var retVal, marker, background;
    
    if (scheme) {
      retVal = {};
      
      switch(geomType) {
        case "point":
          retVal.color = new esriColor(scheme.color);
          retVal.noDataColor = new esriColor(scheme.noDataColor);
          retVal.outline = {
            color: new esriColor(scheme.outline.color),
            width: scheme.outline.width
          };
          retVal.size = scheme.size;
          retVal.noDataSize = scheme.noDataSize;
          retVal.minSize = scheme.minSize;
          retVal.maxSize = scheme.maxSize;
          break;
          
        case "line":
          retVal.color = new esriColor(scheme.color);
          retVal.noDataColor = new esriColor(scheme.noDataColor);
          retVal.width = scheme.width;
          retVal.noDataWidth = scheme.noDataWidth;
          retVal.minWidth = scheme.minWidth;
          retVal.maxWidth = scheme.maxWidth;
          break;
          
        case "polygon":
          marker = scheme.marker;
          background = scheme.background;
           
          retVal.marker = {
            color: new esriColor(marker.color),
            noDataColor: new esriColor(marker.noDataColor),
            outline: {
              color: new esriColor(marker.outline.color),
              width: marker.outline.width
            },
            size: marker.size,
            noDataSize: marker.noDataSize,
            minSize: marker.minSize,
            maxSize: marker.maxSize
          };
          
          retVal.background = {
            color: new esriColor(background.color),
            outline: {
              color: new esriColor(background.outline.color),
              width: background.outline.width
            }
          };
          break;
          
      }
    }
    
    return retVal;
  }
  
  function basicClone(scheme) {
    var clone;
    
    if (scheme) {
      clone = lang.mixin({}, scheme);
  
      // Replace object and array refs with copies.
      if (clone.color) {
        clone.color = new esriColor(clone.color);
      }
  
      if (clone.noDataColor) {
        clone.noDataColor = new esriColor(clone.noDataColor);
      }
  
      if (clone.outline) {
        clone.outline = {
          color: clone.outline.color && new esriColor(clone.outline.color),
          width: clone.outline.width
        };
      }
    }
    
    return clone;
  }
  
  createIndex();
  // console.log("Size style index =", index);
  
  function getGeometryType(geometryType) {
    var geomType = geometryType;
    
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
  // Module value
  ////////////////////
  
  var sizeStyle = {
    
    getAvailableThemes: function(basemap) {
      // basemap parameter is optional
      var available = [], themeName, theme, themeIndex;
      
      for (themeName in themes) {
        theme = themes[themeName];
        themeIndex = index[themeName];
        
        // Exclude this theme if it does not support the given basemap
        if (basemap && array.indexOf(themeIndex.basemaps, basemap) === -1) {
          continue;
        }
        
        available.push({
          name: theme.name,
          label: theme.label,
          description: theme.description,
          basemaps: themeIndex.basemaps.slice(0)
        });
      }
      
      return available;
    },
    
    getSchemes: function(params) {
      var themeName = params.theme,
          basemapName = params.basemap,
          geomType = getGeometryType(params.geometryType),
          themeIndex = index[themeName],
          schemes,
          retVal;
    
      schemes = themeIndex && themeIndex[geomType];
      schemes = schemes && schemes[basemapName];
      
      if (schemes) {
        retVal = {
          primaryScheme: copyScheme(schemes.primary, geomType),
          
          secondarySchemes: array.map(schemes.secondary, function(scheme) {
            return copyScheme(scheme, geomType);
          })
        };
      }
      
      return retVal;
    },
  
    cloneScheme: function(scheme) {
      var clone;
    
      if (scheme) {
        clone = basicClone(scheme);
        
        if (clone.marker) {
          clone.marker = basicClone(clone.marker);
        }
  
        if (clone.background) {
          clone.background = basicClone(clone.background);
        }
      }
    
      return clone;
    }
    
  };

  
  
  return sizeStyle;
});
