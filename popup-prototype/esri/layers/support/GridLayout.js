define(
[
  "../../core/declare",
  "dojo/_base/array",
  
  "../../geometry/SpatialReference",
  "../../geometry/Extent",
  "../../geometry/Polyline"
],
function(
  declare, array,
  SpatialReference,
  Extent, Polyline
) {

  /**************************
   * esri.layers._GridLayout
   **************************/
  
  var GridLayout = declare(null, {
    declaredClass: "esri.layers.GridLayout",
    
    /*
     * cellSize = { width: <Number>, height: <Number> }
     * mapSize  = { width: <Number>, height: <Number> }
     */
    constructor: function(origin, cellSize, mapSize, srInfo) {
      this.origin = origin;
      this.cellWidth = cellSize.width;
      this.cellHeight = cellSize.height;
      this.mapWidth = mapSize.width;
      this.mapHeight = mapSize.height;
      this.srInfo = srInfo; // map wrapping is enabled and sr is wrappable
    },
    
    /*****************
     * Public Methods
     *****************/
    
    setResolution: function(mapExtent) {
      this._resolution = (mapExtent.xmax - mapExtent.xmin) / this.mapWidth;
  
      if (this.srInfo) {
        // Logic borrowed from tiled layer
        var pixelsCoveringWorld = Math.round((2 * this.srInfo.valid[1]) / this._resolution),
            numTiles = Math.round(pixelsCoveringWorld / this.cellWidth);
        
        this._frameStats = [ 
          /* #tiles */ numTiles, 
          /* -180 */ 0, 
          /* +180 */ numTiles - 1 
        ];
      }
    },
    
    getCellCoordinates: function(point) {
      //console.log("getCellCoordinates");
      var res = this._resolution,
          origin = this.origin;
      return {
        row: Math.floor((origin.y - point.y) / (this.cellHeight * res)),
        col: Math.floor((point.x - origin.x) / (this.cellWidth * res))
      };
    },
    
    normalize: function(col) {
      var frameStats = this._frameStats;
      if (frameStats) {
        // Logic borrowed from tiled layer
        var total_cols = frameStats[0], m180 = frameStats[1], p180 = frameStats[2];
  
        if (col < m180) {
          /*while (col < m180) {
            col += total_cols;
          }*/
          col = col % total_cols;
          col = col < m180 ? col + total_cols : col;
        }
        else if (col > p180) {
          /*while (col > p180) {
            col -= total_cols;
          }*/
          col = col % total_cols;
        }
      }
      
      return col;
    },
    
    intersects: function(cExtent, mExtent) {
      // cExtent assumed to be normalized already
      // and does not span across dateline
      
      var srInfo = this.srInfo;
      if (srInfo) {
        return array.some(mExtent._getParts(srInfo), function(mePart) {
          return cExtent.intersects(mePart.extent);
        });
      }
      else {
        return cExtent.intersects(mExtent);
      }
    },
    
    getCellExtent: function(row, col) {
      //console.log("getCellExtent");
      var res = this._resolution,
          origin = this.origin,
          cellWidth = this.cellWidth,
          cellHeight = this.cellHeight;
          
      return new Extent(
        (col * cellWidth * res) + origin.x,
        origin.y - ( (row + 1) * cellHeight * res),
        ( (col + 1) * cellWidth * res) + origin.x,
        origin.y - (row * cellHeight * res),
        new SpatialReference(origin.spatialReference.toJSON())
      );
    },
    
    getLatticeID: function(mExtent) {
      var topLeftCoord = this.getCellCoordinates({ x: mExtent.xmin, y: mExtent.ymax }),
          bottomRightCoord = this.getCellCoordinates({ x: mExtent.xmax, y: mExtent.ymin }),
          minRow = topLeftCoord.row, 
          maxRow = bottomRightCoord.row,
          minCol = this.normalize(topLeftCoord.col), 
          maxCol = this.normalize(bottomRightCoord.col);
          
      return minRow + "_" + maxRow + "_" + minCol + "_" + maxCol;
    },
    
    sorter: function(a, b) {
      return (a < b) ? -1 : 1;
    },
    
    getCellsInExtent: function(extent, needLattice) {
      //console.log("getCellsInExtent");
      var topLeftCoord = this.getCellCoordinates({ x: extent.xmin, y: extent.ymax }),
          bottomRightCoord = this.getCellCoordinates({ x: extent.xmax, y: extent.ymin }),
          minRow = topLeftCoord.row, maxRow = bottomRightCoord.row,
          minCol = topLeftCoord.col, maxCol = bottomRightCoord.col,
          cells = [], i, j, nj, xcoords = [], ycoords = [], 
          len, xmin, xmax, ymin, ymax, paths = [], lattice, latticeID;
          
      for (i = minRow; i <= maxRow; i++) {
        for (j = minCol; j <= maxCol; j++) {
          nj = this.normalize(j);
          extent = this.getCellExtent(i, nj);
          
          cells.push({ 
            row: i, col: nj, 
            extent: extent, 
            resolution: this._resolution 
          });
          
          if (needLattice) {
            xcoords.push(extent.xmin, extent.xmax);
            ycoords.push(extent.ymin, extent.ymax);
          }
        }
      }
      //console.log(cells);
      
      minCol = this.normalize(minCol);
      maxCol = this.normalize(maxCol);
      
      // create a unique lost of x-coordinatesd and y-coordinates
      xcoords.sort(this.sorter);
      ycoords.sort(this.sorter);
      
      len = xcoords.length;
      for (i = len - 1; i >= 0; i--) {
        if (i < (len - 1)) {
          if (xcoords[i] === xcoords[i + 1]) {
            xcoords.splice(i, 1);
          }
        }
      }
      
      len = ycoords.length;
      for (i = len - 1; i >= 0; i--) {
        if (i < (len - 1)) {
          if (ycoords[i] === ycoords[i + 1]) {
            ycoords.splice(i, 1);
          }
        }
      }
      //console.log(xcoords, ycoords);
      
      // create the lattice
      if (xcoords.length && ycoords.length) {
        xmin = xcoords[0];
        xmax = xcoords[xcoords.length - 1];
        ymin = ycoords[0];
        ymax = ycoords[ycoords.length - 1];
        //console.log(xmin, xmax, ymin, ymax);
    
        len = xcoords.length;
        for (i = 0; i < len; i++) {
          // a line from ymax to ymin at this x-coordinate
          paths.push([ 
            [xcoords[i], ymax],
            [xcoords[i], ymin]
          ]);
        }
    
        len = ycoords.length;
        for (i = 0; i < len; i++) {
          // a line from xmin to xmax at this y-coordinate
          paths.push([
            [xmin, ycoords[i]],
            [xmax, ycoords[i]]
          ]);
        }
        
        lattice = Polyline.fromJSON({
          paths: paths,
          spatialReference: this.origin.spatialReference.toJSON()
        });
  
        latticeID = minRow + "_" + maxRow + "_" + minCol + "_" + maxCol;
        
        //console.log("lattice = ", paths.length, dojo.toJson(lattice.toJSON()));
        //console.log("key = " + latticeID);
        
        cells.push({
          latticeID: latticeID,
          lattice: lattice, // a polyline
          resolution: this._resolution
        });
      }
      
      return {
        minRow: minRow,
        maxRow: maxRow,
        minCol: minCol,
        maxCol: maxCol,
        cells: cells
      }; // cellInfo
    }
  });
  
  return GridLayout;  
});
