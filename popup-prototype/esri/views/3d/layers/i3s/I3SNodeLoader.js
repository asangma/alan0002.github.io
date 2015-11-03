/* jshint forin:false */
define(["../../../../core/declare",
    "dojo/_base/lang",
  "../../webgl-engine/lib/Util",
  "./I3SUtil",
  "./I3SAttributeReader",
  "../../support/PromiseLightweight",
  "../../support/projectionUtils",
  "../../lib/glMatrix"],
  function(declare, lang, Util, I3SUtil, I3SAttributeReader, promise, projectionUtils, glMatrix) {

  var assert = Util.assert;

  return declare(null, {

    constructor : function(_streamDataSupplier, _bundleLoadedCallback,
        _url, queueFunctionCall, debugVis, renderCoordsHelper, indexSR,
        _calcDesiredTextureLOD,_imageIsPartOfTextureBundle, _matId2Meta, _texId2Meta, useCompressedTextures, warningEvent,
        defaultGeometrySchema, requiredAttributes, bypassFeatureData) {

      var vec4d = glMatrix.vec4d;

      var bundleLoadedCallback = _bundleLoadedCallback;
      var loader = _streamDataSupplier;
      var url = _url;
      var loading = false;

      var cancelled = false;
      this.cancel = function() {
        cancelled = true;
      };

      this.isLoading = function() {
        return loading;
      };

      var addAbsoluteHrefTexture = function(store, shared, url) {
        var textures = shared.textureDefinitions;
        if (textures!==undefined) {
          for (var texId in textures) {
            if (textures.hasOwnProperty(texId)) {
              var tex = textures[texId];
              var numEncodings = Array.isArray(tex.encoding) ? tex.encoding.length : -1;
              var hrefConcat = url;
              if (tex.href) {
                hrefConcat = I3SUtil.concatUrl(hrefConcat, tex.href);
                tex = store[hrefConcat].textureDefinitions;
                assert(tex);
              }
              for (var j = 0; j < tex.images.length; j++) {
                var image = tex.images[j];
                if (numEncodings > -1) {
                  image.hrefConcat =  image.href.map(function(href) {
                    return I3SUtil.concatUrl(hrefConcat, href);
                  });
                }
                else {
                  image.hrefConcat = I3SUtil.concatUrl(hrefConcat, image.href);
                }
              }
            }
          }
        }
      };

      var fixTextureEncodings = function(shared) {
        // cut "data:" part from encoding strings

        var textures = shared.textureDefinitions;
        if (textures != null) {
          for (var texId in textures) {
            var tex = textures[texId];
            if (Array.isArray(tex.encoding)) {
              for (var i = 0; i < tex.encoding.length; i++) {
                if (tex.encoding[i].startsWith("data:")) {
                  tex.encoding[i] = tex.encoding[i].substring(5);
                }
              }
            }
            else {
              tex.encoding = tex.encoding.substring(5);
            }
          }
        }
      };

      var loadAllShared = function(node, store, nodeURL)
      {
        var pathComb;
        var promiseShared = new promise.Promise();
        if (node.sharedResource != null) {
          pathComb = I3SUtil.concatUrl(nodeURL, node.sharedResource.href)+"/";
          node.sharedResource.hrefConcat = pathComb;
          var promiseSharedMain = loader.request(pathComb,"json");

          promiseSharedMain.then(function loadReferencedShared(url, data) {
              if (handleCancelled()) {
                return;
              }

              store[url] = data;
              fixTextureEncodings(data);
              addAbsoluteHrefTexture(store,data,url);

              var deferredSharedArray = loadReferencedSharedResources(node, nodeURL, store);
              if (deferredSharedArray.length > 0) {
                var all2 = promise.join(deferredSharedArray);
                all2.then(function(result) {
                    if (handleCancelled()) {
                      return;
                    }
                    addResultsToStore(result, store);

                    // calc&store absolute texture urls
                    fixTextureEncodings(store[urlS]);
                    for (var urlS in store) {
                      addAbsoluteHrefTexture(store, store[urlS],urlS);
                    }

                    promiseShared.done();
                  },
                  function(){promiseShared.reject();});
              }
              else
              {
                promiseShared.done();
              }
            },
            function(err){
              promiseShared.reject();
            }
          );
        }
        else {
          promiseShared.done();
        }
        return promiseShared;
      };

      var texIdToPromises = {};

      var loadTexture = function(desiredURL, promiseTexture, i3sTexId, i3sTex, desiredImage,desiredLOD,encodingIdx) {
        var encoding = encodingIdx > -1 ? i3sTex.encoding[encodingIdx] : i3sTex.encoding;
        var isDDS = encoding === I3SUtil.DDS_ENCODING_STRING;
        var loadAsBlob = _imageIsPartOfTextureBundle(desiredImage);
        assert(!(isDDS && loadAsBlob), "DDS in multi texture bundles not supported at the moment");
        var requestType = (loadAsBlob || isDDS) ? "binary" : "image";
        // load as binary and extract
        _streamDataSupplier.request(desiredURL, requestType).then(
          function(url,data,docType,metadata) {
            if (cancelled) {
              return;
            }


            if (loadAsBlob) {
              var blobUrl;

              try {
                var byteOffset, length;
                if (encodingIdx > -1) {
                  assert(Array.isArray(desiredImage.byteOffset) && Array.isArray(desiredImage.length), "texture encoding is array, but image byteOffset/length isn't");
                  byteOffset = desiredImage.byteOffset[encodingIdx];
                  length = desiredImage.length[encodingIdx];
                }
                else {
                  byteOffset = desiredImage.byteOffset;
                  length = desiredImage.length;
                }
                var textureArray = new Uint8Array(data, byteOffset, length);

                var blob = new Blob([textureArray], {type: encoding});
                blobUrl = window.URL.createObjectURL(blob);
              }
              catch (e) {
                //red error image
                blobUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAIElEQVQ4T2P8zyD6n4ECwDhqAMNoGDCMhgEwDw2DdAAAdzkhQdS8dl8AAAAASUVORK5CYII=";
                console.error("error loading texture "+desiredURL+" "+e);
              }


              var domImage = new Image();

              domImage.onerror = function() {
                window.URL.revokeObjectURL(blobUrl);
                domImage.url = "";
                domImage.onerror = undefined;
                domImage.onload = undefined;
                promiseTexture.done({});
              };

              domImage.onload = function() {
                window.URL.revokeObjectURL(blobUrl);
                domImage.url = "";
                domImage.onerror = undefined;
                domImage.onload = undefined;

                if (cancelled)
                {
                  promiseTexture.reject();
                }
                else {
                  promiseTexture.done({i3sTexId:i3sTexId,data:domImage,encoding:encoding,desiredLOD:desiredLOD});
                }

              };

              domImage.src = blobUrl;
            }
            else {
              promiseTexture.done({i3sTexId:i3sTexId,data:data,encoding:encoding,desiredLOD:desiredLOD});
            }
          },
          function err() {promiseTexture.done({});},
          this
        );
      };

      var getAllEngineMBS = function (features) {
        var featuresMBS = [];
        for (var i=0; i<features.length; i++) {
          featuresMBS.push(features[i].engineMBS);
        }
        return featuresMBS;
      };

      var loadTextures = function(allGeometries, sharedResources, _matId2Meta, _texId2Meta, store, node) {
        var promiseTextures = [];

        for (var i=0; i<allGeometries.length; i++) {
          var geometries = allGeometries[i].geometries;
          var featuresMBS = getAllEngineMBS(allGeometries[i].features);

          for (var geomIdx = 0; geomIdx < geometries.length; ++geomIdx) {
            var geometry = geometries[geomIdx];
            var numComponents = geometry.params.components.length;
            for (var compIdx = 0; compIdx < numComponents; compIdx++) {
              var component = geometry.params.components[compIdx];
              var i3sMatId = component.materialID;
              var i3sTexId = component.textureID || "none";

              if (_matId2Meta[i3sMatId] && _matId2Meta[i3sMatId][i3sTexId]!==undefined) {
                continue;
              }

              if (_texId2Meta[i3sTexId]!==undefined) {
                continue;
              }

              if (i3sTexId !== "none") {

                if (texIdToPromises[i3sTexId]!==undefined) {
                  promiseTextures.push(texIdToPromises[i3sTexId]);
                  continue;
                }

                if (sharedResources.textureDefinitions==null || sharedResources.textureDefinitions[i3sTexId]==null)
                {
                  warningEvent("textureDefinitions missing in shared resource",1, "i3sTexId "+i3sTexId);
                }

                var i3sTex = sharedResources.textureDefinitions[i3sTexId];
                assert(i3sTex !== undefined, "geometry wants unknown texture " + i3sTexId);

                var desiredLOD = _calcDesiredTextureLOD(featuresMBS, i3sTex.images);

                if (i3sTex.images.length===0) {
                  continue;
                }

                var promiseTexture = new promise.Promise();
                promiseTextures.push(promiseTexture);
                texIdToPromises[i3sTexId] = promiseTexture;

                var desiredImage = i3sTex.images[desiredLOD];

                var encodingIdx = I3SUtil.getAppropriateTextureEncoding(i3sTex.encoding, useCompressedTextures());
                var desiredURL = (encodingIdx > -1) ? desiredImage.hrefConcat[encodingIdx] : desiredImage.hrefConcat;

                loadTexture(desiredURL,promiseTexture,i3sTexId,i3sTex,desiredImage,desiredLOD,encodingIdx);
            }
          }
        }
        }
        if (promiseTextures.length>0) {
          return promise.join(promiseTextures);
        }
      };


      var getIdFromJsonPointer = function(pointer)
      {
        var tmpSplit = pointer.split("/");
        return tmpSplit[tmpSplit.length-1];
      };

      var buildNodeFeatures = function(node, bundleIdx, store) {
        var featureDataFile = store[node.featureData[bundleIdx].hrefConcat];

        if (node.features==null) {
          node.features = [];
        }

        for (var featureIdx in featureDataFile.featureData)
        {
          var featureData = featureDataFile.featureData[featureIdx];
          node.features.push({id:featureData.id, mbs: node.mbs, block: bundleIdx});
        }
      };


      var collectGeometries = function(node, bundleIdx, store) {
        var collectedGeometries = [];

        var dbgFallbackBlock = false;

        if (node.featureData[bundleIdx].featureRange==null) {
          var start = 0; //todo: remove when all caches have correct .featureRange instead of feature.block
          var end = node.features.length - 1;
          dbgFallbackBlock = true;
        }
        else {
          start = node.featureData[bundleIdx].featureRange[0];
          end = node.featureData[bundleIdx].featureRange[1];
        }

        // iterate over all features in node
        for (var featureIdx = start; featureIdx <= end; ++featureIdx) {
          var feature = node.features[featureIdx];

          if (!feature.engineMBS) {
            var featureEngineMBS = vec4d.create();
            projectionUtils.mbsToMbs(feature.mbs, indexSR, featureEngineMBS, renderCoordsHelper.spatialRef);
            featureEngineMBS[3] = feature.mbs[3];
            feature.engineMBS = featureEngineMBS;
          }

          if (dbgFallbackBlock) {
            if (feature.block !== bundleIdx) {
              continue;
            }
          }

          // find featureData in FeatureData block
          var featureDataFile = store[node.featureData[bundleIdx].hrefConcat];
          var featureDataBlock = featureDataFile.featureData;

          var featureData;
          for (var featureDataIdx = 0; featureDataIdx < featureDataBlock.length; featureDataIdx++) {
            if (featureDataBlock[featureDataIdx].id === feature.id) {
              featureData = featureDataBlock[featureDataIdx];
              break;
            }
          }

          assert(featureData, "I3S: unable to find feature data in specified block in node.id " + node.id + " feature.id " + feature.id);

          var geometries = featureData.geometries;
          var arrayBufferViewGeometries = [];
          var arrayBufferViewFaceRanges = [];

          if (geometries != null) {
            for (var geomIdx = 0; geomIdx < geometries.length; geomIdx++) {
              var geometry = featureData.geometries[geomIdx];

              if (geometry.type == "GeometryReference") {
                var ref = getIdFromJsonPointer(geometry.params.$ref);
                var geometriesRef;
                for (var i = 0; i < featureDataFile.geometryData.length; i++) {
                  var g = featureDataFile.geometryData[i];

                  if (g.id + "" == ref) {
                    geometriesRef = g;
                    break;
                  }
                }

                assert(geometriesRef, "I3S: Unable to find referenced geometry");

                if (geometriesRef.params.material == null) {

                  warningEvent("material definition is missing in featureData, node ", node.id);

                  var materialId = Object.keys(store[node.sharedResource.hrefConcat].materialDefinitions)[0];
                  geometriesRef.params.material = "/materialDefinitions/" + materialId;
                }


                if (geometriesRef.params.components == null) {
                  //patch in components. TODO: a bit hacky, change reader instead?
                  if (geometriesRef.params.texture != null) {
                    geometriesRef.params.components =
                      [
                        {
                          "material": geometriesRef.params.material,
                          "materialID": getIdFromJsonPointer(geometriesRef.params.material),
                          "texture": geometriesRef.params.texture,
                          "textureID": getIdFromJsonPointer(geometriesRef.params.texture),
                          "id": 1
                        }
                      ];
                  }
                  else {
                    geometriesRef.params.components =
                      [
                        {
                          "material": geometriesRef.params.material,
                          "materialID": getIdFromJsonPointer(geometriesRef.params.material),
                          "id": 1
                        }
                      ];
                  }

                  if (geometriesRef.params.faces != null && geometriesRef.params.faces.position != null) {
                    geometriesRef.params.faces.position.componentIndices = [0]; // should be: geometriesRef.params.faces.position.count, old spec used??
                  }
                }

                //always create one visibleGeometry for a GeometryReference, possibly containing multiple features
                //one feature may be spread across multiple visibleGeometry this way (if it has multiple GeometryReference)

                var visibleGeometry;
                visibleGeometry = null;
                for (i = 0; i < collectedGeometries.length; i++) {
                  if (collectedGeometries[i].geometries.length == 1 && collectedGeometries[i].geometries[0].id + "" === ref) {
                    visibleGeometry = collectedGeometries[i];
                    break;
                  }
                }

                if (visibleGeometry === null) {
                  visibleGeometry = {
                    features: [],
                    featureDataPositions: [],
                    featureDataAttributes: [],
                    faceRanges: [],
                    geometries: [geometriesRef]
                  };
                  collectedGeometries.push(visibleGeometry);
                }

                visibleGeometry.features.push(feature);
                visibleGeometry.featureDataAttributes.push(featureData.attributes);
                visibleGeometry.featureDataPositions.push(featureData.position);
                visibleGeometry.faceRanges.push(geometry.params.faceRange);
              }
              else { //geometry.type != "GeometryReference"
                arrayBufferViewGeometries.push(geometry);
                if (geometry.params.faceRange != null) {
                  arrayBufferViewFaceRanges.push(geometry.params.faceRange);
                }
              }
            }
          }
          else if (featureData.position!=null) { //geometries==null - embedded?
            arrayBufferViewGeometries.push(
            {
              "id": feature.id,
              "type": "Embedded",
              "transformation" : [1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0],
              "params": {
              "type": "points",
                "vertexAttributes": {
                "position": [0,0,0]
              }}});
          }

          if (arrayBufferViewFaceRanges.length===0) {
            arrayBufferViewFaceRanges = null;
          }

          if (arrayBufferViewGeometries.length>0) {
            collectedGeometries.push({features: [feature], featureDataAttributes: [featureData.attributes],featureDataPositions: [featureData.position], geometries: arrayBufferViewGeometries, faceRanges: arrayBufferViewFaceRanges});
          }

        }

        return collectedGeometries;
      };

      var buildDefaultFeatureData = function(uniqueId, materialId, textureId, mbb) {

        var featureData = {
          "featureData": [
            {
              "id": uniqueId,
              "position": [0,0,0],
              "pivotOffset": [
                0,0,0],
              "mbb": mbb,
              "layer": "Default",
              "geometries": [
                {
                  "id": 1,
                  "type": "GeometryReference",
                  "params": {
                    "$ref": "/geometryData/0",
                    "faceRange": [0,0] //will be set later
                  }
                }
              ]
            }
          ],
          "geometryData": [
            {
              "id": 0,
              "type": "ArrayBufferView",
              "transformation": [1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0],
              "params": {
                "type": "triangles",
                "material": "/materialDefinitions/" + materialId
              }
            }
          ]
        };

        if (textureId!=null) {
          featureData.geometryData[0].params.texture = "/textureDefinitions/" + textureId;
        }

        return featureData;
      };

      var calcDefaultFeatureDataOffsets = function(visibleGeometries, defaultGeometrySchema, geometryArrayBuffer, hasVertexRegions) {
        var geometryData = visibleGeometries.geometries[0];

        //read header
        var header = I3SAttributeReader.readBinaryHeader(geometryArrayBuffer, defaultGeometrySchema.header);
        var byteOffset = header.byteCount;

        visibleGeometries.faceRanges[0][0] = 0;
        visibleGeometries.faceRanges[0][1] = header.fields.vertexCount/3 - 1;

        geometryData.params.vertexAttributes = lang.clone(defaultGeometrySchema.vertexAttributes);

        if (!hasVertexRegions && geometryData.params.vertexAttributes.region==null) {
          delete geometryData.params.vertexAttributes.region;
        }

        var va = geometryData.params.vertexAttributes;
        if (defaultGeometrySchema.faces) {
          geometryData.params.faces = lang.clone(defaultGeometrySchema.faces);
          var faces = geometryData.params.faces;
        }

        for (var i=0; i<defaultGeometrySchema.ordering.length; i++) {
          var name = defaultGeometrySchema.ordering[i];
          if (!hasVertexRegions && name==="region") {
            continue;
          }
          va[name].byteOffset = byteOffset;
          va[name].count = header.fields.vertexCount;
          byteOffset+= I3SUtil.getBytesPerValue(va[name].valueType)*va[name].valuesPerElement*header.fields.vertexCount;
        }

        if (faces) {
          for (i=0; i<defaultGeometrySchema.ordering.length; i++) {
            name = defaultGeometrySchema.ordering[i];
            faces[name].byteOffset = byteOffset;
            faces[name].count = header.fields.vertexCount;
          }
          //todo mp workaround: index arrays are currently always the same!
          byteOffset+= I3SUtil.getBytesPerValue(faces[name].valueType)*faces[name].valuesPerElement*header.fields.vertexCount;
          faces.position.componentIndices = [0]; //old style component indices. TODO remove when no longer in spec
        }

        if (defaultGeometrySchema.featureAttributes && defaultGeometrySchema.featureAttributeOrder && header.fields.featureCount) {
          geometryData.params.featureAttributes = lang.clone(defaultGeometrySchema.featureAttributes);
          var fa = geometryData.params.featureAttributes;

          for (i=0; i<defaultGeometrySchema.featureAttributeOrder.length; i++) {
            name = defaultGeometrySchema.featureAttributeOrder[i];

            fa[name].byteOffset = byteOffset;
            fa[name].count = header.fields.featureCount;

            var valueLength = I3SUtil.getBytesPerValue(fa[name].valueType);

            //handle uint64 arrays which do not exist in JS natively
            if (fa[name].valueType==="UInt64") {
              valueLength = 8;
            }

            byteOffset+= valueLength*fa[name].valuesPerElement*header.fields.featureCount;
          }

          if (fa.faceRange && fa.id) {

            visibleGeometries.faceRanges = [];
            visibleGeometries.featureIds = [];

            var TypedArrayClass = I3SUtil.valueType2TypedArrayClassMap[fa.faceRange.valueType];
            var faceRanges = new TypedArrayClass(geometryArrayBuffer, fa.faceRange.byteOffset, fa.faceRange.count * fa.faceRange.valuesPerElement);

            //handle uint64 arrays which do not exist in JS natively
            var uint64Workaround = 1;
            if (fa.id.valueType=="UInt64") {
              TypedArrayClass = Uint32Array;
              uint64Workaround = 2;
            } else {
              TypedArrayClass = I3SUtil.valueType2TypedArrayClassMap[fa.id.valueType];
            }
            var id = new TypedArrayClass(geometryArrayBuffer, fa.id.byteOffset, fa.id.count * fa.id.valuesPerElement*uint64Workaround);

            for (i=0; i<header.fields.featureCount; i++) {
              visibleGeometries.faceRanges[i] = [];
              visibleGeometries.faceRanges[i][0] =  faceRanges[i*fa.faceRange.valuesPerElement];
              visibleGeometries.faceRanges[i][1] =  faceRanges[i*fa.faceRange.valuesPerElement+1];
              visibleGeometries.featureIds[i] = id[i*fa.id.valuesPerElement*uint64Workaround];

              if (uint64Workaround===2) {
                var msb = id[i*fa.id.valuesPerElement*uint64Workaround+1];
                //max safe integer = 9007199254740991, 2^32=4294967296; msb max = (9007199254740991-4294967296)/4294967296 = 2097150
                assert(msb<2097150,"ID exceeded maximum range supported by javascript (max = 53bit-1 = 9007199254740991)");
                //assume little endian
                visibleGeometries.featureIds[i] += 4294967296*msb;
              }
            }
          }

        }
      };

      this.loadAttributes = function(node, nodeURL, requiredAttributes) {
        var attributeData = {};
        var promises = [];
        for (var i=0; i<requiredAttributes.length; i++) {
          var attr = requiredAttributes[i];
          promises.push(I3SAttributeReader.load(loader, nodeURL, attr.attributeStorageInfo, node.attributeData[attr.index]));
        }
        var brokenPromise = true;
        if (brokenPromise) {
          // a very complicated block of error handling, because PromiseLightweight.js is
          // currently broken (then doesn't return a new promise).
          var promiseAttributes = new promise.Promise();
          promise.join(promises).then(function (resultArray) {
            try {
              for (var i = 0; i < requiredAttributes.length; ++i) {
                if (resultArray[i][0]) {
                  attributeData[requiredAttributes[i].name] = resultArray[i][0];
                }
              }
              promiseAttributes.done(attributeData);
            }
            catch (err) {
              promiseAttributes.cancel(err);
            }
          }, function (err) {
            promiseAttributes.cancel(err);
          });
          return promiseAttributes;
        } else {
          // Welcome to ES6-Promise heaven:
          return Promise.all(promises).then(function (resultArray) {
            for (var i = 0; i < requiredAttributes.length; ++i) {
              if (resultArray[i]) {
                attributeData[requiredAttributes[i].name] = resultArray[i];
              }
            }
            return attributeData;
          });
        }
      }

      // load geometry, materials & textures
      this.loadNodeData = function(node, bundlesToLoad, promiseLoaded, loadTexturesEarly, lodToRemove) {

        if (promiseLoaded) {
          loading = true;
        }

        var createNodeFeatures = (node.features==null);

        var nodeURL = I3SUtil.getNodeURL(url, node.id);
        var store = {};
        var pathComb;

        // fetch all shared and referenced shared

        var promiseSharedAndAttributes = [];
        promiseSharedAndAttributes.push(loadAllShared(node, store, nodeURL));

        if (requiredAttributes != null) {
          promiseSharedAndAttributes.push(this.loadAttributes(node, nodeURL, requiredAttributes));
        }

        function handleJoinedPromises(deferredArrayAllBundles) {
          if (promiseLoaded) {
            var deferredArrayAllBundlesArray = [];
            for (var bundleNrOuter2 in deferredArrayAllBundles) {
              deferredArrayAllBundlesArray.push(deferredArrayAllBundles[bundleNrOuter2]);
            }
            var allBundles = promise.join(deferredArrayAllBundlesArray);
            allBundles.then(function (result) {
              promiseLoaded.done();
              loading = false;
            }, function (err) {
              promiseLoaded.done();
              loading = false;
            });
          }
        }

        // TODO: attributes should be loaded in parallel with geometry.
        promise.join(promiseSharedAndAttributes).then(function loadBundles(promiseResults) {
          if (requiredAttributes != null) {
            var attributeData = promiseResults[1][0];
          }
          if (handleCancelled(promiseLoaded)) {
            return;
          }

          var bundle;
          var bundles = {};
          var deferredArrayAllBundles = {};

          // setup bundles&fetch featureData per bundle
          if (node.featureData != null) {
            for (var bundleIdx in bundlesToLoad) {

              var i = bundlesToLoad[bundleIdx];

              pathComb = I3SUtil.concatUrl(nodeURL, node.featureData[i].href);
              node.featureData[i].hrefConcat = pathComb;
              bundle = {};
              bundle.featureDataPath = pathComb;

              if (bypassFeatureData && defaultGeometrySchema) {
                var uniqueId = node.id;
                var materialId = Object.keys(store[node.sharedResource.hrefConcat].materialDefinitions)[0]; //todo change to index-based id's
                if (store[node.sharedResource.hrefConcat].textureDefinitions!=null) {
                  var textureId = Object.keys(store[node.sharedResource.hrefConcat].textureDefinitions)[0];
                }
                var mbb = null;
                var featureData = buildDefaultFeatureData(uniqueId, materialId, textureId, mbb);
                bundle.promiseFeatureData = new promise.Promise();
                bundle.promiseFeatureData.resolve(node.featureData[i].hrefConcat, featureData, "json", i);
              }
              else {
                bundle.promiseFeatureData = loader.request(pathComb, "json", {
                  metadata : i
                });
              }

              bundles[i] = bundle;

              if (promiseLoaded) {
                deferredArrayAllBundles[i] = new promise.Promise();
              }
            }
          }

          for (var bundleNrOuter in bundles) {
            bundle = bundles[bundleNrOuter];
            bundle.promiseFeatureData.then(function(url, data, docType, metaData) {
              if (handleCancelled(promiseLoaded)) {
                return;
              }

              store[url] = data;
              var bundleNr = metaData;
              var promiseArray = [];

              if (!bundles[bundleNr].alreadyLoaded) {

                if (createNodeFeatures) {
                  buildNodeFeatures(node, bundleNr, store);
                }

                bundles[bundleNr].collectedGeometries = collectGeometries(node, bundleNr, store);

                // fetch geometry
                if (node.geometryData != null && node.geometryData.length > bundleNr) {
                  pathComb = I3SUtil.concatUrl(nodeURL, node.geometryData[bundleNr].href);
                  node.geometryData[bundleNr].hrefConcat = pathComb;
                  var promiseGeom = loader.request(pathComb, "binary", {
                      metadata : bundleNr
                    });
                  promiseArray.push(promiseGeom);
                }

                // possibly fetch textures
                if (loadTexturesEarly)
                {
                  var promiseTex = loadTextures(bundles[bundleNr].collectedGeometries, store[node.sharedResource.hrefConcat], _matId2Meta, _texId2Meta,store, node);
                  if (promiseTex!==undefined) {
                    promiseArray.push(promiseTex);
                  }
                }

              }
              else {
                bundles[bundleNr].collectedGeometries = collectGeometries(node, bundleNr, store);
                queueFunctionCall(bundleLoadedCallback, undefined, [ node,  bundles[bundleNr].collectedGeometries, null, store, deferredArrayAllBundles[bundleNr], undefined, bundleNr, lodToRemove]);
                return;
              }

              var promiseArrayJoined = promiseArray.length>0?promise.join(promiseArray):
                {then:function(f){f([[0,0,0,bundleNr]]);}};

              promiseArrayJoined.then(function loadNodeBundle(results) {
                if (handleCancelled(promiseLoaded)) {
                  return;
                }

                if (results!=null) {
                  addResultsToStore(results, store);
                  var imageDataRecs = {};
                  for ( var i = 0; i < results.length; i++) {
                    if (results[i].length === 1) { //image data
                      for (var j=0; j<results[i][0].length; j++) {
                        var imageDataRec = results[i][0][j][0];
                        var texId = imageDataRec.i3sTexId;
                        imageDataRecs[texId]={
                          data: imageDataRec.data,
                          encoding: imageDataRec.encoding,
                          desiredLOD: imageDataRec.desiredLOD,
                          createdTextureForDomImage: function() {
                            if (texIdToPromises[texId]) {
                              delete texIdToPromises[texId];
                            }
                          }
                        };
                      }

                    }
                  }
                }


                // finally add
                if (debugVis !== undefined) {
                  debugVis.show(node, indexSR, "green");
                }
                var bundleNr = results[0][3];


                if (bypassFeatureData && defaultGeometrySchema) {
                  var materialId = Object.keys(store[node.sharedResource.hrefConcat].materialDefinitions)[0];
                  var hasVertexRegions = store[node.sharedResource.hrefConcat].materialDefinitions[materialId].params.vertexRegions;
                  calcDefaultFeatureDataOffsets( bundles[bundleNr].collectedGeometries[0], defaultGeometrySchema, store[node.geometryData[0].hrefConcat],hasVertexRegions);
                }
                
                var attributeDataInfo = null;
                if (attributeData)
                {
                  attributeDataInfo = {
                    attributeData: attributeData,
                    loadedAttributes: requiredAttributes
                  }
                }

                queueFunctionCall(bundleLoadedCallback, undefined, [ node, bundles[bundleNr].collectedGeometries, attributeDataInfo, store, deferredArrayAllBundles[bundleNr], imageDataRecs, bundleNr, lodToRemove]);
              }, function(err) {
                //could not load geometry data
                queueFunctionCall(bundleLoadedCallback, undefined, [ node, null, null, store, deferredArrayAllBundles[bundleNr], null, bundleNr, lodToRemove]);
              });
            }, function(err) {
              //could not load feature data
              queueFunctionCall(bundleLoadedCallback, undefined, [ node, null, null, store, deferredArrayAllBundles[bundleNrOuter], null, bundleNrOuter, lodToRemove]);
            });
          }
          handleJoinedPromises(deferredArrayAllBundles);

        }, function(err) {
          //could not load shared data
          var deferredArrayAllBundles = [];
          for (var bundleIdx in bundlesToLoad) {
            var bundleNr = bundlesToLoad[bundleIdx];
            deferredArrayAllBundles[bundleNr] = new promise.Promise();
            queueFunctionCall(bundleLoadedCallback, undefined, [ node, null, null, store, deferredArrayAllBundles[bundleNr], null, bundleNr, lodToRemove]);
            loading = false;
          }
          handleJoinedPromises(deferredArrayAllBundles);
        });

        return promiseLoaded;
      };

      function handleCancelled(promiseLoaded)
      {
        if (cancelled) {
          loading = false;
          if (promiseLoaded) {
            promiseLoaded.done();
          }
          return true;
        }
        return false;
      }
      
      function addResultsToStore(results, store)
      {
        if (results !== undefined)
        {
           for ( var i = 0; i < results.length; i++) {
             if (results[i].length<2) {
               continue;
             }
             store[results[i][0]] = results[i][1];
           }
        }
           
      }
      
      function loadReferencedSharedResources(node, nodeURL, store) {
        var deferredSharedArray = [];
        var sharedResource = store[node.sharedResource.hrefConcat];
        assert(sharedResource);
        for (var matId in sharedResource.materialDefinitions) {
          if (sharedResource.materialDefinitions.hasOwnProperty(matId)) {
            var mat = sharedResource.materialDefinitions[matId];
            if (mat.href) {
              var pathComb = I3SUtil.concatUrl(nodeURL, mat.href)+"/";
              mat.hrefConcat = pathComb;
              deferredSharedArray.push(loader.request(pathComb, "json"));
            }
          }
        }
        return deferredSharedArray;
      }
    }
  });
});
