/*jslint browser: true, continue: true, eqeq: true, nomen: true, plusplus: true, regexp: true, unparam: true, sloppy: true, todo: true, vars: true, white: true */
/*global define */
define(
[
  "../../core/declare",
  
  "../../core/Accessor",
  
  "./LODInfo"
],
function(
  declare,
  Accessor,
  LODInfo
) {

  var max = Math.max, min = Math.min,
      floor = Math.floor, ceil = Math.ceil;

  //--------------------------------------------------------------------------
  //
  //  TileSpan
  //
  //--------------------------------------------------------------------------

  var TileSpan = function TileSpan(lodInfo, row, colFrom, colTo) {
    this.lodInfo = lodInfo;
    this.row = row;
    this.colFrom = colFrom;
    this.colTo = colTo;
  };

  //--------------------------------------------------------------------------
  //
  //  Edges
  //
  //--------------------------------------------------------------------------

  
  var Edge = function Edge(x, ymin, ymax, invM, leftAdjust, rightAdjust, leftBound, rightBound) {
    // current x value, incremented at each row.
    this.x = x;
    // starting row.
    this.ymin = ymin;
    // end row.
    this.ymax = ymax;
    this.invM = invM;
    this.leftAdjust  = leftAdjust;
    this.rightAdjust = rightAdjust;
    this.leftBound   = leftBound;
    this.rightBound  = rightBound;
  };
  Edge.prototype.incrRow = function() {
    this.x += this.invM;
  };
  Edge.prototype.getLeftCol = function() {
    return max(this.x + this.leftAdjust, this.leftBound);
  };
  Edge.prototype.getRightCol = function() {
    return min(this.x + this.rightAdjust, this.rightBound);
  };

  Edge.create = function create(a, b) {
    var swap;
    // sort corners by y.
    if (a[1] > b[1]) {
      swap = a;
      a = b;
      b = swap;
    }
    var ax = a[0], ay = a[1],
        bx = b[0], by = b[1],
        dx = bx - ax, dy = by - ay,
        // don't increment x when the edge is vertical
        invM        = dy !== 0 ? dx/dy : 0.0,
        // adjustXLeft/Right helps calculating the number of columns covered while moving to the next row.
        // eg: for row = 0, col = 1 and for row = 1, col = 10 : on row 0, cols in range [2-10] might also be included.
        //     see http://ezekiel.vancouver.wsu.edu/~cs442/lectures/raster/polyfill/poly.pdf - page 5
        ceilAdjust  = (ceil(ay) - ay) * invM,
        floorAdjust = (floor(ay) - ay) * invM;

    return new Edge(
      ax,              // current x value, incremented at each row.
      floor(ay),  // starting row.
      ceil(by),   // end row.
      invM,
      dx < 0 ? ceilAdjust : floorAdjust,
      dx < 0 ? floorAdjust : ceilAdjust,
      dx < 0 ? bx : ax,
      dx < 0 ? ax : bx
    );
  };


  //--------------------------------------------------------------------------
  //
  //  TileInfoView
  //
  //--------------------------------------------------------------------------
  
  // Static cache used in getTileSpans
  var cornersCache = [
    [0,0],
    [0,0],
    [0,0],
    [0,0]
  ];

  /**
   * TileInfoView is a view over a TileInfo object.
   * Use it to have 
   * It is a stateless object meaning that 
   *
   */
  var TileInfoView = declare([Accessor], {

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    normalizeCtorArgs: function(kwArgs) {
      var ti = kwArgs.tileInfo,
          lods = ti.lods,
          constraints = kwArgs.constraints || {};
          
      if (lods && lods.length) {
        var minZoom = constraints.minZoom,
            maxZoom = constraints.maxZoom,
            minScale = constraints.minScale,
            maxScale = constraints.maxScale,
            minScaleZoom = -1, maxScaleZoom = -1,
            gotMin = false, gotMax = false,
            i;

        for (i = 0; i < lods.length; i++) {
          if (!gotMin && minScale > 0 && minScale >= lods[i].scale) {
            minScaleZoom = lods[i].level;
            gotMin = true;
          }
          if (!gotMax && maxScale > 0 && maxScale >= lods[i].scale) {
            maxScaleZoom = (i > 0) ? lods[i-1].level : -1;
            gotMax = true;
          }
        }

        if (minZoom == null) {
          minZoom = (minScale == null) ? lods[0].level : minScaleZoom;
        }

        if (maxZoom == null) {
          maxZoom = (maxScale == null) ? lods[lods.length - 1].level : maxScaleZoom;
        }
      }

      return {
        tileInfo: ti,
        fullExtent: kwArgs.fullExtent,
        constraints: {
          minZoom: minZoom,
          maxZoom: maxZoom
        }
      };
    },

    getDefaults: function(kwArgs) {
      return {
        wrap: kwArgs.tileInfo.spatialReference.isWrappable()
      };
    },

    initialize: function initialize() {
      // TODO factorise code with ZoomConstraints
      var ti = this.tileInfo,
          fullExtent = this.fullExtent,
          normScale = this.dpi / ti.dpi,
          constraints = this.constraints || { minZoom: -Infinity, maxZoom: +Infinity},
          minZoom = constraints.minZoom,
          maxZoom = constraints.maxZoom,
          lods = ti.lods;

      this._infoByZoom = {};
      this._infoByScale = {};
      this.zooms = [];
      this.scales = [];

      lods = lods.map(
        function(lod) {
          // - Copy the LODs
          // - normalize scales
          lod = lod.clone();
          lod.scale = lod.scale * normScale;
          return lod;
        }
      ).filter(
        // - filter inside min/maxScale
        function(lod) {
          return lod.level >= minZoom && lod.level <= maxZoom;
        }
      ).sort(function(a, b) {
        // - sort DESC by scale
        return b.scale - a.scale;
      });
     
      // - create LODInfos
      this.lodInfos = lods.map(
        function(lod) {
          return new LODInfo(ti, lod, fullExtent);
        }
      );

      lods.forEach(
        function(lod, index) {
          this._infoByZoom[lod.level] = this.lodInfos[index];
          this._infoByScale[lod.scale] = this.lodInfos[index];
          this.zooms[index] = lod.level;
          this.scales[index] = lod.scale;
        },
        this
      );

      this.lods = lods;

      minZoom = this.zooms[0];
      maxZoom = this.zooms[this.zooms.length - 1];

      this.constraints = {
        minZoom: minZoom,
        maxZoom: maxZoom,
        minScale: this._infoByZoom[minZoom].scale,
        maxScale: this._infoByZoom[maxZoom].scale
      };

      // double check if the user has override the default
      this.wrap = this.wrap && ti.spatialReference.isWrappable();

      // TODO support exclusionAreas?
    },


    //--------------------------------------------------------------------------
    //
    //  Variables
    //
    //--------------------------------------------------------------------------

    _infoByZoom: null,

    _infoByScale: null,

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    constraints: null,

    // Screen DPI
    dpi: 96,

    lods: null,

    scales: null,

    wrap: false,

    zooms: null,

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    getZoomForScale: function(scale) {
      var lods = this.lods,
          l1 = null, l2 = null,
          i = 0, n = lods.length - 1;

      for (i; i < n; i++) {
        l1 = lods[i];
        l2 = lods[i+1];
        if (l1.scale <= scale) {
          return l1.level;
        }
        if (l2.scale === scale) {
          return l2.level;
        }
        if (l1.scale > scale && l2.scale < scale) {
          return l2.level - (scale - l2.scale) / (l1.scale - l2.scale);
        }
      }
    },

    getScaleForZoom: function(zoom) {
      var lods = this.lods,
          l1 = null, l2 = null,
          i = 0, n = lods.length - 1;

      for (i; i < n; i++) {
        l1 = lods[i];
        l2 = lods[i+1];
        if (l1.level <= zoom) {
          return l1.scale;
        }
        if (l2.level === zoom) {
          return l2.scale;
        }
        if (l1.level > zoom && l2.level < zoom) {
          return l2.scale - (zoom - l2.level) / (l1.level - l2.level);
        }
      }
    },

    getInfoForZoom: function(zoom) {
      return this._infoByZoom[zoom];
    },

    getInfoForScale: function(scale) {
      return this._infoByScale[scale];
    },

    /**
     * Function that calculates the coordinates of a tile.
     * 
     * @param level
     * @param row
     * @param col
     * @param out optional Point to store the result.
     *
     * @return a point of the top left corner of the tile.
     */
    getTileOrigin: function getTileOrigin(out, coords) {
      var info = this._infoByZoom[coords[2]];
      if (!info) {
        return null;
      }
      return info.getTileOrigin(out, coords);
    },

    /**
     *  Function that calculates spans of tiles for the current map view at a specific level of detail.
     * 
     *  Parameters:
     *    state 
     *      The state decribing the current state.
     *    LOD - <esri.layers.LOD>
     *      The level to create spans for.
     *
     *  Returns:
     *    An array of anonymous objects containing the row and columns range.
     *    {
     *      row: <Number>,
     *      colFrom: <Number>,
     *      colTo: <Number>
     *    }
     */
    getTileSpans: function getTileSpans(state) {
      var info = this._getClosestInfoForScale(state.scale);      
      var wrap = this.wrap,

          row, rowFrom = +Infinity, rowTo = -Infinity,
          colFrom, colTo,

          i, j,
          edge, edges = [], activeEdges,

          spans = [],
          corners;

      cornersCache[0][0] = cornersCache[0][1] = cornersCache[1][1] = cornersCache[3][0] = 0;
      cornersCache[1][0] = cornersCache[2][0] = state.size[0];
      cornersCache[2][1] = cornersCache[3][1] = state.size[1];

      corners = cornersCache.map(function(corner) {
        // Project each corners of the map
        state.toMap(corner, corner);
        // to coordinates on the tile grid.
        corner[0] = info.toGridCol(corner[0]);
        corner[1] = info.toGridRow(corner[1]);
        return corner;
      });

      // Calculate the edges
      //  - drop horizontal ones (a scanline will cover them anyway)
      //  - order them by increasing row value
      j = 3;
      for (i = 0; i < 4; i++) {
        // Edge is horizontal, dropped
        if (corners[i][1] === corners[j][1]) {
          j = i;
          continue;
        }
        edge = Edge.create(corners[i], corners[j]);

        rowFrom = min(edge.ymin, rowFrom);
        rowTo   = max(edge.ymax, rowTo);

        // Add the edge in the edge table.
        if (edges[edge.ymin] === undefined) {
          edges[edge.ymin] = [];
        }
        edges[edge.ymin].push(edge);
        j = i;
      }

      if (rowFrom == null || rowTo == null || rowTo - rowFrom > 100) {
        // this might happen when we are very far from native level resolution.
        // console.log("ERROR: " + lod.resolution + " - " + (rowTo - rowFrom) );
        return [];
      }

      // 1. Initialize bucket to nil
      activeEdges = [];

      // Cap the rows
      row = rowFrom;      
      while (row < rowTo) {

        // 2. move edges available for the current row.
        if (edges[row] != null) {
          //Remove no more active edges, whose rowTo === row
          activeEdges = activeEdges.concat(edges[row]);
        }

        // 3. Fill the span between the 2 edges.
        colFrom = +Infinity;
        colTo   = -Infinity;
        for (i = activeEdges.length - 1; i >= 0; i--) {
          edge = activeEdges[i];
          colFrom = min(colFrom, edge.getLeftCol());
          colTo   = max(colTo, edge.getRightCol());
        }

        colFrom = floor(colFrom);
        colTo = floor(colTo);

        // 4. Create the TileSpan(s):
        //  - the row should be in the bounds of the layer.
        //  - if we don't wrap, the column range should be in the bounds of the layer
        //  - or else, the TileSpan should be splited across multiple worlds
        if (row >= info.start[1] && row <= info.end[1]) {
          if (!wrap) {
            // - check if the lod is partially visible
            if (!(colFrom > info.end[0] || colTo < info.start[0])) {
              colFrom = max(colFrom, info.start[0]);
              colTo   = min(colTo, info.end[0]);
              spans.push(new TileSpan(info, row, colFrom, colTo));
            }
          }
          else {

            // http://asciiflow.com/
            //
            //              +-----------+-----------+-----------+-----------+------------+
            //              |           |           |           |           |            |
            //              |           |           |           |           |            |
            // World        |    -2     |    -1     |     0     |     1     |     2      |
            //              |           |           |           |           |            |
            //              |           |           |           |           |            |
            //              +-----+-----------+-----------+-----------+-----------+------+
            //                    |     |     |     |     |     |     |     |     |       
            // Tiles              | -3  | -2  | -1  |  0  |  1  |  2  |  3  |  4  |       
            //                    |     |     |     |     |     |     |     |     |       
            //                    +-----------------------------------------------+       
            //                    |     |     |     |     |     |     |     |     |       
            // Ref                |  1  |  0  |  1  |  0  |  1  |  0  |  1  |  0  |       
            //                    |     |     |     |     |     |     |     |     |       
            //                    +-----+-----+-----+-----+-----+-----+-----+-----+       


            // with a fullExtent smaller that the world,
            // we split the TileSpan into multiple
            if (info.size[0] < info.worldSize[0]) { 
              for (i = floor(colFrom / info.worldSize[0]), j = floor(colTo / info.worldSize[0]); i <= j; i++) {
                spans.push(new TileSpan(
                  info,
                  row,
                  max(info.getWorldStartCol(i), colFrom),
                  min(info.getWorldEndCol(i), colTo)
                ));
              }
            }
            else {
              // The tile span covers the entire screen 
              spans.push(new TileSpan(info, row, colFrom, colTo));
            }
          }
        }

        // 5. Increment the row.
        row = row + 1;

        // 6. Remove no more active edges.
        // 7. Update x values.
        for (i = activeEdges.length - 1; i >= 0; i--) {
          edge = activeEdges[i];
          if (edge.ymax >= row) {
            edge.incrRow();
          }
          else {
            activeEdges.splice(i, 1);
          }
        }
      }

      return spans;
    },

//     intersects: function(tileA, tileB) {
//       var swap = tileA,
//           parentTile;
//       if (tileA.level > tileB.level) {
//         tileA = tileB;
//         tileB = swap;
//       }
//       var parentTile = this.getParentTile(tileA, tileB.level);
//       return parentTile.level === tileB.level && parentTile.row === tileB.row && parentTile.col === tileB.col;
//     },

//     getParentTile(tile, level) {
//       var parentLevel = this.layer.tileInfo,
//           lods = tileInfo.lods,
//           tileLod, tileLodIndex,
//           parentLod, parent = null;

//       // return the parent tile only if there is a LOD above.
//       if (tileLodIndex > 0) {
//         parentLod = lods[tileLodIndex - 1];
//         parent = new Tile(
//           parentLod.level,
//           // Floating point joy.
//           // At low resolution a decimal is so quickly dropped.
//           Math.floor((tile.row * tileLod.resolution) / parentLod.resolution + 0.01),
//           Math.floor((tile.col * tileLod.resolution) / parentLod.resolution + 0.01)
//         );
//     }
    
//     return parent;
//     },

    /**
     *  Function that calculates tiles for the current map view at a specific level of detail.
     * 
     *  Parameters:
     *    map - <esri.Map>
     *      The map decribing the current view.
     *    LOD - <esri.layers.LOD>
     *      The level to create spans for.
     *    fullExtent - <esri.geometry.Extent> - Optional
     *      An Extent to limit the maximum value of possible rows and columns.
     *
     *  Returns:
     *    An array of anonymous objects decribing tiles.
     *    {
     *      level: <Number>,
     *      row:   <Number>,
     *      col:   <Number>
     *    }
     */
    /*getTiles: function(map, lod, fullExtent) {

      var i, j, m, n, level = lod.level,
          span, spans = this.getTileSpans(map, lod, fullExtent),
          tiles = [];

      for (i = 0, n = spans.length; i < n; i++) {
        span = spans[i];
        for (j = span.colFrom, m = span.colTo; j <= m; j++) {
          tiles.push({
            level: lod.level,
            row: span.row,
            col: j
          });
        }
      }

      return tiles;
    },*/

    clone: function() {
      return new TileInfoView(this.tileInfo ? this.tileInfo.clone() : null);
    },


    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    /**
     * Retrive the closest LOD for a scale value.
     */
    _getClosestInfoForScale: function _getClosestInfoForScale(scale) {
      var scales = this.scales;
      if (this._infoByScale[scale]) {
        return this._infoByScale[scale];
      }
      else {
        scale = scales.reduce(function(prev, curr, idx, array) {
          return Math.abs(curr - scale) < Math.abs(prev - scale) ? curr : prev;
        }, scales[0], this);
        return this._infoByScale[scale];
      }
    }
     
  });

  return TileInfoView;

});
