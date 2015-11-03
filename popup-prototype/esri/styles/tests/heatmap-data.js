define([ 
  "esri/Color",
  "dojo/_base/array"
], function(esriColor, array) {
  
  var namedColors = {
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
  
  function getColorObjs(hexArray, fillOpacity) {
    return array.map(hexArray, function(hexString) {
      var obj = new esriColor(hexString);
      obj.a = fillOpacity;
      return obj;
    });
  }
  
  var version1 = getColorObjs(namedColors.v1, 0.7),
      version2 = getColorObjs(namedColors.v2, 0.7),
      version3 = getColorObjs(namedColors.v3, 0.7),
      version4 = getColorObjs(namedColors.v4, 0.7);
  
  return {
    themeTests: [
      {
        params: [ "UNKNOWN-BASEMAP" ],
        expectedValue: [ ]
      },
      
      {
        params: [],
        expectedValue: [{
          name: "default",
          basemaps: [
            "streets", 
            "gray", 
            "topo", 
            "terrain", 
            "national-geographic", 
            "oceans", 
            "osm",
            "satellite",
            "hybrid",
            "dark-gray"
          ]
        }]
      },
      
      {
        params: [ "topo" ],
        expectedValue: [{
          name: "default",
          basemaps: [
            "streets", 
            "gray", 
            "topo", 
            "terrain", 
            "national-geographic", 
            "oceans", 
            "osm",
            "satellite",
            "hybrid",
            "dark-gray"
          ]
        }]
      }
      
    ],
    
    schemeTests: [
      // light
      {
        params: [{
          theme:    "default",
          basemap:  "topo"
        }],
        
        expectedValue: {
          primaryScheme: {
            colors: version1
          },
          
          secondarySchemes: [
            { colors: version2 },
            { colors: version3 },
            { colors: version4 }
          ]
        }
      },
      
      // dark
      {
        params: [{
          theme:    "default",
          basemap:  "hybrid"
        }],
        
        expectedValue: {
          primaryScheme: {
            colors: version4
          },
          
          secondarySchemes: [
            { colors: version1 },
            { colors: version2 },
            { colors: version3 }
          ]
        }
      }
      
    ],
  
    cloneSchemeTests: [
      {
        params: [],
        expectedValue: undefined
      },
    
      {
        // A secondary scheme from "light"
        params: [{ colors: version4 }],
      
        expectedValue: { colors: version4 }
      }
    ]
  };
  
});
