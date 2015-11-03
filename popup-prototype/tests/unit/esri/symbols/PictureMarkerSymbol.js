define([
  "intern!object", 
  "intern/chai!assert", 
  "intern/order!sinon",

  "esri/symbols/PictureMarkerSymbol"
], function(
  registerSuite, assert, sinon, 
  PictureMarkerSymbol
) {
  
  registerSuite({
    name: "esri/symbols/PictureMarkerSymbol",

    "empty fromJSON": function() {
      var expected = new PictureMarkerSymbol({});
      var result = PictureMarkerSymbol.fromJSON({});
      assert.deepEqual(expected.toJSON(), result.toJSON());
    },

    "fromJSON": function() {
      var expected = new PictureMarkerSymbol({
        source: {
          url: "471E7E31",
          imageData: "iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAYAAACpSkzOAAAAAXNSR0IB2cksfwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAMNJREFUSIntlcENwyAMRZ+lSMyQFcI8rJA50jWyQuahKzCDT+6h0EuL1BA1iip8Qg/Ex99fYuCkGv5bKK0EcB40YgSE7bnTxsa58LeOnMd0QhwGXkxB3L0w0IDxPaMqpBFxjLMuaSVmRjurWIcRDHxaiWZuEbRcEhpZpSNhE9O81GiMN5E0ZRt2M0iVjshek8UkTQfZy8JqGHYP/rJhODD4T6wehtbB9zD0MPQwlOphaAxD/uPLK7Z8MB5gFet+WKcJPQDx29XkRhqr/AAAAABJRU5ErkJggg==", 
          contentType: "image/png"
        },
        width: 32, 
        height: 32, 
        angle: 30, 
        xoffset: 8, 
        yoffset: 8
      });
      var result = PictureMarkerSymbol.fromJSON({
        "type" : "esriPMS", 
        "url" : "471E7E31", 
        "imageData" : "iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAYAAACpSkzOAAAAAXNSR0IB2cksfwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAMNJREFUSIntlcENwyAMRZ+lSMyQFcI8rJA50jWyQuahKzCDT+6h0EuL1BA1iip8Qg/Ex99fYuCkGv5bKK0EcB40YgSE7bnTxsa58LeOnMd0QhwGXkxB3L0w0IDxPaMqpBFxjLMuaSVmRjurWIcRDHxaiWZuEbRcEhpZpSNhE9O81GiMN5E0ZRt2M0iVjshek8UkTQfZy8JqGHYP/rJhODD4T6wehtbB9zD0MPQwlOphaAxD/uPLK7Z8MB5gFet+WKcJPQDx29XkRhqr/AAAAABJRU5ErkJggg==", 
        "contentType" : "image/png", 
        "width" : 24, 
        "height" : 24, 
        "angle" : -30, 
        "xoffset" : 6, 
        "yoffset" : 6
      });
      assert.deepEqual(expected.toJSON(), result.toJSON());
    },
    
    "computed property: source": function() {
      var pfs = new PictureMarkerSymbol();
      pfs.url = "data:test-contentType;base64,test-base64";
      assert.isNotNull(pfs.source, "setting the url should recompute the source");
      assert.isDefined(pfs.source, "setting the url should recompute the source");
      assert.equal(pfs.source.contentType, "test-contentType", "setting the url should compute the contentType");
      assert.equal(pfs.source.imageData, "test-base64", "setting the url should compute the imageData");

      pfs.url = "http://someImage.com";
      assert.equal(pfs.source.url, "http://someImage.com");
      assert.isUndefined(pfs.source.contentType, "setting a regular url should remove the contentType");
      assert.isUndefined(pfs.source.imageData, "setting a regular url should remove the imageData");
    },
    
    "computed property: url": function() {
      var pfs = new PictureMarkerSymbol({
        source: {
          url: "471E7E31",
          imageData: "iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAYAAACpSkzOAAAAAXNSR0IB2cksfwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAMNJREFUSIntlcENwyAMRZ+lSMyQFcI8rJA50jWyQuahKzCDT+6h0EuL1BA1iip8Qg/Ex99fYuCkGv5bKK0EcB40YgSE7bnTxsa58LeOnMd0QhwGXkxB3L0w0IDxPaMqpBFxjLMuaSVmRjurWIcRDHxaiWZuEbRcEhpZpSNhE9O81GiMN5E0ZRt2M0iVjshek8UkTQfZy8JqGHYP/rJhODD4T6wehtbB9zD0MPQwlOphaAxD/uPLK7Z8MB5gFet+WKcJPQDx29XkRhqr/AAAAABJRU5ErkJggg==", 
          contentType: "image/png"
        }
      });
      assert.isNotNull(pfs.url, "setting the source should recompute the url");
      assert.isDefined(pfs.url, "setting the source should recompute the url");
      assert.equal(pfs.url, "471E7E31", "setting the source should compute the url");
    }
  
  });
});
