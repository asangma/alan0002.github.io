define(["../../support/projectionUtils", "../../lib/glMatrix",
    "../../webgl-engine/lib/proj4"],
  function (projectionUtils, glMatrix,
            proj4) {

    // Imports
    var vec3d = glMatrix.vec3d,
      mat4d = glMatrix.mat4d;

    // Constants
    var DBG = false;
    var WKID_WGS84 = 4326;

    var ReprojectionTypes = {
      PER_VERTEX: "perVertex",
      BOUNDINGBOX: "boundingBox",
      NO_REPROJECTION: "noReprojection"
    };

    var reproject_batch_size = 1000;
    var reproject_temp = new Float64Array(reproject_batch_size * 3);

    var I3SProjectionUtil = {
      ReprojectionTypes: ReprojectionTypes,

      reprojectPoints: function(reprojectionType, pointArray, normalArray, mbs, isReprojected, srMbs, srPoints, renderSR) {
        if (reprojectionType === ReprojectionTypes.PER_VERTEX)
        {
          var mat =  this.reprojectPointsPerVertex(pointArray, normalArray, mbs, srMbs, srPoints, renderSR, isReprojected);
        }
        else if (reprojectionType === ReprojectionTypes.BOUNDINGBOX)
        {
          mat = this.reprojectBoundingBox(pointArray, mbs, srMbs, srPoints, renderSR);
        }
        else
        {
          var local = mat4d.create();
          mat4d.identity(local);
          var global = mat4d.create();
          projectionUtils.computeLinearTransformation(srMbs, mbs, global, renderSR);

          mat = {localTrafo:local, globalTrafo:global};
        }

        if (DBG) {
          //debug verify in mbs
          var centerPos = [0, 0, 0, 0];
          projectionUtils.mbsToMbs(mbs, srMbs, centerPos, renderSR);
          var vTrafo1 = [0, 0, 0, 0];
          var passed = true;
          for (var i = 0; i < pointArray.data.length / 3 - 1; i++) {
            var vIn = [pointArray.data[i * 3 + 0], pointArray.data[i * 3 + 1], pointArray.data[i * 3 + 2]];

            mat4d.multiplyVec3(mat.localTrafo, vIn, vTrafo1);
            mat4d.multiplyVec3(mat.globalTrafo, vTrafo1, vTrafo1);

            vec3d.subtract(vTrafo1, centerPos, vTrafo1);
            var dist = vec3d.length(vTrafo1);

            if (dist > mbs[3] * 1.1) {
              passed = false;
            }
          }

          if (passed === false) {
            console.debug("vertex out of MBS!");
          }
        }

        return mat;
      },

      reprojectPointsPerVertex: function(pointArray, normalArray, mbs, srMbs, srPoints, renderSR, isReprojected) {

        var global = mat4d.create();
        projectionUtils.computeLinearTransformation(srMbs, mbs, global, renderSR);

        var globalInv = mat4d.create();
        globalInv = mat4d.inverse(global,globalInv);

        var local = mat4d.create();
        mat4d.identity(local);

        var pos3d = vec3d.create();
        var projCordDelta = vec3d.create();

        if (!isReprojected) {

          var projCordCenter = [0,0,0];
          var pointData = pointArray.data;
          var count = pointData.length / 3;
          projectionUtils.vectorToVector(mbs, srMbs, projCordCenter, srPoints);

          var vIdx = 0;

          for (var batch_offset = 0; batch_offset < count; batch_offset += reproject_batch_size ) {
            var batch_count = Math.min(reproject_batch_size, count - batch_offset);
            for (vIdx = 0; vIdx < batch_count; vIdx++) {
              reproject_temp[vIdx * 3 + 0] = pointData[(batch_offset + vIdx) * 3 + 0] + projCordCenter[0];
              reproject_temp[vIdx * 3 + 1] = pointData[(batch_offset + vIdx) * 3 + 1] + projCordCenter[1];
              reproject_temp[vIdx * 3 + 2] = pointData[(batch_offset + vIdx) * 3 + 2] + projCordCenter[2];
            }

            projectionUtils.bufferToBuffer(reproject_temp, srPoints, 0, reproject_temp, renderSR, 0, batch_count);

            var x, y, z;
            for (vIdx = 0; vIdx < batch_count; vIdx++) {
              x = reproject_temp[vIdx * 3 + 0];
              y = reproject_temp[vIdx * 3 + 1];
              z = reproject_temp[vIdx * 3 + 2];
              //inline of mat4d.multiplyVec3(globalInv, pos3d, vecTemp);
              pointData[(batch_offset + vIdx) * 3 + 0] = globalInv[0] * x + globalInv[4] * y + globalInv[8] * z + globalInv[12];
              pointData[(batch_offset + vIdx) * 3 + 1] = globalInv[1] * x + globalInv[5] * y + globalInv[9] * z + globalInv[13];
              pointData[(batch_offset + vIdx) * 3 + 2] = globalInv[2] * x + globalInv[6] * y + globalInv[10] * z + globalInv[14];
            }
          }
        }

        return  {localTrafo: local, globalTrafo:global};
      },

      reprojectBoundingBox: function(positions, mbs, geographicCRS, projectedCRS, renderSR) {

        //get boundingbox of all points; in projectedCRS relative to center
        var bbMin = [Number.MAX_VALUE,Number.MAX_VALUE,Number.MAX_VALUE];
        var bbMax = [-Number.MAX_VALUE,-Number.MAX_VALUE,-Number.MAX_VALUE];
        for (var vIdx = 0; vIdx<positions.data.length/3; vIdx++) {
          var relative = [positions.data[vIdx * 3 + 0], positions.data[vIdx * 3 + 1], positions.data[vIdx * 3 + 2]];
          for (var coordIdx=0; coordIdx<3; coordIdx++) {
            bbMin[coordIdx] = Math.min(bbMin[coordIdx],relative[coordIdx]);
            bbMax[coordIdx] = Math.max(bbMax[coordIdx],relative[coordIdx]);
          }
        }

        //add centerProjectedCRS to get absolute coordinates
        var centerProjectedCRS = this.geographicToProjected(mbs, geographicCRS, projectedCRS);
        vec3d.add(centerProjectedCRS,bbMin,bbMin);
        vec3d.add(centerProjectedCRS,bbMax,bbMax);
        for (var i=0; i<3; i++) {
          if (bbMax[i]==bbMin[i]) {
            bbMax[i] += 1; //handle cases with zero length
          }
        }

        //get 4 bounding box corner points, and calculate 3d space position for them
        var bbCorners =[ [bbMin[0],bbMin[1],bbMin[2]], [bbMax[0],bbMin[1],bbMin[2]], [bbMin[0],bbMax[1],bbMin[2]], [bbMin[0],bbMin[1],bbMax[2]]];
        for (var pIdx = 0; pIdx<4; pIdx++) {
          var p = bbCorners[pIdx];
          projectionUtils.vectorToVector(p, projectedCRS, p, renderSR);
        }

        //get vectors between bounding box points
        var xVec = vec3d.subtract(bbCorners[1],bbCorners[0],vec3d.create());
        var yVec = vec3d.subtract(bbCorners[2],bbCorners[0],vec3d.create());
        var zVec = vec3d.subtract(bbCorners[3],bbCorners[0],vec3d.create());


        //scale them
        vec3d.scale(xVec, 1.0/(bbMax[0]-bbMin[0]));
        vec3d.scale(yVec, 1.0/(bbMax[1]-bbMin[1]));
        vec3d.scale(zVec, 1.0/(bbMax[2]-bbMin[2]));

        var sx = vec3d.length(xVec);
        var sy = vec3d.length(yVec);
        var sz = vec3d.length(zVec);

        //very non-uniform scaling? (happens on wgs84 points with height)
        //->apply to source points to prevent numerical errors and way too big bounding spheres
        if (Math.abs(sx-sy)>3 || Math.abs(sx-sz)>3 || Math.abs(sy-sz)>3) {
          for (vIdx = 0; vIdx<positions.data.length/3; vIdx++) {
            positions.data[vIdx * 3 + 0] *= sx;
            positions.data[vIdx * 3 + 1] *= sy;
            positions.data[vIdx * 3 + 2] *= sz;
          }
          vec3d.normalize(xVec);
          vec3d.normalize(yVec);
          vec3d.normalize(zVec);
        }

        //local trafo to be used on every vertex in the shader
        var localTrafo = mat4d.createFromMatrixRowMajor([
          xVec[0], yVec[0],zVec[0],0,
          xVec[1], yVec[1],zVec[1],0,
          xVec[2], yVec[2],zVec[2],0,
          0,0,0,1
        ]);

        //calc global translation matrix, placing the object in 3d space
        var center3D = [0,0,0,0];
        projectionUtils.vectorToVector(mbs, geographicCRS, center3D, renderSR);
        var globalTrafo = mat4d.createFromMatrixRowMajor([
          1,0,0,center3D[0],
          0,1,0,center3D[1],
          0,0,1,center3D[2],
          0,0,0,1
        ]);

        return {globalTrafo:globalTrafo, localTrafo:localTrafo};
      },

      geographicToProjected: function(mbsCenterGeographicCrs, geographicCRS, projectedCRS) {
        //project bounding sphere center to projectedCRS
        if (projectionUtils.wkidIsUTM(projectedCRS.wkid)) {
          var lat = mbsCenterGeographicCrs[1];
          var lon = mbsCenterGeographicCrs[0];
          var utm = proj4.LLtoUTM(lat, lon);
          return [utm.easting, utm.northing, mbsCenterGeographicCrs[2]];
        }
        else if (projectedCRS.wkid === WKID_WGS84) {
          return [mbsCenterGeographicCrs[0],mbsCenterGeographicCrs[1], mbsCenterGeographicCrs[2]];
        }
        else
        {
          return mbsCenterGeographicCrs;
        }
      }
    };

    return I3SProjectionUtil;
  }
);
