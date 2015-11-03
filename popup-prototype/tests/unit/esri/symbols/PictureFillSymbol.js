define([
  "intern!object", 
  "intern/chai!assert", 
  "intern/order!sinon",

  "esri/symbols/PictureFillSymbol",
  "esri/symbols/SimpleLineSymbol"
], function(
  registerSuite, assert, sinon, 
  PictureFillSymbol, SimpleLineSymbol
) {
  
  registerSuite({
    name: "esri/symbols/PictureFillSymbol",

    "empty fromJSON": function() {
      var expected = new PictureFillSymbol({
      });
      var result = PictureFillSymbol.fromJSON({
      });
      assert.deepEqual(expected.toJSON(), result.toJSON());
    },

    "fromJSON": function() {
      var expected = new PictureFillSymbol({
        source: {
          url: "866880A0",
          imageData: "iVBORw0KGgoAAAANSUhEUgAAAFQAAABUCAYAAAAcaxDBAAAAAXNSR0IB2cksfwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAM9JREFUeJzt0EEJADAMwMA96l/zTBwUSk5ByLxQsx1wTUOxhmINxRqKNRRrKNZQrKFYQ7GGYg3FGoo1FGso1lCsoVhDsYZiDcUaijUUayjWUKyhWEOxhmINxRqKNRRrKNZQrKFYQ7GGYg3FGoo1FGso1lCsoVhDsYZiDcUaijUUayjWUKyhWEOxhmINxRqKNRRrKNZQrKFYQ7GGYg3FGoo1FGso1lCsoVhDsYZiDcUaijUUayjWUKyhWEOxhmINxRqKNRRrKNZQrKFYQ7GGYh/hIwFRFpnZNAAAAABJRU5ErkJggg==", 
          contentType: "image/png"
        },
        outline: new SimpleLineSymbol({
          style : "solid", 
          color : [110,110,110], 
          width : 1.3333333333333333
        }),
        width : 48, 
        height : 48, 
        angle : 30, 
        xoffset : 8, 
        yoffset : 8, 
        xscale : 1, 
        yscale : 1
      });
      var result = PictureFillSymbol.fromJSON({
        "type" : "esriPFS", 
        "url" : "866880A0", 
        "imageData" : "iVBORw0KGgoAAAANSUhEUgAAAFQAAABUCAYAAAAcaxDBAAAAAXNSR0IB2cksfwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAM9JREFUeJzt0EEJADAMwMA96l/zTBwUSk5ByLxQsx1wTUOxhmINxRqKNRRrKNZQrKFYQ7GGYg3FGoo1FGso1lCsoVhDsYZiDcUaijUUayjWUKyhWEOxhmINxRqKNRRrKNZQrKFYQ7GGYg3FGoo1FGso1lCsoVhDsYZiDcUaijUUayjWUKyhWEOxhmINxRqKNRRrKNZQrKFYQ7GGYg3FGoo1FGso1lCsoVhDsYZiDcUaijUUayjWUKyhWEOxhmINxRqKNRRrKNZQrKFYQ7GGYh/hIwFRFpnZNAAAAABJRU5ErkJggg==", 
        "contentType" : "image/png", 
        "outline" : {
          "type" : "esriSLS", 
          "style" : "esriSLSSolid", 
          "color" : [110,110,110,255], 
          "width" : 1
        }, 
        "width" : 36, 
        "height" : 36, 
        "angle" : -30, 
        "xoffset" : 6, 
        "yoffset" : 6, 
        "xscale" : 1, 
        "yscale" : 1
      });
      assert.deepEqual(expected.toJSON(), result.toJSON());
    },

    "computed property: source": function() {
      var pfs = new PictureFillSymbol();
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
      var pfs = new PictureFillSymbol({
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
