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
  
  // Frequently used outlines
  var outlines = {
    light: {
      color: [128,128,128,1.0],
      width: 0.5
    },
    
    lighter: {
      color: [153,153,153,1.0],
      width: 0.5
    }
  };
  
  // Frequently used scheme properties
  var common = {
    lightBasemaps: {
      outline: outlines.lighter,
      fillOpacity: 0.8,
      width: 2,
      size: 8
    },
    
    darkBasemaps: {
      outline: outlines.light,
      fillOpacity: 0.6,
      width: 2,
      size: 8
    }
  };
  
  var noData = "#aaaaaa",
      noDataWhite = "#ffffff";
  
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
  
  // http://www.arcgis.com/sharing/rest/content/items/a1fec8b4fa964706be7fa11deed7a2b6/data?f=json
  var seqColorSetsFromPortal = [
    "seq-single-blues",
    "seq-single-greens",
    "seq-single-grays",
    "seq-single-oranges",
    "seq-single-purples",
    "seq-single-reds",
    
    "seq-multi-bugn",
    "seq-multi-bupu",
    "seq-multi-gnbu",
    "seq-multi-orrd",
    "seq-multi-pubu",
    "seq-multi-pubugn",
    "seq-multi-purd",
    "seq-multi-rdpu",
    "seq-multi-ylgn",
    "seq-multi-ylgnbu",
    "seq-multi-ylorbr",
    "seq-multi-ylorrd"
  ];
  
  var divColorSetsFromPortal = [
    "div-brbg",
    "div-piyg",
    "div-prgn",
    "div-puor",
    "div-rdbu",
    "div-rdgy",
    "div-rdylbu",
    "div-rdylgn",
    "div-spectral"
  ];

  ////////////////////
  // Theme dictionary
  ////////////////////
  
  var themes = {

    ////////////////////
    // high-to-low
    ////////////////////
    
    "high-to-low": {
      
      name:        "high-to-low",
      label:       "TODO",
      description: "TODO",
      
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
      ],
      
      // Schemes per basemap
      
      schemes: {
        
        streets: {
          common: common.lightBasemaps,
          
          primary: "seq-yellow-orange-red",
          
          secondary: [
            "seq-yellow-red-purple",
            "seq-yellow-pink-purple",
            "seq-yellow-purple-blue",
            "seq-yellow-green-blue"
          ].concat(seqColorSetsFromPortal)
        },
        
        gray: {
          common: common.lightBasemaps,
          
          primary: "seq-yellow-orange-red",
          
          secondary: [
            "seq-orange-red-light",
            "seq-yellow-red-purple",
            "seq-yellow-pink-purple",
            "seq-yellow-purple-blue"
          ].concat(seqColorSetsFromPortal)
        },
        
        topo: {
          common: common.lightBasemaps,
          
          primary: "seq-yellow-pink-purple",
          
          secondary: [
            "seq-yellow-purple-blue",
            "seq-yellow-red-purple",
            "seq-yellow-orange-red",
            "seq-yellow-green-blue"
          ].concat(seqColorSetsFromPortal)
        },
        
        "terrain": {
          common: common.lightBasemaps,
          
          primary: "seq-pink-red",
          
          secondary: [
            "seq-yellow-pink-purple",
            "seq-yellow-red-purple",
            "seq-yellow-orange-red",
            "seq-orange-red-light"
          ].concat(seqColorSetsFromPortal)
        },
        
        "national-geographic": {
          common: common.lightBasemaps,
          
          primary: "seq-yellow-red-purple",
          
          secondary: [
            "seq-yellow-orange-red",
            "seq-yellow-pink-purple",
            "seq-yellow-purple-blue",
            "seq-yellow-green-blue"
          ].concat(seqColorSetsFromPortal)
        },
        
        "oceans": {
          common: common.lightBasemaps,
          
          primary: "seq-yellow-red-purple",
          
          secondary: [
            "seq-yellow-green-blue",
            "seq-yellow-orange-red",
            "seq-yellow-pink-purple",
            "seq-yellow-purple-blue"
          ].concat(seqColorSetsFromPortal)
        },
        
        "osm": {
          common: common.lightBasemaps,
          
          primary: "seq-red-blue-green",
          
          secondary: [
            "seq-yellow-pink-purple",
            "seq-yellow-red-purple",
            "seq-yellow-purple-blue"
          ].concat(seqColorSetsFromPortal)
        },
        
        "satellite": {
          common: common.darkBasemaps,
          
          primary: "seq-orange-red-dark",
          
          secondary: [
            "seq-yellow-green-blue",
            "seq-red-blue-green",
            "seq-yellow-purple-blue"
          ].concat(seqColorSetsFromPortal)
        },
        
        "hybrid": {
          common: common.darkBasemaps,
          
          primary: "seq-orange-red-dark",
          
          secondary: [
            "seq-yellow-green-blue",
            "seq-red-blue-green",
            "seq-yellow-purple-blue"
          ].concat(seqColorSetsFromPortal)
        },
        
        "dark-gray": {
          common: common.darkBasemaps,
          
          primary: "seq-yellow-orange-red-bright",
          
          secondary: [].concat(seqColorSetsFromPortal)
        }
      }
    },

    ////////////////////
    // above-and-below
    ////////////////////
    
    "above-and-below": {
      
      name:        "above-and-below",
      label:       "TODO",
      description: "TODO",
      
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
      ],
      
      // Schemes per basemap
      
      schemes: {
        
        streets: {
          common: common.lightBasemaps,
          
          primary: "div-bluegreen-yellow-orange",
          
          secondary: [
            "div-orange-yellow-blue-light",
            "div-green-yellow-redpurple",
            "div-green-yellow-orange"
          ].concat(divColorSetsFromPortal)
        },
        
        gray: {
          common: common.lightBasemaps,
          
          primary: "div-orange-purple",
          
          secondary: [
            "div-bluegreen-purple",
            "div-bluegreen-orange",
            "div-orange-pink"
          ].concat(divColorSetsFromPortal)
        },
        
        topo: {
          common: common.lightBasemaps,
          
          primary: "div-orange-pink",
          
          secondary: [
            "div-redpurple-blue",
            "div-orange-blue",
            "div-green-pink"
          ].concat(divColorSetsFromPortal)
        },
        
        "terrain": {
          common: common.lightBasemaps,
          
          primary: "div-bluegreen-orange",
          
          secondary: [
            "div-bluegreen-redpurple",
            "div-green-redpurple",
            "div-green-orange"
          ].concat(divColorSetsFromPortal)
        },
        
        "national-geographic": {
          common: common.lightBasemaps,
          
          primary: "div-orange-yellow-blue-light",
          
          secondary: [
            "div-bluegreen-yellow-orange",
            "div-green-yellow-redpurple"
          ].concat(divColorSetsFromPortal)
        },
        
        "oceans": {
          common: common.lightBasemaps,
          
          primary: "div-red-yellow-pink",
          
          secondary: [
            "div-blue-green",
            "div-bluegreen-yellow-redpurple",
            "div-bluegreen-yellow-orange"
          ].concat(divColorSetsFromPortal)
        },
        
        "osm": {
          common: common.lightBasemaps,
          
          primary: "div-bluegreen-pink",
          
          secondary: [
            "div-bluegreen-redpurple",
            "div-bluegreen-orange",
            "div-orange-pink"
          ].concat(divColorSetsFromPortal)
        },
        
        "satellite": {
          common: common.darkBasemaps,
          
          primary: "div-orange-yellow-blue-dark",
          
          secondary: [
            "div-red-yellow-purple",
            "div-orange-yellow-pink",
            "div-orange-yellow-blue-light"
          ].concat(divColorSetsFromPortal)
        },
        
        "hybrid": {
          common: common.darkBasemaps,
          
          primary: "div-orange-yellow-blue-dark",
          
          secondary: [
            "div-red-yellow-purple",
            "div-orange-yellow-pink",
            "div-orange-yellow-blue-light"
          ].concat(divColorSetsFromPortal)
        },
        
        "dark-gray": {
          common: common.darkBasemaps,
          
          primary: "div-orange-gray-blue",
          
          secondary: [
            "div-yellow-gray-purple",
            "div-red-gray-blue",
            "div-green-gray-purple"
          ].concat(divColorSetsFromPortal)
        }
      }
    },

    ////////////////////
    // centered-on
    ////////////////////
    
    "centered-on": {
      
      name:        "centered-on",
      label:       "TODO",
      description: "TODO",
      
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
      ],
      
      // Schemes per basemap
      
      schemes: {
        
        streets: {
          common: {
            outline: outlines.lighter,
            width: 2,
            size: 8
          },
          
          primary: "highlight-orange",
          
          secondary: [
            "highlight-bluegreen",
            "highlight-orange-gray",
            "highlight-bluegreen-gray"
          ]
        },
        
        gray: {
          common: {
            outline: outlines.lighter,
            width: 2,
            size: 8
          },
          
          primary: "highlight-orange",
          
          secondary: [
            "highlight-purple",
            "highlight-orange-gray",
            "highlight-purple-gray"
          ]
        },
        
        topo: {
          common: {
            outline: outlines.lighter,
            width: 2,
            size: 8
          },
          
          primary: "highlight-orange",
          
          secondary: [
            "highlight-pink",
            "highlight-orange-gray",
            "highlight-pink-gray"
          ]
        },
        
        "terrain": {
          common: {
            outline: outlines.lighter,
            width: 2,
            size: 8
          },
          
          primary: "highlight-orange",
          
          secondary: [
            "highlight-bluegreen",
            "highlight-orange-gray",
            "highlight-bluegreen-gray"
          ]
        },
        
        "national-geographic": {
          common: {
            outline: outlines.lighter,
            width: 2,
            size: 8
          },
          
          primary: "highlight-orange",
          
          secondary: [
            "highlight-blue",
            "highlight-orange-gray",
            "highlight-blue-gray"
          ]
        },
        
        "oceans": {
          common: {
            outline: outlines.lighter,
            width: 2,
            size: 8
          },
          
          primary: "highlight-red",
          
          secondary: [
            "highlight-pink",
            "highlight-red-gray",
            "highlight-pink-gray"
          ]
        },
        
        "osm": {
          common: {
            outline: outlines.lighter,
            width: 2,
            size: 8
          },
          
          primary: "highlight-pink",
          
          secondary: [
            "highlight-bluegreen",
            "highlight-pink-gray",
            "highlight-bluegreen-gray"
          ]
        },
        
        "satellite": {
          common: {
            outline: outlines.light,
            width: 2,
            size: 8
          },
          
          primary: "highlight-orange-dark",
          
          secondary: [
            "highlight-blue-dark",
            "highlight-orange-gray-dark",
            "highlight-blue-gray-dark"
          ]
        },
        
        "hybrid": {
          common: {
            outline: outlines.light,
            width: 2,
            size: 8
          },
          
          primary: "highlight-orange-dark",
          
          secondary: [
            "highlight-blue-dark",
            "highlight-orange-gray-dark",
            "highlight-blue-gray-dark"
          ]
        },
        
        "dark-gray": {
          common: {
            outline: outlines.light,
            width: 2,
            size: 8
          },
          
          primary: "highlight-orange-bright",
          
          secondary: [
            "highlight-blue-bright",
            "highlight-orange-gray-bright",
            "highlight-blue-gray-bright"
          ]
        }
      }
    },

    ////////////////////
    // Extremes
    ////////////////////
    
    "extremes": {
      
      name:        "extremes",
      label:       "TODO",
      description: "TODO",
      
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
      ],
      
      // Schemes per basemap
      
      schemes: {
        
        streets: {
          common: {
            outline: outlines.lighter,
            width: 2,
            size: 8
          },
          
          primary: "extremesdiv-bluegreen-yellow-orange",
          
          secondary: [
            "extremesdiv-orange-yellow-blue-light",
            "extremesdiv-green-yellow-redpurple",
            "extremesdiv-green-yellow-orange",
            
            "extremes-orange",
            "extremes-bluegreen",
            "extremes-orange-gray",
            "extremes-bluegreen-gray"
          ]
        },
        
        gray: {
          common: {
            outline: outlines.lighter,
            width: 2,
            size: 8
          },
          
          primary: "extremesdiv-orange-purple",
          
          secondary: [
            "extremesdiv-bluegreen-purple",
            "extremesdiv-bluegreen-orange",
            "extremesdiv-orange-pink",
            
            "extremes-orange",
            "extremes-purple",
            "extremes-orange-gray",
            "extremes-purple-gray"
          ]
        },
        
        topo: {
          common: {
            outline: outlines.lighter,
            width: 2,
            size: 8
          },
          
          primary: "extremesdiv-orange-pink",
          
          secondary: [
            "extremesdiv-redpurple-blue",
            "extremesdiv-orange-blue",
            "extremesdiv-green-pink",
            
            "extremes-orange",
            "extremes-pink",
            "extremes-orange-gray",
            "extremes-pink-gray"
          ]
        },
        
        "terrain": {
          common: {
            outline: outlines.lighter,
            width: 2,
            size: 8
          },
          
          primary: "extremesdiv-bluegreen-orange",
          
          secondary: [
            "extremesdiv-bluegreen-redpurple",
            "extremesdiv-green-redpurple",
            "extremesdiv-green-orange",
            
            "extremes-orange",
            "extremes-bluegreen",
            "extremes-orange-gray",
            "extremes-bluegreen-gray"
          ]
        },
        
        "national-geographic": {
          common: {
            outline: outlines.lighter,
            width: 2,
            size: 8
          },
          
          primary: "extremesdiv-orange-yellow-blue-light",
          
          secondary: [
            "extremesdiv-bluegreen-yellow-orange",
            "extremesdiv-green-yellow-redpurple",
            
            "extremes-orange",
            "extremes-blue",
            "extremes-orange-gray",
            "extremes-blue-gray"
          ]
        },
        
        "oceans": {
          common: {
            outline: outlines.lighter,
            width: 2,
            size: 8
          },
          
          primary: "extremesdiv-red-yellow-pink",
          
          secondary: [
            "extremesdiv-blue-green",
            "extremesdiv-bluegreen-yellow-redpurple",
            "extremesdiv-bluegreen-yellow-orange",
            
            "extremes-red",
            "extremes-pink",
            "extremes-red-gray",
            "extremes-pink-gray"
          ]
        },
        
        "osm": {
          common: {
            outline: outlines.lighter,
            width: 2,
            size: 8
          },
          
          primary: "extremesdiv-bluegreen-pink",
          
          secondary: [
            "extremesdiv-bluegreen-redpurple",
            "extremesdiv-bluegreen-orange",
            "extremesdiv-orange-pink",
            
            "extremes-pink",
            "extremes-bluegreen",
            "extremes-pink-gray",
            "extremes-bluegreen-gray"
          ]
        },
        
        "satellite": {
          common: {
            outline: outlines.light,
            width: 2,
            size: 8
          },
          
          primary: "extremesdiv-orange-yellow-blue-dark",
          
          secondary: [
            "extremesdiv-red-yellow-purple",
            "extremesdiv-orange-yellow-pink",
            "extremesdiv-orange-yellow-blue-light",
            
            "extremes-orange-dark",
            "extremes-blue-dark",
            "extremes-orange-gray-dark",
            "extremes-blue-gray-dark"
          ]
        },
        
        "hybrid": {
          common: {
            outline: outlines.light,
            width: 2,
            size: 8
          },
          
          primary: "extremesdiv-orange-yellow-blue-dark",
          
          secondary: [
            "extremesdiv-red-yellow-purple",
            "extremesdiv-orange-yellow-pink",
            "extremesdiv-orange-yellow-blue-light",
            
            "extremes-orange-dark",
            "extremes-blue-dark",
            "extremes-orange-gray-dark",
            "extremes-blue-gray-dark"
          ]
        },
        
        "dark-gray": {
          common: {
            outline: outlines.light,
            width: 2,
            size: 8
          },
          
          primary: "extremesdiv-orange-gray-blue",
          
          secondary: [
            "extremesdiv-yellow-gray-purple",
            "extremesdiv-red-gray-blue",
            "extremesdiv-green-gray-purple",
            
            "extremes-orange-bright",
            "extremes-blue-bright",
            "extremes-orange-gray-bright",
            "extremes-blue-gray-bright"
          ]
        }
      }
    },

    ////////////////////
    // Group Similar
    ////////////////////
    
    "group-similar": {
      
      name:        "group-similar",
      label:       "TODO",
      description: "TODO",
      
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
          common: common.lightBasemaps,
          primary: "spectral",
          
          secondary: [
            "cat-dark-6",
            "cat-light-6"
          ]
        },
        
        dark: {
          common: common.darkBasemaps,
          primary: "spectral",
  
          secondary: [
            "cat-dark-6",
            "cat-light-6"
          ]
        }
      }
    }
    
  };
  
  // Module value
  var choroplethStyle = {};
  
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
  
  function compareColor(colorA, colorB) {
    // Returns true if the two colors are identical.
    // TODO
    // Include alpha in comparison?
    return (
      colorA.r === colorB.r &&
      colorA.g === colorB.g &&
      colorA.b === colorB.b
    );
  }
  
  function hasIdenticalColors(schemeColors, userColors) {
    // Returns 0 if the two color sets are NOT identical.
    // If they are identical, then it returns -1 or 1.
    //   -1 indicates they match after the colors are reversed.
    //    1 indicates they match exactly.
    var identical, result = 0;
    
    if (schemeColors.length === userColors.length) {
      
      // Check if two color sets match in the order they're given.
      identical = array.every(schemeColors, function(clr, idx) {
        return compareColor(clr, userColors[idx]);
      });
      
      if (identical) {
        result = 1;
      }
      else {
        // Check if the colors are in reverse order.
        var flippedColors = schemeColors.slice(0).reverse();
        
        identical = array.every(flippedColors, function(clr, idx) {
          return compareColor(clr, userColors[idx]);
        });
        
        if (identical) {
          result = -1; // indicates reversed color order.
        }
      }
      
    }
      
    return result;
  }
  
  function compareColors(scheme, userColors) {
    // Returns the "scheme" if it contains the userColors.
    // The returned scheme will have flipped colors, if it matches 
    // userColors only after flipping its colors.
    var matchingScheme, result;
    
    // Check if color "stops" match the user colors.
    result = hasIdenticalColors(userColors, scheme.colors);
    
    if (result) {
      matchingScheme = (result > 0) ? scheme : choroplethStyle.flipColors(scheme, true);
    }
    else {
      // Check if one of the "break" color sets match the user colors.
      var breakColors;
      
      array.some(scheme.colorsForClassBreaks, function(breakInfo) {
        if (breakInfo.numClasses === userColors.length) {
          breakColors = breakInfo.colors;
        }
        
        return !!breakColors;
      });
      
      if (breakColors) {
        result = hasIdenticalColors(userColors, breakColors);

        if (result) {
          matchingScheme = (result > 0) ? scheme : choroplethStyle.flipColors(scheme, true);
        }
      }
    }
    
    return matchingScheme;
  }
  
  function getSchemeInfo(theme, basemapName) {
    // Returns scheme info for the given basemap.
    var groups = theme && theme.basemapGroups,
        basemaps = theme && theme.basemaps,
        groupName, found, schemeKey;
    
    // Find scheme "key" for the given basemap.
    if (groups) {
      for (groupName in groups) {
        basemaps = groups[groupName];
        found = array.indexOf(basemaps, basemapName);
        
        if (found > -1) {
          schemeKey = groupName;
          break;
        }
      }
    }
    
    schemeKey = schemeKey || basemapName;
    
    return (theme && schemeKey) ? theme.schemes[schemeKey] : null;
  }
  
  function getAllBasemaps(theme) {
    // Returns all basemaps supported by the given theme.
    var groups = theme.basemapGroups,
        basemaps = theme.basemaps,
        groupName, all = [];
    
    if (groups) {
      for (groupName in groups) {
        all = all.concat(groups[groupName]);
      }
    }
    else if (basemaps) {
      all = all.concat(basemaps);
    }
    
    return all;
  }
  
  function copyScheme(scheme, commonProps, geomType, themeName, basemapName) {
    var retVal, numClasses, fillOpacity,

        // See esri/styles/colors.js for structure of colorSpec
        colorsSpec = colors[scheme];
    
    if (colorsSpec) {
      retVal = {
        id: themeName + "/" + basemapName + "/" + scheme,
        theme: themeName
      };
      
      fillOpacity = commonProps.fillOpacity;
      
      if (
        fillOpacity == null && 
        array.indexOf(fadeToGraySchemes, scheme) !== -1
      ) {
        // Fade to gray schemes get a single uniform opacity of 80%
        fillOpacity = 0.8;
      }

      // 1. Colors for un-classed choropleth
      retVal.colors = createColors(colorsSpec.stops, fillOpacity);
      
      // 2. Colors for classed choropleth
      retVal.colorsForClassBreaks = [];
      
      for (numClasses in colorsSpec) {
        if (numClasses !== "stops") {
          // convert string of the form "<number>" to number
          numClasses = +numClasses;
          
          retVal.colorsForClassBreaks.push({
            numClasses: numClasses,
            colors: createColors(colorsSpec[numClasses], fillOpacity)
          });
        }
      }
      
      // 3. Add noDataColor
      // "fade to gray" schemes in "centered-on" and "extremes" themes get "noDataWhite".
      // Everything else gets "noData".
      retVal.noDataColor = new esriColor(
        (array.indexOf(fadeToGraySchemes, scheme) !== -1)
          ? noDataWhite
          : noData
      );
      
      if (fillOpacity != null) {
        retVal.noDataColor.a = fillOpacity || 1;
      }
      
      // 4. Fill in other scheme properties
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
  
  lang.mixin(choroplethStyle, {
    
    getAvailableThemes: function(basemap) {
      // basemap parameter is optional
      var available = [], themeName, theme, basemaps;
      
      for (themeName in themes) {
        theme = themes[themeName];
        basemaps = getAllBasemaps(theme);
        
        // Exclude this theme if it does not support the given basemap
        if (basemap && array.indexOf(basemaps, basemap) === -1) {
          continue;
        }
        
        available.push({
          name: theme.name,
          label: theme.label,
          description: theme.description,
          basemaps: basemaps
        });
      }
      
      return available;
    },
    
    getSchemes: function(params) {
      var themeName = params.theme,
          basemapName = params.basemap,
          geomType = getGeometryType(params.geometryType),
          theme = themes[themeName],
          schemeInfo,
          retVal;
    
      schemeInfo = getSchemeInfo(theme, basemapName);
      
      if (schemeInfo) {
        retVal = {
          primaryScheme: copyScheme(schemeInfo.primary, schemeInfo.common, geomType, themeName, basemapName),
          
          secondarySchemes: array.map(schemeInfo.secondary, function(scheme) {
            return copyScheme(scheme, schemeInfo.common, geomType, themeName, basemapName);
          })
        };
      }
      
      return retVal;
    },

    getSchemeById: function(params) {
      var retVal, themeName, basemapName, schemeName, schemeInfo,
          schemeId = params.id,
          geomType = getGeometryType(params.geometryType);

      // Extract theme, basemap and scheme from the given scheme id.
      if (schemeId) {
        // Example:
        // "high-to-low/streets/seq-yellow-orange-red"
        schemeId = schemeId.split("/");

        if (schemeId) {
          themeName = schemeId[0];
          basemapName = schemeId[1];
          schemeName = schemeId[2];
        }
      }

      schemeInfo = getSchemeInfo(themes[themeName], basemapName);

      if (schemeInfo) {
        retVal = copyScheme(schemeName, schemeInfo.common, geomType, themeName, basemapName);
      }

      return retVal;
    },

    cloneScheme: function(scheme) {
      var clone;

      if (scheme) {
        clone = lang.mixin({}, scheme);

        // Replace object and array refs with copies.
        clone.colors = createColors(clone.colors);

        clone.colorsForClassBreaks = array.map(clone.colorsForClassBreaks, function(breakInfo) {
          return {
            numClasses: breakInfo.numClasses,
            colors: createColors(breakInfo.colors)
          };
        });

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
    },
    
    flipColors: function(scheme, flipInPlace) {
      // Create a new scheme from the given scheme, but with colors 
      // flipped.
      var flippedScheme = flipInPlace ? scheme : choroplethStyle.cloneScheme(scheme);

      flippedScheme.colors.reverse();

      array.forEach(flippedScheme.colorsForClassBreaks, function(breakInfo) {
        breakInfo.colors.reverse();
      });

      return flippedScheme;
    },
    
    getMatchingSchemes: function(params) {
      // Returns ALL schemes matching the given colors.
      // Only R, G and B components are compared - not A (alpha).
      var themeName = params.theme,
          geomType = getGeometryType(params.geometryType),
          userColors = params.colors,
          theme = themes[themeName],
          basemaps = getAllBasemaps(theme),
          matchingScheme, matchingSchemes = [];
      
      array.forEach(basemaps, function(basemapName) {
        var schemeInfo = getSchemeInfo(theme, basemapName);
        
        // Compare the given colors against both primary and secondary 
        // schemes.
        if (schemeInfo) {
          // Does the primary scheme match?
          matchingScheme = compareColors(
            copyScheme(schemeInfo.primary, schemeInfo.common, geomType, themeName, basemapName),
            userColors
          );
        
          if (matchingScheme) {
            matchingSchemes.push(matchingScheme);
          }
          
          // Does any of the secondary schemes match?
          array.forEach(schemeInfo.secondary, function(schemeObj) {
            matchingScheme = compareColors(
              copyScheme(schemeObj, schemeInfo.common, geomType, themeName, basemapName),
              userColors
            );

            if (matchingScheme) {
              matchingSchemes.push(matchingScheme);
            }
          });
        }
      });
      
      return matchingSchemes;
    }
    
  });

  
  
  return choroplethStyle;
});
