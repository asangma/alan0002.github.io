/*jslint browser: true, continue: true, eqeq: true, nomen: true, plusplus: true, regexp: true, unparam: true, sloppy: true, todo: true, vars: true, white: true */
/*global define, console */
define(
[
  "../../../core/declare",
  "dojo/_base/lang"
],
function(
  declare, lang
) {
  
var ScaleBin = function() {
  this.requests = [];
};
  
var TileQueue = declare(null, {

  //--------------------------------------------------------------------------
  //
  //  Constructor
  //
  //--------------------------------------------------------------------------
  
  constructor: function(properties) {
    // Properties
    //   - tileInfo
    lang.mixin(this, properties);
    this._scales = [];
    this._scaleBins = {};
    this._levelToScale = {};
    
    var lods = properties.tileInfo.lods;
    lods.forEach(function(lod) {
      this._levelToScale[lod.level] = lod.scale;
    }, this);
    
    this._requestIds = {};
  },
  
  //--------------------------------------------------------------------------
  //
  //  Variables
  //
  //--------------------------------------------------------------------------
  
  _minScale:  0,
  _maxScale: -1,
  _scales:    null,
  _scaleBins: null,
  _levelToScale: null,
  _requestIds:     null,
  
  //--------------------------------------------------------------------------
  //
  //  Public methods
  //
  //--------------------------------------------------------------------------
  
  add: function(id, request) {
    // request: {
    //   id
    //   tile
    // }
    if (this.contains(id)) {
      return;
    }
    
    var scale = this._levelToScale[request.tile.level];
        
    // Update min/max scales
    if (this._maxScale < this._minScale) {
      this._minScale = this._maxScale = scale;
    }
    else {
      if (scale < this._minScale) {
        this._minScale = scale;
      }
      if (scale > this._maxScale) {
        this._maxScale = scale;
      }
    }
    
    var bin = this._scaleBins[scale];
    if (!bin) {
      this._scales.push(scale);
      this._scales.sort(this._sortNumbers);
      bin = this._scaleBins[scale] = new ScaleBin();
    }
    
    bin.requests.push(request);
    this._requestIds[id] = request;
  },
  
  get: function(num) {
    var requests    = [],
        scale  = this.state.scale,
        x = this.state.x, y = this.state.y,
        scales = this._scales,
        ti = this.tileInfo, normCols, normRows,
        bin, i, n;
    
    if (num == null) {
      num = 1;
    }
    
    while(requests.length < num && this._minScale <= this._maxScale) {
      
      // Exact scale
      bin = this._scaleBins[scale];
      
      // Lookup for another one
      if (!bin) {
        if (scale < this._minScale) {
          scale = this._minScale;
        }
        else if (scale > this._maxScale) {
          scale = this._maxScale;
        }
        // lookup for the closest one
        else {
          for (i = 1, n = scales.length; i < n; i++) {
            if (scale < scales[i]) {
              scale = scale - scales[i-1] < scales[i] - scale ? 
                           scales[i-1] : scales[i];
            }
          }
        }
        bin = this._scaleBins[scale];
      }
      
      //
      // find the closest tile from the center
      //
      
      // sort the requests by the center
      normRows = 1 / scale / ti.rows;
      normCols = 1 / scale / ti.cols;
      bin.requests.sort(this._sortRequests(
        (x - ti.origin.x) * normCols,
        (ti.origin.y - y) * normRows
      ));
      
      while(requests.length < num && bin.requests.length > 0) {
        requests.push(this._remove(bin, scale, bin.requests[0]));
      }
    }
    
    return requests;
  },
  
  contains: function(id) {
    return this._requestIds[id] !== undefined;
  },
  
  remove: function(id) {
    var request = this._requestIds[id],
        scale, bin;
    if (request) {
      scale = this._levelToScale[request.tile.level];
      bin = this._scaleBins[scale];
      this._remove(bin, scale, request);
    }
    return request;
  },
  
  isEmpty: function() {
    return this._minScale > this._maxScale;
  },
  
  
  //--------------------------------------------------------------------------
  //
  //  Private functions
  //
  //--------------------------------------------------------------------------
  
  _remove: function(bin, scale, request) {
    bin.requests.splice(bin.requests.indexOf(request), 1);
    if (!bin.requests.length) {
      this._scales.splice(this._scales.indexOf(scale), 1);
      delete this._scaleBins[scale];
      this._scales.sort();
      if (this._scales.length > 0) {
        this._minScale = this._scales[0];
        this._maxScale = this._scales[this._scales.length - 1];
      }
      else {
        this._minScale =  0;
        this._maxScale = -1;
      }
    }
    delete this._requestIds[request.id];
    return request;
  },
  
  _sortNumbers: function(a, b) {
    return a - b;
  },
  
  _sortRequests: function(col, row) {
    return function(a, b) {
      a = a.tile;
      b = b.tile;
      return Math.sqrt((col-a.c)*(col-a.c) + (row-a.row)*(row-a.row)) -
             Math.sqrt((col-b.c)*(col-b.c) + (row-b.row)*(row-b.row));
    };
  }
  
});

return TileQueue;

});
