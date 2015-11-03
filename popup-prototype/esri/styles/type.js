define([
  "dojo/_base/array",
  "dojo/_base/lang",
  "../Color",
  "./colors"
], 
function(array, lang, esriColor, colors) {

  // Based on styling specs from:
  // http://servicesbeta.esri.com/jerome/esri-color-browser/index.html
  // https://devtopia.esri.com/jero6957/esri-color-browser/blob/master/data/schemes.json
  
  // All size and width values are specified in pixel units.
  // All alpha values specified in the range 0.0 to 1.0.

  ////////////////////
  // Theme dictionary
  ////////////////////
  
  // Frequently used outlines
  var outlines = {
    light: {
      color: [153,153,153,1.0],
      width: 1
    },
    
    dark: {
      color: [51,51,51,1.0],
      width: 1
    },
    
    darker: {
      color: [26,26,26,1.0],
      width: 1
    }
  };
  
  // http://www.arcgis.com/sharing/rest/content/items/bfd3813c3958445d96caf356a5671523/data?f=json
  var colorSetsFromPortal = [
    "tropical-bliss",
    "desert-blooms",
    "under-the-sea",
    "vibrant-rainbow",
    "ocean-bay",
    "prairie-summer",
    "pastel-chalk"
  ];
  
  var noDataColor = "#aaaaaa";
  
  var themes = {
    
    "default": {
      
      name:        "default",
      label:       "Default",
      description: "Default theme for visualizing features by their type.",
      
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
          common: {
            noDataColor: noDataColor,
            outline: outlines.light,
            size: 8
          },
  
          primary: "cat-dark",
          
          secondary: [
            "cat-light"
          ].concat(colorSetsFromPortal)
        },
        
        dark: {
          common: {
            noDataColor: noDataColor,
            outline: outlines.darker,
            size: 8
          },
  
          primary: "cat-light",
          
          secondary: [
            "cat-dark"
          ].concat(colorSetsFromPortal)
        }
      },
      
      ////////////////////
      // Line schemes
      ////////////////////
      
      lineSchemes: {
        light: {
          common: {
            noDataColor: noDataColor,
            width: 2
          },
          
          primary: "cat-dark",
          
          secondary: [
            "cat-light"
          ].concat(colorSetsFromPortal)
        },
        
        dark: {
          common: {
            noDataColor: noDataColor,
            width: 2
          },
          
          primary: "cat-light",
          
          secondary: [
            "cat-dark"
          ].concat(colorSetsFromPortal)
        }
      },
      
      ////////////////////
      // Polygon schemes
      ////////////////////
      
      polygonSchemes: {
        light: {
          common: {
            noDataColor: noDataColor,
            outline: outlines.light,
            fillOpacity: 0.8
          },
          
          primary: "cat-dark",
          
          secondary: [
            "cat-light"
          ].concat(colorSetsFromPortal)
        },
        
        dark: {
          common: {
            noDataColor: noDataColor,
            outline: outlines.dark,
            fillOpacity: 0.8
          },
  
          primary: "cat-light",
          
          secondary: [
            "cat-dark"
          ].concat(colorSetsFromPortal)
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
  
  function createColors(colors, fillOpacity) {
    // Converts colors specified in HEX or RGBA to esri/Color objects.
    // fillOpacity is optional
    
    return array.map(colors, function(colorValue) {
      // For centered-on and extremes themes, colorValue could be defined in 
      // RGBA or HEX notations
      var clr = new esriColor(colorValue);
      
      // Use fillOpacity if defined, else use whatever is defined in "colors"
      if (fillOpacity != null) {
        clr.a = fillOpacity;
      }
      
      return clr;
    });
  }
  
  function copyScheme(scheme, commonProps, geomType) {
    var retVal,

        // See esri/styles/colors.js for structure of colorSpec
        colorsSpec = colors[scheme];
    
    if (colorsSpec) {
      retVal = {};
      
      retVal.colors = createColors(colorsSpec.stops, commonProps.fillOpacity);
      
      retVal.noDataColor = new esriColor(commonProps.noDataColor);
      if (commonProps.fillOpacity != null) {
        retVal.noDataColor.a = commonProps.fillOpacity || 1;
      }
      
      switch(geomType) {
        case "point":
          retVal.outline = {
            color: new esriColor(commonProps.outline.color),
            width: commonProps.outline.width
          };
          retVal.size = commonProps.size;
          break;
          
        case "line":
          retVal.width = commonProps.width;
          break;
          
        case "polygon":
          retVal.outline = {
            color: new esriColor(commonProps.outline.color),
            width: commonProps.outline.width
          };
          break;
          
      }
    }
    
    return retVal;
  }
  
  createIndex();
  // console.log("Type style index =", index);
  
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
  
  var typeStyle = {
    
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
          primaryScheme: copyScheme(schemes.primary, schemes.common, geomType),
          
          secondarySchemes: array.map(schemes.secondary, function(scheme) {
            return copyScheme(scheme, schemes.common, geomType);
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
        clone.colors = createColors(clone.colors);
      
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
    
  };

  
  
  return typeStyle;
});
