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
  
  var themes = {
    
    "default": {
      
      name:        "default",
      label:       "Default",
      description: "Default theme for basic visualization of features.",
      
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
        light: {
          primary: {
            color: [77,77,77,1.0],
            outline: {
              color: [255,255,255,1.0],
              width: 1
            },
            size: 8
          },
          
          secondary: [
            {
              color: [226,119,40,1.0],
              outline: {
                color: [255,255,255,1.0],
                width: 1
              },
              size: 8
            },
        
            {
              color: [255,255,255,1.0],
              outline: {
                color: [51,51,51,1.0],
                width: 1
              },
              size: 8
            }
          ]
        },
        
        dark: {
          primary: {
            color: [255,255,255,1.0],
            outline: {
              color: [26,26,26,1.0],
              width: 1
            },
            size: 8
          },
          
          secondary: [
            {
              color: [226,119,40,1.0],
              outline: {
                color: [255,255,255,1.0],
                width: 1
              },
              size: 8
            },
        
            {
              color: [26,26,26,1.0],
              outline: {
                color: [178,178,178,1.0],
                width: 1
              },
              size: 8
            }
          ]
        }
      },
      
      ////////////////////
      // Line schemes
      ////////////////////
      
      lineSchemes: {
        light: {
          primary: {
            color: [77,77,77,1.0],
            width: 2
          },
          
          secondary: [
            {
              color: [226,119,40,1.0],
              width: 2
            },
        
            {
              color: [255,255,255,1.0],
              width: 2
            }
          ]
        },
        
        dark: {
          primary: {
            color: [255,255,255,1.0],
            width: 2
          },
          
          secondary: [
            {
              color: [226,119,40,1.0],
              width: 2
            },
        
            {
              color: [26,26,26,1.0],
              width: 2
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
            color: [227,139,79,0.8],
            outline: {
              color: [255,255,255,1.0],
              width: 1
            }
          },
          
          secondary: [
            {
              color: [128,128,128,0.8],
              outline: {
                color: [255,255,255,1.0],
                width: 1
              }
            },
        
            {
              color: [255,255,255,0.8],
              outline: {
                color: [128,128,128,1.0],
                width: 1
              }
            }
          ]
        },
        
        dark: {
          primary: {
            color: [227,139,79,0.8],
            outline: {
              color: [51,51,51,1.0],
              width: 1
            }
          },
          
          secondary: [
            {
              color: [178,178,178,0.8],
              outline: {
                color: [51,51,51,1.0],
                width: 1
              }
            },
        
            {
              color: [26,26,26,0.8],
              outline: {
                color: [128,128,128,1.0],
                width: 1
              }
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
    var retVal;
    
    if (scheme) {
      retVal = {};
      retVal.color = new esriColor(scheme.color);
      
      switch(geomType) {
        case "point":
          retVal.outline = {
            color: new esriColor(scheme.outline.color),
            width: scheme.outline.width
          };
          retVal.size = scheme.size;
          break;
          
        case "line":
          retVal.width = scheme.width;
          break;
          
        case "polygon":
          retVal.outline = {
            color: new esriColor(scheme.outline.color),
            width: scheme.outline.width
          };
          break;
          
      }
    }
    
    return retVal;
  }
  
  createIndex();
  //console.log("Basic style index =", index);
  
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
  
  var basicStyle = {
    
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
        clone = lang.mixin({}, scheme);
      
        // Replace object and array refs with copies.
        if (clone.color) {
          clone.color = new esriColor(clone.color);
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
    
  };

  
  
  return basicStyle;
});
