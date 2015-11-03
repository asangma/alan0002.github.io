define(function () {
  var GeomDirtyType = {
    ADD: 1,
    UPDATE: 2,
    REMOVE: 4
  };

  var UpdateTypes = {
    REINSERT: 1,
    FACERANGE: 2,
    VERTEXATTRS: 4,
    COLORATTRS: 8,
    TRANSFORMATION: 16
  };
  return {GeomDirtyType: GeomDirtyType, UpdateTypes: UpdateTypes};
});