define([ 
  "esri/styles/colors", 
  "esri/Color",
  "dojo/_base/array"
], function(colors, esriColor, array) {
  
  function getColorObjs(hexArray, fillOpacity) {
    return array.map(hexArray, function(hexString) {
      var obj = new esriColor(hexString);
      obj.a = fillOpacity;
      return obj;
    });
  }
  
  var catLight = getColorObjs(colors["cat-light"].stops, 1),
      catDark = getColorObjs(colors["cat-dark"].stops, 1),
      catLight_8 = getColorObjs(colors["cat-light"].stops, 0.8),
      catDark_8 = getColorObjs(colors["cat-dark"].stops, 0.8);
  
  var noDataColor = { r: 170, g: 170, b: 170, a: 1 },
      noDataColor_8 = { r: 170, g: 170, b: 170, a: 0.8 };
  
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
      // Point - light
      {
        params: [{
          theme:        "default",
          basemap:      "topo",
          geometryType: "point"
        }],
        
        expectedValue: {
          primaryScheme: {
            colors: catDark,
            noDataColor: noDataColor,
            outline: {
              color: { r: 153, g: 153, b: 153, a: 1 },
              width: 1
            },
            size: 8
          },
          
          secondarySchemes: [
            {
              colors: catLight,
              noDataColor: noDataColor,
              outline: {
                color: { r: 153, g: 153, b: 153, a: 1 },
                width: 1
              },
              size: 8
            },
            
            {
              colors: getColorObjs(colors["tropical-bliss"].stops, 1),
              noDataColor: noDataColor,
              outline: {
                color: { r: 153, g: 153, b: 153, a: 1 },
                width: 1
              },
              size: 8
            },
  
            {
              colors: getColorObjs(colors["desert-blooms"].stops, 1),
              noDataColor: noDataColor,
              outline: {
                color: { r: 153, g: 153, b: 153, a: 1 },
                width: 1
              },
              size: 8
            },
  
            {
              colors: getColorObjs(colors["under-the-sea"].stops, 1),
              noDataColor: noDataColor,
              outline: {
                color: { r: 153, g: 153, b: 153, a: 1 },
                width: 1
              },
              size: 8
            },
  
            {
              colors: getColorObjs(colors["vibrant-rainbow"].stops, 1),
              noDataColor: noDataColor,
              outline: {
                color: { r: 153, g: 153, b: 153, a: 1 },
                width: 1
              },
              size: 8
            },
  
            {
              colors: getColorObjs(colors["ocean-bay"].stops, 1),
              noDataColor: noDataColor,
              outline: {
                color: { r: 153, g: 153, b: 153, a: 1 },
                width: 1
              },
              size: 8
            },
  
            {
              colors: getColorObjs(colors["prairie-summer"].stops, 1),
              noDataColor: noDataColor,
              outline: {
                color: { r: 153, g: 153, b: 153, a: 1 },
                width: 1
              },
              size: 8
            },
  
            {
              colors: getColorObjs(colors["pastel-chalk"].stops, 1),
              noDataColor: noDataColor,
              outline: {
                color: { r: 153, g: 153, b: 153, a: 1 },
                width: 1
              },
              size: 8
            }
          ]
        }
      },
      
      // Point - dark
      {
        params: [{
          theme:        "default",
          basemap:      "hybrid",
          geometryType: "point"
        }],
        
        expectedValue: {
          primaryScheme: {
            colors: catLight,
            noDataColor: noDataColor,
            outline: {
              color: { r: 26, g: 26, b: 26, a: 1 },
              width: 1
            },
            size: 8
          },
          
          secondarySchemes: [
            {
              colors: catDark,
              noDataColor: noDataColor,
              outline: {
                color: { r: 26, g: 26, b: 26, a: 1 },
                width: 1
              },
              size: 8
            },
  
            {
              colors: getColorObjs(colors["tropical-bliss"].stops, 1),
              noDataColor: noDataColor,
              outline: {
                color: { r: 26, g: 26, b: 26, a: 1 },
                width: 1
              },
              size: 8
            },
  
            {
              colors: getColorObjs(colors["desert-blooms"].stops, 1),
              noDataColor: noDataColor,
              outline: {
                color: { r: 26, g: 26, b: 26, a: 1 },
                width: 1
              },
              size: 8
            },
  
            {
              colors: getColorObjs(colors["under-the-sea"].stops, 1),
              noDataColor: noDataColor,
              outline: {
                color: { r: 26, g: 26, b: 26, a: 1 },
                width: 1
              },
              size: 8
            },
  
            {
              colors: getColorObjs(colors["vibrant-rainbow"].stops, 1),
              noDataColor: noDataColor,
              outline: {
                color: { r: 26, g: 26, b: 26, a: 1 },
                width: 1
              },
              size: 8
            },
  
            {
              colors: getColorObjs(colors["ocean-bay"].stops, 1),
              noDataColor: noDataColor,
              outline: {
                color: { r: 26, g: 26, b: 26, a: 1 },
                width: 1
              },
              size: 8
            },
  
            {
              colors: getColorObjs(colors["prairie-summer"].stops, 1),
              noDataColor: noDataColor,
              outline: {
                color: { r: 26, g: 26, b: 26, a: 1 },
                width: 1
              },
              size: 8
            },
  
            {
              colors: getColorObjs(colors["pastel-chalk"].stops, 1),
              noDataColor: noDataColor,
              outline: {
                color: { r: 26, g: 26, b: 26, a: 1 },
                width: 1
              },
              size: 8
            }
          ]
        }
      },
      
      // Line - light
      {
        params: [{
          theme:        "default",
          basemap:      "topo",
          geometryType: "line"
        }],
        
        expectedValue: {
          primaryScheme: {
            colors: catDark,
            noDataColor: noDataColor,
            width: 2
          },
          
          secondarySchemes: [
            {
              colors: catLight,
              noDataColor: noDataColor,
              width: 2
            },
  
            {
              colors: getColorObjs(colors["tropical-bliss"].stops, 1),
              noDataColor: noDataColor,
              width: 2
            },
  
            {
              colors: getColorObjs(colors["desert-blooms"].stops, 1),
              noDataColor: noDataColor,
              width: 2
            },
  
            {
              colors: getColorObjs(colors["under-the-sea"].stops, 1),
              noDataColor: noDataColor,
              width: 2
            },
  
            {
              colors: getColorObjs(colors["vibrant-rainbow"].stops, 1),
              noDataColor: noDataColor,
              width: 2
            },
  
            {
              colors: getColorObjs(colors["ocean-bay"].stops, 1),
              noDataColor: noDataColor,
              width: 2
            },
  
            {
              colors: getColorObjs(colors["prairie-summer"].stops, 1),
              noDataColor: noDataColor,
              width: 2
            },
  
            {
              colors: getColorObjs(colors["pastel-chalk"].stops, 1),
              noDataColor: noDataColor,
              width: 2
            }
          ]
        }
      },
      
      // Line - dark
      {
        params: [{
          theme:        "default",
          basemap:      "hybrid",
          geometryType: "line"
        }],
        
        expectedValue: {
          primaryScheme: {
            colors: catLight,
            noDataColor: noDataColor,
            width: 2
          },
          
          secondarySchemes: [
            {
              colors: catDark,
              noDataColor: noDataColor,
              width: 2
            },
  
            {
              colors: getColorObjs(colors["tropical-bliss"].stops, 1),
              noDataColor: noDataColor,
              width: 2
            },
  
            {
              colors: getColorObjs(colors["desert-blooms"].stops, 1),
              noDataColor: noDataColor,
              width: 2
            },
  
            {
              colors: getColorObjs(colors["under-the-sea"].stops, 1),
              noDataColor: noDataColor,
              width: 2
            },
  
            {
              colors: getColorObjs(colors["vibrant-rainbow"].stops, 1),
              noDataColor: noDataColor,
              width: 2
            },
  
            {
              colors: getColorObjs(colors["ocean-bay"].stops, 1),
              noDataColor: noDataColor,
              width: 2
            },
  
            {
              colors: getColorObjs(colors["prairie-summer"].stops, 1),
              noDataColor: noDataColor,
              width: 2
            },
  
            {
              colors: getColorObjs(colors["pastel-chalk"].stops, 1),
              noDataColor: noDataColor,
              width: 2
            }
          ]
        }
      },
      
      // Polygon - light
      {
        params: [{
          theme:        "default",
          basemap:      "topo",
          geometryType: "polygon"
        }],
        
        expectedValue: {
          primaryScheme: {
            colors: catDark_8,
            noDataColor: noDataColor_8,
            outline: {
              color: { r: 153, g: 153, b: 153, a: 1 },
              width: 1
            }
          },
          
          secondarySchemes: [
            {
              colors: catLight_8,
              noDataColor: noDataColor_8,
              outline: {
                color: { r: 153, g: 153, b: 153, a: 1 },
                width: 1
              }
            },
  
            {
              colors: getColorObjs(colors["tropical-bliss"].stops, 0.8),
              noDataColor: noDataColor_8,
              outline: {
                color: { r: 153, g: 153, b: 153, a: 1 },
                width: 1
              }
            },
  
            {
              colors: getColorObjs(colors["desert-blooms"].stops, 0.8),
              noDataColor: noDataColor_8,
              outline: {
                color: { r: 153, g: 153, b: 153, a: 1 },
                width: 1
              }
            },
  
            {
              colors: getColorObjs(colors["under-the-sea"].stops, 0.8),
              noDataColor: noDataColor_8,
              outline: {
                color: { r: 153, g: 153, b: 153, a: 1 },
                width: 1
              }
            },
  
            {
              colors: getColorObjs(colors["vibrant-rainbow"].stops, 0.8),
              noDataColor: noDataColor_8,
              outline: {
                color: { r: 153, g: 153, b: 153, a: 1 },
                width: 1
              }
            },
  
            {
              colors: getColorObjs(colors["ocean-bay"].stops, 0.8),
              noDataColor: noDataColor_8,
              outline: {
                color: { r: 153, g: 153, b: 153, a: 1 },
                width: 1
              }
            },
  
            {
              colors: getColorObjs(colors["prairie-summer"].stops, 0.8),
              noDataColor: noDataColor_8,
              outline: {
                color: { r: 153, g: 153, b: 153, a: 1 },
                width: 1
              }
            },
  
            {
              colors: getColorObjs(colors["pastel-chalk"].stops, 0.8),
              noDataColor: noDataColor_8,
              outline: {
                color: { r: 153, g: 153, b: 153, a: 1 },
                width: 1
              }
            }
          ]
        }
      },
      
      // Polygon - dark
      {
        params: [{
          theme:        "default",
          basemap:      "hybrid",
          geometryType: "polygon"
        }],
        
        expectedValue: {
          primaryScheme: {
            colors: catLight_8,
            noDataColor: noDataColor_8,
            outline: {
              color: { r: 51, g: 51, b: 51, a: 1 },
              width: 1
            }
          },
          
          secondarySchemes: [
            {
              colors: catDark_8,
              noDataColor: noDataColor_8,
              outline: {
                color: { r: 51, g: 51, b: 51, a: 1 },
                width: 1
              }
            },
            
            {
              colors: getColorObjs(colors["tropical-bliss"].stops, 0.8),
              noDataColor: noDataColor_8,
              outline: {
                color: { r: 51, g: 51, b: 51, a: 1 },
                width: 1
              }
            },
  
            {
              colors: getColorObjs(colors["desert-blooms"].stops, 0.8),
              noDataColor: noDataColor_8,
              outline: {
                color: { r: 51, g: 51, b: 51, a: 1 },
                width: 1
              }
            },
  
            {
              colors: getColorObjs(colors["under-the-sea"].stops, 0.8),
              noDataColor: noDataColor_8,
              outline: {
                color: { r: 51, g: 51, b: 51, a: 1 },
                width: 1
              }
            },
  
            {
              colors: getColorObjs(colors["vibrant-rainbow"].stops, 0.8),
              noDataColor: noDataColor_8,
              outline: {
                color: { r: 51, g: 51, b: 51, a: 1 },
                width: 1
              }
            },
  
            {
              colors: getColorObjs(colors["ocean-bay"].stops, 0.8),
              noDataColor: noDataColor_8,
              outline: {
                color: { r: 51, g: 51, b: 51, a: 1 },
                width: 1
              }
            },
  
            {
              colors: getColorObjs(colors["prairie-summer"].stops, 0.8),
              noDataColor: noDataColor_8,
              outline: {
                color: { r: 51, g: 51, b: 51, a: 1 },
                width: 1
              }
            },
  
            {
              colors: getColorObjs(colors["pastel-chalk"].stops, 0.8),
              noDataColor: noDataColor_8,
              outline: {
                color: { r: 51, g: 51, b: 51, a: 1 },
                width: 1
              }
            }
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
        // Secondary scheme from "Point - dark"
        params: [{
          colors: catDark,
          noDataColor: noDataColor,
          outline: {
            color: { r: 26, g: 26, b: 26, a: 1 },
            width: 1
          },
          size: 8
        }],
      
        expectedValue: {
          colors: catDark,
          noDataColor: noDataColor,
          outline: {
            color: { r: 26, g: 26, b: 26, a: 1 },
            width: 1
          },
          size: 8
        }
      }
    ]
  };
  
});
