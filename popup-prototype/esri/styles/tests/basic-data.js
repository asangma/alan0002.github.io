define([], function() {
  
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
            color: { r: 77, g: 77, b: 77, a: 1 },
            outline: {
              color: { r: 255, g: 255, b: 255, a: 1 },
              width: 1
            },
            size: 8
          },
          
          secondarySchemes: [
            {
              color: { r: 226, g: 119, b: 40, a: 1 },
              outline: {
                color: { r: 255, g: 255, b: 255, a: 1 },
                width: 1
              },
              size: 8
            },
            {
              color: { r: 255, g: 255, b: 255, a: 1 },
              outline: {
                color: { r: 51, g: 51, b: 51, a: 1 },
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
            color: { r: 255, g: 255, b: 255, a: 1 },
            outline: {
              color: { r: 26, g: 26, b: 26, a: 1 },
              width: 1
            },
            size: 8
          },
          
          secondarySchemes: [
            {
              color: { r: 226, g: 119, b: 40, a: 1 },
              outline: {
                color: { r: 255, g: 255, b: 255, a: 1 },
                width: 1
              },
              size: 8
            },
        
            {
              color: { r: 26, g: 26, b: 26, a: 1 },
              outline: {
                color: { r: 178, g: 178, b: 178, a: 1 },
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
            color: { r: 77, g: 77, b: 77, a: 1 },
            width: 2
          },
          
          secondarySchemes: [
            {
              color: { r: 226, g: 119, b: 40, a: 1 },
              width: 2
            },
        
            {
              color: { r: 255, g: 255, b: 255, a: 1 },
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
            color: { r: 255, g: 255, b: 255, a: 1 },
            width: 2
          },
          
          secondarySchemes: [
            {
              color: { r: 226, g: 119, b: 40, a: 1 },
              width: 2
            },
        
            {
              color: { r: 26, g: 26, b: 26, a: 1 },
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
            color: { r: 227, g: 139, b: 79, a: 0.8 },
            outline: {
              color: { r: 255, g: 255, b: 255, a: 1 },
              width: 1
            }
          },
          
          secondarySchemes: [
            {
              color: { r: 128, g: 128, b: 128, a: 0.8 },
              outline: {
                color: { r: 255, g: 255, b: 255, a: 1 },
                width: 1
              }
            },
            {
              color: { r: 255, g: 255, b: 255, a: 0.8 },
              outline: {
                color: { r: 128, g: 128, b: 128, a: 1 },
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
            color: { r: 227, g: 139, b: 79, a: 0.8 },
            outline: {
              color: { r: 51, g: 51, b: 51, a: 1 },
              width: 1
            }
          },
          
          secondarySchemes: [
            {
              color: { r: 178, g: 178, b: 178, a: 0.8 },
              outline: {
                color: { r: 51, g: 51, b: 51, a: 1 },
                width: 1
              }
            },
            {
              color: { r: 26, g: 26, b: 26, a: 0.8 },
              outline: {
                color: { r: 128, g: 128, b: 128, a: 1 },
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
        // First secondary scheme from "Point - dark"
        params: [{
          color: { r: 226, g: 119, b: 40, a: 1 },
          outline: {
            color: { r: 255, g: 255, b: 255, a: 1 },
            width: 1
          },
          size: 8
        }],
      
        expectedValue: {
          color: { r: 226, g: 119, b: 40, a: 1 },
          outline: {
            color: { r: 255, g: 255, b: 255, a: 1 },
            width: 1
          },
          size: 8
        }
      }
    ]
  };
  
});
