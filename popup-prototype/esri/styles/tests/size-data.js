define([], function() {
  
  var transparentFill = { r: 0, g: 0, b: 0, a: 0 };
  
  var noDataColorLight = { r: 128, g: 128, b: 128, a: 1 },
      noDataColorDark = { r: 128, g: 128, b: 128, a: 1 },
      noDataColorLight_8 = { r: 128, g: 128, b: 128, a: 0.8 },
      noDataColorDark_8 = { r: 128, g: 128, b: 128, a: 0.8 };
  
  var bgOutlineLight = {
    color: transparentFill,
    outline: {
      color: { r: 166, g: 166, b: 166, a: 1 },
      width: 1
    }
  };
  
  var bgOutlineDark = {
    color: transparentFill,
    outline: {
      color: { r: 166, g: 166, b: 166, a: 1 },
      width: 1
    }
  };
  
  var pointLight = {
    primaryScheme: {
      color: { r: 227, g: 139, b: 79, a: 0.8 },
      noDataColor: noDataColorLight_8,
      outline: {
        color: { r: 255, g: 255, b: 255, a: 1 },
        width: 1
      },
      noDataSize: 4,
      size: 12,
      minSize: 8,
      maxSize: 50
    },
    
    secondarySchemes: [
      {
        color: { r: 128, g: 128, b: 128, a: 0.8 },
        noDataColor: noDataColorLight_8,
        outline: {
          color: { r: 255, g: 255, b: 255, a: 1 },
          width: 1
        },
        noDataSize: 4,
        size: 12,
        minSize: 8,
        maxSize: 50
      },
      {
        color: { r: 255, g: 255, b: 255, a: 0.8 },
        noDataColor: noDataColorLight_8,
        outline: {
          color: { r: 128, g: 128, b: 128, a: 1 },
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
    primaryScheme: {
      color: { r: 227, g: 139, b: 79, a: 0.8 },
      noDataColor: noDataColorDark_8,
      outline: {
        color: { r: 51, g: 51, b: 51, a: 1 },
        width: 1
      },
      noDataSize: 4,
      size: 12,
      minSize: 8,
      maxSize: 50
    },
    
    secondarySchemes: [
      {
        color: { r: 178, g: 178, b: 178, a: 0.8 },
        noDataColor: noDataColorDark_8,
        outline: {
          color: { r: 51, g: 51, b: 51, a: 1 },
          width: 1
        },
        noDataSize: 4,
        size: 12,
        minSize: 8,
        maxSize: 50
      },
  
      {
        color: { r: 26, g: 26, b: 26, a: 0.8 },
        noDataColor: noDataColorDark_8,
        outline: {
          color: { r: 128, g: 128, b: 128, a: 1 },
          width: 1
        },
        noDataSize: 4,
        size: 12,
        minSize: 8,
        maxSize: 50
      }
    ]
  };
  
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
        
        expectedValue: pointLight
      },
      
      // Point - dark
      {
        params: [{
          theme:        "default",
          basemap:      "hybrid",
          geometryType: "point"
        }],
        
        expectedValue: pointDark
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
            color: { r: 226, g: 119, b: 40, a: 1 },
            noDataColor: noDataColorLight,
            noDataWidth: 1,
            width: 1,
            minWidth: 1,
            maxWidth: 18
          },
          
          secondarySchemes: [
            {
              color: { r: 77, g: 77, b: 77, a: 1 },
              noDataColor: noDataColorLight,
              noDataWidth: 1,
              width: 1,
              minWidth: 1,
              maxWidth: 18
            },
        
            {
              color: { r: 153, g: 153, b: 153, a: 1 },
              noDataColor: noDataColorLight,
              noDataWidth: 1,
              width: 1,
              minWidth: 1,
              maxWidth: 18
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
            color: { r: 226, g: 119, b: 40, a: 1 },
            noDataColor: noDataColorDark,
            noDataWidth: 1,
            width: 1,
            minWidth: 1,
            maxWidth: 18
          },
          
          secondarySchemes: [
            {
              color: { r: 255, g: 255, b: 255, a: 1 },
              noDataColor: noDataColorDark,
              noDataWidth: 1,
              width: 1,
              minWidth: 1,
              maxWidth: 18
            },
        
            {
              color: { r: 153, g: 153, b: 153, a: 1 },
              noDataColor: noDataColorDark,
              noDataWidth: 1,
              width: 1,
              minWidth: 1,
              maxWidth: 18
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
            marker: pointLight.primaryScheme,
            background: bgOutlineDark
          },
          
          secondarySchemes: [
            {
              marker: pointLight.secondarySchemes[0],
              background: bgOutlineDark
            },
            {
              marker: pointLight.secondarySchemes[1],
              background: bgOutlineDark
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
            marker: pointDark.primaryScheme,
            background: bgOutlineLight
          },
          
          secondarySchemes: [
            {
              marker: pointDark.secondarySchemes[0],
              background: bgOutlineLight
            },
            {
              marker: pointDark.secondarySchemes[1],
              background: bgOutlineLight
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
        // Primary scheme from "Polygon - dark"
        params: [{
          marker: pointDark.primaryScheme,
          background: bgOutlineLight
        }],
      
        expectedValue: {
          marker: pointDark.primaryScheme,
          background: bgOutlineLight
        }
      }
    ]
  };
  
});
