define(
[
  "../../core/declare",
  "dojo/_base/lang",

  "dojox/gfx",
  "dojox/gfx/matrix",
  
  "./math/common",
  "./math/mat2d",
  "./math/vec2",

  "./Projector",

  "../../geometry/Polygon",
  
  "../../symbols/MarkerSymbol",
  "../../symbols/SimpleMarkerSymbol",
  "../../symbols/support/gfxUtils",
  
  "../../core/screenUtils",
  
  "../../core/Accessor"
],
function(
  declare, lang,
  gfx, gfxMatrix,
  common, mat2d, vec2,
  Projector,
  Polygon,
  MarkerSymbol, SMS, gfxUtils,
  coreScreenUtils,
  Accessor
) {
  
var ID = 0;
function generateID() {
  return "vecgp" + ID++;
}

var mat2d2GFXMatrix = function mat2d2GFXMatrix(mat) {
  return {
    xx: mat[0],
    yx: mat[1],
    xy: mat[2],
    yy: mat[3],
    dx: mat[4],
    dy: mat[5]
  };
};

var isSvg = (gfx.renderer.toLowerCase().indexOf("svg") !== -1);
    
// Default marker used to draw points using "path" when styling=false.
// Then define styling through CSS: use stroke-linecap and stroke-linejoin
// to get "round" or "square" shapes. Use stroke-width to control the size
var _defaultMarker = SMS.fromJSON({
  type:    "simplemarkersymbol",
  style:   "square",
  // Unable to achieve square effect on Firefox and Safari with size 0.5.
  // Chrome worked though.
  // Users need to account for this 1px when setting stroke-width in CSS
  size:    20,
  xoffset: 0,
  yoffset: 0,
  angle:   0
}),
_typeMaps = {
  "picturemarkersymbol":    "image",
  "picturefillsymbol":      "path",
  "simplefillsymbol":       "path",
  "simplelinesymbol":       "path",
  "cartographiclinesymbol": "path",
  "textsymbol":             "text"
},
_pathStyles = {
  "square":  1,
  "cross":   1,
  "x":       1,
  "diamond": 1,
  "target":  1
};

var VectorGroup = declare(Accessor, {
  declaredClass: "esri.views.2d.VectorGroup",
  
  //--------------------------------------------------------------------------
  //
  //  Lifecycle
  //
  //--------------------------------------------------------------------------
  
  constructor: function(properties) {
    this.id = generateID();

    this._transform = mat2d.create();
    this._projector = new Projector();
    
    this.vectors  = [];
    this.adding   = [];
    this.removing = [];
    this.updating = [];
  },
  
  //--------------------------------------------------------------------------
  //
  //  Public methods
  //
  //--------------------------------------------------------------------------
  
  applyState: function(state) {
    if (!this.transform) {
      return;
    }
    var tmp = mat2d.invert(this._transform, this.transform);
    mat2d.multiply(tmp, state.transformNoRotation, tmp);
    this.surface.setTransform(mat2d2GFXMatrix(tmp));
  },
  
  requestVectorDraw: function(vector) {
    // this.updating.push(vector);
    // this.requestDraw();
  },
  
  addVector: function(vector) {
    return this.addVectorAt(vector, this.vectors.length);
  },
  
  addVectorAt: function(vector, index) {
    index = Math.min(this.vectors.length, index);
    this.vectors.splice(index, 0, vector);
    vector.set({
      parent   : this,
      view : this.view
    });
    return vector;
  },
  
  removeVector: function(vector) {
    if (!this.vectors) {
      return vector;
    }
    var index = this.vectors.indexOf(vector);
    if (index > -1) {
      vector = this.vectors.splice(index, 1)[0];
      vector.set({
        parent:    null,
        view:  null
      });
      this._removeShape(vector);
    }
    return vector;
  },
  
  draw: function() {
    this._updateTransform();
    
    this.surface.openBatch();
    var vector, i, n;
    for (i = 0, n = this.vectors.length; i < n; i++) {
      vector = this.vectors[i];
      if (vector) {
        this.drawVector(vector);
      }
    }
    this.surface.closeBatch();
  },
  
  drawVector: function(vector, redraw) {
    var graphic = vector.graphic,
        extent  = vector.extent,
        shape   = vector.shape,
        gfxPainting = true,
        // dataAttrs = isSvg && this.dataAttributes,
        offsets, symbol, skipDraw,
        
        // Geometry to be used instead of graphic.geometry:
        // The projected geometry will be 102100 if graphic.geometry is 4326 
        // and the view is 102100.
        projectedGeometry = vector.projectedGeometry;
    
    // TODO
    // We got to be efficient about when we draw the shape AND symbolize
    // versus draw OR symbolize
    
    if (
      graphic.visible &&
      extent &&
      (offsets = this._intersects(this._map, extent, graphic.geometry._originOnly)) &&
      (symbol = gfxPainting ? vector.symbol : _defaultMarker)
     ) {
      
      // Update offsets
      if (
        vector.resolution !== this.resolution ||
        (!vector.offsets || (vector.offsets.join(",") !== offsets.join(",")))
      ) {
        vector.offsets = offsets;
      }
      else {
        // Skip drawing if the current offsets are identical to the 
        // calculated ones
        skipDraw = true;
      }
      
      if (!shape || redraw || !skipDraw) {
        var type = graphic.geometry.type,
            bgShape = vector.bgShape,
            // Use renderer only if layer styling is enabled 
            // AND the graphic does not have its own symbol 
            // Graphic's own symbol takes precedence over renderer!
            renderer = null, //TODO (gfxPainting && !graphic.symbol) ? this._getRenderer(graphic) : null,
            // TODO
            // Model this as Renderer.getSymbol returning CompositeSymbol
            // Or a subclass of CompositeSymbol: GraduatedSymbol
            bgFill = renderer && renderer.backgroundFillSymbol;
            
            vector.resolution = this.resolution;
  
        if (type === "point") {
          // Remove existing shape if the new shape is incompatible
          if (this._isInvalidShape(symbol, shape)) {
            this._removeShape(vector);
          }
          
          shape = vector.shape = this._drawPoint(
            this.surface,
            projectedGeometry || graphic.geometry,
            symbol,
            vector,
            offsets,
            renderer,
            graphic
          );
          
          gfxPainting && this._stylePoint(vector.shape, symbol, renderer, graphic);
        }
        else if (type === "multipoint") {
          this._drawMarkers(graphic, symbol, offsets, renderer);
          gfxPainting && this._symbolizeMarkers(graphic, symbol, renderer);
        }
        else {
          var markerSymbol, fillSymbol = symbol,
              group;

          // 1) What needs to be drawn?
          if (gfxPainting) {
            // Find fill and marker symbols
            markerSymbol = (symbol.isInstanceOf(MarkerSymbol)) ? symbol : null;
            fillSymbol = markerSymbol ? bgFill : symbol;
          }
          
          // Background fill will be drawn in a group that is added to the
          // DOM before the primary symbol. When bg fill is defined, the 
          // primary symbol is usually a marker.
          if (fillSymbol && (fillSymbol === bgFill)) {
            group = this._bgGroup;
          }
          
          // 2) Make sure we have the DOM structure we want
          if (bgShape && !group) {
            // If we're not using background group, it means we dont need
            // the bg shape 
            this._removeBgShape(vector);
          }
          
          // 3) Draw Path
          if (fillSymbol) {
            // Invalidate current shape if necessary
            if (!group && this._isInvalidShape(fillSymbol, shape)) {
              this._removeShape(vector, false);
            }
            
            shape = this._drawShape(
              projectedGeometry || graphic.geometry,
              offsets,
              group || this.surface,
              group ? bgShape : vector.shape
            );
            
            this._styleShape(shape, fillSymbol, !bgFill && renderer, graphic, vector);
            
            vector[group ? "bgShape" : "shape"] = shape;
          }
          
          // 4) Draw Marker
          /*if (markerSymbol) {
            // Invalidate current shape if necessary
            if (this._isInvalidShape(markerSymbol, graphic._shape)) {
              this._removeShape(graphic, false);
            }
            
            // TODO
            // Don't draw marker if it does not intersect map extent
            shp = this._drawPoint(
              this._div,
              graphic.geometry.centroid,
              markerSymbol,
              graphic._shape,
              offsets,
              renderer,
              graphic
            );
            
            this._symbolizePoint(shp, markerSymbol, renderer, graphic);
            
            graphic._shape = shp;
          }*/
        }
          
        shape.getNode().vector = vector;
      }
    }
    else if (shape) {
      this._removeShape(vector);
    }
  },
  
  _intersects: function(map, extent, originOnly) {
    
    // TODO
    return [0];
    
    // "_originOnly" is an internal flag to draw this geometry only over its
    // originating frame. Used when drawing map's zoom box, 
    // and when drawing using extent tool.
    
//     var mapSR = map.spatialReference,
//         extentSR = extent.spatialReference,
//         useGeo = (
//           mapSR && extentSR && 
//           !mapSR.equals(extentSR) && 
//           mapSR._canProject(extentSR) && 
//           extentSR.wkid === 4326
//         );

//     if (this._wrap && !originOnly) {
//       var offsets = [], world = map._getFrameWidth(), info = this._srInfo,
//           partsGE, mapExtent = map._clip ? map._getAvailExtent() : map.extent, 
//           partsME,
//           g, m, f, gl, ml, fl, gePart, mePart, filtered = [],
//           partwise = extent._partwise;
      
//       if (useGeo) {
//         mapExtent = map.geographicExtent;
//         info = extentSR._getInfo();
//       }
      
//       partsME = mapExtent._getParts(info);

//       // If the geometry is a line or polygon, we need to
//       // perform "partwise" extent comparison with map extent.
//       // This will avoid a situation where a polygon split by
//       // the 180deg and "moved" a little bit will result in
//       // identical xmin and xmax (before calling normalizeCM),
//       // thereby not repeated the right amount.
//       // See Polygon/Polyline::getExtent for "_partwise" creation
//       if (partwise && partwise.length) {
//         partsGE = [];
//         for (g = 0, gl = partwise.length; g < gl; g++ ) {
//           partsGE = partsGE.concat(partwise[g]._getParts(info));
//         }
//       }
//       else {
//         partsGE = extent._getParts(info);
//       }

//       for (g = 0, gl = partsGE.length; g < gl; g++) {
//         gePart = partsGE[g];
        
//         for (m = 0, ml = partsME.length; m < ml; m++) {
//           mePart = partsME[m];
          
//           if (mePart.extent.intersects(gePart.extent)) {
//             for (f = 0, fl = gePart.frameIds.length; f < fl; f++) {
//               offsets.push( (mePart.frameIds[0] - gePart.frameIds[f]) * world );
//             }
//           }
//         }
//       }
      
//       // remove duplicate offsets
//       for (g = 0, gl = offsets.length; g < gl; g++) {
//         f = offsets[g];
//         if (offsets && offsets.indexOf(f) === g) {
//           filtered.push(f);
//         }
//       }

//       //console.log("offsets = ", (filtered.length) ? filtered : null);
//       return (filtered.length) ? filtered : null;
//     }
//     else {
//       return (useGeo ? map.geographicExtent : map.extent).intersects(extent) ? [ 0 ] : null;
//     }
  },
  
  _isInvalidShape: function(symbol, shape) {
    // GFX Shape Types: SMS (circle, path), PMS (image), TS(text)
    // SYM Type Styles: SMS (circle, square, cross, x, diamond, target), PMS, TS
    var shpType = shape && shape.shape && shape.shape.type,
        symType = symbol && symbol.type,
        symStyle = symbol && symbol.style;
    
    if (symType) {
      symStyle = _typeMaps[symType] || symStyle;
    }

    if (_pathStyles[symStyle]) {
      symStyle = "path";
    }
    //console.log(shpType, symStyle);
    
    return !!(shpType && symStyle && (shpType !== symStyle));
  },
  
  _removeShape: function(vector, removeBg) {
    var shape = vector.shape,
        node  = shape && shape.getNode();
        
    if (shape) {
      shape.removeShape();
      // for chrome and firefox, those browsers using svg as renderer engine,
      // shape.removeShape() doesn't remove the related <pattern> tags.
      // shape.destroy() does this job.
      shape.destroy();
    }
    
    vector.shape = vector.offsets = null;
    
    // Remove background shape
    if (removeBg !== false) {
      this._removeBgShape(vector);
    }
    
    if (node) {
      node.e_graphic = null;
      
// TODO YCA: integrate events 
//       if (!isCanvas) {
//         this.onGraphicNodeRemove({
//           graphic: graphic,
//           node: node
//         });
//       }
    }
  },
  
  _removeBgShape: function(vector) {
    // Removes shape used to draw backgroundFillSymbol
    var bgShape = vector.bgShape,
        node    = bgShape && bgShape.getNode();
    
    if (bgShape) {
      bgShape.removeShape();
      bgShape.destroy();
    }
    
    vector.bgShape = null;
    
    if (node) {
      node.e_graphic = null;
      
// TODO YCA: integrate events 
//       if (!isCanvas) {
//         this.onGraphicNodeRemove({
//           graphic: graphic,
//           node: node
//         });
//       }
    }
  },
  
  // TODO: Get rid of dojo matrix
  _drawPoint: function(container, geometry, symbol, vector, offsets, renderer, graphic) {
  
    var type = symbol.type,
        // TODO YCA: offsets
        coords = vec2.fromValues(geometry.x, geometry.y),
        point = vec2.transformMat2d(coords, coords, this.transform),
        px = Math.round(point[0]),
        py = Math.round(point[1]),
        currentShape = vector.shape,
        shape, transforms = [],

        // Calculate rotation angle if defined by the renderer
        rotation = (renderer && renderer.rotationInfo) ? 
          renderer.getRotationAngle(graphic) : 
          null,

        // Calculate proportional symbol size if defined by the renderer
        hasPropSym = !!vector.size, // (renderer && renderer.proportionalSymbolInfo),
        
        size = hasPropSym ?
          coreScreenUtils.pt2px(vector.size[0]) : 
          null;
    
    // Visualize these transforms in this order:
    // 1. Rotate symbol by symbol.angle
    // 2. Offset using xoffset, yoffset
    // 3. Rotate by rotationExpression
   
    if (rotation) {
      transforms.push(gfxMatrix.rotategAt(rotation, point));
    }

    if (symbol.xoffset !== 0 || symbol.yoffset !== 0) {
      transforms.push(gfxMatrix.translate(symbol.xoffset, -symbol.yoffset));
    }
    
    if (symbol.angle !== 0) {
      transforms.push(gfxMatrix.rotategAt(symbol.angle, point));
    }
    
    if (type === "simplemarkersymbol") {
      var style = symbol.style,
          half,
          round = Math.round;

      size = hasPropSym ? size : symbol.size;

      var w, h;

      switch (style) {
        case SMS.STYLE_SQUARE:
        case SMS.STYLE_CROSS:
        case SMS.STYLE_X:
        case SMS.STYLE_DIAMOND:
          half = isNaN(size) ? 16 : (size / 2);
          
          shape = this._drawPath(
            container, 
            currentShape, 
            this._smsToPath(
              SMS, style, 
              px, py, 
              round(px - half), round(px + half), 
              round(py - half), round(py + half)
            )
          );
          break;
          
        case SMS.STYLE_TARGET:
          var halfWidth = symbol._targetWidth / 2,
              halfHeight = symbol._targetHeight / 2;
          
          shape = this._drawPath(
            container, 
            currentShape, 
            this._smsToPath(
              SMS, style, 
              px, py, 
              round(px - halfWidth), round(px + halfWidth), 
              round(py - halfHeight), round(py + halfHeight), 
              symbol._spikeSize
            )
          );
          break;
          
        case SMS.STYLE_PATH:
          shape = this._drawPath(container, currentShape, symbol.path, true);
          
          var bbox = shape.getBoundingBox(),
              scaleMat = this._getScaleMatrix(bbox, size);
          
          if (scaleMat.xx !== 1 || scaleMat.yy !== 1) {
            transforms.push(
              gfxMatrix.scaleAt(scaleMat.xx, scaleMat.yy, point)
            );
          }
          
          transforms.push(
            // dx and dy aligns the center of the given path with screen x/y
            gfxMatrix.translate(
              -(bbox.x + (bbox.width / 2)) + px, 
              -(bbox.y + (bbox.height / 2)) + py
            )
          );
          
          break;
          
        default:
          half = isNaN(size) ? 16 : (size / 2);
          shape = this._drawCircle(container, currentShape, {cx:px, cy:py, r:half});
      }
    }
    else if (type === "shieldlabelsymbol") {
      w = symbol.width;
      h = symbol.height;
      var group = container.createGroup(),
          imageShape = container.createImage({
            x:      px - (w/2), 
            y:      py - (h/2), 
            width:  w, 
            height: h, 
            src:    symbol.url
          });
      
      group.add(imageShape);
      
      if(symbol.font != null) {
        var textX = px,
            textY = py + 0.2 * symbol.getHeight(), // correction to text middle line
            textShape = container.createText({
              type:   "text", 
              text:   symbol.text, 
              x:      textX, 
              y:      textY, 
              align:  "middle", 
              decoration: symbol.decoration, 
              rotated:    symbol.rotated, 
              kerning:    symbol.kerning
            });
        
        textShape.setFont(symbol.font);
        textShape.setFill(symbol.color);
        group.add(textShape);
      }
      shape = group;
    }
    else if (type === "picturemarkersymbol") {
      w = hasPropSym ? size : symbol.width;
      h = hasPropSym ? size : symbol.height;
          
      shape = this._drawImage(
        container, 
        currentShape, 
        {
          x:      px - (w/2), 
          y:      py - (h/2), 
          width:  w, 
          height: h, 
          src:    symbol.url
        }
      );
    }
    else if (type === "textsymbol") {
      shape = this._drawText(
        container, 
        currentShape, 
        { 
          type: "text", 
          text: symbol.text, 
          x:    px, 
          y:    py, 
          align:      symbol.getSVGAlign(), 
          decoration: symbol.decoration || (symbol.font && symbol.font.decoration), 
          rotated:    symbol.rotated, 
          kerning:    symbol.kerning 
        }
      );
      
      if (isSvg) {
        var node = shape.getNode(),
            baseline = symbol.getSVGBaseline(),
            shift = symbol.getSVGBaselineShift();
        
        // NOTE: IE 9 and 10 do not honor any of this.
        if (node) {
          node.setAttribute("dominant-baseline", baseline);
          
          if (shift) {
            node.setAttribute("baseline-shift", shift);
          }
        }
      }

      //glyph
      // var text = { type:"text", text:symbol.text, x:px, y:py, align:symbol.align, decoration:symbol.decoration, rotated:symbol.rotated, kerning:symbol.kerning };
      // if (symbol.font instanceof dojox.gfx.VectorFont) {
      //   shape = this._drawGlyph(this._div, _shape, text, symbol);
      // }
      // else {
      //   shape = this._drawText(this._div, _shape, text);
      // }
    }

    shape.setTransform(gfxMatrix.multiply(transforms));
    
    shape._wrapOffsets = offsets; // used by _VertexMover.js, _Box.js to figure out offset to use for ghost lines
    
    return shape;
  },
  
  
  _drawShape: function(geometry, offsets, container, shape) {
    var type = geometry.type,
        //map = this._map,
        //me = this.renderInfo.extent,
        //mw = this.renderInfo.width,
        //mh = this.renderInfo.height,
        //_mvr = map.__visibleRect,
        projector = this._projector,
        paths = [], i, il;

    if (type === "extent") {
      geometry = Polygon.fromExtent(geometry);
      type = geometry.type;
    }
    
    if (type === "polyline" || type === "polygon") {
      for (i = 0, il = offsets.length; i < il; i++) {
        paths = paths.concat(projector.toScreenPath(geometry, offsets[i]));
      }

      shape = this._drawPath(container, shape, paths);

      if (this._rendererLimits) {
        if (type === "polyline") {
          this._clipPolyline(shape, geometry);
        }
        else {
          this._clipPolygon(shape, geometry);
        }
      }
    }

    return shape;
  },
  
  _drawRect: function(/*dojox.gfx.Surface/Group*/ container, /*dojox.gfx.Shape*/ shape, /*dojox.gfx.Rect*/ rect) {
    return shape ? shape.setShape(rect) : container.createRect(rect);
  },

  _drawImage: function(container, shape, image) {
    return shape ? shape.setShape(image) : container.createImage(image);
  },

  _drawCircle: function(container, shape, circle) {
    return shape ? shape.setShape(circle) : container.createCircle(circle);
  },
  
  _drawPath: function(container, shape, /*String[]*/ path, isPathString) {
    path = isPathString ? path : path.join(" ");

    return shape ? 
            shape.setShape(path) : 
            container.createPath(path);
  },
  
  _smsToPath: function(SMS, style, x, y, xMh, xPh, yMh, yPh, spikeSize) {
    switch (style) {
      case SMS.STYLE_SQUARE:
        return ["M", xMh + "," + yMh, xPh + "," + yMh, xPh + "," + yPh, xMh + "," + yPh, "Z"];
      case SMS.STYLE_CROSS:
        return ["M", x + "," + yMh, x + "," + yPh, "M", xMh + "," + y, xPh + "," + y];
      case SMS.STYLE_X:
        return ["M", xMh + "," + yMh, xPh + "," + yPh, "M", xMh + "," + yPh, xPh + "," + yMh];
      case SMS.STYLE_DIAMOND:
        return ["M", x + "," + yMh, xPh + "," + y, x + "," + yPh, xMh + "," + y, "Z"];
      case SMS.STYLE_TARGET:
        return [
          "M", xMh + "," + yMh, xPh + "," + yMh, xPh + "," + yPh, xMh + "," + yPh, xMh + "," + yMh,
          "M", (xMh - spikeSize) + "," + y, xMh + "," + y,
          "M", x + "," + (yMh - spikeSize), x + "," + yMh,
          "M", (xPh + spikeSize) + "," + y, xPh + "," + y,
          "M", x + "," + (yPh + spikeSize), x + "," + yPh
        ];
    }
  },
  
  _stylePoint: function(shape, symbol, renderer, graphic) {
    
    var type = symbol.type;
    
    if (type === "shieldlabelsymbol" || type === "picturemarkersymbol") {
      return;
    }

    var stroke, fill,
        hasColorInfo = (renderer && renderer.colorInfo);

    if (type === "textsymbol") {
      shape.setFont(symbol.font).setFill(gfxUtils.getFill(symbol));

      //glyph
      // if (! (symbol.font instanceof dojox.gfx.VectorFont)) {
      //   shape.setFont(symbol.font).setFill(symbol.get("fill"));
      // }
    }
    else {
      stroke = gfxUtils.getStroke(symbol);
      fill = gfxUtils.getFill(symbol);

      if (type === "simplemarkersymbol") {
        shape
          .setFill(hasColorInfo ? renderer.getColor(graphic) : fill)
          .setStroke(stroke);
      }
    }
  },
  
  _styleShape: function(shape, fillSymbol, renderer, graphic, vector) {
    var stroke = gfxUtils.getStroke(fillSymbol),
        fill = gfxUtils.getFill(fillSymbol),
        type = fillSymbol.type,
        color, strokeColor, fillColor,

        // Calculate proportional symbol size if defined by the renderer
        lineWidth = (renderer && renderer.proportionalSymbolInfo) ? 
          renderer.getSize(graphic) : 
          null;

    // Color scaling:
    // - applied to stroke for lines
    // - applied to fill for polygons

    if (vector.color && type !== "picturefillsymbol") {
      // It is assumed that getColor *will* return a color.
      // If it doesn't, then we have a problem in renderer color implementation
      color = vector.color;

      if (type.indexOf("linesymbol") !== -1) {
        strokeColor = color;
      }
      // toCss check identifies dojo.Color instances and hence 
      // excludes pattern fills: see SimpleFillSymbol.getFill
      else if (fill && fill.toCss) {
        fillColor = color;
      }
    }

    shape.setStroke(
            (lineWidth == null && !strokeColor) ?
              stroke : 

               // Throw away object: not cached at fillSymbol._stroke
              lang.mixin(
                {}, stroke, 
                lineWidth && { width: lineWidth }, 
                strokeColor && { color: strokeColor }
              )
          )
         .setFill(fillColor || fill);
    
    if (isSvg) {
      shape.rawNode.setAttribute("vector-effect", "non-scaling-stroke");
    }
  },
  
  _updateTransform: function() {
    var t = this.transform = this.transform || mat2d.create();
    var res = this.resolution;
    var size = vec2.fromValues(this.view.width * 0.5, this.view.height * 0.5);
    var scale = vec2.fromValues(1 / res, - 1 / res);
    var cen = vec2.fromValues(-this.x, -this.y);
    var rad = common.toRadian(this.view.rotation);

    mat2d.identity(t);
    mat2d.translate(t, t, size);
    mat2d.scale(t, t, scale);
    mat2d.translate(t, t, cen);
    mat2d.rotate(t, t, rad);
    
    t[4] = Math.round(t[4]);
    t[5] = Math.round(t[5]);
    this._projector.set({
      resolution: res,
      transform: t
    });
  }
  
});

return VectorGroup;

});
