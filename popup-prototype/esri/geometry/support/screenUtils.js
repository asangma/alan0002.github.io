define(
[
  "dojo/_base/array",
  "dojo/sniff",
  "../Point",
  "../ScreenPoint",
  "../Polyline",
  "../Polygon",
  "../Multipoint",
  "../Extent"
],
function(array, has, Point, ScreenPoint, Polyline, Polygon, Multipoint, Extent) {

  function toScreenPoint(/*esri.geometry.Extent*/ ext, /*Number*/ wd, /*Number*/ ht, /*esri.geometry.Point*/ pt, doNotRound) {
    var extSR = ext.spatialReference,
        ptSR = pt.spatialReference,
        //EsriGeom = esri.geometry,
        x = pt.x, y = pt.y, projected;
    
    if (extSR && ptSR && !extSR.equals(ptSR) && extSR._canProject(ptSR)) {
      projected = extSR.isWebMercator() ?
                    Point.lngLatToXY(x, y) :
                    Point.xyToLngLat(x, y, true);

      x = projected[0];
      y = projected[1];
    }
    
    x = (x - ext.xmin) * (wd / ext.getWidth());
    y = (ext.ymax - y) * (ht / ext.getHeight());
    
    // Sometimes caller needs the precision if the screen point 
    // is just an intermediate result while performing calculations
    // in map coordinate space.
    if (!doNotRound) {
      x = Math.round(x);
      y = Math.round(y);
    }
    
    return new ScreenPoint(x, y);
  }

  function toScreenGeometry(/*esri.geometry.Extent*/ ext, /*Number*/ wd, /*Number*/ ht, /*esri.geometry.Geometry*/ g) {
    var x = ext.xmin,
        y = ext.ymax,
        rwd = wd / ext.getWidth(),
        rht = ht / ext.getHeight(),
        forEach = array.forEach,
        round = Math.round;

    if (g instanceof Point) {
      return new Point( round((g.x - x) * rwd),
                                      round((y - g.y) * rht));
    }
    else if (g instanceof Multipoint) {
      var mp = new Multipoint(),
          mpp = mp.points;

      forEach(g.points, function(pt, i) {
        mpp[i] = [round((pt[0] - x) * rwd), round((y - pt[1]) * rht)];
      });
      
      return mp;
    }
    else if (g instanceof Extent) {
      return new Extent(
        round((g.xmin - x) * rwd),
        round((y - g.ymin) * rht),
        round((g.xmax - x) * rwd),
        round((y - g.ymax) * rwd)
      );
    }
    else if (g instanceof Polyline) {
      var pline = new Polyline(),
          paths = pline.paths,
          newPath;
      
      forEach(g.paths, function(path, i) {
        newPath = (paths[i] = []);
        forEach(path, function(pt, j) {
          newPath[j] = [round((pt[0] - x) * rwd), round((y - pt[1]) * rht)];
        });
      });
      
      return pline;
    }
    else if (g instanceof Polygon) {
      var pgon = new Polygon(),
          rings = pgon.rings,
          newRing;
      
      forEach(g.rings, function(ring, i) {
        newRing = (rings[i] = []);
        forEach(ring, function(pt, j) {
          newRing[j] = [round((pt[0] - x) * rwd), round((y - pt[1]) * rht)];
        });
      });
      
      return pgon;
    }
  }

  var convert = (function() {
    // esri.vml won't be ready at this point
    if (has("ie") < 9) {
      return function(x, y, rwd, rht, dx, dy, inPaths, projector, isLinear) { //toVML
        var paths = [], //paths or rings, for simplicity in function variable names, just using path. But also applies for rings
            round = Math.round, p, pl = inPaths.length,
            path, pathIndex, pathLength, pt, x1, y1, x2, y2; //, left, top, left2, top2;

        for (p=0; p<pl; p++) {
          path = inPaths[p];
          
          pt = projector ? 
                projector(path[0][0], path[0][1], isLinear) : 
                path[0];

          if ((pathLength = path.length) > 1) {
            //pt = path[0];
            x1 = round(((pt[0] - x) * rwd) + dx);
            y1 = round(((y - pt[1]) * rht) + dy);
            
            pt = projector ? 
                  projector(path[1][0], path[1][1], isLinear) : 
                  path[1];
            
            x2 = round(((pt[0] - x) * rwd) + dx);
            y2 = round(((y - pt[1]) * rht) + dy);
            
            //left2 = x2 < x1 ? x2 : x1;
            //top2 = y2 < y1 ? y2 : y1;
            paths.push(
              "M", x1 + "," + y1,
              "L", x2 + "," + y2
            );

            for (pathIndex=2; pathIndex<pathLength; pathIndex++) {
              pt = projector ? 
                    projector(path[pathIndex][0], path[pathIndex][1], isLinear) : 
                    path[pathIndex];
              
              x1 = round(((pt[0] - x) * rwd) + dx);
              y1 = round(((y - pt[1]) * rht) + dy);
              
              //left2 = x1 < left2 ? x1 : left2;
              //top2 = y1 < top2 ? y1 : top2;
              paths.push(x1 + "," + y1);
            }
          }
          else {
            x1 = round(((pt[0] - x) * rwd) + dx);
            y1 = round(((y - pt[1]) * rht) + dy);
            paths.push("M", x1 + "," + y1);
          }
          
          /*if (p === 0) { // first path
            left = left2;
            top = top2;
          }
          else {
            left = left2 < left ? left2 : left;
            top = top2 < top ? top2 : top;
          }*/
        }

        // We are calculating left and top here so that it can be used to
        // identify if clipping is required. Normally, this information
        // is available for free from GFX - but we've overridden GFX path
        // in VML using esri.gfx.Path impl which prevents GFX from getting
        // the necessary data. (see _GraphicsLayer::_getCorners)
        //geom._screenLeft = left;
        //geom._screenTop = top;

        return paths;
      };
    }
    else {
      return function(x, y, rwd, rht, dx, dy, inPaths, projector, isLinear) { //toGFX/SVG
        var paths = [], i, j, il, jl, path, pt,
            round = Math.round;
        
        for (i = 0, il = inPaths ? inPaths.length : 0; i < il; i++) {
          path = inPaths[i];
          paths.push("M");
          
          for (j = 0, jl = path ? path.length : 0; j < jl; j++) {
            pt = projector ? 
                  projector(path[j][0], path[j][1], isLinear) : 
                  path[j];
            
            paths.push(round(((pt[0] - x) * rwd) + dx) + "," + round(((y - pt[1]) * rht) + dy));
          }
        }
       
        return paths;
      };
    }
  }());

  function _toScreenPath(ext, wd, ht, g, dx, dy) {
    var //EsriGeom = esri.geometry,
        isPline = g instanceof Polyline,
        extSR = ext.spatialReference, 
        geomSR = g.spatialReference,
        projector, isLinear;
    
    if (extSR && geomSR && !extSR.equals(geomSR) && extSR._canProject(geomSR)) {
      if (extSR.isWebMercator()) {
        projector = Point.lngLatToXY;
      }
      else {
        projector = Point.xyToLngLat;
        isLinear = true;
      }
    }
    
    return convert(
      ext.xmin, ext.ymax, 
      wd / ext.getWidth(), 
      ht / ext.getHeight(), 
      dx, dy, 
      isPline ? g.paths : g.rings,
      projector,
      isLinear
    );
  }

  function toMapPoint(/*esri.geometry.Extent*/ ext, /*Number*/ wd, /*Number*/ ht, /*esri.geometry.Point*/ pt) {
    return new Point(ext.xmin + (pt.x / (wd / ext.getWidth())),
                                   ext.ymax - (pt.y / (ht / ext.getHeight())),
                                   ext.spatialReference);
  }

  function toMapGeometry(/*esri.geometry.Extent*/ ext, /*Number*/ wd, /*Number*/ ht, /*esri.geometry.Geometry*/ g) {
    var x = ext.xmin,
        y = ext.ymax,
        sr = ext.spatialReference,
        rwd = wd / ext.getWidth(),
        rht = ht / ext.getHeight(),
        forEach = array.forEach;

    if (g instanceof Point) {
      return new Point( x + (g.x / rwd),
                                      y - (g.y / rht),
                                      sr);
    }
    else if (g instanceof Multipoint) {
      var mp = new Multipoint(sr),
          mpp = mp.points;
      forEach(g.points, function(pt, i) {
        mpp[i] = [x + (pt[0] / rwd), y - (pt[1] / rht)];
      });
      return mp;
    }
    else if (g instanceof Extent) {
      return new Extent(x + (g.xmin / rwd),
                                      y - (g.ymin / rht),
                                      x + (g.xmax / rwd),
                                      y - (g.ymax / rht),
                                      sr);
    }
    else if (g instanceof Polyline) {
      var pline = new Polyline(sr),
          paths = pline.paths,
          newPath;
      forEach(g.paths, function(path, i) {
        newPath = (paths[i] = []);
        forEach(path, function(pt, j) {
          newPath[j] = [x + (pt[0] / rwd), y - (pt[1] / rht)];
        });
      });
      return pline;
    }
    else if (g instanceof Polygon) {
      var pgon = new Polygon(sr),
          rings = pgon.rings,
          newRing;
      forEach(g.rings, function(ring, i) {
        newRing = (rings[i] = []);
        forEach(ring, function(pt, j) {
          newRing[j] = [x + (pt[0] / rwd), y - (pt[1] / rht)];
        });
      });
      return pgon;
    }
  }
    
  var screenUtils = {
    toScreenPoint: toScreenPoint,
    toScreenGeometry: toScreenGeometry,
    _toScreenPath: _toScreenPath,
    toMapPoint: toMapPoint,
    toMapGeometry: toMapGeometry
  };

  

  return screenUtils;  
});
