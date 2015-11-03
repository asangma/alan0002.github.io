/* jshint forin: false */
define(["../../../../core/declare", "dojo/_base/lang",
  "../../support/PromiseLightweight",

  "../../lib/glMatrix",

  "../../webgl-engine/Stage",
  "../../webgl-engine/lib/Util",
  "../../webgl-engine/lib/Geometry",
  "../../webgl-engine/lib/GeometryData",
  "../../webgl-engine/materials/Material",
  "../../webgl-engine/lib/Texture"
],
  function(
    declare, lang, promise,
    glMatrix,
    Stage, Util, Geometry, GeometryData, Material, Texture
  ) {
    var mat4d = glMatrix.mat4d;
    var assert = Util.assert;

    var I3SSymbolLoader = declare(null, {
      constructor: function(streamDataSupplier) {
        this.streamDataSupplier = streamDataSupplier;
      },

      destroy: function() {
      },

      fetchSymbol: function(url, options) {
        options = options || {};
        //var splitIdx = url.lastIndexOf("/");
        //var path = url.substring(0, splitIdx);
        //var symbolName = url.substring(splitIdx + 1);

        var loadedPromise = new promise.Promise();

        this.streamDataSupplier.request(url, "json").then(
          function (url, symbolResource) {
//            var i3sGeometries = symbolResource.model.geometries;
//            var textureDownloadPromises = [];
//            var textureBins = this._gatherExternalTextures(symbolResource);
//            var textureBinRequests = {}, texture;
//            for (textureBinUrl in textureBinRequests) {
//              textureDownloadPromises.push(this.streamDataSupplier.request(textureBinUrl, "binary"));
//            }
//            if (textureDownloadPromises.length > 0) {
//              promise.join(textureDownloadPromises).then(
//                function(textureBins) {
//                  var textureExtractPromises = [];
//                  for (var i = 0; i < textureBins.length; i++) {
//                    var url = textureBins[i][0];
//                    this.streamDataSupplier.unuse(url);
//                    var textureImageDefs = textureBinRequests[url];
//                    for (var j = 0; j < textureImageDefs.length; j++) {
//                      textureExtractPromises.push(
//                        this._extractTextureImageFromBin(textureBins[i][1], textureImageDefs[j])
//                      );
//                    }
//                  }
//                  promise.join(textureExtractPromises).then(
//                    function() {
//                      var stageResources = this._createStageResources(i3sGeometries, data[1][1], data[2][1]);
//                      loadedPromise.done(stageResources);
//                    }.bind(this),
//                    function() { loadedPromise.reject(); }
//                  );
//                }.bind(this),
//                function() { loadedPromise.reject(); }
//              );
//            } else {
              var stageResources = this._createStageResources(symbolResource, options);
              loadedPromise.done(stageResources);
            //}
          }.bind(this),
          function() { loadedPromise.reject(); }
        );
        return loadedPromise;
      },

      _gatherExternalTextures: function(symbolResource) {
        for (var textureId in symbolResource.textureDefinitions) {
          var texDef = symbolResource.textureDefinitions[textureId];
          for (var imgIdx = 0; imgIdx < texDef.images.length; imgIdx++) {
            var image = texDef.images[imgIdx];
            if ("href" in image) {
              console.warn("External image resources not yet supported");
            }
          }
        }
        return {};
      },

      _extractTextureImageFromBin: function(data, textureImageDefinition) {
        var extractedPromise = new promise.Promise();
        var textureArray = new Uint8Array(data,textureImageDefinition.byteOffset, textureImageDefinition.length);
        var blob = new Blob([textureArray], {type: textureImageDefinition.encoding});
        var blobUrl = window.URL.createObjectURL(blob);

        var domImage = new Image();

        domImage.onerror = function() {
          window.URL.revokeObjectURL(blobUrl);
          extractedPromise.reject();
          domImage.url = "";
          domImage.onerror = undefined;
          domImage.onload = undefined;
        };

        domImage.onload = function() {
          window.URL.revokeObjectURL(blobUrl);
          textureImageDefinition.img = domImage;
          extractedPromise.done();
          domImage.url = "";
          domImage.onerror = undefined;
          domImage.onload = undefined;
        };

        domImage.src = blobUrl;
        return extractedPromise;
      },

      _createStageResources: function(symbolResource, options) {
        var stageGeometries = [],
          stageMats = [],
          stageMatsByComponent = [],
          stageMatsByI3sRefs = [],
          stageTextures = [],
          geoTransformations = [];

        var modelId = "meshsymbol_" + symbolResource.model.name;

        // create textures
        var textureDefinitions = symbolResource.textureDefinitions;
        var textures = {};
        for (var texId in textureDefinitions) {
          var texDef = textureDefinitions[texId];
          var imageDataBase64 = texDef.images[0].data;
          assert(imageDataBase64, "symbol resources must have embedded texture data (at the moment)");
          var imageDataUri = texDef.encoding + ";base64," + imageDataBase64;
          var texRef = "/textureDefinitions/"+texId;
          var texture = new Texture(imageDataUri, modelId, {
            noUnpackFlip: true
          });
          stageTextures.push(texture);
          textures[texRef] = {
            engineTexObj: texture,
            transparent: texDef.channels === "rgba"
          };
        }

        var i3sGeometries = symbolResource.model.geometries;
        var materialDefinitions = symbolResource.materialDefinitions;

        for (var geoIdx = 0; geoIdx < i3sGeometries.length; geoIdx++) {
          var i3sGeometry = i3sGeometries[geoIdx];
          if (!i3sGeometry.params.components) {
            this._createSingleComponent(i3sGeometry);
          }

          var components = i3sGeometry.params.components;
          var numComponents = components.length;
          var facesIn = i3sGeometry.params.faces;
          var vertexAttrIn = i3sGeometry.params.vertexAttributes;
          var topology = i3sGeometry.params.topology || "Indexed";

          // Vertex attributes are common for all components
          var va = {};
          var name;

          for (name in vertexAttrIn) {
            var an = vertexAttrIn[name];
            assert(an.values, "symbol resources with external geometry bin not yet supported");
//            var TypedArrayClass = I3SUtil.valueType2TypedArrayClassMap[an.valueType];
//            assert(TypedArrayClass != null, "unsupported vertex attribute value type: " + an.valueType);
            va[name] = {
              data : an.values, //new TypedArrayClass(an.values),
              size : an.valuesPerElement
            };
          }

          // Indices are per component, only present if topology is indexed
          var componentIndices, indicesOffset;
          var facesOut = new Array(numComponents);
          if (topology === "Indexed") {
            componentIndices = facesIn.componentIndices;
            indicesOffset = {};
            for (name in facesIn) {
              indicesOffset[name] = facesIn[name].byteOffset;
            }
          }
          else {
            if (topology !== "PerAttributeArray") {
              console.warn("I3S symbol loader: unsupported topology type " + topology);
            }
            else if (numComponents !== 1) {
              console.warn("I3S symbol loader: if topology is not Indexed, only single component geometries are supported");
            }
          }

          stageMatsByComponent.push([]);
          for (var compIdx = 0; compIdx < components.length; compIdx++) {
            var component = components[compIdx];

            var f = { type: "triangle", positionKey: "position", indices: {}};
            if (componentIndices) {
              var numIndicesInComponent = (compIdx < numComponents - 1) ?
              componentIndices[compIdx + 1] - componentIndices[compIdx] :
              facesIn.position.count - componentIndices[compIdx];

              for (name in facesIn) {
                if (name === "componentIndices") {
                  continue;
                }
                var fIn = facesIn[name];
                assert(fIn.values, "symbol resources with external geometry bin not yet supported");
                f.indices[name] = new Uint32Array(fIn.values);
                indicesOffset[name] += numIndicesInComponent * 4;
              }
            }
            else {
              // Our internal Geometry objects require indices at the moment -> generate (1..N)
              var indexArray = generateIndexArray(va.position.data.length / va.position.size);
              for (name in va) {
                f.indices[name] = indexArray;
              }
            }
            facesOut[compIdx] = f;

            var engineTexId;
            if (component.texture) {
              engineTexId = textures[component.texture].engineTexObj.getId();
            }

            // need to multiply out different combinations of materials and textures, as in the engine, the texture
            // is a part of the material
            var engineMat = stageMatsByI3sRefs[component.material] ? stageMatsByI3sRefs[component.material][component.texture] : null;
            if (!engineMat) {
              var i3sMatId = component.material.substring(component.material.lastIndexOf("/") + 1);
              var i3sMat = materialDefinitions[i3sMatId].params;
              if (i3sMat.transparency === 1) {
                i3sMat.transparency = 0;
              }
              var matParams = {
                ambient: i3sMat.diffuse, //i3sMat.ambient,
                diffuse: i3sMat.diffuse,
                specular: i3sMat.specular,
                shininess: i3sMat.shininess,
                opacity: 1.0 - i3sMat.transparency,
                textureId: engineTexId,
                doubleSided: true,
                cullFace: "none",
                flipV: false
              };
              matParams.transparent = matParams.opacity < 1.0;
              if (options.materialParamsMixin) {
                lang.mixin(matParams, options.materialParamsMixin);
              }

              engineMat = new Material(matParams, modelId);
              if (!stageMatsByI3sRefs[component.material]) {
                stageMatsByI3sRefs[component.material] = {};
              }
              stageMatsByI3sRefs[component.material][component.texture] = engineMat;
              stageMats.push(engineMat);
            }
            stageMatsByComponent[geoIdx].push(engineMat);
          }

          var geom = new Geometry(new GeometryData(facesOut, va), modelId);
          var modelTrafo = mat4d.create(i3sGeometry.transformation);

          stageGeometries.push(geom);
          geoTransformations.push(modelTrafo);
        }

        var result = {};
        result.stageResources = {};
        result.stageResources[Stage.ModelContentType.TEXTURE] = stageTextures;
        result.stageResources[Stage.ModelContentType.MATERIAL] = stageMats;
        result.stageResources[Stage.ModelContentType.GEOMETRY] = stageGeometries;
        result.geometryTransformations = geoTransformations;
        result.materialsByComponent = stageMatsByComponent;
        result.pivotOffset = symbolResource.model.pivotOffset;

        return result;
      },

      _createSingleComponent: function(i3sGeometry) {
        var params = i3sGeometry.params;
        assert(params.material);
        params.components = [
          {
            id: 1,
            material: i3sGeometry.params.material,
            texture: i3sGeometry.params.texture,
            region: i3sGeometry.params.texture
          }
        ];
        if (params.faces) {
          params.faces.componentIndices = [params.faces.position.count];
        }
      }
    });

    var generateIndexArray = function(N) {
      var result = new Uint32Array(N);
      for (var i = 0; i < N; i++) {
        result[i] = i;
      }
      return result;
    };

    return I3SSymbolLoader;
  }
);
