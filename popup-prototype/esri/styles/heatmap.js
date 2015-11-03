define([
  "dojo/_base/array",
  "dojo/_base/lang",
  "../Color"
], 
function(array, lang, esriColor) {
  
  ////////////////////
  // Theme dictionary
  ////////////////////
  
  var namedColors = {
    
    // From Andrew Skinner.
    
    "v1": [
      "#85c1c8", "#90a1be", "#9c8184", "#a761aa", 
      "#af4980", "#b83055", "#c0182a", "#c80000", 
      "#d33300", "#de6600", "#e99900", "#f4cc00", 
      "#ffff00"
    ],

    "v2": [
      "#f3e4e5", "#e4becb", "#d498b2", "#c57298", 
      "#b95685", "#ae3972", "#a21d5e", "#96004b", 
      "#ab006f", "#c00093", "#d500b7", "#ea00db", 
      "#ff00ff"
    ],

    "v3": [
      "#d4e3f5", "#b3c5f7", "#93a6fa", "#7288fc", 
      "#566ffd", "#3955fe", "#1d3bfe", "#0022ff", 
      "#334ecc", "#667a99", "#99a766", "#ccd333", 
      "#ffff00"
    ],

    "v4": [
      "#0022c8", "#2b1ca7", "#551785", "#801164", 
      "#aa0b43", "#d50621", "#ff0000", "#ff3900", 
      "#ff7100", "#ffaa00", "#ffc655", "#ffe3aa", 
      "#ffffff"
    ]
  };
  
  var themes = {

    "default": {
      
      name:        "default",
      label:       "Default",
      description: "Default theme for visualizing features using heatmap.",
      
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
      
      schemes: {
        
        light: {
          primary: "v1",
          secondary: [ "v2", "v3", "v4" ]
        },
        
        dark: {
          primary: "v4",
          secondary: [ "v1", "v2", "v3" ]
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
                    .concat(groups.dark)
      };
      
      for (groupName in groups) {
        basemapsInGroup = groups[groupName];
        
        for (i = 0; i < basemapsInGroup.length; i++) {
          basemap = basemapsInGroup[i];
          
          if (theme.schemes) {
            themeIndex[basemap] = theme.schemes[groupName];
          }
        }
      }
    }
  }
  
  createIndex();
  // console.log("Heatmap style index =", index);
  
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
  
  ////////////////////
  // Module value
  ////////////////////
  
  var heatmapStyle = {
    
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
          themeIndex = index[themeName],
          fillOpacity = 0.7,
          schemes,
          retVal;
    
      schemes = themeIndex && themeIndex[basemapName];
      
      if (schemes) {
        retVal = {
          
          primaryScheme: {
            colors: createColors(namedColors[schemes.primary], fillOpacity)
          },
          
          secondarySchemes: array.map(schemes.secondary, function(scheme) {
            return {
              colors: createColors(namedColors[scheme], fillOpacity)
            };
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
      }
    
      return clone;
    }
    
  };

  
  
  return heatmapStyle;
});
