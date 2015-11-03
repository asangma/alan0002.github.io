define([
  "intern!object",
  "intern/chai!assert",
  "intern/order!sinon",

  "esri/geometry/Extent",
  "esri/geometry/support/scaleUtils"
], function(
  registerSuite, assert, sinon,
  Extent, scaleUtils
){

  registerSuite({
    name: "esri/geometry/support/scaleUtils",

    getExtentForScale: function(){
      var get = sinon.stub();
      get.withArgs("extent").returns(new Extent(-1000, -500, 1000, 500, { wkid: 102100 }));
      get.withArgs("width").returns(1000);
      
      var view = {
        get: get
      };

      var expansion = 10000 / ((2000 / 1000) * 39.37 * 96);
      var expected =  new Extent(-1000, -500, 1000, 500, { wkid: 102100 }).expand(expansion);

      var result = scaleUtils.getExtentForScale(view, 10000);
      
      assert.deepEqual(result.toJSON(), expected.toJSON(), "result extent not correct");
    }
  });
});
