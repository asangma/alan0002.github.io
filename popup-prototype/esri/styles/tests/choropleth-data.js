define([ 
  "esri/styles/colors", 
  "esri/Color",
  "dojo/_base/array",
  "dojo/_base/lang"
], function(colors, esriColor, array, lang) {
  
  function getColorObjs(clrs, fillOpacity, flipColors) {
    
    var outColors = array.map(clrs, function(colorValue) {
      var obj = new esriColor(colorValue);
      
      if (fillOpacity != null) {
        obj.a = fillOpacity;
      }
      
      return obj;
    });
    
    if (flipColors && outColors) {
      outColors.reverse();
    }
    
    return outColors;
  }
  
  function getColorObjsForUNC(colorsName, fillOpacity, flipColors) {
    return getColorObjs(colors[colorsName].stops, fillOpacity, flipColors);
  }
  
  function getColorObjsForCLBR(colorsName, fillOpacity, flipColors) {
    var colorsForClassBreaks = [], numClasses,
        colorsSpec = colors[colorsName];
    
    for (numClasses in colorsSpec) {
      if (numClasses !== "stops") {
        // convert string of the form "<number>" to number
        numClasses = +numClasses;
        
        colorsForClassBreaks.push({
          numClasses: numClasses,
          colors: getColorObjs(colorsSpec[numClasses], fillOpacity, flipColors)
        });
      }
    }
    
    return colorsForClassBreaks;
  }
  
  var fadeToGraySchemes = [
    "highlight-orange-gray",
    "highlight-bluegreen-gray",
    "highlight-purple-gray",
    "highlight-pink-gray",
    "highlight-blue-gray",
    "highlight-red-gray",
    "highlight-orange-gray-dark",
    "highlight-blue-gray-dark",
    "highlight-orange-gray-bright",
    "highlight-blue-gray-bright",
    
    "extremes-orange-gray",
    "extremes-bluegreen-gray",
    "extremes-purple-gray",
    "extremes-pink-gray",
    "extremes-blue-gray",
    "extremes-red-gray",
    "extremes-orange-gray-dark",
    "extremes-blue-gray-dark",
    "extremes-orange-gray-bright",
    "extremes-blue-gray-bright"
  ];
  
  var noData = "#aaaaaa",
      noDataWhite = "#ffffff";
  
  function getNoDataColor(schemeName, fillOpacity) {
    var noDataColor;
    
    if (array.indexOf(fadeToGraySchemes, schemeName) !== -1) {
      noDataColor = new esriColor(noDataWhite);
    }
    else {
      noDataColor = new esriColor(noData);
    }
    
    if (fillOpacity != null) {
      noDataColor.a = fillOpacity || 1;
    }
    
    return noDataColor;
  }
  
  function createSchemeObj(schemeId, fillOpacity, commonProps, flipColors) {
    var retVal = lang.mixin({}, commonProps);
    retVal.id = schemeId;
  
    retVal.theme = schemeId.split("/")[0];
    
    var scheme = schemeId.split("/")[2];
    retVal.colors = getColorObjsForUNC(scheme, fillOpacity, flipColors);
    retVal.colorsForClassBreaks = getColorObjsForCLBR(scheme, fillOpacity, flipColors);
    retVal.noDataColor = getNoDataColor(scheme, fillOpacity);
    
    return retVal;
  }
  
  var outlines = {
    light: {
      color: { r: 128, g: 128, b: 128, a: 1 },
      width: 0.5
    },
    
    lighter: {
      color: { r: 153, g: 153, b: 153, a: 1 },
      width: 0.5
    }
  };
  
  return {
    themeTests: [
      {
        params: [ "UNKNOWN-BASEMAP" ],
        expectedValue: [ ]
      },
      
      {
        params: [],
        expectedValue: [
          {
            name: "high-to-low",
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
          },
          {
            name: "above-and-below",
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
          },
          {
            name: "centered-on",
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
          },
          {
            name: "extremes",
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
          },
          {
            name: "group-similar",
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
          }
        ]
      },
      
      {
        params: [ "topo" ],
        expectedValue: [
          {
            name: "high-to-low",
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
          },
          {
            name: "above-and-below",
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
          },
          {
            name: "centered-on",
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
          },
          {
            name: "extremes",
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
          },
          {
            name: "group-similar",
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
          }
        ]
      }
      
    ],
    
    schemeTests: [
    
      ////////////////////
      // high-to-low
      ////////////////////
    
      // Point - topo
      {
        params: [{
          theme:        "high-to-low",
          basemap:      "topo",
          geometryType: "point"
        }],
        
        expectedValue: {
          primaryScheme: createSchemeObj("high-to-low/topo/seq-yellow-pink-purple", 0.8, { outline: outlines.lighter, size: 8 }),
          
          secondarySchemes: [
            createSchemeObj("high-to-low/topo/seq-yellow-purple-blue", 0.8, { outline: outlines.lighter, size: 8 }),
            createSchemeObj("high-to-low/topo/seq-yellow-red-purple", 0.8, { outline: outlines.lighter, size: 8 }),
            createSchemeObj("high-to-low/topo/seq-yellow-orange-red", 0.8, { outline: outlines.lighter, size: 8 }),
            createSchemeObj("high-to-low/topo/seq-yellow-green-blue", 0.8, { outline: outlines.lighter, size: 8 }),
  
            // Portal color sets: single
            createSchemeObj("high-to-low/topo/seq-single-blues", 0.8, { outline: outlines.lighter, size: 8 }),
            createSchemeObj("high-to-low/topo/seq-single-greens", 0.8, { outline: outlines.lighter, size: 8 }),
            createSchemeObj("high-to-low/topo/seq-single-grays", 0.8, { outline: outlines.lighter, size: 8 }),
            createSchemeObj("high-to-low/topo/seq-single-oranges", 0.8, { outline: outlines.lighter, size: 8 }),
            createSchemeObj("high-to-low/topo/seq-single-purples", 0.8, { outline: outlines.lighter, size: 8 }),
            createSchemeObj("high-to-low/topo/seq-single-reds", 0.8, { outline: outlines.lighter, size: 8 }),
  
            // Portal color sets: multi
            createSchemeObj("high-to-low/topo/seq-multi-bugn", 0.8, { outline: outlines.lighter, size: 8 }),
            createSchemeObj("high-to-low/topo/seq-multi-bupu", 0.8, { outline: outlines.lighter, size: 8 }),
            createSchemeObj("high-to-low/topo/seq-multi-gnbu", 0.8, { outline: outlines.lighter, size: 8 }),
            createSchemeObj("high-to-low/topo/seq-multi-orrd", 0.8, { outline: outlines.lighter, size: 8 }),
            createSchemeObj("high-to-low/topo/seq-multi-pubu", 0.8, { outline: outlines.lighter, size: 8 }),
            createSchemeObj("high-to-low/topo/seq-multi-pubugn", 0.8, { outline: outlines.lighter, size: 8 }),
            createSchemeObj("high-to-low/topo/seq-multi-purd", 0.8, { outline: outlines.lighter, size: 8 }),
            createSchemeObj("high-to-low/topo/seq-multi-rdpu", 0.8, { outline: outlines.lighter, size: 8 }),
            createSchemeObj("high-to-low/topo/seq-multi-ylgn", 0.8, { outline: outlines.lighter, size: 8 }),
            createSchemeObj("high-to-low/topo/seq-multi-ylgnbu", 0.8, { outline: outlines.lighter, size: 8 }),
            createSchemeObj("high-to-low/topo/seq-multi-ylorbr", 0.8, { outline: outlines.lighter, size: 8 }),
            createSchemeObj("high-to-low/topo/seq-multi-ylorrd", 0.8, { outline: outlines.lighter, size: 8 })
          ]
        }
      },
      
      // Line - topo
      {
        params: [{
          theme:        "high-to-low",
          basemap:      "topo",
          geometryType: "line"
        }],
        
        expectedValue: {
          primaryScheme: createSchemeObj("high-to-low/topo/seq-yellow-pink-purple", 0.8, { width: 2 }),
          
          secondarySchemes: [
            createSchemeObj("high-to-low/topo/seq-yellow-purple-blue", 0.8, { width: 2 }),
            createSchemeObj("high-to-low/topo/seq-yellow-red-purple", 0.8, { width: 2 }),
            createSchemeObj("high-to-low/topo/seq-yellow-orange-red", 0.8, { width: 2 }),
            createSchemeObj("high-to-low/topo/seq-yellow-green-blue", 0.8, { width: 2 }),
  
            // Portal color sets: single
            createSchemeObj("high-to-low/topo/seq-single-blues", 0.8, { width: 2 }),
            createSchemeObj("high-to-low/topo/seq-single-greens", 0.8, { width: 2 }),
            createSchemeObj("high-to-low/topo/seq-single-grays", 0.8, { width: 2 }),
            createSchemeObj("high-to-low/topo/seq-single-oranges", 0.8, { width: 2 }),
            createSchemeObj("high-to-low/topo/seq-single-purples", 0.8, { width: 2 }),
            createSchemeObj("high-to-low/topo/seq-single-reds", 0.8, { width: 2 }),
  
            // Portal color sets: multi
            createSchemeObj("high-to-low/topo/seq-multi-bugn", 0.8, { width: 2 }),
            createSchemeObj("high-to-low/topo/seq-multi-bupu", 0.8, { width: 2 }),
            createSchemeObj("high-to-low/topo/seq-multi-gnbu", 0.8, { width: 2 }),
            createSchemeObj("high-to-low/topo/seq-multi-orrd", 0.8, { width: 2 }),
            createSchemeObj("high-to-low/topo/seq-multi-pubu", 0.8, { width: 2 }),
            createSchemeObj("high-to-low/topo/seq-multi-pubugn", 0.8, { width: 2 }),
            createSchemeObj("high-to-low/topo/seq-multi-purd", 0.8, { width: 2 }),
            createSchemeObj("high-to-low/topo/seq-multi-rdpu", 0.8, { width: 2 }),
            createSchemeObj("high-to-low/topo/seq-multi-ylgn", 0.8, { width: 2 }),
            createSchemeObj("high-to-low/topo/seq-multi-ylgnbu", 0.8, { width: 2 }),
            createSchemeObj("high-to-low/topo/seq-multi-ylorbr", 0.8, { width: 2 }),
            createSchemeObj("high-to-low/topo/seq-multi-ylorrd", 0.8, { width: 2 })
          ]
        }
      },
      
      // Polygon - topo
      {
        params: [{
          theme:        "high-to-low",
          basemap:      "topo",
          geometryType: "polygon"
        }],
        
        expectedValue: {
          primaryScheme: createSchemeObj("high-to-low/topo/seq-yellow-pink-purple", 0.8, { outline: outlines.lighter }),
          
          secondarySchemes: [
            createSchemeObj("high-to-low/topo/seq-yellow-purple-blue", 0.8, { outline: outlines.lighter }),
            createSchemeObj("high-to-low/topo/seq-yellow-red-purple", 0.8, { outline: outlines.lighter }),
            createSchemeObj("high-to-low/topo/seq-yellow-orange-red", 0.8, { outline: outlines.lighter }),
            createSchemeObj("high-to-low/topo/seq-yellow-green-blue", 0.8, { outline: outlines.lighter }),
  
            // Portal color sets: single
            createSchemeObj("high-to-low/topo/seq-single-blues", 0.8, { outline: outlines.lighter }),
            createSchemeObj("high-to-low/topo/seq-single-greens", 0.8, { outline: outlines.lighter }),
            createSchemeObj("high-to-low/topo/seq-single-grays", 0.8, { outline: outlines.lighter }),
            createSchemeObj("high-to-low/topo/seq-single-oranges", 0.8, { outline: outlines.lighter }),
            createSchemeObj("high-to-low/topo/seq-single-purples", 0.8, { outline: outlines.lighter }),
            createSchemeObj("high-to-low/topo/seq-single-reds", 0.8, { outline: outlines.lighter }),
  
            // Portal color sets: multi
            createSchemeObj("high-to-low/topo/seq-multi-bugn", 0.8, { outline: outlines.lighter }),
            createSchemeObj("high-to-low/topo/seq-multi-bupu", 0.8, { outline: outlines.lighter }),
            createSchemeObj("high-to-low/topo/seq-multi-gnbu", 0.8, { outline: outlines.lighter }),
            createSchemeObj("high-to-low/topo/seq-multi-orrd", 0.8, { outline: outlines.lighter }),
            createSchemeObj("high-to-low/topo/seq-multi-pubu", 0.8, { outline: outlines.lighter }),
            createSchemeObj("high-to-low/topo/seq-multi-pubugn", 0.8, { outline: outlines.lighter }),
            createSchemeObj("high-to-low/topo/seq-multi-purd", 0.8, { outline: outlines.lighter }),
            createSchemeObj("high-to-low/topo/seq-multi-rdpu", 0.8, { outline: outlines.lighter }),
            createSchemeObj("high-to-low/topo/seq-multi-ylgn", 0.8, { outline: outlines.lighter }),
            createSchemeObj("high-to-low/topo/seq-multi-ylgnbu", 0.8, { outline: outlines.lighter }),
            createSchemeObj("high-to-low/topo/seq-multi-ylorbr", 0.8, { outline: outlines.lighter }),
            createSchemeObj("high-to-low/topo/seq-multi-ylorrd", 0.8, { outline: outlines.lighter })
          ]
        }
      },
    
      ////////////////////
      // above-and-below
      ////////////////////
    
      // Point - hybrid
      {
        params: [{
          theme:        "above-and-below",
          basemap:      "hybrid",
          geometryType: "point"
        }],
        
        expectedValue: {
          primaryScheme: createSchemeObj("above-and-below/hybrid/div-orange-yellow-blue-dark", 0.6, { outline: outlines.light, size: 8 }),
          
          secondarySchemes: [
            createSchemeObj("above-and-below/hybrid/div-red-yellow-purple", 0.6, { outline: outlines.light, size: 8 }),
            createSchemeObj("above-and-below/hybrid/div-orange-yellow-pink", 0.6, { outline: outlines.light, size: 8 }),
            createSchemeObj("above-and-below/hybrid/div-orange-yellow-blue-light", 0.6, { outline: outlines.light, size: 8 }),
  
            // Portal color sets
            createSchemeObj("above-and-below/hybrid/div-brbg", 0.6, { outline: outlines.light, size: 8 }),
            createSchemeObj("above-and-below/hybrid/div-piyg", 0.6, { outline: outlines.light, size: 8 }),
            createSchemeObj("above-and-below/hybrid/div-prgn", 0.6, { outline: outlines.light, size: 8 }),
            createSchemeObj("above-and-below/hybrid/div-puor", 0.6, { outline: outlines.light, size: 8 }),
            createSchemeObj("above-and-below/hybrid/div-rdbu", 0.6, { outline: outlines.light, size: 8 }),
            createSchemeObj("above-and-below/hybrid/div-rdgy", 0.6, { outline: outlines.light, size: 8 }),
            createSchemeObj("above-and-below/hybrid/div-rdylbu", 0.6, { outline: outlines.light, size: 8 }),
            createSchemeObj("above-and-below/hybrid/div-rdylgn", 0.6, { outline: outlines.light, size: 8 }),
            createSchemeObj("above-and-below/hybrid/div-spectral", 0.6, { outline: outlines.light, size: 8 })
          ]
        }
      },
      
      // Line - hybrid
      {
        params: [{
          theme:        "above-and-below",
          basemap:      "hybrid",
          geometryType: "line"
        }],
        
        expectedValue: {
          primaryScheme: createSchemeObj("above-and-below/hybrid/div-orange-yellow-blue-dark", 0.6, {  width: 2 }),
          
          secondarySchemes: [
            createSchemeObj("above-and-below/hybrid/div-red-yellow-purple", 0.6, { width: 2 }),
            createSchemeObj("above-and-below/hybrid/div-orange-yellow-pink", 0.6, { width: 2 }),
            createSchemeObj("above-and-below/hybrid/div-orange-yellow-blue-light", 0.6, { width: 2 }),
  
            // Portal color sets
            createSchemeObj("above-and-below/hybrid/div-brbg", 0.6, { width: 2 }),
            createSchemeObj("above-and-below/hybrid/div-piyg", 0.6, { width: 2 }),
            createSchemeObj("above-and-below/hybrid/div-prgn", 0.6, { width: 2 }),
            createSchemeObj("above-and-below/hybrid/div-puor", 0.6, { width: 2 }),
            createSchemeObj("above-and-below/hybrid/div-rdbu", 0.6, { width: 2 }),
            createSchemeObj("above-and-below/hybrid/div-rdgy", 0.6, { width: 2 }),
            createSchemeObj("above-and-below/hybrid/div-rdylbu", 0.6, { width: 2 }),
            createSchemeObj("above-and-below/hybrid/div-rdylgn", 0.6, { width: 2 }),
            createSchemeObj("above-and-below/hybrid/div-spectral", 0.6, { width: 2 })
          ]
        }
      },
      
      // Polygon - hybrid
      {
        params: [{
          theme:        "above-and-below",
          basemap:      "hybrid",
          geometryType: "polygon"
        }],
        
        expectedValue: {
          primaryScheme: createSchemeObj("above-and-below/hybrid/div-orange-yellow-blue-dark", 0.6, { outline: outlines.light }),
          
          secondarySchemes: [
            createSchemeObj("above-and-below/hybrid/div-red-yellow-purple", 0.6, { outline: outlines.light }),
            createSchemeObj("above-and-below/hybrid/div-orange-yellow-pink", 0.6, { outline: outlines.light }),
            createSchemeObj("above-and-below/hybrid/div-orange-yellow-blue-light", 0.6, { outline: outlines.light }),
  
            // Portal color sets
            createSchemeObj("above-and-below/hybrid/div-brbg", 0.6, { outline: outlines.light }),
            createSchemeObj("above-and-below/hybrid/div-piyg", 0.6, { outline: outlines.light }),
            createSchemeObj("above-and-below/hybrid/div-prgn", 0.6, { outline: outlines.light }),
            createSchemeObj("above-and-below/hybrid/div-puor", 0.6, { outline: outlines.light }),
            createSchemeObj("above-and-below/hybrid/div-rdbu", 0.6, { outline: outlines.light }),
            createSchemeObj("above-and-below/hybrid/div-rdgy", 0.6, { outline: outlines.light }),
            createSchemeObj("above-and-below/hybrid/div-rdylbu", 0.6, { outline: outlines.light }),
            createSchemeObj("above-and-below/hybrid/div-rdylgn", 0.6, { outline: outlines.light }),
            createSchemeObj("above-and-below/hybrid/div-spectral", 0.6, { outline: outlines.light })
          ]
        }
      },
    
      ////////////////////
      // centered-on
      ////////////////////
    
      // Point - osm
      {
        params: [{
          theme:        "centered-on",
          basemap:      "osm",
          geometryType: "point"
        }],
        
        expectedValue: {
          primaryScheme: createSchemeObj("centered-on/osm/highlight-pink", null, { outline: outlines.lighter, size: 8 }),
          
          secondarySchemes: [
            createSchemeObj("centered-on/osm/highlight-bluegreen", null, { outline: outlines.lighter, size: 8 }),
            createSchemeObj("centered-on/osm/highlight-pink-gray", 0.8, { outline: outlines.lighter, size: 8 }),
            createSchemeObj("centered-on/osm/highlight-bluegreen-gray", 0.8, { outline: outlines.lighter, size: 8 })
          ]
        }
      },
    
      // Line - osm
      {
        params: [{
          theme:        "centered-on",
          basemap:      "osm",
          geometryType: "line"
        }],
        
        expectedValue: {
          primaryScheme: createSchemeObj("centered-on/osm/highlight-pink", null, { width: 2 }),
          
          secondarySchemes: [
            createSchemeObj("centered-on/osm/highlight-bluegreen", null, { width: 2 }),
            createSchemeObj("centered-on/osm/highlight-pink-gray", 0.8, { width: 2 }),
            createSchemeObj("centered-on/osm/highlight-bluegreen-gray", 0.8, { width: 2 })
          ]
        }
      },
    
      // Polygon - osm
      {
        params: [{
          theme:        "centered-on",
          basemap:      "osm",
          geometryType: "polygon"
        }],
        
        expectedValue: {
          primaryScheme: createSchemeObj("centered-on/osm/highlight-pink", null, { outline: outlines.lighter }),
          
          secondarySchemes: [
            createSchemeObj("centered-on/osm/highlight-bluegreen", null, { outline: outlines.lighter }),
            createSchemeObj("centered-on/osm/highlight-pink-gray", 0.8, { outline: outlines.lighter }),
            createSchemeObj("centered-on/osm/highlight-bluegreen-gray", 0.8, { outline: outlines.lighter })
          ]
        }
      },
    
      ////////////////////
      // Extremes
      ////////////////////
    
      // Point - dark-gray
      {
        params: [{
          theme:        "extremes",
          basemap:      "dark-gray",
          geometryType: "point"
        }],
        
        expectedValue: {
          primaryScheme: createSchemeObj("extremes/dark-gray/extremesdiv-orange-gray-blue", null, { outline: outlines.light, size: 8 }),
          
          secondarySchemes: [
            createSchemeObj("extremes/dark-gray/extremesdiv-yellow-gray-purple", null, { outline: outlines.light, size: 8 }),
            createSchemeObj("extremes/dark-gray/extremesdiv-red-gray-blue", null, { outline: outlines.light, size: 8 }),
            createSchemeObj("extremes/dark-gray/extremesdiv-green-gray-purple", null, { outline: outlines.light, size: 8 }),
            createSchemeObj("extremes/dark-gray/extremes-orange-bright", null, { outline: outlines.light, size: 8 }),
            createSchemeObj("extremes/dark-gray/extremes-blue-bright", null, { outline: outlines.light, size: 8 }),
            createSchemeObj("extremes/dark-gray/extremes-orange-gray-bright", 0.8, { outline: outlines.light, size: 8 }),
            createSchemeObj("extremes/dark-gray/extremes-blue-gray-bright", 0.8, { outline: outlines.light, size: 8 })
          ]
        }
      },
    
      // Line - dark-gray
      {
        params: [{
          theme:        "extremes",
          basemap:      "dark-gray",
          geometryType: "line"
        }],
        
        expectedValue: {
          primaryScheme: createSchemeObj("extremes/dark-gray/extremesdiv-orange-gray-blue", null, { width: 2 }),
          
          secondarySchemes: [
            createSchemeObj("extremes/dark-gray/extremesdiv-yellow-gray-purple", null, { width: 2 }),
            createSchemeObj("extremes/dark-gray/extremesdiv-red-gray-blue", null, { width: 2 }),
            createSchemeObj("extremes/dark-gray/extremesdiv-green-gray-purple", null, { width: 2 }),
            createSchemeObj("extremes/dark-gray/extremes-orange-bright", null, { width: 2 }),
            createSchemeObj("extremes/dark-gray/extremes-blue-bright", null, { width: 2 }),
            createSchemeObj("extremes/dark-gray/extremes-orange-gray-bright", 0.8, { width: 2 }),
            createSchemeObj("extremes/dark-gray/extremes-blue-gray-bright", 0.8, { width: 2 })
          ]
        }
      },
    
      // Polygon - dark-gray
      {
        params: [{
          theme:        "extremes",
          basemap:      "dark-gray",
          geometryType: "polygon"
        }],
        
        expectedValue: {
          primaryScheme: createSchemeObj("extremes/dark-gray/extremesdiv-orange-gray-blue", null, { outline: outlines.light }),
          
          secondarySchemes: [
            createSchemeObj("extremes/dark-gray/extremesdiv-yellow-gray-purple", null, { outline: outlines.light }),
            createSchemeObj("extremes/dark-gray/extremesdiv-red-gray-blue", null, { outline: outlines.light }),
            createSchemeObj("extremes/dark-gray/extremesdiv-green-gray-purple", null, { outline: outlines.light }),
            createSchemeObj("extremes/dark-gray/extremes-orange-bright", null, { outline: outlines.light }),
            createSchemeObj("extremes/dark-gray/extremes-blue-bright", null, { outline: outlines.light }),
            createSchemeObj("extremes/dark-gray/extremes-orange-gray-bright", 0.8, { outline: outlines.light }),
            createSchemeObj("extremes/dark-gray/extremes-blue-gray-bright", 0.8, { outline: outlines.light })
          ]
        }
      },
    
      ////////////////////
      // Group Similar
      ////////////////////
    
      // Point - dark-gray
      {
        params: [{
          theme:        "group-similar",
          basemap:      "topo",
          geometryType: "point"
        }],
        
        expectedValue: {
          primaryScheme: createSchemeObj("group-similar/topo/spectral", 0.8, { outline: outlines.lighter, size: 8 }),
          
          secondarySchemes: [
            createSchemeObj("group-similar/topo/cat-dark-6", 0.8, { outline: outlines.lighter, size: 8 }),
            createSchemeObj("group-similar/topo/cat-light-6", 0.8, { outline: outlines.lighter, size: 8 })
          ]
        }
      },
    
      // Line - dark-gray
      {
        params: [{
          theme:        "group-similar",
          basemap:      "topo",
          geometryType: "line"
        }],
        
        expectedValue: {
          primaryScheme: createSchemeObj("group-similar/topo/spectral", 0.8, { width: 2 }),
          
          secondarySchemes: [
            createSchemeObj("group-similar/topo/cat-dark-6", 0.8, { width: 2 }),
            createSchemeObj("group-similar/topo/cat-light-6", 0.8, { width: 2 })
          ]
        }
      },
    
      // Polygon - dark-gray
      {
        params: [{
          theme:        "group-similar",
          basemap:      "satellite",
          geometryType: "polygon"
        }],
        
        expectedValue: {
          primaryScheme: createSchemeObj("group-similar/satellite/spectral", 0.6, { outline: outlines.light }),
          
          secondarySchemes: [
            createSchemeObj("group-similar/satellite/cat-dark-6", 0.6, { outline: outlines.light }),
            createSchemeObj("group-similar/satellite/cat-light-6", 0.6, { outline: outlines.light })
          ]
        }
      }
      
    ],

    schemeByIdTests: [
      {
        params: [{}],

        expectedValue: undefined
      },

      {
        params: [{
          id: "UNKNOWN",
          geometryType: "point"
        }],

        expectedValue: undefined
      },

      {
        params: [{
          id: "UNKNOWN/UNKNOWN/UNKNOWN",
          geometryType: "point"
        }],

        expectedValue: undefined
      },

      {
        params: [{
          id: "high-to-low/topo/UNKNOWN",
          geometryType: "point"
        }],

        expectedValue: undefined
      },

      {
        params: [{
          id: "above-and-below/hybrid/div-orange-yellow-blue-light",
          geometryType: "point"
        }],

        expectedValue: createSchemeObj("above-and-below/hybrid/div-orange-yellow-blue-light", 0.6, { outline: outlines.light, size: 8 })
      }
    ],

    cloneSchemeTests: [
      {
        params: [],
        expectedValue: undefined
      },

      {
        params: [
          createSchemeObj("centered-on/osm/highlight-pink", null, { outline: outlines.lighter, size: 8 })
        ],

        expectedValue: createSchemeObj("centered-on/osm/highlight-pink", null, { outline: outlines.lighter, size: 8 })
      }
    ],
  
    matchingSchemesTests: [
      // Basic: stops
      {
        params: [{
          theme: "centered-on",
          colors: getColorObjs(colors["highlight-pink"].stops),
          geometryType: "point"
        }],
                               
        expectedValue: [
          createSchemeObj("centered-on/topo/highlight-pink", null, { outline: outlines.lighter, size: 8 }),
          createSchemeObj("centered-on/oceans/highlight-pink", null, { outline: outlines.lighter, size: 8 }),
          createSchemeObj("centered-on/osm/highlight-pink", null, { outline: outlines.lighter, size: 8 })
        ]
      },
      
      // Basic: break colors
      {
        params: [{
          theme: "high-to-low",
          colors: getColorObjs(colors["seq-pink-red"]["7"]), // 7-class colors
          geometryType: "point"
        }],
                               
        expectedValue: [
          createSchemeObj("high-to-low/terrain/seq-pink-red", 0.8, { outline: outlines.lighter, size: 8 })
        ]
      },
      
      // Basic: break colors (reversed)
      {
        params: [{
          theme: "high-to-low",
          colors: getColorObjs(colors["seq-pink-red"]["7"]).reverse(), // 7-class colors (reversed)
          geometryType: "point"
        }],
                               
        expectedValue: [
          createSchemeObj("high-to-low/terrain/seq-pink-red", 0.8, { outline: outlines.lighter, size: 8 }, true)
        ]
      },
      
      // extremes does not use seq-pink-red
      {
        params: [{
          theme: "extremes",
          colors: getColorObjs(colors["seq-pink-red"].stops),
          geometryType: "point"
        }],
                               
        expectedValue: []
      },
      
      // One-class color used by multiple colorsets.
      {
        params: [{
          theme: "above-and-below",
          colors: getColorObjs(colors["div-green-orange"]["1"]),
          geometryType: "point"
        }],
                               
        expectedValue: [
          createSchemeObj("above-and-below/gray/div-bluegreen-orange", 0.8, { outline: outlines.lighter, size: 8 }),
          createSchemeObj("above-and-below/terrain/div-bluegreen-orange", 0.8, { outline: outlines.lighter, size: 8 }),
          createSchemeObj("above-and-below/terrain/div-green-orange", 0.8, { outline: outlines.lighter, size: 8 }),
          createSchemeObj("above-and-below/osm/div-bluegreen-orange", 0.8, { outline: outlines.lighter, size: 8 })
        ]
      },
      
      // One-class color used by multiple colorsets.
      {
        params: [{
          theme: "above-and-below",
          colors: getColorObjs(colors["div-orange-pink"]["1"]),
          geometryType: "point"
        }],
                               
        expectedValue: [
          createSchemeObj("above-and-below/gray/div-orange-pink", 0.8, { outline: outlines.lighter, size: 8 }),
          createSchemeObj("above-and-below/topo/div-orange-pink", 0.8, { outline: outlines.lighter, size: 8 }),
          createSchemeObj("above-and-below/topo/div-green-pink", 0.8, { outline: outlines.lighter, size: 8 }),
          createSchemeObj("above-and-below/osm/div-bluegreen-pink", 0.8, { outline: outlines.lighter, size: 8 }),
          createSchemeObj("above-and-below/osm/div-orange-pink", 0.8, { outline: outlines.lighter, size: 8 })
        ]
      }
    ]
  };
  
});
