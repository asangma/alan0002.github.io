define([
  "../../../../core/declare",

  "../../support/PreallocArray",

  "../../lib/glMatrix",
  "../../support/eventUtils",

  "../../webgl-engine/lib/Util",
  "../../webgl-engine/materials/HUDMaterial"
], function (
  declare,
  PreallocArray,
  glMatrix,
  eventUtils,
  Util, HUDMaterial
) {

    var debug = false;
    var debug_accelerationStruct = false;

    var mat4d = glMatrix.mat4d;
    var vec3d = glMatrix.vec3d;
    var vec2d = glMatrix.vec2d;
    var vec4d = glMatrix.vec4d;
    var lerp = Util.lerp;
    var VertexAttrConstants = Util.VertexAttrConstants;

    var visFlag = "VISIBILITY_LABELMANAGER";

    var corners = [
      [ -1, -1 ],
      [ 1, -1 ],
      [ 1, 1 ],
      [ -1, 1 ]
    ];

    var posWorld = vec4d.create();
    var posView = vec4d.create();
    var posProj = vec4d.create();
    var posProjNorm = vec4d.create();

    var anchor = vec2d.create();
    var scrOffs = vec2d.create();

    var posTmp1 = vec4d.create();
    var posTmp2 = vec4d.create();
    var posTmp3 = vec4d.create();
    var viewDirInNormalPlane = vec3d.create();
    var screenCoords = vec2d.create();
    var posViewTmp = vec4d.create();

    var tmpNormal = vec3d.create();
    var tmpDirection = vec3d.create();
    var viewTemp = mat4d.create();
    var tmpLabelDirOrtho = vec3d.create();
    var posWorldTmp = vec4d.create();

    var visObjects = new PreallocArray(100);

    var debugCanvas2d;

    function sortPosView(a, b) {
      return b.posView - a.posView;
    }

    var FreeList = function(constructor) {
      this.constructor = constructor;
      this.list = [];
      this.currentIndex = 0;
    };
    FreeList.prototype.alloc = function() {
      if (this.currentIndex>=this.list.length) {
        this.list.push(this.constructor.apply(this, arguments));
      }
      return this.list[this.currentIndex++];
    };
    FreeList.prototype.freeAll = function(obj) {
      this.currentIndex = 0;
    };
    var labelInfoPool = new FreeList(function(){
        return {labelGraphics: null, c3dGraphic:null, positions: [vec2d.create(),vec2d.create(),vec2d.create(),vec2d.create()],
          xMin:0.0, xMax:0.0, yMin:0.0, yMax:0.0,
          posView: 0.0, layerView: null, labelId:0};
      }
    );


    var LabelManager = declare(null, {
      constructor: function (_view) {
        this.layerViews = [];
        
        this.view = _view;
        this.stage = _view._stage;

        this._deconflictTimeoutId = 0;
        this._cameraListener = eventUtils.on(_view, "navigation.targetViewChanged", this._targetViewChanged, this);

        this._viewReadyWatcher = _view.watch("ready", function(ready) {
          if (!ready && this._deconflictTimeoutId) {
            clearTimeout(this._deconflictTimeoutId);
            this._deconflictTimeoutId = 0;
          }
        }.bind(this));
      },

      destroy: function () {
        this._cameraListener.remove();

        if (this._deconflictTimeoutId !== 0) {
          clearTimeout(this._deconflictTimeoutId);
          this._deconflictTimeoutId = 0;
        }

        this._viewReadyWatcher.remove();
      },

      addSceneServiceLayerView: function (v) {
        this.layerViews.push(v);
      },

      setDirty: function() {
        this._deconflictLabelsTimeout(10);
      },

      setInitialLabelGraphicState: function(labelGraphic) {
        // Clear the visibility flag so that the label is not shown until it
        // has been initially deconflicted.
        labelGraphic.setVisibilityFlag(visFlag, false);
      },

      removeSceneServiceLayerView: function (v) {
        var i = this.layerViews.indexOf(v);
        if (i >= 0) {
          this.layerViews.splice(i, 1);
        }
      },

      _drawPoly: function (ctx, positions, color) {
        var i;
        ctx.beginPath();
        ctx.lineWidth = "1";
        ctx.strokeStyle = color;
        // path
        ctx.moveTo(positions[0][0], positions[0][1]);
        for (i = 1; i < 4; i++) {
          ctx.lineTo(positions[i][0], positions[i][1]);
          ctx.stroke();
        }
        ctx.lineTo(positions[0][0], positions[0][1]);
        ctx.stroke();
        ctx.closePath();
      },
      _tmp_vec: vec2d.create(),
      _doesIntersectExistingPoly: function (labelInfo) {
        var vecTmp = this._tmp_vec;
        var poly1 = labelInfo.positions;
        var alreadyAdded = {};
        var x, y,labels,labelIdx,label,poly2,polyPlane,polyTest,side,p1,p2,p3,dir,tmp,dot, i, j, d, dOwn;
        for (x = Math.floor(labelInfo.xMin / this._accBinsSizeX); x <= Math.floor(labelInfo.xMax / this._accBinsSizeX); x++) {
          if (x < 0 || x >= this._accBinsNumX) {
            continue;
          }
          for (y = Math.floor(labelInfo.yMin / this._accBinsSizeY); y <= Math.floor(labelInfo.yMax / this._accBinsSizeY); y++) {
            if (y < 0 || y >= this._accBinsNumY) {
              continue;
            }
            labels = this._accBins[x][y];
            outer: for (labelIdx = 0; labelIdx < labels.length; labelIdx++) {
              label = labels.data[labelIdx];
              if (alreadyAdded[label.labelId] != null) {
                continue;
              }
              alreadyAdded[label.labelId] = true;

              poly2 = label.positions;
              this._accNumTests++;

              //try to find a dividing plane
              for (side = 0; side < 2; side++) {
                polyPlane = side === 0 ? poly1 : poly2;
                polyTest = side === 0 ? poly2 : poly1;

                inner: for (i = 0; i < 4; i++) {
                  p1 = polyPlane[i];
                  p2 = polyPlane[(i + 1) % 4];

                  p3 = polyPlane[(i + 2) % 4];

                  vecTmp[0] = p2[0] - p1[0];
                  vecTmp[1] = p2[1] - p1[1];

                  dir = vec2d.normalize(vecTmp);
                  tmp = dir[1];
                  dir[1] = dir[0];
                  dir[0] = -tmp;

                  //inline ov vec2d.dot
                  d = dir[0] * p1[0] + dir[1] * p1[1];

                  dOwn = dir[0] * p3[0] + dir[1] * p3[1] < d;

                  for (j = 0; j < 4; j++) {
                    p3 = polyTest[j];
                    dot = dir[0] * p3[0] + dir[1] * p3[1];
                    if ((!!dOwn && dot < d) || (!dOwn && dot > d)) {
                      continue inner; //this is not a dividing plane
                    }
                  }
                  continue outer; //dividing plane found, no intersection
                }
              }
              return true; //no dividing plane found -> intersection
            }
          }
        }
        return false;
      },

      _accBinsNumX: 15,
      _accBinsNumY: 20,
      _accBinsSizeX: 0.0,
      _accBinsSizeY: 0.0,
      _accBins: null,
      _accNumTests: 0,

      _initBins: function (sizeX, sizeY) {
        var x, y, row;
        if (this._accBins == null) {
          this._accBins = [];
          for (x = 0; x < this._accBinsNumX; x++) {
            this._accBins.push([]);
            row = this._accBins[this._accBins.length - 1];
            for (y = 0; y < this._accBinsNumY; y++) {
              row.push(new PreallocArray(10));
            }
          }
        }
        for (x = 0; x < this._accBinsNumX; x++) {
          for (y = 0; y < this._accBinsNumY; y++) {
            this._accBins[x][y].clear();
          }
        }
        this._accBinsSizeX = sizeX / this._accBinsNumX;
        this._accBinsSizeY = sizeY / this._accBinsNumY;
        this._accNumTests=0;
      },

      _addToBins: function (labelInfo) {
        //one label can fit into multiple bins
        var x, y;
        for (x = Math.floor(labelInfo.xMin / this._accBinsSizeX); x <= Math.floor(labelInfo.xMax / this._accBinsSizeX); x++) {
          if (x<0 || x>=this._accBinsNumX ) {
            continue;
          }
          for (y = Math.floor(labelInfo.yMin / this._accBinsSizeY); y <= Math.floor(labelInfo.yMax / this._accBinsSizeY); y++) {
            if (y<0 || y>=this._accBinsNumY ) {
              continue;
            }

            this._accBins[x][y].push(labelInfo);
          }
        }
      },

      _accDrawDebug: function (ctx) {
        var positions = [vec2d.create(),vec2d.create(),vec2d.create(),vec2d.create()];

        var totalShownLabels = 0;

        var x, y,
            labels, xMin, xMax, yMin, yMax;

        for (x = 0; x < this._accBinsNumX; x++) {
          for (y = 0; y < this._accBinsNumY; y++) {
            labels = this._accBins[x][y];

            totalShownLabels+=labels.length;

            xMin = x*this._accBinsSizeX;
            xMax = (x+1)*this._accBinsSizeX;
            yMin = y*this._accBinsSizeY;
            yMax = (y+1)*this._accBinsSizeY;

            positions[0][0] = xMin;
            positions[0][1] = yMin;
            positions[1][0] = xMax;
            positions[1][1] = yMin;
            positions[2][0] = xMax;
            positions[2][1] = yMax;
            positions[3][0] = xMin;
            positions[3][1] = yMax;

            ctx.fillText(labels.length.toFixed(),xMin+5,yMin+15);

            this._drawPoly(ctx, positions,"blue");
          }
        }
        ctx.fillText("total totalShownLabels: "+totalShownLabels,70,40);
      },

      _targetViewChanged: function() {
        this._deconflictLabelsTimeout();
      },

      _deconflictLabelsTimeout: function(time) {
        time = time || 200;

        if (this._deconflictTimeoutId === 0) {
          this._deconflictTimeoutId = setTimeout(this._deconflictLabels.bind(this), time);
        }
      },

      _deconflictLabels: function () {
        var view = this.view;

        this._deconflictTimeoutId = 0;

        labelInfoPool.freeAll();

        var camera = view.navigation.targetCamera;
        var viewMatrix = camera.viewMatrix;

        var cotFovXHalf = 1 / Math.tan(camera.fovX / 2);
        var proj = camera.projectionMatrix;
        var fullWidth = camera.fullWidth;
        var fullHeight = camera.fullHeight;

        if (debug || debug_accelerationStruct) {
          if (debugCanvas2d == null) {
            debugCanvas2d = document.createElement("canvas");
            debugCanvas2d.setAttribute("id", "canvas2d");
            this.view.surface.parentNode.appendChild(debugCanvas2d);
          }

          debugCanvas2d.setAttribute("width", camera.width);
          debugCanvas2d.setAttribute("height", camera.height);
          debugCanvas2d.setAttribute("style", "position:absolute;left:0px;top:0px;display:block;pointer-events:none;");

          var c = document.getElementById("canvas2d");

          var ctx = c.getContext("2d");
          ctx.clearRect(0, 0, camera.width, camera.height);
          ctx.font="8px Arial";

        }

        visObjects.clear();
        var changedLayerViews = {};

        var binsInited = false;

        for (var kIdx = 0; kIdx < this.layerViews.length; kIdx++) {
          var lv = this.layerViews[kIdx];

          if (lv.layerLabelsEnabled==null || !lv.layerLabelsEnabled()){
            continue;
          }

          if (lv.getCanvas3DGraphics==null || lv.getCanvas3DGraphicsKeys==null) {
            continue;
          }

          if (!binsInited) {
            this._initBins(fullWidth, fullHeight);
            binsInited = true;
          }

          var canvas3DGraphics = lv.getCanvas3DGraphics();

          //forIn is not optimized by chrome, therefore we iterate using keys
          //to reduce memory allocations, keys are cached
          var canvas3DGraphicsKeys = lv.getCanvas3DGraphicsKeys();
          for (var kIdx2=0; kIdx2<canvas3DGraphicsKeys.length; kIdx2++) {
            var c3dGraphic = canvas3DGraphics[canvas3DGraphicsKeys[kIdx2]];

            if (c3dGraphic._labelGraphics == null || c3dGraphic._labelGraphics.length < 1) {
              continue;
            }

            if (!c3dGraphic.areVisibilityFlagsSet(undefined, visFlag)) {
              continue;
            }

            var labelGraphic = c3dGraphic._labelGraphics[0];
            var object3d = labelGraphic.stageObject;

            var geometryRecord0 = object3d.getGeometryRecord(0);
            if (geometryRecord0==null) {
              continue;
            }
            var mat = geometryRecord0.materials[0];
            if (mat==null || !(mat instanceof HUDMaterial) || geometryRecord0.origin==null) {
              continue;
            }

            //to get the exact same behaviour as the shader we also need to use the origin offsets
            view = viewMatrix;
            var objCenter = object3d.getCenter();
            var originVec =  geometryRecord0.origin.vec3;
            vec4d.set4(objCenter[0]- originVec[0], objCenter[1]- originVec[1], objCenter[2]- originVec[2], 1.0, posWorld);

            mat4d.translate(view, originVec, viewTemp);
            view = viewTemp;
            mat4d.multiplyVec4(view, posWorld, posView);

            var centerOffset = geometryRecord0.geometry.getData().getVertexAttr()[VertexAttrConstants.AUXPOS1];
            if (centerOffset!=null && centerOffset.data[3]<0.0) {
              for (var i=0; i<3; i++) {
                posView[i]+=centerOffset.data[i];
              }
            }

            mat4d.multiplyVec4(proj, posView, posProj);
            vec4d.scale(posProj, 1.0 / Math.abs(posProj[3]), posProjNorm);

            vec2d.set2(lerp(0, fullWidth, 0.5 + 0.5 * posProjNorm[0]),
                       lerp(0, fullHeight, 0.5 + 0.5 * posProjNorm[1]),
                       screenCoords);

            var outside = posProjNorm[0] < -1.0 || posProjNorm[1] < -1.0 || posProjNorm[2] < -1.0 || posProjNorm[0] >= 1.0 || posProjNorm[1] >= 1.0;

            if (outside) {
              var changed = false;
              for (var lIdx=0; lIdx<c3dGraphic._labelGraphics.length; lIdx++) {
                changed = changed||c3dGraphic._labelGraphics[lIdx].setVisibilityFlag(visFlag, false);
              }
              if (changed) {
                changedLayerViews[lv]=true;
              }
            }
            else {

              var matParams = mat.getParams();
              var size = geometryRecord0.geometry.getData().getVertexAttr()[VertexAttrConstants.SIZE].data;
              vec2d.subtract(matParams.anchorPos, [0.5, 0.5], anchor); // shader"s anchor has range 0..1 whereas here we need -0.5..0.5
              vec2d.scale(matParams.screenOffset, 0.5, scrOffs);

              var labelInfo = labelInfoPool.alloc();

              if (matParams.direction) {
                //TODO untested
                var normal = vec3d.set3(labelGraphic.geometry.normal[0], labelGraphic.geometry.normal[1], labelGraphic.geometry.normal[2], tmpNormal);
                var camDir = vec3d.normalize(vec3d.subtract(camera.eye, camera.center, posTmp1), posTmp1);
                var direction = vec3d.normalize(vec3d.set(matParams.direction, tmpDirection));

                var labelDir, labelDirOrtho;
                var offY = 0;

                vec3d.scale(direction, vec3d.dot(direction, camDir), viewDirInNormalPlane);
                vec3d.subtract(camDir, viewDirInNormalPlane, viewDirInNormalPlane);
                vec3d.normalize(viewDirInNormalPlane);
                var angleToNormal = Math.abs(vec3d.dot(viewDirInNormalPlane, normal));
                var angleToDirection = Math.abs(vec3d.dot(camDir, direction));
                if (angleToDirection < 0.985 && angleToNormal < 0.500) {
                  if (angleToNormal < 0.422) {
                    // upright
                    labelDir = direction;
                    labelDirOrtho = normal;
                    offY = 0.5;
                  } else {
                    // following view angle
                    labelDir = direction;
                    labelDirOrtho = tmpLabelDirOrtho;
                    vec3d.cross(direction, viewDirInNormalPlane, labelDirOrtho);
                    offY = vec3d.dot(labelDirOrtho, normal) / 2;
                  }
                } else {
                  // flat
                  labelDir = direction;
                  labelDirOrtho = vec3d.normalize(vec3d.cross(normal, direction));
                }

                var screen2world = vec3d.dist(camera.eye, objCenter) / cotFovXHalf / camera.width * 2.0;
                var minWorldSize = screen2world * matParams.screenMinMaxSize[0];
                var maxWorldSize = screen2world * matParams.screenMinMaxSize[1];

                var scale;
                if (matParams.worldScale) {
                  scale = 1.0;
                  if ((minWorldSize > 0) && (minWorldSize > size[1])) {
                    scale = minWorldSize / size[1];
                  }
                  if ((maxWorldSize > 0) && (size[1] > maxWorldSize)) {
                    scale = maxWorldSize / size[1];
                  }

                } else {
                  scale = posProj[3] * 0.5 / fullWidth;
                }
                for (i = 0; i < 4; i++) {
                  vec4d.set(posWorld, posWorldTmp);
                  vec3d.add(posWorldTmp, vec3d.scale(labelDir, corners[i][0] * size[0] * scale, posTmp2));
                  vec3d.add(posWorldTmp, vec3d.scale(labelDirOrtho, (corners[i][1] + offY) * size[1] * scale, posTmp3));

                  mat4d.multiplyVec4(view, posWorldTmp, posTmp1);
                  var posProjTmp = mat4d.multiplyVec4(proj, posTmp1, posTmp2);

                  vec4d.scale(posProjTmp, 1.0 / Math.abs(posProjTmp[3]), posProjTmp);
                  labelInfo.positions[i][0] = lerp(0, fullWidth, 0.5 + 0.5 * posProjTmp[0]);
                  labelInfo.positions[i][1] = fullHeight - lerp(0, fullHeight, 0.5 + 0.5 * posProjTmp[1]);
                }
              }
              else {
                if (!matParams.worldScale) {
                  var dist = vec3d.dist(camera.eye, posWorld);

                  for (i = 0; i < 4; i++) {
                    labelInfo.positions[i][0] = screenCoords[0] + (0.5 * corners[i][0] - anchor[0]) * size[0] + scrOffs[0];
                    labelInfo.positions[i][1] = fullHeight - screenCoords[1] + (0.5 * corners[i][1] + anchor[1]) * size[1] - scrOffs[1];
                  }
                }
                else {
                  screen2world = vec3d.dist(camera.eye, objCenter) / cotFovXHalf / camera.width * 2.0;
                  minWorldSize = screen2world * matParams.screenMinMaxSize[0];
                  maxWorldSize = screen2world * matParams.screenMinMaxSize[1];

                  scale = 1.0;
                  if ((minWorldSize > 0) && (minWorldSize > size[1])) {
                    scale = minWorldSize / size[1];
                  }
                  if ((maxWorldSize > 0) && (size[1] > maxWorldSize)) {
                    scale = maxWorldSize / size[1];
                  }


                  for (i = 0; i < 4; i++) {
                    posViewTmp[0] = posView[0]+(0.5 * corners[i][0] - anchor[0]) * size[0] * scale;
                    posViewTmp[1] = posView[1]+(0.5 * corners[i][1] - anchor[1]) * size[1] * scale;

                    posProjTmp = mat4d.multiplyVec4(proj, posViewTmp, posTmp1);

                    vec4d.scale(posProjTmp, 1.0 / Math.abs(posProjTmp[3]), posProjTmp);
                    labelInfo.positions[i][0] = lerp(0, fullWidth, 0.5 + 0.5 * posProjTmp[0]) + scrOffs[0];
                    labelInfo.positions[i][1] = fullHeight - lerp(0, fullHeight, 0.5 + 0.5 * posProjTmp[1]) - scrOffs[1];
                  }
                }
              }

              dist = posView[2];

              //offset if already visible. reduces flickering.
              if (c3dGraphic.areVisibilityFlagsSet(visFlag, undefined)) {
                dist *= 0.7;
              }

              labelInfo.labelId = visObjects.length;
              labelInfo.xMin = Number.MAX_VALUE;
              labelInfo.yMin = Number.MAX_VALUE;
              labelInfo.xMax = -Number.MAX_VALUE;
              labelInfo.yMax = -Number.MAX_VALUE;
              for (var pIdx=0; pIdx<4; pIdx++) {
                labelInfo.xMin = Math.min(labelInfo.positions[pIdx][0], labelInfo.xMin);
                labelInfo.yMin = Math.min(labelInfo.positions[pIdx][1], labelInfo.yMin);
                labelInfo.xMax = Math.max(labelInfo.positions[pIdx][0], labelInfo.xMax);
                labelInfo.yMax = Math.max(labelInfo.positions[pIdx][1], labelInfo.yMax);
              }
              labelInfo.labelGraphics = c3dGraphic._labelGraphics;
              labelInfo.c3dGraphic = c3dGraphic;
              labelInfo.posView = dist;
              labelInfo.layerView = lv;
              visObjects.push(labelInfo);
            }
          }
        }



        visObjects.sort(sortPosView);

        for (kIdx = 0; kIdx < visObjects.length; kIdx++) {
          var obj = visObjects.data[kIdx];
          changed = false;
          lv = obj.layerView;
          if (!this._doesIntersectExistingPoly(obj)) {

            this._addToBins(obj);

            if (debug) {
              this._drawPoly(ctx, obj.positions,"green");
            }
            for (i=0; i<obj.labelGraphics.length; i++) {
              changed = changed||obj.labelGraphics[i].setVisibilityFlag(visFlag, true);
            }

          }
          else {
            if (debug) {
              this._drawPoly(ctx, obj.positions,"red");
            }
            for (i=0; i<obj.labelGraphics.length; i++) {
              changed = changed||obj.labelGraphics[i].setVisibilityFlag(visFlag, false);
            }

          }
          if (changed && obj.c3dGraphic.isDraped()) {
            changedLayerViews[lv] = true;
          }



        Object.keys(changedLayerViews).forEach(
          function(lv){if (lv.emit) {lv.emit("draped-data-change");}}
        );


      }

        if (debug_accelerationStruct) {
          this._accDrawDebug(ctx);
          ctx.fillText("total visible labels: "+keys.length,70,50);
          ctx.fillText("total numTests: "+this._accNumTests,70,30);
        }
      }
    });

    return LabelManager;
  }
);
