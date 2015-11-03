define([
  "./Util"
], function (Util) {
  return function GLMaterialRep(textureRep, programRep) {
    var id2glMaterialRef = {};

    var GLMaterialRef = function(glMaterial) {
      var refCnt = 0;

      this.incRefCnt = function() {
        ++refCnt;
      };

      this.decRefCnt = function() {
        --refCnt;
        Util.assert(refCnt >= 0);
      };

      this.getRefCnt = function() {
        return refCnt;
      };

      this.getGLMaterial = function() {
        return glMaterial;
      };
    };

    this.aquire = function(material) {
      return aquireExt(material, 0, id2glMaterialRef);
    };

    this.aquireDepthShadowMap = function(material) {
      return aquireExt(material, 1, id2glMaterialRef);
    };

    this.aquireDepth = function(material) {
      return aquireExt(material, 3, id2glMaterialRef);
    };

    this.aquireNormal = function(material) {
      return aquireExt(material, 2, id2glMaterialRef);
    };

    var aquireExt = function(material, idx, id2glMaterialRef) {
      var id = material.getId();

      if (idx === 1) {
        id += "_depthShadowMap";
      }
      else if (idx === 2) {
        id += "_normal";
      }
      else if (idx === 3) {
        id += "_depth";
      }

      var glMaterialRef = id2glMaterialRef[id];
      var glMaterial;

      if (glMaterialRef === undefined) {
        var GLMaterialConstructor = material.getGLMaterials()[idx];

        glMaterial = GLMaterialConstructor
          ? new GLMaterialConstructor(material, programRep, textureRep)
          : undefined;
        glMaterialRef = new GLMaterialRef(glMaterial);

        id2glMaterialRef[id] = glMaterialRef;
      } else {
        glMaterial = glMaterialRef.getGLMaterial();
      }

      glMaterialRef.incRefCnt();

      if (glMaterial) {
        increaseProgramReferences(glMaterial);
      }

      return glMaterial;
    };

    this.release = function(id) {
      release(id);
    };

    this.releaseDepth = function(id) {
      release(id + "_depth");
    };

    this.releaseNormal = function(id) {
      release(id + "_normal");
    };

    var release = function(id) {
      var glMaterialRef = id2glMaterialRef[id];
      glMaterialRef.decRefCnt();

      if (glMaterialRef.getRefCnt() === 0) {
        var glMaterial = glMaterialRef.getGLMaterial();
        
        if (glMaterial) {
          decreaseProgramReferences(glMaterial);
          
          if (glMaterial.dispose !== undefined) {
            glMaterial.dispose();
          }
        }

        delete id2glMaterialRef[id];
      }
    };

    this.updateMaterialParameters = function(id) {
      var matRef = id2glMaterialRef[id];
      
      if (matRef && matRef.getGLMaterial()) {
        updateParamsForMat(matRef.getGLMaterial());
      }

      var depthMatRef = id2glMaterialRef[id + "_depth"];

      if (depthMatRef && depthMatRef.getGLMaterial()) {
        updateParamsForMat(depthMatRef.getGLMaterial());
      }

      var normMatRef = id2glMaterialRef[id + "_normal"];
      
      if (normMatRef && normMatRef.getGLMaterial()) {
        updateParamsForMat(normMatRef.getGLMaterial());
      }
    };

    function updateParamsForMat(glMaterial)  {
      glMaterial.updateVisibility();

      if (glMaterial.updateParameters) {
        glMaterial.updateParameters();
      }
    }

    function increaseProgramReferences(glMaterial) {
      if (glMaterial.getAllPrograms) {
        var programs = glMaterial.getAllPrograms();
        
        for (var i = 0; i < programs.length; i++) {
          programRep.increaseRefCount(programs[i]);
        }
      } else {
        programRep.increaseRefCount(glMaterial.getProgram());
      }
    }

    function decreaseProgramReferences(glMaterial) {
      if (glMaterial.getAllPrograms) {
        var programs = glMaterial.getAllPrograms();
        for (var i = 0; i < programs.length; i++) {
          programRep.decreaseRefCount(programs[i]);
        }
      } else {
        programRep.decreaseRefCount(glMaterial.getProgram());
      }
    }

  };
});