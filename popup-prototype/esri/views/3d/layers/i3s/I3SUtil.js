/* jshint forin:false */
define([
    "require",

    "../../lib/glMatrix",
    "../../support/earthUtils",
    "../../support/projectionUtils",
    "../../support/PromiseLightweight",

    "../graphics/Canvas3DSymbolCommonCode",

    "../../webgl-engine/Stage",
    "../../webgl-engine/materials/Material",
    "../../webgl-engine/lib/Geometry",
    "../../webgl-engine/lib/GeometryUtil",
    "../../webgl-engine/lib/Object3D",
    "../../webgl-engine/lib/Layer",
    "../../webgl-engine/lib/BufferVectorMath",
    "../../webgl-engine/lib/Util"],
  function (relativeRequire,
            glMatrix, earthUtils, projectionUtils, PromiseLightweight,
            Canvas3DSymbolCommonCode,
            Stage, Material, Geometry, GeometryUtil, Object3D, Layer, BufferVectorMath, Util) {
    // Static utility functions for I3S loading

    var matrix2frustumPlanes = Util.matrix2frustumPlanes;
    var vec4d = glMatrix.vec4d;
    var vec3d = glMatrix.vec3d;
    var vec3 = glMatrix.vec3;
    var mat4d = glMatrix.mat4d;
    var assert = Util.assert;

    var tmpVec1 = vec3d.create();
    var tmpVec2 = vec3d.create();
    var tmpMbs = vec4d.create();

    var DBGLOD = false;


    var I3SUtil = {
      DDS_ENCODING_STRING: "image/vnd-ms.dds",
      BROWSER_SUPPORTED_IMAGE_ENCODING_STRINGS: ["image/jpeg", "image/png"],

      getNodeURL: function (baseURL, nodeID) {
        return baseURL + "nodes/" + nodeID + "/";
      },
      addTrailingSlash: function (url) {
        if (url[url.length - 1] != "/") {
          url += "/";
        }
        return url;
      },
      concatUrl: function (url, concat) {
        var url1 = url.split("/");
        var url2 = concat.split("/");
        var url3 = [];
        for (var i = 0, l = url1.length; i < l; i++) {
          if (url1[i] == "..") {
            url3.pop();
          } else if (url1[i] == "." || (url1[i] === "" && i > 1)) {
            continue;
          } else {
            url3.push(url1[i]);
          }
        }
        for (i = 0, l = url2.length; i < l; i++) {
          if (url2[i] == "..") {
            url3.pop();
          } else if (url2[i] == "." || url2[i] === "") {
            continue;
          } else {
            url3.push(url2[i]);
          }
        }
        return url3.join("/");
      },
      // Extract WKID from an EPSG url, eg.: "http://www.opengis.net/def/crs/EPSG/0/4326" -> 4326
      extractWkid: function(crs) {
        return crs && parseInt(crs.substring(crs.lastIndexOf("/") + 1, crs.length), 10);
      },

      getAppropriateTextureEncoding: function(encodings, useCompressedTextures) {
        if (Array.isArray(encodings)) {
          // if we want to use compressed textures, try to find DDS encoding
          if (useCompressedTextures) {
            var ddsIdx = encodings.indexOf(I3SUtil.DDS_ENCODING_STRING);
            if (ddsIdx > -1) {
              return ddsIdx;
            }
          }

          // otherwise, pick any encoding that is supported by the browser
          for (var encodingIdx = 0; encodingIdx < encodings.length; encodingIdx++) {
            if (I3SUtil.BROWSER_SUPPORTED_IMAGE_ENCODING_STRINGS.indexOf(encodings[encodingIdx]) > -1) {
              return encodingIdx;
            }
          }
          throw new Error("Could not find appropriate texture encoding (among " + encodings.toString() + ")");
        }
        else {
          // encodings is not an array -> only one encoding available -> return -1
          return -1;
        }
      },

      findIntersectingNodes: function(aabb, srAabb, node, srIndex, nodeIndex, resultArray) {
        if (node == null) { return; }
        // project mbs to aabb coordinate system.
        var projected_mbs = tmpMbs;
        projectionUtils.mbsToMbs(node.mbs, srIndex, projected_mbs, srAabb);
        // if mbs intersects aabb, add to results and traverse children
        if (this.intersectBoundingBoxWithMbs(aabb, projected_mbs) !== 0) {

          resultArray.push(node);

          var child_count = (node.children) != null? node.children.length : 0;
          for (var i=0; i<child_count; i++) {
            var child = nodeIndex[node.children[i].id]
            this.findIntersectingNodes(aabb, srAabb, child, srIndex, nodeIndex, resultArray);
          }
        }
      },

      intersectBoundingBoxWithMbs: function(aabb, mbs) {
        var cx = mbs[0];
        var cy = mbs[1];
        var cz = mbs[2];
        var radius = mbs[3];

        // compute squared outer distance
        var dist2 = 0;
        var d;
        if (cx < aabb[0]) { d=aabb[0]-cx; dist2 += d*d; }
        if (cy < aabb[1]) { d=aabb[1]-cy; dist2 += d*d; }
        if (cz < aabb[2]) { d=aabb[2]-cz; dist2 += d*d; }
        if (cx > aabb[3]) { d=cx-aabb[3]; dist2 += d*d; }
        if (cy > aabb[4]) { d=cy-aabb[4]; dist2 += d*d; }
        if (cz > aabb[5]) { d=cz-aabb[5]; dist2 += d*d; }

        if (dist2 > radius * radius) {
          return 0; // completely outside
        }
        else if (dist2 > 0)
        {
          return 1; // center outside, partially inside
        }
        else {
          // center inside, compute inner distance
          var distInner = Infinity;
          if (cx-aabb[0]<distInner) { distInner = cx-aabb[0]; }
          if (cy-aabb[1]<distInner) { distInner = cy-aabb[1]; }
          if (cz-aabb[2]<distInner) { distInner = cz-aabb[2]; }
          if (aabb[3]-cx<distInner) { distInner = aabb[3]-cx; }
          if (aabb[4]-cy<distInner) { distInner = aabb[4]-cy; }
          if (aabb[5]-cz<distInner) { distInner = aabb[5]-cz; }
          if (distInner > radius) {
            return 2; //completely inside
          } else {
            return 1; // partially inside
          }
        }
      },

      ViewportQueries: function (indexSR, renderCoordsHelper, viewData, maxDist, extent, disableLod, nodeIDFilter, debugLodRankEnabled, debugLodRank, screenspaceErrorBias, errorMetricToUse, elevationProvider, elevationInfo) {
        var fp = []; // frustum planes
        for (var i = 0; i < 8; ++i) {
          fp[i] = vec4d.create();
        }
        matrix2frustumPlanes(viewData.viewMatrix, viewData.projectionMatrix, fp);

        var engineSR = renderCoordsHelper.spatialRef;
        this.engineSR = engineSR;

        // = 1 / (Math.tan(this.fovX / 2) / this.width) = this.width/Math.tan(this.fovX / 2)
        var _screenSizeFactor = 1 / viewData.perPixelRatio;
        var _camPos = viewData.eye;
        var _center = viewData._center;
        var _camDir = vec3.subtract(_center, _camPos, [0,0,0]);
        vec3.normalize(_camDir);

        var tmpPoint = { x:0, y:0, z:0, spatialReference:indexSR};

        var computedMbs = function(node) {
          if (!node.computedMbs)
          {
              node.computedMbs = vec4d.create();
              node.computedMbs[3] = -1; // invalidate
          }
          var mbs = node.computedMbs;
          if (mbs[3] < 0) {
            mbs[0] = node.mbs[0];
            mbs[1] = node.mbs[1];
            mbs[2] = node.mbs[2]
            mbs[3] = node.mbs[3];            
            if (elevationProvider) {
              tmpPoint.x = mbs[0];
              tmpPoint.y = mbs[1];
              tmpPoint.z = mbs[2];
              mbs[2] = Canvas3DSymbolCommonCode.computeElevation(elevationProvider, tmpPoint, elevationInfo);
            }
            projectionUtils.mbsToMbs(mbs, indexSR, mbs, engineSR);
          }
          return mbs;
        }


        this.isNodeVisible = function (nodeRef) {
          if (nodeIDFilter) {
            var inFilter = false;
            for (var j = 0; (j < nodeIDFilter.length) && !inFilter; j++) {
              if (nodeIDFilter[j].indexOf(nodeRef.id.toString()) === 0) {
                inFilter = true;
              }
            }
            if (!inFilter) {
              return false;
            }
          }

          var mbs = computedMbs(nodeRef);

          return isMBSinExtent(mbs) && isMBSVisible(mbs);
        };

        var isMBSinExtent = function (engineMBS) {
          if (!extent) {
            return true;
          }
          return I3SUtil.intersectBoundingBoxWithMbs(extent, engineMBS) != 0;
        };

        var isMBSVisible = function (engineMBS) {
          var cx = engineMBS[0];
          var cy = engineMBS[1];
          var cz = engineMBS[2];
          var radius = engineMBS[3];

          if (fp[0][0] * cx + fp[0][1] * cy + fp[0][2] * cz + fp[0][3] > radius) {
            return false;
          }
          if (fp[1][0] * cx + fp[1][1] * cy + fp[1][2] * cz + fp[1][3] > radius) {
            return false;
          }
          if (fp[2][0] * cx + fp[2][1] * cy + fp[2][2] * cz + fp[2][3] > radius) {
            return false;
          }
          if (fp[3][0] * cx + fp[3][1] * cy + fp[3][2] * cz + fp[3][3] > radius) {
            return false;
          }

          var nearDist = fp[4][0] * cx + fp[4][1] * cy + fp[4][2] * cz + fp[4][3];

          return (nearDist < radius) && (-nearDist - radius < maxDist);
        };
        this.isMBSVisible = isMBSVisible;

        var calcScreenSpaceSize = function(nodeRef, sizeWS)
        {
          var mbs = computedMbs(nodeRef);
          var r = mbs[3];
          var dist = vec3d.dist2(mbs,_camPos) - r*r;
          if (dist < 0) {
            return 0.5*Number.MAX_VALUE;
          }
          return sizeWS / Math.sqrt(dist) * _screenSizeFactor;
        };

        this.calcScreenSpaceSize = calcScreenSpaceSize;

        var hasLOD = function (node) {
          if (disableLod === true) {
            return false;
          }

          //TODO actually use i3s 1.2 lod infos
          return node.lodSelection !== undefined || node.precision !== undefined;
        };

        this.hasLOD = hasLOD;

        var hasFeatures = function (node) {
          return (node.features != null && node.features.length > 0) || node.featureData != null;
        };

        this.hasFeatures = hasFeatures;

        var _tmp0 = [0,0,0];
        var _tmp1 = [0,0,0];
        var _tmp2 = [0,0,0];
        var _tmp3 = [0,0,0];

        var getDistancePlanarMode = function(camera_gp, node_center, node_radius) {

          var dx = camera_gp[0] - node_center[0];
          var dy = camera_gp[1] - node_center[1];
          var dz = camera_gp[2] - node_center[2];
          var d2 = dx+dx + dy*dy;
          if (d2 <= node_radius*node_radius) {
            // inside node circle: height above node
            return Math.abs(dz);
          } else {
            // outside node circle: distance to circle
            var dPlanar = Math.sqrt(d2) - node_radius;
            return Math.sqrt(dz*dz + dPlanar*dPlanar);
          }
        };

        var getDistanceGlobeMode = function(camera_gp, node_center, node_radius) {

          var node_height = vec3.length(node_center);
          var camera_height_above_node = vec3.length(camera_gp) - node_height;

          vec3.scale(camera_gp, vec3.dot(camera_gp, node_center)/vec3.length2(camera_gp), _tmp0);
          var d2 = vec3.dist2(node_center, _tmp0);

          if (d2 <= node_radius*node_radius) {
            return Math.abs(camera_height_above_node);
          } else {
            //based on c++ code from runtime

                                                        // HAL_3D::Vector3d N = p_scene_node->get_center_ep();
                                                        // N.normalize();
            var N = vec3.scale(node_center, 1/node_height, _tmp0);

            var r = node_radius;                        // double r = p_scene_node->get_radius();
            var R = node_height;                        // double R = EARTH_RADIUS;
            // compute center of circle (C)
            var circle_center_dis = r * r / 2.0 / R;    // double circle_center_dis = r * r / 2.0 / R;
            var C = vec3.scale(N, (R - circle_center_dis), _tmp1);
                                                        // HAL_3D::Vector3d C = N * (R - circle_center_dis);
            var P = camera_gp;                          // HAL_3D::Vector3d P = draw_queue.m_vCameraPos;
            // project camera position on circle plane (Q)
            var delta = vec3.subtract(P,C, _tmp2);      // HAL_3D::Vector3d delta = P - C;
            var QC = vec3.subtract(delta, vec3.scale(N, vec3.dot(N,delta),_tmp3), _tmp2);
                                                        // HAL_3D::Vector3d QC = delta - N * (N * delta);
            // nearest point on circle (K)
            var K = vec3.add(C, vec3.scale(QC, r/vec3.length(QC), _tmp2), _tmp2);
                                                        // HAL_3D::Vector3d K = C + QC / QC.length() * r;

                                                        // HAL_3D::Vector3d PK = P - K;
            var d_PK = vec3.dist(P,K);                  // double d_PK = PK.length();

            // increase distance for high cameras with flat viewing angle
                                                        // current_node_showd_res = tan(0.5 * fov * HAL_3D::Math::fDeg2Rad) * d_PK * 2.0 / height;
            if (camera_height_above_node >= 200000)     // if (camera_height >= 200000)
            {
              var PK = vec3.subtract(P,K, _tmp1);       // HAL_3D::Vector3d PK = P - K;
              var cosalpha = vec3.dot(PK, N) / vec3.length(PK);
                                                        // float cosalpha = PK * N / PK.length();
              if (cosalpha < 0.08)
              {
                cosalpha = 0.0001;
              }
              d_PK /= cosalpha;                         // current_node_showd_res /= cosalpha;
            }
            //var screenSpaceRelative = (2 * d * Math.tan(viewData.fov / 2) ) / viewData.height;
            return d_PK;
          }

        };

        var getDistance = (engineSR === projectionUtils.SphericalRenderSpatialReference) ? getDistanceGlobeMode : getDistancePlanarMode;

        var isTooHighLOD = function (node) {
          if (debugLodRankEnabled) {
            if (debugLodRank == -1) {
              return false;
            }

            if (!node.features || node.features.length === 0) {
              return false;
            }

            return node.features[0].rank > debugLodRank;
          }

          if (node.lodSelection && node.lodSelection.length > 0) {

            if (hasFeatures(node) === false) {
              return false;
            }

            for (var lodMetricIdx = 0; lodMetricIdx < node.lodSelection.length; lodMetricIdx++) {
              var lodMetric = node.lodSelection[lodMetricIdx];

              if (node.dbgErrorS == null) {
                node.dbgErrorS = {};
              }

              if (errorMetricToUse!=null && lodMetric.metricType!=errorMetricToUse) {
                continue;
              }

              if (lodMetric.metricType == "screenSpaceRelative") {

                var node_mbs = computedMbs(node);

                //TODO: this code does NOT yet have the same behavior as the RT client!

                //most recent psudocode (Sep 14 2015) from beijing:
                /*
                 d = (node_center - camera) * camera_dir – node_raidus
                 screenSpaceRelative = q / p = (2 * d * tan(fov/2) ) / H
                 if (maxError > q/p > child.maxError) { render this node } else { render child }
                */
                //based on most recent pseudocode

                //var dCamDir = vec3.dot(vec3.subtract(node_center, _camPos), _camDir);
                //var d = dCamDir-node_radius;

                var d = getDistance(_camPos, node_mbs, node_mbs[3]);
                var screenSpaceRelative = 2 * d / _screenSizeFactor;

                if (DBGLOD) {
                  console.debug("----node id "+node.id);
                  console.debug("dist "+d);
                  console.debug("screenSpaceRelative "+screenSpaceRelative);
                  console.debug("lodMetric.maxError "+lodMetric.maxError);
                  if (lodMetric.maxError>screenSpaceRelative) {
                    console.debug("isTooHighLOD false");
                  }
                  else {
                    console.debug("isTooHighLOD true");
                  }
                }

                if (lodMetric.maxError>screenSpaceRelative) {
                  return false;
                }
                else {
                  return true;
                }

              }
              else if (lodMetric.metricType == "maxScreenThreshold") {
                var mbsSizeSS = calcScreenSpaceSize(node, node.mbs[3]); // sizeWS * _screenSizeFactor/ dist ; = sizeWS*view_width_in_pixel / (Math.tan(viewData.fovX / 2)*dist)
                return (mbsSizeSS * screenspaceErrorBias < lodMetric.maxError);
              }
              else if (lodMetric.metricType == "removedFeatureDiameter") {
                var errorS = calcScreenSpaceSize(node, lodMetric.maxError);
                return (errorS * screenspaceErrorBias < 10.0); //10 pixel error default
              }

            }

          }


          return false;
        };

        this.isTooHighLOD = isTooHighLOD;

        this.isChosenLod = function (node, nodeParent, isTooHighLODNode, isTooHighLODParent) {

          if (debugLodRankEnabled) {
            if (debugLodRank == -1) {
              return true;
            }

            return node.features[0].rank == debugLodRank;
          }


          if (node.lodSelection && node.lodSelection.length > 0) {
            var tooHigh = isTooHighLODNode !=null? isTooHighLODNode: isTooHighLOD(node);
            var tooHighParent = !nodeParent ? false : (isTooHighLODParent!=null? isTooHighLODParent : isTooHighLOD(nodeParent));

            return ( (tooHigh || !node.children) && !tooHighParent);
          }

          return true;
        };

        this.distToPOI = function(nodeRef, poi) {
          var mbs = computedMbs(nodeRef);
          return vec3d.dist(mbs, poi) - mbs[3];
        };

      },

      recomputeNormals: function (indexArrays, vertexArrays) {
        var subtractBufferVector = BufferVectorMath.Vec3Compact.subtract;
        var numTriangles = indexArrays.map(function (o) {
          return o.indices.position.length / 3;
        })
          .reduce(function (a, b) {
            return a + b;
          });
        var newNormals = new Float32Array(numTriangles * 3);
        var vertices = vertexArrays.position.data;

        var ni = 0;
        for (var compIdx = 0; compIdx < indexArrays.length; compIdx++) {
          var vInd = indexArrays[compIdx].indices.position;
          var nInd = new Uint32Array(vInd.length);
          for (var i = 0; i < vInd.length; i += 3) {
            subtractBufferVector(vertices, vInd[i] * 3, vertices, vInd[i + 1] * 3, tmpVec2, 0);
            subtractBufferVector(vertices, vInd[i] * 3, vertices, vInd[i + 2] * 3, tmpVec1, 0);
            vec3d.cross(tmpVec1, tmpVec2);
            vec3d.normalize(tmpVec1);
            var nii = ni / 3;
            newNormals[ni++] = tmpVec1[0];
            newNormals[ni++] = tmpVec1[1];
            newNormals[ni++] = tmpVec1[2];
            nInd[i] = nii;
            nInd[i + 1] = nii;
            nInd[i + 2] = nii;
          }
          indexArrays[compIdx].indices.normal = nInd;
        }
        vertexArrays.normal.data = newNormals;
      },

      makeNodeDebugVisualizer: function (stage, renderCoordsHelper, layerID) {
        var debugGeometry = new Geometry(GeometryUtil.createCylinderGeometry(1.0, 1.0, 64, [0, 0, 1], [0, 0, 0], false), "debugCylinder");
        var debugGeometrySphere = new Geometry(GeometryUtil.createSphereGeometry(1.0), "debugSphere");


        function makeMatParams(ambient) {
          return { ambient: ambient, diffuse: [0, 0, 0], transparent: true, opacity: 0.5, blendModeOneOne: false };
        }

        var debugMaterials = {};
        debugMaterials.red = new Material(makeMatParams([0.8, 0, 0]), "debugMaterialRed");
        debugMaterials.grey = new Material(makeMatParams([0.4, 0.4, 0.4]), "debugMaterialGrey");
        debugMaterials.brown = new Material(makeMatParams([0.2, 0.1, 0]), "debugMaterialBrown");
        debugMaterials.green = new Material(makeMatParams([0.0, 0.8, 0.0]), "debugMaterialGreen");
        debugMaterials.blue = new Material(makeMatParams([0.0, 0.0, 0.8]), "debugMaterialBlue");
        debugMaterials.yellow = new Material(makeMatParams([0.8, 0.8, 0.0]), "debugMaterialYellow");
        debugMaterials.magenta = new Material(makeMatParams([0.8, 0.0, 0.8]), "debugMaterialMagenta");

        for (var i in debugMaterials) {
          stage.add(Stage.ModelContentType.MATERIAL, debugMaterials[i]);
        }

        stage.add(Stage.ModelContentType.GEOMETRY, debugGeometry);
        var layer = new Layer(layerID + "_debug", {interaction: "IGNORED"}, layerID + "_debug");
        stage.add(Stage.ModelContentType.LAYER, layer);
        stage.addToViewContent([layer.getId()]);

        var node_center = vec3d.create();
        var trafo = mat4d.create();

        return {
          engineLayer: layer,
          added: {},
          show: function (node, indexSR, color) {
            var mbs = node.mbs;
            var computedMbs = node.computedMbs;

            var name = "node" + node.id + "dbg";
            vec3d.set(computedMbs, node_center);
            var r2 = computedMbs[3];

            if (r2>earthUtils.earthRadius/10 && renderCoordsHelper.spatialRef === projectionUtils.SphericalRenderSpatialReference) {
              //find intersection with earth
              //from http://stackoverflow.com/questions/23918737/sphere-sphere-intersection-and-circle-sphere-intersection
              //node_center = [];
              //projectionUtils.vectorToVector(node.mbs, indexSR, node_center, renderCoordsHelper.spatialRef);

              this.showWS(node_center,Math.max(r2*0.01,10000),color,name+"_center");

              var d = vec3.length(node_center);
              var r1 = earthUtils.earthRadius;

              if (r1+r2>d) {
                var x = (d*d+r1*r1-r2*r2)/(2.0*d);
                vec3.scale(node_center, x/d);
                //r_i = sqrt(r_1*r_1 - h*h*d*d)
                r2 = Math.sqrt(r1 * r1 - x*x);
              }
            }

            mat4d.identity(trafo);
            mat4d.scale(trafo, [ r2, r2, r2*0.05]);
            var mat = debugMaterials[color];
            assert(mat);


            var object = new Object3D({
              name: name,
              geometries: [debugGeometry],
              materials: [[mat]],
              transformations: [trafo],
              castShadow: false,
              idHint: name
            });


            projectionUtils.computeLinearTransformation(indexSR, mbs, trafo, renderCoordsHelper.spatialRef);

            if (node_center!=null) {
              trafo[12]=node_center[0];
              trafo[13]=node_center[1];
              trafo[14]=node_center[2];
            }

            object.setObjectTransformation(trafo);

            this._addToStage(object, name);
          },

          showWS: function (positionWS, size, color, name) {

            var trafo = mat4d.identity();
            mat4d.scale(trafo, [ size, size, size]);
            var mat = debugMaterials[color];
            assert(mat);

            var object = new Object3D({
              name: name,
              geometries: [debugGeometrySphere],
              materials: [[mat]],
              transformations: [trafo],
              castShadow: false,
              idHint: name
            });

            var transl = mat4d.identity();
            mat4d.translate(transl, positionWS);
            object.setObjectTransformation(transl);

            this._addToStage(object, name);
          },

          _addToStage: function(object, name) {
            stage.add(Stage.ModelContentType.OBJECT, object);
            this.engineLayer.addObject(object);

            var prev = this.added[name];
            if (prev !== undefined) {
              stage.remove(Stage.ModelContentType.OBJECT, prev.getId());
              this.engineLayer.removeObject(prev);
            }

            this.added[name] = object;
          },

          clear: function () {
            for (var objIdx in this.added) {
              var obj = this.added[objIdx];
              stage.remove(Stage.ModelContentType.OBJECT, obj.getId());
              this.engineLayer.removeObject(obj);
            }
            this.added = {};
          },

          dispose: function () {
            this.clear();
            for (var i in debugMaterials) {
              stage.remove(Stage.ModelContentType.MATERIAL, debugMaterials[i].getId());
            }
            stage.remove(Stage.ModelContentType.GEOMETRY, debugGeometry.getId());
            stage.remove(Stage.ModelContentType.LAYER, this.engineLayer.getId());
          }
        };
      },

      postData: function (url, data, type) {
        var xhr = new XMLHttpRequest();
        xhr.open("PUT", "/put.php" + url, true);
        xhr.setRequestHeader("Content-type", type);
        xhr.send(data);
      },

      queryAttributesFromFeatureLayer: function(featureLayer, featureId) {
        var promise = new PromiseLightweight.Promise();

        if (featureLayer) {
          var queryTaskUrl = featureLayer.url;
          relativeRequire(["../../../../tasks/support/Query", "../../../../tasks/QueryTask"],function(Query, QueryTask){
            var query = new Query();
            query.where = "1=1";
            query.objectIds = [featureId];
            query.outFields = [ "*" ];
            query.returnGeometry = false;
            var queryTask = new QueryTask(queryTaskUrl);
            queryTask.execute(query).then(function(res){
              if (!res || !res.features || (res.features.length < 1)) {
                promise.reject();
                return;
              }
              promise.done(res.features[0].attributes);
            },function(err){
              promise.reject(err);
            });
          });
        } else {
          promise.reject(new Error("Companion feature layer not present."));
        }
        return promise;
      },

      valueType2TypedArrayClassMap: {
        "Float32": Float32Array,
        "Float64": Float64Array,
        "UInt8": Uint8Array,
        "Int8": Int8Array,
        "UInt16": Uint16Array,
        "Int16": Int16Array,
        "UInt32": Uint32Array,
        "Int32": Int32Array
      },

      isValueType: function(valueType) { return I3SUtil.valueType2TypedArrayClassMap.hasOwnProperty(valueType); },
      getBytesPerValue: function(valueType) { return I3SUtil.isValueType(valueType) && I3SUtil.valueType2TypedArrayClassMap[valueType].BYTES_PER_ELEMENT; }
    };

    return I3SUtil;
  }
);