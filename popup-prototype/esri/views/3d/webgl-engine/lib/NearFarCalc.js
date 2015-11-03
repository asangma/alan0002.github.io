// jshint bitwise:false, forin:false
define([
  "./Util",
  "./gl-matrix"
], function (Util, glMatrix){

  var vec3 = glMatrix.vec3;
  var vec4d = glMatrix.vec4d;
  var mat4 = glMatrix.mat4;
  var mat4d = glMatrix.mat4d;

  var NearFarCalc = function NearFarHelper() {

    var contentArr = [];
    var nearArr = [];
    var farArr = [];

    var nearSpecialArr = [];
    var farSpecialArr = [];

    var boundingInfoHelper = new BoundingInfoHelper();
    var tmpProjViewMat = mat4d.create();

    this.calculateSceneNearFar = function(camera, content, visibleContent) {

      mat4d.multiply(camera.projectionMatrix, camera.viewMatrix, tmpProjViewMat);

      var view = camera.viewMatrix;
      var view2 = view[2], view6 = view[6], view10 = view[10], view14 = view[14];

      var ii = 0;
      var i;

      var renderGeo;

      //heuristics to find small subset of objects for near&far calc:
      //1. calc near&farplane per visible object based on bounding sphere
      for (i in content) {
        renderGeo = content[i];

        if (renderGeo.displayedIndexRange!=null && renderGeo.displayedIndexRange.length===0) {
          continue;
        }

        if (!renderGeo.castShadow) {
          continue;
        }

        if (!visibleContent.get(renderGeo.idx)) {
          continue;
        }

        var radius = renderGeo.bsRadius;
        var center = renderGeo.center;

        var z = view2 * center[0] + view6 * center[1] + view10 * center[2] + view14;

        var z0 = z - radius;
        var z1 = z + radius;

        contentArr[ii] = renderGeo;
        nearArr[ii] = -z1;
        farArr[ii] = -z0;

        ++ii;
      }

      //2. find best possible case, might be too tight
      var bestNear = Number.MAX_VALUE;
      var bestFar = -Number.MAX_VALUE;

      if (ii === 0) {
        return [bestNear, bestFar];
      }

      for (i = 0; i < ii; ++i) {
        if (nearArr[i] > bestFar) {
          bestFar = nearArr[i];
        }

        if (nearArr[i] > 2.0 && farArr[i] < bestNear) {
          bestNear = farArr[i];
        }
      }

      //3. find objects further away than 50% from the tight fit
      //   == subset where exact intersections are performed
      var bestNear2 = Math.max(bestNear * 0.5, 2.0);
      var bestFar2 = bestFar * 2.0;

      var iii = 0;
      var iiii = 0;

      for (i = 0; i < ii; ++i) {
        if (nearArr[i] < bestNear) {
          if (nearArr[i] >= bestNear2) {
            bestNear = nearArr[i];
          }
          else {
            nearSpecialArr[iii++] = i;
          }
        }
        if (farArr[i] > bestFar) {
          if (farArr[i] <= bestFar2) {
            bestFar = farArr[i];
          }
          else {
            farSpecialArr[iiii++] = i;
          }
        }
      }

      //no objects outside 50% of aggressive fit?
      //just return an conservative fit
      //in the worst case this has one cascade more than the best solution
      if (iii === 0 && iiii === 0) {
        return [bestNear, bestFar];
      }

      nearSpecialArr.length = iii;
      farSpecialArr.length = iiii;

      //sort for early culling.
      //ToDO: is this optimal when many objects behind camera?
      nearSpecialArr.sort(function(a, b) {
        if (nearArr[a] < nearArr[b]) {
          return -1;
        }

        if (nearArr[a] > nearArr[b]) {
          return 1;
        }

        return 0;
      });

      farSpecialArr.sort(function(a, b) {
        if (farArr[a] < farArr[b]) {
          return 1;
        }

        if (farArr[a] > farArr[b]) {
          return -1;
        }

        return 0;
      });

      var nearFarCtx = {
        "bestNear" : bestNear,
        "bestFar" : bestFar,
        "bestNear2" : bestNear2,
        "bestFar2" : bestFar2
      };

      var boundingInfo;

      //calc exact intersection of candidates with view frustum
      boundingInfoHelper.init(camera, tmpProjViewMat, nearFarCtx);

      for (i = 0; i < iii; ++i) {
        if (nearArr[nearSpecialArr[i]] < nearFarCtx.bestNear) {
          renderGeo = contentArr[nearSpecialArr[i]];
          boundingInfo = renderGeo.boundingInfo;
          boundingInfoHelper.includeNearBoundingInfoRec(boundingInfo, renderGeo.transformation);
        }
      }

      for (i = 0; i < iiii; ++i) {
        if (farArr[farSpecialArr[i]] > nearFarCtx.bestFar) {
          renderGeo = contentArr[farSpecialArr[i]];
          boundingInfo = renderGeo.boundingInfo;
          boundingInfoHelper.includeFarBoundingInfoRec(boundingInfo, renderGeo.transformation);
        }
      }

      return [nearFarCtx.bestNear, nearFarCtx.bestFar];
    };
  };

  function BoundingInfoHelper() {
    var plane0x = 0.0, plane0y = 0.0, plane0z = 0.0, plane0w = 0.0,
      plane1x = 0.0, plane1y = 0.0, plane1z = 0.0, plane1w = 0.0,
      plane2x = 0.0, plane2y = 0.0, plane2z = 0.0, plane2w = 0.0,
      plane3x = 0.0, plane3y = 0.0, plane3z  = 0.0, plane3w = 0.0;

    var view2 = 0.0, view6 = 0.0, view10 = 0.0, view14 = 0.0;

    var vp;

    var nearFarCtx;

    var clippingHelper = new ClippingHelper();

    var tmpPlanes = new Array(6);

    for (var i = 0; i < 6; ++i) {
      tmpPlanes[i] = vec4d.create();
    }

    var tmpCenter = vec3.create();

    this.init = function(camera, vp_, nearFarCtx_) {
      camera.computeFrustumPlanes(tmpPlanes);

      var view = camera.viewMatrix;

      plane0x = tmpPlanes[0][0]; plane0y = tmpPlanes[0][1]; plane0z = tmpPlanes[0][2]; plane0w = tmpPlanes[0][3];
      plane1x = tmpPlanes[1][0]; plane1y = tmpPlanes[1][1]; plane1z = tmpPlanes[1][2]; plane1w = tmpPlanes[1][3];
      plane2x = tmpPlanes[2][0]; plane2y = tmpPlanes[2][1]; plane2z = tmpPlanes[2][2]; plane2w = tmpPlanes[2][3];
      plane3x = tmpPlanes[3][0]; plane3y = tmpPlanes[3][1]; plane3z = tmpPlanes[3][2]; plane3w = tmpPlanes[3][3];

      view2 = view[2]; view6 = view[6]; view10 = view[10]; view14 = view[14];

      vp = vp_;

      nearFarCtx = nearFarCtx_;

      clippingHelper.init(nearFarCtx_);
    };

    this.includeNearBoundingInfoRec = function(boundingInfo, transf) {
      var radius = boundingInfo.getBSRadius();
      var center = boundingInfo.getCenter();

      mat4.multiplyVec3(transf, center, tmpCenter);

      var sx = transf[0] * transf[0] + transf[4] * transf[4] + transf[8]  * transf[8];
      var sy = transf[1] * transf[1] + transf[5] * transf[5] + transf[9]  * transf[9];
      var sz = transf[2] * transf[2] + transf[6] * transf[6] + transf[10] * transf[10];
      var scale = Math.sqrt(Math.max(Math.max(sx, sy), sz));

      var cx = tmpCenter[0];
      var cy = tmpCenter[1];
      var cz = tmpCenter[2];

      radius *= scale;

      //bounding sphere outside frustum planes?
      if (plane0x * cx + plane0y * cy + plane0z * cz  + plane0w > radius) {
        return;
      }

      if (plane1x * cx + plane1y * cy + plane1z * cz  + plane1w > radius) {
        return;
      }

      if (plane2x * cx + plane2y * cy + plane2z * cz  + plane2w > radius) {
        return;
      }

      if (plane3x * cx + plane3y * cy + plane3z * cz  + plane3w > radius) {
        return;
      }

      var z = view2 * cx + view6 * cy + view10 * cz + view14;
      var z0 = z - radius;
      var z1 = z + radius;

      if (-z0 < 2.0) {
        return;
      }

      if (-z1 >= nearFarCtx.bestNear) {
        return;
      }

      if (-z1 > nearFarCtx.bestNear2) {
        nearFarCtx.bestNear = -z1;
        return;
      }

      //subdivide when bounding sphere to big
      if (radius > 100) {
        //subdivide octree node
        var children = boundingInfo.getChildren();

        if (children !== undefined) {
          for (var i = 0; i < 8; ++i) {
            if (children[i] !== undefined) {
              this.includeNearBoundingInfoRec(children[i], transf);
            }
          }

          return;
        }
      }

      clippingHelper.intersectFrustumAABB(vp, transf, boundingInfo.getBBMin(), boundingInfo.getBBMax());
    };

    this.includeFarBoundingInfoRec = function(boundingInfo, transf) {
      var radius = boundingInfo.getBSRadius();
      var center = boundingInfo.getCenter();

      mat4.multiplyVec3(transf, center, tmpCenter);

      var sx = transf[0] * transf[0] + transf[4] * transf[4] + transf[8]  * transf[8];
      var sy = transf[1] * transf[1] + transf[5] * transf[5] + transf[9]  * transf[9];
      var sz = transf[2] * transf[2] + transf[6] * transf[6] + transf[10] * transf[10];
      var scale = Math.sqrt(Math.max(Math.max(sx, sy), sz));

      var cx = tmpCenter[0];
      var cy = tmpCenter[1];
      var cz = tmpCenter[2];

      radius *= scale;

      if (plane0x * cx + plane0y * cy + plane0z * cz  + plane0w > radius) {
        return;
      }

      if (plane1x * cx + plane1y * cy + plane1z * cz  + plane1w > radius) {
        return;
      }

      if (plane2x * cx + plane2y * cy + plane2z * cz  + plane2w > radius) {
        return;
      }

      if (plane3x * cx + plane3y * cy + plane3z * cz  + plane3w > radius) {
        return;
      }

      var z = view2 * cx + view6 * cy + view10 * cz + view14;
      var z0 = z - radius;

      if (-z0 <= nearFarCtx.bestFar) {
        return;
      }

      if (-z0 < nearFarCtx.bestFar2) {
        nearFarCtx.bestFar = -z0;
        return;
      }

      if (radius > 100) {
        var children = boundingInfo.getChildren();

        if (children !== undefined) {
          for (var i = 0; i < 8; ++i) {
            if (children[i] !== undefined) {
              this.includeFarBoundingInfoRec(children[i], transf);
            }
          }

          return;
        }
      }

      clippingHelper.intersectFrustumAABB(vp, transf, boundingInfo.getBBMin(), boundingInfo.getBBMax());
    };
  }

  function ClippingHelper() {
    var TRIANGLES = [[0, 1, 3], [2, 3, 1], [1, 5, 2], [6, 2, 5], [5, 4, 6], [7, 6, 4], [4, 0, 7], [3, 7, 0], [3, 2, 7], [6, 7, 2], [4, 5, 0], [1, 0, 5]];

    var nearFarCtx;

    var clipP = new Array(8);

    for (var i = 0; i < 8; ++i) {
      clipP[i] = vec4d.create();
    }

    var mvp = mat4.create();

    this.init = function(nearFarCtx_) {
      nearFarCtx = nearFarCtx_;
    };

    this.intersectFrustumAABB = function(vp, transf, bbMin, bbMax) {
      mat4.multiply(vp, transf, mvp);
      var i, j;
      var depth;

      for (i = 0; i < 8; ++i) {
        var p = clipP[i];

        var x = i === 0 || i === 3 || i === 4 || i === 7 ? bbMin[0] : bbMax[0];
        var y = i === 0 || i === 1 || i === 4 || i === 5 ? bbMin[1] : bbMax[1];
        var z = i < 4 ? bbMin[2] : bbMax[2];

        //transform to clipspace
        p[0] = mvp[0] * x + mvp[4] * y + mvp[8] * z + mvp[12];
        p[1] = mvp[1] * x + mvp[5] * y + mvp[9] * z + mvp[13];
        p[2] = mvp[2] * x + mvp[6] * y + mvp[10] * z + mvp[14];
        p[3] = mvp[3] * x + mvp[7] * y + mvp[11] * z + mvp[15];
      }

      for (i = 0; i < 12; ++i) {
        var v0 = clipP[TRIANGLES[i][0]];
        var v1 = clipP[TRIANGLES[i][1]];
        var v2 = clipP[TRIANGLES[i][2]];

        var clippedVertices = clipTriangle(v0, v1, v2);

        var allInvisible = true;

        for (j = 0; j < clippedVertices.length; ++j) {
          depth = clippedVertices[j][3];

          if (depth >= 2.0) {
            allInvisible = false;
            break;
          }
        }

        if (allInvisible) {
          continue;
        }

        for (j = 0; j < clippedVertices.length; ++j) {
          depth = clippedVertices[j][3];

          if (depth < nearFarCtx.bestNear) {
            nearFarCtx.bestNear = depth;
          }

          if (depth > nearFarCtx.bestFar) {
            nearFarCtx.bestFar = depth;
          }
        }
      }
    };

    var clipTriangle = function(v0, v1, v2) {
      var inside = function (v, i) {
        if (i === 0) {
          return v[0] >= -v[3];
        }
        else if (i === 1) {
          return v[1] >= -v[3];
        }
        else if (i === 2) {
          return v[0] <= v[3];
        }
        else if (i === 3) {
          return v[1] <= v[3];
        }

        Util.assert(false);
      };

      var intersect = function (s, e, i) {
        var ss = 0.0;

        if (i === 0) {
          ss = (-s[3] - s[0]) / (e[0] - s[0] + e[3] - s[3]);
        }
        else if (i === 1) {
          ss = (-s[3] - s[1]) / (e[1] - s[1] + e[3] - s[3]);
        }
        else if (i === 2) {
          ss = (s[3] - s[0]) / (e[0] - s[0] - e[3] + s[3]);
        }
        else if (i === 3) {
          ss = (s[3] - s[1]) / (e[1] - s[1] - e[3] + s[3]);
        }

        return vec4d.lerp(s, e, ss, vec4d.create());
      };

      var outputList = [v0, v1, v2];

      for (var i = 0; i < 4; ++i) {
        var inputList = outputList;
        outputList = [];

        for (var j = 0; j < inputList.length; ++j) {
          var s = inputList[j];
          var e = inputList[(j + 1) % inputList.length];

          if (inside(e, i)) {
            if (!inside(s, i)) {
              outputList.push(intersect(s, e, i));
            }

            outputList.push(e);
          } else if (inside(s, i)) {
            outputList.push(intersect(s, e, i));
          }
        }
      }

      return outputList;
    };
  }

  return NearFarCalc;
});
