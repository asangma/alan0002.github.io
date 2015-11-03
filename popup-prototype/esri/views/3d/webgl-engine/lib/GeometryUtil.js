/* jshint forin:false */
define([
  "./GeometryData",
  "./BufferVectorMath",
  "./Util",
  "./gl-matrix"
  ], function (GeometryData, BufferVectorMath, Util, glMatrix) {

  var vec3 = glMatrix.vec3;
  var vec3d = glMatrix.vec3d;
  var VertexAttrConstants = Util.VertexAttrConstants;
  var bvec3 = BufferVectorMath.Vec3Compact;


  function createBoxGeometryFunc() {
    var i, j;

    // static variables for boxes:
    var s = 0.5;
    var boxCorners = [
      [-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s],
      [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s]
    ];

    var normals = [
      0, 0, 1,    -1, 0, 0,    1, 0, 0,
      0, -1, 0,    0, 1, 0,   0, 0, -1
    ];

    var uvs = [0, 0, 1, 0, 1, 1, 0, 1];

    var vertexIndices = [
      0, 1, 2,    2, 3, 0, // front
      4, 0, 3,    3, 7, 4, // right
      1, 5, 6,    6, 2, 1, // left
      1, 0, 4,    4, 5, 1, // top
      3, 2, 6,    6, 7, 3, // bottom
      5, 4, 7,    7, 6, 5  // back
    ];

    var normalIndices = new Array(3*2*6);
    for (i = 0; i < 6; i++) {
      for (j = 0; j < 6; j++) {
        normalIndices[i*6+j] = i;
      }
    }
    var uvIndices = new Array(3*2*6);
    for (i = 0; i < 6; i++) {
      uvIndices[i*6 + 0] = 0;
      uvIndices[i*6 + 1] = 1;
      uvIndices[i*6 + 2] = 2;
      uvIndices[i*6 + 3] = 2;
      uvIndices[i*6 + 4] = 3;
      uvIndices[i*6 + 5] = 0;
    }

    return function createBoxGeometry(size) {
      var i;
      if (!Array.isArray(size)) {
        size = [size, size, size];
      }

      var vertices = new Float32Array(8*3);
      for (i = 0; i < 8; i++) {
        vertices[i*3] = boxCorners[i][0]*size[0];
        vertices[i*3+1] = boxCorners[i][1]*size[1];
        vertices[i*3+2] = boxCorners[i][2]*size[2];
      }

      var indices3 = {};
      indices3[VertexAttrConstants.POSITION] = new Uint8Array(vertexIndices);
      indices3[VertexAttrConstants.NORMAL] = new Uint8Array(normalIndices);
      indices3[VertexAttrConstants.UV0] = new Uint8Array(uvIndices);
      var vertexAttr = {};
      vertexAttr[VertexAttrConstants.POSITION] = { "size" : 3, "data" : vertices };
      vertexAttr[VertexAttrConstants.NORMAL] = { "size" : 3, "data" : new Float32Array(normals) };
      vertexAttr[VertexAttrConstants.UV0] = { "size" : 2, "data" : new Float32Array(uvs) };

      var faces = [ { "type" : "triangle", "indices" : indices3, "positionKey" : VertexAttrConstants.POSITION } ];

      return new GeometryData(faces, vertexAttr);
    };
  }

  function createDiamondGeometryFunc() {
    var s = 0.5;
    var diamondCorners = [
      [-s, 0, -s], [s, 0, -s], [s, 0, s], [-s, 0, s],
      [0, -s, 0], [0, s, 0]
    ];

    var normals = [
      0,  1, -1,   1,  1,  0,   0,  1, 1,   -1,  1, 0,
      0, -1, -1,   1, -1,  0,   0, -1, 1,   -1, -1, 0
    ];

    var vertexIndices = [
      5, 1, 0,
      5, 2, 1, 
      5, 3, 2,
      5, 0, 3,
      4, 0, 1,
      4, 1, 2, 
      4, 2, 3, 
      4, 3, 0
    ];

    var normalIndices = [
      0, 0, 0, 
      1, 1, 1, 
      2, 2, 2, 
      3, 3, 3, 
      4, 4, 4,
      5, 5, 5,
      6, 6, 6, 
      7, 7, 7
    ];

    return function createDiamondGeometry(size) {
      var i;
      if (!Array.isArray(size)) {
        size = [size, size, size];
      }

      var vertices = new Float32Array(6*3);
      for (i = 0; i < 6; i++) {
        vertices[i*3]   = diamondCorners[i][0]*size[0];
        vertices[i*3+1] = diamondCorners[i][1]*size[1];
        vertices[i*3+2] = diamondCorners[i][2]*size[2];
      }

      var indices4 = {};
      indices4[VertexAttrConstants.POSITION] = new Uint8Array(vertexIndices);
      indices4[VertexAttrConstants.NORMAL] = new Uint8Array(normalIndices);
      var vertexAttr = {};
      vertexAttr[VertexAttrConstants.POSITION] = { "size" : 3, "data" : vertices };
      vertexAttr[VertexAttrConstants.NORMAL] = { "size" : 3, "data" : new Float32Array(normals) };

      var faces = [ { "type" : "triangle", "indices" : indices4, "positionKey" : VertexAttrConstants.POSITION } ];

      return new GeometryData(faces, vertexAttr);
    };
  }

  function createTetrahedronGeometryFunc() {
    var s = 0.5;
    var p = 0; //height offset
    var a = vec3.createFrom(-s, p, -s);
    var b = vec3.createFrom( s, p, -s);
    var c = vec3.createFrom( 0, p,  s);
    var d = vec3.createFrom( 0, p+s,  0);

    var t1 = vec3.create();
    var t2 = vec3.create();

    var r1 = vec3.create();
    var r2 = vec3.create();
    var r3 = vec3.create();

    vec3.subtract(a, d, t1);
    vec3.subtract(a, b, t2);
    vec3.cross(t1, t2, r1);
    vec3.normalize(r1, r1);

    vec3.subtract(b, d, t1);
    vec3.subtract(b, c, t2);
    vec3.cross(t1, t2, r2);
    vec3.normalize(r2, r2);

    vec3.subtract(c, d, t1);
    vec3.subtract(c, a, t2);
    vec3.cross(t1, t2, r3);
    vec3.normalize(r3, r3);
   
    var tetrahedronCorners = [a, b, c, d];
    var normals = [ 0, -1, 0, r1[0], r1[1], r1[2], r2[0], r2[1], r2[2], r3[0], r3[1], r3[2] ];

    var vertexIndices = [
      0, 1, 2,
      3, 1, 0,
      3, 2, 1, 
      3, 0, 2 
    ];

    var normalIndices = [
      0, 0, 0, 
      1, 1, 1, 
      2, 2, 2, 
      3, 3, 3
    ];

    return function createTetrahedronGeometry(size) {
      var i;
      if (!Array.isArray(size)) {
        size = [size, size, size];
      }

      var vertices = new Float32Array(4*3);
      for (i = 0; i < 4; i++) {
        vertices[i*3]   = tetrahedronCorners[i][0]*size[0];
        vertices[i*3+1] = tetrahedronCorners[i][1]*size[1];
        vertices[i*3+2] = tetrahedronCorners[i][2]*size[2];
      }

      var indices4 = {};
      indices4[VertexAttrConstants.POSITION] = new Uint8Array(vertexIndices);
      indices4[VertexAttrConstants.NORMAL] = new Uint8Array(normalIndices);
      var vertexAttr = {};
      vertexAttr[VertexAttrConstants.POSITION] = { "size" : 3, "data" : vertices };
      vertexAttr[VertexAttrConstants.NORMAL] = { "size" : 3, "data" : new Float32Array(normals) };

      var faces = [ { "type" : "triangle", "indices" : indices4, "positionKey" : VertexAttrConstants.POSITION } ];

      return new GeometryData(faces, vertexAttr);
    };
  }

  var tmpVec1 = vec3d.create(),
      tmpVec2 = vec3d.create();

  var GeometryUtil = {
    createSphereGeometry: function(radius, segmentsWidth, segmentsHeight, phiStart, phiLength, thetaStart, thetaLength) {
      radius = radius || 50;

      phiStart = phiStart !== undefined ? phiStart : -Math.PI;
      phiLength = phiLength !== undefined ? phiLength : Math.PI * 2.0;

      thetaStart = thetaStart !== undefined ? thetaStart : -Math.PI * 0.5;
      thetaLength = thetaLength !== undefined ? thetaLength : Math.PI;

      var segmentsX = Math.max( 3, Math.floor( segmentsWidth ) || 8 );
      var segmentsY = Math.max( 2, Math.floor( segmentsHeight ) || 6 );

      var numV = (segmentsX + 1) * (segmentsY + 1);
      
      var vertices = new Float32Array(numV * 3);
      var normals = new Float32Array(numV * 3);
      var uvs = new Float32Array(numV * 2);
      
      var x, y, indices = [];

      var normal = vec3.create();
      
      var cur = 0;

      for (y = 0; y <= segmentsY; y ++) {
        var indicesRow = [];
        
        var v = y / segmentsY;

        var lat = thetaStart + v * thetaLength;
        var cosLat = Math.cos(lat);
        
        for (x = 0; x <= segmentsX; x++) {
          var u = x / segmentsX;

          var lon = phiStart + u * phiLength;
          
          var xpos = Math.cos(lon) * cosLat * radius;
          var ypos = Math.sin(lat) * radius;
          var zpos = -Math.sin(lon) * cosLat * radius;
          
          vertices[3 * cur] = xpos; vertices[3 * cur + 1] = ypos; vertices[3 * cur + 2] = zpos;
          vec3.set3(xpos, ypos, zpos, normal);
          vec3.normalize(normal);
          normals[3 * cur] = normal[0]; normals[3 * cur + 1] = normal[1]; normals[3 * cur + 2] = normal[2];
          uvs[2 * cur] = u; uvs[2 * cur + 1] = v;

          indicesRow.push(cur);
          ++cur;
        }

        indices.push( indicesRow );
      }
      
      
      var indices2 = new Uint32Array(segmentsX * 2 * (segmentsY - 1) * 3);
      cur = 0;
      
      for (y = 0; y < segmentsY; y++) {
        for (x = 0; x < segmentsX; x++) {
          var v1 = indices[y][x];
          var v2 = indices[y][x + 1];
          var v3 = indices[y + 1][x + 1];
          var v4 = indices[y + 1][x];

          if (y === 0) {
            indices2[cur++] = v1;
            indices2[cur++] = v3;
            indices2[cur++] = v4;
          } else if (y === segmentsY-1) {
            indices2[cur++] = v1;
            indices2[cur++] = v2;
            indices2[cur++] = v3;
          } else {
            indices2[cur++] = v1;
            indices2[cur++] = v2;
            indices2[cur++] = v3;

            indices2[cur++] = v3;
            indices2[cur++] = v4;
            indices2[cur++] = v1;
          }
        }
      }
      
      Util.assert(cur === indices2.length);
      
      var indices3 = {};
      indices3[VertexAttrConstants.POSITION] = indices2;
      indices3[VertexAttrConstants.NORMAL] = indices2;
      indices3[VertexAttrConstants.UV0] = indices2;
      var vertexAttr = {};
      vertexAttr[VertexAttrConstants.POSITION] = { "size" : 3, "data" : vertices };
      vertexAttr[VertexAttrConstants.NORMAL] = { "size" : 3, "data" : normals };
      vertexAttr[VertexAttrConstants.UV0] = { "size" : 2, "data" : uvs };
      
      var faces = [ { "type" : "triangle", "indices" : indices3, "positionKey" : VertexAttrConstants.POSITION } ];
      
      return new GeometryData(faces, vertexAttr);
    },

    createPolySphereGeometry: function(radius, iterations, octaInsteadOfIco) {
      // Code inspired by http://blog.andreaskahler.com/2009/06/creating-icosphere-mesh-in-code.html
    //  Number of faces generated:
    //  Iterations  Octahedron  Icosahedron
    //           0           8           20
    //           1          32           80
    //           2         128          320
    //           3         512         1280
    //           4        2048         5120

      var i;

      var r = radius;
      var vertices, indices;
      if (octaInsteadOfIco) {
        vertices = [
           0, -1, 0,    1, 0,  0,    0, 0, 1,
          -1,  0, 0,    0, 0, -1,    0, 1, 0
        ];
        indices = [
          0, 1, 2,   0, 2, 3,   0, 3, 4,   0, 4, 1,
          1, 5, 2,   2, 5, 3,   3, 5, 4,   4, 5, 1
        ];
      }
      else {
        var t = r * (1.0 + Math.sqrt(5.0)) / 2.0;
        vertices = [
          -r,  t,  0,     r,  t,  0,    -r, -t,  0,     r, -t,  0,
          0, -r,  t,     0,  r,  t,     0, -r, -t,     0,  r, -t,
          t,  0, -r,     t,  0,  r,    -t,  0, -r,    -t,  0,  r
        ];
        indices = [
          0, 11, 5,    0, 5, 1,    0, 1, 7,    0, 7, 10,    0, 10, 11,
          1, 5, 9,    5, 11, 4,    11, 10, 2,    10, 7, 6,    7, 1, 8,
          3, 9, 4,    3, 4, 2,    3, 2, 6,    3, 6, 8,    3, 8, 9,
          4, 9, 5,    2, 4, 11,    6, 2, 10,    8, 6, 7,    9, 8, 1
        ];
      }
      for (i = 0; i < vertices.length; i+=3) {
        bvec3.scale(vertices, i, radius / bvec3.length(vertices, i));
      }

      // then subdivide the icosahedron's edges
      var vertexCache = {};
      function getMiddlePoint(i1, i2) {
        if (i1 > i2) {
          i1 = i2 + (i2=i1, 0); // swap
        }
        var hash = i1.toString() + "." + i2.toString();
        if (vertexCache[hash]) {
          return vertexCache[hash];
        }
        var iNew = vertices.length;
        vertices.length += 3;
        bvec3.add(vertices, i1*3, vertices, i2*3, vertices, iNew);
        bvec3.scale(vertices, iNew, radius / bvec3.length(vertices, iNew));
        iNew /= 3;
        vertexCache[hash] = iNew;
        return iNew;
      }
      for (i = 0; i < iterations; i++) {
        var numIndices = indices.length;
        var newIndices = new Array(numIndices*4);
        for (var ii = 0; ii < numIndices; ii += 3) {
          var o1 = indices[ii], o2 = indices[ii+1], o3 = indices[ii+2];
          var n1 = getMiddlePoint(o1, o2),
            n2 = getMiddlePoint(o2, o3),
            n3 = getMiddlePoint(o3, o1);
          var offs = ii*4;
          newIndices[offs    ] = o1; newIndices[offs + 1] = n1; newIndices[offs + 2] = n3;
          newIndices[offs + 3] = o2; newIndices[offs + 4] = n2; newIndices[offs + 5] = n1;
          newIndices[offs + 6] = o3; newIndices[offs + 7] = n3; newIndices[offs + 8] = n2;
          newIndices[offs + 9] = n1; newIndices[offs + 10] = n2; newIndices[offs + 11] = n3;
        }
        indices = newIndices;
        vertexCache = {};
      }

      var normals = new Float32Array(vertices);
      for (i = 0; i < normals; i+= 3) {
        bvec3.normalize(normals, i);
      }

      vertices = new Float32Array(vertices);

      var indexData = {};
      indexData[VertexAttrConstants.POSITION] = indices;
      indexData[VertexAttrConstants.NORMAL] = indices;


      var vertexAttr = {};
      vertexAttr[VertexAttrConstants.POSITION] = { "size" : 3, "data" : vertices };
      vertexAttr[VertexAttrConstants.NORMAL] = { "size" : 3, "data" : normals };

      var faceData = [ { "type" : "triangle", "indices" : indexData, "positionKey" : VertexAttrConstants.POSITION } ];

      return new GeometryData(faceData, vertexAttr);
    },

    createPointGeometry: function(normal, position, color, size, renderGeometryStyle, customData, _uvs) {
      var vertices = new Float32Array(3);
      vertices[0] = position ? position[0] : 0.0;
      vertices[1] = position ? position[1] : 0.0;
      vertices[2] = position ? position[2] : 0.0;

      var normals = new Float32Array(3);
      normals[0] = normal ? normal[0] : 0.0;
      normals[1] = normal ? normal[1] : 0.0;
      normals[2] = normal ? normal[2] : 1.0;

      if (_uvs == null) {
        var uvs = new Float32Array(2);
        uvs[0] = 0;
        uvs[1] = 0;
      }
      else {
        uvs = new Float32Array(_uvs.length);
        
        for (var i = 0; i < _uvs.length; i++) {
          uvs[i] = _uvs[i];
        }
      }

      var colors = new Uint8Array(4);
      colors[0] = color ? 255 * color[0] : 255.0;
      colors[1] = color ? 255 * color[1] : 255.0;
      colors[2] = color ? 255 * color[2] : 255.0;
      colors[3] = (color && (color.length > 3)) ? 255.0 * color[3] : 255.0;

      var sizes = new Float32Array(2);
      sizes[0] = (size != null && size.length==2) ? size[0] : 1;
      sizes[1] = (size != null && size.length==2) ? size[1] : 1;

      if (customData!=null) {
        var custom = new Float32Array(4);

        custom[0] = customData[0];
        custom[1] = customData[1];
        custom[2] = customData[2];
        custom[3] = customData[3];
      }

      var indices2 = new Uint32Array(1);
      indices2[0] = 0;

      var indices3 = {};
      indices3[VertexAttrConstants.POSITION] = indices2;
      indices3[VertexAttrConstants.NORMAL] = indices2;
      indices3[VertexAttrConstants.UV0] = indices2;
      indices3[VertexAttrConstants.COLOR] = indices2;
      indices3[VertexAttrConstants.SIZE] = indices2;

      if (customData != null ){
        indices3[VertexAttrConstants.AUXPOS1] = indices2;
      }
      
      var vertexAttr = {};
      vertexAttr[VertexAttrConstants.POSITION] = { "size" : 3, "data" : vertices };
      vertexAttr[VertexAttrConstants.NORMAL] = { "size" : 3, "data" : normals };  
      vertexAttr[VertexAttrConstants.UV0] = { "size" : uvs.length, "data" : uvs };
      vertexAttr[VertexAttrConstants.COLOR] = { "size" : 4, "data" : colors };
      vertexAttr[VertexAttrConstants.SIZE] = { "size" : 2, "data" : sizes };

      if (customData != null ){
        vertexAttr[VertexAttrConstants.AUXPOS1] = { "size" : 4, "data" : custom };
      }

      var faces = [ { "type" : "point", "indices" : indices3, "positionKey" : VertexAttrConstants.POSITION } ];

      if (renderGeometryStyle) {
        return {
          "faces" : faces[0],
          "vertexAttr" : vertexAttr,
          "id" : GeometryData.getNewId().toString()  // toString()ing it to make it same type as with proper GeometryData (see Model.getGeometryRenderGeometries())
        };
      } else {
        return new GeometryData(faces, vertexAttr);
      }
    },

    createPointArrayGeometry: function(points, normals) {
      var vertices = new Float32Array(points.length * 3);
      var normalsOut = new Float32Array(normals ? points.length * 3 : 3);

      var vertexIndices = new Uint32Array(points.length);
      var auxIndices = new Uint32Array(points.length);

      for (var i = 0; i < points.length; i++) {
        vertices[i*3] = points[i][0];
        vertices[i*3+1] = points[i][1];
        vertices[i*3+2] = points[i][2];

        if (normals) {
          normalsOut[i*3] = normals[i][0];
          normalsOut[i*3+1] = normals[i][1];
          normalsOut[i*3+2] = normals[i][2];
        }

        vertexIndices[i] = i;
        auxIndices[i] = 0;
      }


      if (!normals) {
        normalsOut[0] = 0;
        normalsOut[1] = 1;
        normalsOut[2] = 0;
      }

      var uvs = new Float32Array(2);
      uvs[0] = 0;
      uvs[1] = 0;

      var indices3 = {};
      indices3[VertexAttrConstants.POSITION] = vertexIndices;
      indices3[VertexAttrConstants.NORMAL] = normals ? vertexIndices : auxIndices;
      indices3[VertexAttrConstants.UV0] = auxIndices;
      var vertexAttr = {};
      vertexAttr[VertexAttrConstants.POSITION] = { "size" : 3, "data" : vertices };
      vertexAttr[VertexAttrConstants.NORMAL] = { "size" : 3, "data" : normalsOut };
      vertexAttr[VertexAttrConstants.UV0] = { "size" : 2, "data" : uvs };

      var faces = [ { "type" : "point", "indices" : indices3, "positionKey" : VertexAttrConstants.POSITION } ];

      return new GeometryData(faces, vertexAttr);
    },

    createTriangleGeometry: function() {
      var vertices = new Float32Array(9);
      vertices[0] = 0.0;
      vertices[1] = 0.0;
      vertices[2] = 0.0;
      vertices[3] = 0.0;
      vertices[4] = 0.0;
      vertices[5] = 100.0;
      vertices[6] = 100.0;
      vertices[7] = 0.0;
      vertices[8] = 0.0;
      
      var indices2 = new Uint32Array(3);
      indices2[0] = 0;
      indices2[1] = 1;
      indices2[2] = 2;
      
      var normals = new Float32Array(3);
      normals[0] = 0.0;
      normals[1] = 1.0;
      normals[2] = 0.0;
      var indicesN = new Uint32Array(3);
      indicesN[0] = 0;
      indicesN[1] = 0;
      indicesN[2] = 0;
      
      var uvs = new Float32Array(2);
      uvs[0] = 0;
      uvs[1] = 0;
      var indicesU = new Uint32Array(3);
      indicesU[0] = 0;
      indicesU[1] = 0;
      indicesU[2] = 0;
      
      var indices3 = {};
      indices3[VertexAttrConstants.POSITION] = indices2;
      indices3[VertexAttrConstants.NORMAL] = indicesN;
      indices3[VertexAttrConstants.UV0] = indicesU;
      var vertexAttr = {};
      vertexAttr[VertexAttrConstants.POSITION] = { "size" : 3, "data" : vertices };
      vertexAttr[VertexAttrConstants.NORMAL] = { "size" : 3, "data" : normals };
      vertexAttr[VertexAttrConstants.UV0] = { "size" : 2, "data" : uvs };
      
      var faces = [ { "type" : "triangle", "indices" : indices3, "positionKey" : VertexAttrConstants.POSITION } ];
      
      
      return new GeometryData(faces, vertexAttr);
    },

    createSquareGeometry: function(vertices_, renderGeometryStyle) {
      var i, j;
      var vertices = new Float32Array(12);
      if (vertices_) {
        for (i = 0; i < 4; i++) {
          for (j = 0; j < 3; j++) {
            vertices[i*3 + j] = vertices_[i][j];
          }
        }
      } else {
        vertices[0] = -1.0; vertices[1] = -1.0;  vertices[2] = 0.0;
        vertices[3] =  1.0; vertices[4] = -1.0; vertices[5] = 0.0;
        vertices[6] =  1.0; vertices[7] =  1.0; vertices[8] = 0.0;
        vertices[9] = -1.0; vertices[10]=  1.0; vertices[11]= 0.0;
      }

      var indices2 = new Uint32Array(6);
      indices2[0] = 0; indices2[1] = 1; indices2[2] = 2;
      indices2[3] = 2; indices2[4] = 3; indices2[5] = 0;

      var normals = new Float32Array(3);
      normals[0] = 0.0;
      normals[1] = 0.0;
      normals[2] = 1.0;
      var indicesN = new Uint32Array(6);
      for (i = 0; i < 6; i++) {
        indicesN[i] = 0;
      }

      var uvs = new Float32Array(8);
      uvs[0] = 0.0;  uvs[1] = 0.0;
      uvs[2] = 1.0;  uvs[3] = 0.0;
      uvs[4] = 1.0;  uvs[5] = 1.0;
      uvs[6] = 0.0;  uvs[7] = 1.0;

      var indices3 = {};
      indices3[VertexAttrConstants.POSITION] = indices2;
      indices3[VertexAttrConstants.NORMAL] = indicesN;
      indices3[VertexAttrConstants.UV0] = indices2;
      var vertexAttr = {};
      vertexAttr[VertexAttrConstants.POSITION] = { "size" : 3, "data" : vertices };
      vertexAttr[VertexAttrConstants.NORMAL] = { "size" : 3, "data" : normals };
      vertexAttr[VertexAttrConstants.UV0] = { "size" : 2, "data" : uvs };

      var faces = [ { "type" : "triangle", "indices" : indices3, "positionKey" : VertexAttrConstants.POSITION } ];

      if (renderGeometryStyle) {
        return {
          "faces" : faces[0],
          "vertexAttr" : vertexAttr,
          "id" : GeometryData.getNewId().toString()  // toString()ing it to make it same type as with proper GeometryData (see Model.getGeometryRenderGeometries())
        };
      } else {
        return new GeometryData(faces, vertexAttr);
      }
    },

    createBoxGeometry: createBoxGeometryFunc(),
    createDiamondGeometry: createDiamondGeometryFunc(),
    createTetrahedronGeometry: createTetrahedronGeometryFunc(),

    createConeGeometry: function(length, radius, segments, inverse) {
      var i;

      var p = 0; //height offset  
      var r = radius;
      var h = length;

      var c = vec3.createFrom(0, p, 0);
      var t = vec3.createFrom(0, p+h, 0);
      var bn = vec3.createFrom(0, -1, 0);
      var tn = vec3.createFrom(0, 1, 0);

      if (inverse) {
        p = h;
        t = vec3.createFrom(0, 0, 0);
        c = vec3.createFrom(0, p, 0);
        bn = vec3.createFrom(0, 1, 0);
        tn = vec3.createFrom(0, -1, 0);
      } 

      var coneCorners = [t, c];
      var coneNormals = [bn, tn];

      var nrVertices = segments + 2;   
      var phi = 0;
      var l = Math.sqrt(h * h + r * r);
        
      if (!inverse) {  
        for (i = 0; i<segments; i++) {
          phi = i*(2*Math.PI / segments);

          var v = vec3.createFrom(Math.cos(phi) * r, p, Math.sin(phi) * r);
          coneCorners.push(v);

          var n = vec3.createFrom(h * Math.cos(phi)/l, r/l, h*Math.sin(phi)/l);
          coneNormals.push(n);
        }
      } else {
        for (i = segments-1; i>=0; i--) {
          phi = i*(2*Math.PI / segments);

          v = vec3.createFrom(Math.cos(phi) * r, p, Math.sin(phi) * r);
          coneCorners.push(v);

          n = vec3.createFrom(h * Math.cos(phi)/l, -r/l, h*Math.sin(phi)/l);
          coneNormals.push(n);
        } 
      }

      var vertexIndices = new Uint32Array((2*(segments+2)) * 3);
      var normalIndices = new Uint32Array((2*(segments+2)) * 3);  

      //Cap
      var idx = 0, tidx = 0;
      for(i = 3; i<coneCorners.length; i++)
      {
        vertexIndices[idx++] = 1;
        vertexIndices[idx++] = i-1;
        vertexIndices[idx++] = i;

        normalIndices[tidx++] = 0;
        normalIndices[tidx++] = 0;
        normalIndices[tidx++] = 0;
      }

      vertexIndices[idx++] = coneCorners.length-1;
      vertexIndices[idx++] = 2;
      vertexIndices[idx++] = 1;

      normalIndices[tidx++] = 0;
      normalIndices[tidx++] = 0;
      normalIndices[tidx++] = 0;  

      //Side
      for(i = 3; i<coneCorners.length; i++)
      {
        vertexIndices[idx++] = i;
        vertexIndices[idx++] = i-1;
        vertexIndices[idx++] = 0;

        normalIndices[tidx++] = i;
        normalIndices[tidx++] = i-1;
        normalIndices[tidx++] = 1;
      }

      vertexIndices[idx++] = 0;
      vertexIndices[idx++] = 2;
      vertexIndices[idx++] = coneCorners.length-1;

      normalIndices[tidx++] = 1;
      normalIndices[tidx++] = 2;
      normalIndices[tidx++] = coneNormals.length-1;

      var size = 1;
      if (!Array.isArray(size)) {
        size = [size, size, size];
      }

      var vertices = new Float32Array(nrVertices*3);
      for (i = 0; i < nrVertices; i++) {
        vertices[i*3]   = coneCorners[i][0]*size[0];
        vertices[i*3+1] = coneCorners[i][1]*size[1];
        vertices[i*3+2] = coneCorners[i][2]*size[2];
      }

      var normals = new Float32Array(nrVertices*3);
      for (i = 0; i < nrVertices; i++) {
        normals[i*3]   = coneNormals[i][0];
        normals[i*3+1] = coneNormals[i][1];
        normals[i*3+2] = coneNormals[i][2];
      }    

      var indices4 = {};
      indices4[VertexAttrConstants.POSITION] = vertexIndices;
      indices4[VertexAttrConstants.NORMAL] = normalIndices;
      var vertexAttr = {};
      vertexAttr[VertexAttrConstants.POSITION] = { "size" : 3, "data" : vertices };
      vertexAttr[VertexAttrConstants.NORMAL] = { "size" : 3, "data" : normals };

      var faces = [ { "type" : "triangle", "indices" : indices4, "positionKey" : VertexAttrConstants.POSITION } ];

      return new GeometryData(faces, vertexAttr);
    },

    createCylinderGeometry: function(length, radius, segments, direction, position, cap_) {
      if (!direction) {
        direction = vec3.createFrom(1.0, 0.0, 0.0);
      }
      
      if (!position) {
        position = vec3.createFrom(0.0, 0.0, 0.0);
      }
      
      var cap = cap_===undefined?true:cap_;    
      
      var unitDir = vec3.create();
      vec3.normalize(direction, unitDir);
      var scaledDir = vec3.create();
      vec3.scale(unitDir, Math.abs(length), scaledDir);
      
      var basePos = vec3.create(); // = position - 0.5*length*direction
      vec3.scale(scaledDir, -0.5, basePos);
      vec3.add(basePos, position);

      // create transformation to desired direction
      var basis1 = vec3.createFrom(0.0, 1.0, 0.0);
      if (Math.abs(1 - vec3.dot(unitDir, basis1) < 0.2)) {
        vec3.set3(0.0, 0.0, 1.0, basis1);
      }
      var basis2 = vec3.create();
      vec3.cross(unitDir, basis1, basis2);
      vec3.normalize(basis2);
      vec3.cross(basis2, unitDir, basis1);

      var numVerts = segments*2 + (cap?2:0);
      var numNormals = segments + (cap?2:0);
      var vertices = new Float32Array(numVerts*3);
      var normals = new Float32Array(numNormals*3);
      var uvs = new Float32Array(numVerts*2);
      var indices = new Uint32Array(segments*3*(cap?4:2));
      var normalIndices = new Float32Array(segments*3*(cap?4:2));

      // cap vertices (at the end of the array)
      if (cap) {
        vertices[(numVerts-2)*3 + 0] = basePos[0];
        vertices[(numVerts-2)*3 + 1] = basePos[1];
        vertices[(numVerts-2)*3 + 2] = basePos[2];
        uvs[(numVerts-2)*2] = 0.0; uvs[(numVerts-2)*2 +1 ] = 0.0;
        vertices[(numVerts-1)*3 + 0] = vertices[(numVerts-2)*3 + 0] + scaledDir[0];
        vertices[(numVerts-1)*3 + 1] = vertices[(numVerts-2)*3 + 1] + scaledDir[1];
        vertices[(numVerts-1)*3 + 2] = vertices[(numVerts-2)*3 + 2] + scaledDir[2];
        uvs[(numVerts-1)*2] = 1.0; uvs[(numVerts-1)*2 + 1] = 1.0;
        
        // cap normals at the end of the array
        normals[(numNormals-2)*3 + 0] = -unitDir[0];
        normals[(numNormals-2)*3 + 1] = -unitDir[1];
        normals[(numNormals-2)*3 + 2] = -unitDir[2];
        normals[(numNormals-1)*3 + 0] = unitDir[0];
        normals[(numNormals-1)*3 + 1] = unitDir[1];
        normals[(numNormals-1)*3 + 2] = unitDir[2];
      }
      
      // side
      var i, iNext, phi, faceInd = 0;
      var tmpV1 = vec3.create(), tmpV2 = vec3.create();
      for (i = 0; i < segments; i++) {
        // compute ring around base
        phi = i*(2*Math.PI / segments);
        vec3.scale(basis1, Math.sin(phi), tmpV1);
        vec3.scale(basis2, Math.cos(phi), tmpV2);
        vec3.add(tmpV1, tmpV2);
        normals[i*3 + 0] = tmpV1[0];
        normals[i*3 + 1] = tmpV1[1];
        normals[i*3 + 2] = tmpV1[2];
        vec3.scale(tmpV1, radius);
        vec3.add(tmpV1, basePos);
        vertices[i*3 + 0] = tmpV1[0]; 
        vertices[i*3 + 1] = tmpV1[1];
        vertices[i*3 + 2] = tmpV1[2];
        uvs[i*2 + 0] = i / segments;
        uvs[i*2 + 1] = 0.0;
        
        // copy to top
        vertices[(i + segments)*3 + 0] = vertices[i*3 + 0] + scaledDir[0]; 
        vertices[(i + segments)*3 + 1] = vertices[i*3 + 1] + scaledDir[1];
        vertices[(i + segments)*3 + 2] = vertices[i*3 + 2] + scaledDir[2];
        uvs[(i + segments)*2 + 0] = i / segments;
        uvs[i*2 + 1] = 1.0;

        // faces
        iNext = (i+1) % segments;
        var makeFaceIndex = function(idx, vertex, normal) {
          indices[idx] = vertex;
          normalIndices[idx] = normal;
        };
        
        if (cap)
        {
          // base cap triangle
          makeFaceIndex(faceInd++, numVerts - 2, numNormals - 2);
          makeFaceIndex(faceInd++, i, numNormals - 2);
          makeFaceIndex(faceInd++, iNext, numNormals - 2);
        }
        // side triangle 1
        makeFaceIndex(faceInd++, i, i);
        makeFaceIndex(faceInd++, i + segments, i);
        makeFaceIndex(faceInd++, iNext, iNext);
        // side triangle 2
        makeFaceIndex(faceInd++, iNext, iNext);
        makeFaceIndex(faceInd++, i + segments, i);
        makeFaceIndex(faceInd++, iNext + segments, iNext);
        if (cap)
        {
          // top cap triangle
          makeFaceIndex(faceInd++, i + segments, numNormals - 1);
          makeFaceIndex(faceInd++, numVerts - 1, numNormals - 1);
          makeFaceIndex(faceInd++, iNext + segments, numNormals - 1);
        }
      }
      
      var indices3 = {};
      indices3[VertexAttrConstants.POSITION] = indices;
      indices3[VertexAttrConstants.NORMAL] = normalIndices;
      indices3[VertexAttrConstants.UV0] = indices;
      var vertexAttr = {};
      vertexAttr[VertexAttrConstants.POSITION] = { "size" : 3, "data" : vertices };
      vertexAttr[VertexAttrConstants.NORMAL] = { "size" : 3, "data" : normals };
      vertexAttr[VertexAttrConstants.UV0] = { "size" : 2, "data" : uvs };
      
      var faces = [ { "type" : "triangle", "indices" : indices3, "positionKey" : VertexAttrConstants.POSITION } ];
      
      return new GeometryData(faces, vertexAttr);  
    },

    createTubeGeometry: function(path, radius, sectors, globe, offset) {
      sectors = sectors || 10;
      globe = (globe != null) ? globe : true;
      Util.assert(path.length > 1);

      var capVerts = [[0, 0, 0]];
      var capTris = [];
      var ring = [];

      for (var i = 0; i < sectors; i++) {
        capTris.push([0, -i-1, -((i+1)%sectors)-1]);
        var phi = i/sectors*2*Math.PI;
        ring.push([Math.cos(phi)*radius, Math.sin(phi)*radius]);
      }

      return GeometryUtil.createPathExtrusionGeometry(ring, path, capVerts, capTris, globe, offset);
    },

    createSquareTubeGeometry: function(path, radius, globe) {
      globe = globe || true;
      Util.assert(path.length > 1);

      var capVerts = [];
      var capTris = [[-1, -2, -3], [-3, -4, -1]];
      var d = Math.SQRT2*radius;
      var ring = [[d, d], [-d, d], [-d, -d], [d, -d]];
      var norms = [[0, 1], [-1, 0], [0, -1], [1, 0]];

      return GeometryUtil.createPathExtrusionGeometry(ring, path, capVerts, capTris, globe, norms);
    },

    createPathExtrusionGeometry: function(templateRing, extrusionPath, capVertices, capTriangles, globe, offset, templateNormals) {
      var i;
      var numTemplVerts = templateRing.length;
      var verts = new Float32Array(extrusionPath.length*numTemplVerts*3 + (capVertices.length*6 || 0));
      var zOffsets = new Float32Array(extrusionPath.length*numTemplVerts + (capVertices.length*2 || 0));
      var norms = new Float32Array(extrusionPath.length*numTemplVerts*3 + (capVertices ? 6 : 0));
      var vi = 0, ni = 0, zoi = 0;
      var vInds = new Uint32Array((extrusionPath.length-1)*numTemplVerts*6 + capTriangles.length*3*2);
      var nInds = new Uint32Array((extrusionPath.length-1)*numTemplVerts*6 + capTriangles.length*3*2);
      var vii = 0, nii = 0;

      var leftSeg = vec3.create();
      var rightSeg = vec3.create();
      var up = vec3.create();
      var right = vec3.create();
      var normUp = vec3.create();
      var normRight = vec3.create();
      var p = vec3.create();
      var n = vec3.create();
      var tmp = vec3.create();
      vec3.subtract(extrusionPath[1], extrusionPath[0], rightSeg);
      vec3.normalize(rightSeg);
      if (globe) {
        vec3.add(extrusionPath[0], offset, tmp);        
        vec3.normalize(tmp, up);    
      } else {
        vec3.set3(0, 0, 1, up); // WARNING: up-axis dependent code
      }
      vec3.cross(up, rightSeg, right);
      vec3.normalize(right);
      vec3.cross(right, rightSeg, up);
      vec3.normalize(up);


      // cap at start
      for (i = 0; i < capVertices.length; i++) {
        vec3.scale(right, capVertices[i][0], p);
        vec3.scale(up, capVertices[i][2], tmp); // WARNING: up-axis dependent code
        vec3.add(p, tmp);
        vec3.add(p, extrusionPath[0]);
        verts[vi++] = p[0]; verts[vi++] = p[1]; verts[vi++] = p[2];
        zOffsets[zoi++] = 0;
      }
      norms[ni++] = -rightSeg[0]; norms[ni++] = -rightSeg[1]; norms[ni++] = -rightSeg[2];
      
      for (i = 0; i < capTriangles.length; i++) {
        vInds[vii++] = (capTriangles[i][0] > 0) ? capTriangles[i][0] : -capTriangles[i][0]-1 + capVertices.length;
        vInds[vii++] = (capTriangles[i][1] > 0) ? capTriangles[i][1] : -capTriangles[i][1]-1 + capVertices.length;
        vInds[vii++] = (capTriangles[i][2] > 0) ? capTriangles[i][2] : -capTriangles[i][2]-1 + capVertices.length;
        nInds[nii++] = 0; nInds[nii++] = 0; nInds[nii++] = 0;
      }

      // segments
      var firstV = capVertices.length;
      var firstV2N = capVertices.length - 1;
      var last;
      for (var pathIdx = 0; pathIdx < extrusionPath.length; pathIdx++) {
        last = false;
        if (pathIdx > 0) {
          if (globe) {
            vec3.add(extrusionPath[pathIdx], offset, tmp);        
            vec3.normalize(tmp, up);
          } else {
            vec3.set3(0, 0, 1, up); // WARNING: up-axis dependent code
          }
          vec3.set(rightSeg, leftSeg);
          vec3.set(leftSeg, tmp);
          if (pathIdx < extrusionPath.length-1) {
            vec3.subtract(extrusionPath[pathIdx+1], extrusionPath[pathIdx], rightSeg);
            vec3.normalize(rightSeg);
            vec3.add(tmp, rightSeg);
          } else {
            last = true;
          }
          vec3.cross(up, tmp, right);
          vec3.normalize(right);
          vec3.cross(right, tmp, up);
          vec3.normalize(up);
        }
        if (templateNormals) {
          vec3.cross(up, rightSeg, normRight);
          vec3.normalize(normRight);
          vec3.cross(normRight, rightSeg, normUp);
          vec3.normalize(normUp);
        }


        for (var cIdx = 0; cIdx < numTemplVerts; cIdx++) {
          vec3.scale(right, templateRing[cIdx][0], p);
          vec3.scale(up, templateRing[cIdx][1], tmp);
          vec3.add(p, tmp);
          if (templateNormals) {
            // face normals -> flat surface
            vec3.scale(normRight, templateNormals[cIdx][0], n);
            vec3.scale(normUp, templateNormals[cIdx][1], tmp);
            vec3.add(n, tmp);
            vec3.normalize(n);
            vec3.scale(n, -1); // FIXME
          } else {
            // vertex normals -> smooth surface
            vec3.normalize(p, n);
          }
          norms[ni++] = n[0]; norms[ni++] = n[1]; norms[ni++] = n[2];
          vec3.add(p, extrusionPath[pathIdx]);
          verts[vi++] = p[0]; verts[vi++] = p[1]; verts[vi++] = p[2];
          zOffsets[zoi++] = -templateRing[cIdx][1];

          if (!last) {
            var nextIdx = ((cIdx+1)%numTemplVerts);
            vInds[vii++] = firstV + cIdx;
            vInds[vii++] = firstV + numTemplVerts + cIdx;
            vInds[vii++] = firstV + nextIdx;
            vInds[vii++] = firstV + nextIdx;
            vInds[vii++] = firstV + numTemplVerts + cIdx;
            vInds[vii++] = firstV + numTemplVerts + nextIdx;
            if (templateNormals) {
              var nIdx;
              for (nIdx = 0; nIdx < 6; nIdx++) {
                nInds[nii++] = firstV - firstV2N + cIdx;
              }
            } else {
              for (nIdx = 0; nIdx < 6; nIdx++) {
                nInds[nii++] = vInds[vii-6+nIdx] - firstV2N;
              }
            }
          }
        }
        firstV += numTemplVerts;
      }

      // cap at end
      last = extrusionPath[extrusionPath.length-1];
      for (i = 0; i < capVertices.length; i++) {
        vec3.scale(right, capVertices[i][0], p);
        vec3.scale(up, capVertices[i][1], tmp);
        vec3.add(p, tmp);
        vec3.add(p, last);
        verts[vi++] = p[0]; verts[vi++] = p[1]; verts[vi++] = p[2];
        zOffsets[zoi++] = 0;
      }
      var capNormInd = ni/3;
      norms[ni++] = rightSeg[0]; norms[ni++] = rightSeg[1]; norms[ni++] = rightSeg[2];

      var lastRing = firstV - numTemplVerts;
      for (i = 0; i < capTriangles.length; i++) {
        vInds[vii++] = (capTriangles[i][0] >= 0) ? firstV + capTriangles[i][0] : -capTriangles[i][0]-1 + lastRing;
        vInds[vii++] = (capTriangles[i][2] >= 0) ? firstV + capTriangles[i][2] : -capTriangles[i][2]-1 + lastRing;
        vInds[vii++] = (capTriangles[i][1] >= 0) ? firstV + capTriangles[i][1] : -capTriangles[i][1]-1 + lastRing;
        nInds[nii++] = capNormInd; nInds[nii++] = capNormInd; nInds[nii++] = capNormInd;
      }

      var indices = {};
      indices[VertexAttrConstants.POSITION] = vInds;
      indices[VertexAttrConstants.NORMAL] = nInds;
      var vertexAttr = {};
      vertexAttr[VertexAttrConstants.POSITION] = { "size" : 3, "data" : verts };
      vertexAttr.zOffset = { "size" : 1, "data" : zOffsets };
      vertexAttr[VertexAttrConstants.NORMAL] = { "size" : 3, "data" : norms };

      var faces = [ { "type" : "triangle", "indices" : indices, "positionKey" : VertexAttrConstants.POSITION } ];

      return new GeometryData(faces, vertexAttr);
    },

    createPolylineGeometry: function(points, renderGeometryStyle) {
      Util.assert(points.length > 1, "createPolylineGeometry(): polyline needs at least 2 points");
      Util.assert(points[0].length === 3, "createPolylineGeometry(): malformed vertex");
      var vertices = new Float32Array(points.length*3);
      var indices = new Uint32Array(2*(points.length - 1));
      var vi = 0, ii = 0;
      for (var pi = 0; pi < points.length; pi++) {
        for (var coord = 0; coord < 3; coord++) {
          vertices[vi++] = points[pi][coord];
        }
        if (pi > 0) {
          indices[ii++] = pi-1;
          indices[ii++] = pi;
        }
      }
      var indices2 = {}, vertexAttr = {};
      indices2[VertexAttrConstants.POSITION] = indices;
      vertexAttr[VertexAttrConstants.POSITION] = { "size" : 3, "data": vertices};
      var faces = [ { "type" : "line", "indices" : indices2, "positionKey" : VertexAttrConstants.POSITION } ];

      if (renderGeometryStyle) {
        return {
          "faces" : faces[0],
          "vertexAttr" : vertexAttr,
          "id" : GeometryData.getNewId().toString()  // toString()ing it to make it same type as with proper GeometryData (see Model.getGeometryRenderGeometries())
        };
      } else {
        return new GeometryData(faces, vertexAttr);
      }
    },

    addVertexColors: function(geometryData, color, createShallowCopy) {
      var faces, indices, i, va;

      if (createShallowCopy) {
        // only create a copy of the containers that need to be modified for adding vertex colors
        var vertexAttr = {};
        var vertexAttrOri = geometryData.getVertexAttr();
        for (va in vertexAttrOri) {
          vertexAttr[va] = vertexAttrOri[va];
        }
        var facesOri = geometryData.getFaces();
        faces = new Array(facesOri.length);
        for (i = 0; i < facesOri.length; i++) {
          indices = {};
          for (va in facesOri[i].indices) {
            indices[va] = facesOri[i].indices[va];
          }
          faces[i] = { "type" : facesOri[i].type, "indices" : indices, "positionKey" : facesOri[i].positionKey };
        }
        geometryData = new GeometryData(faces, vertexAttr);
      }

      var c = color || [1, 1, 1, 1];

      var colorData = new Uint8Array(4);
      colorData[0] = 255 * c[0];
      colorData[1] = 255 * c[1];
      colorData[2] = 255 * c[2];
      colorData[3] = 255 * (c.length > 3 ? c[3] : 1.0);

      var vertexAttrs = geometryData.getVertexAttr();
      vertexAttrs[VertexAttrConstants.COLOR] = {"size": 4, "data": colorData };

      faces = geometryData.getFaces();
      for (i = 0; i < faces.length; i++) {
        var face = faces[i];
        var num = face.indices[face.positionKey].length;
        indices = new Uint32Array(num);
        face.indices[VertexAttrConstants.COLOR] = indices; // all set to 0, perfect!
      }

      return geometryData;
    },

    addNormals: function(geometryData) {
      // computes face normals, vertex normals not yet implemented

      var vertexArrays = geometryData.getVertexAttr();
      var indexArrays = geometryData.getFaces();

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
          subtractBufferVector(vertices, vInd[i] * 3, vertices, vInd[i + 2] * 3, tmpVec2, 0);
          subtractBufferVector(vertices, vInd[i] * 3, vertices, vInd[i + 1] * 3, tmpVec1, 0);
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
      vertexArrays.normal = { size: 3, data: newNormals};
    },

    cgToGIS: function(geometryData) {
      var vertexArrays = geometryData.getVertexAttr(),
        positions = vertexArrays.position.data,
        normals = vertexArrays.normal.data,
        i, tmp;
      if (normals) {
        for (i = 0; i < normals.length; i+=3) {
          tmp = normals[i+1];
          normals[i+1] = -normals[i+2];
          normals[i+2] = tmp;
        }
      }
      if (positions) {
        for (i = 0; i < positions.length; i+=3) {
          tmp = positions[i+1];
          positions[i+1] = -positions[i+2];
          positions[i+2] = tmp;
        }
      }
    }
  };

  return GeometryUtil;
});