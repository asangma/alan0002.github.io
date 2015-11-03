dojo.provide("esri.tests.arcgis.PortalFolder");

doh.register("PortalFolder",
  [
    {
      name:"getFolders",
      timeout:5000, // 5 seconds.
      runTest:function () {
        var d = new doh.Deferred();
        user.getFolders().then(d.getTestCallback(function (result) {
          folders = result;
          folder = folders[0];
          doh.t(result && result.length !== 0);
        }), 500);
        return d;
      }
    },
    {
      name:"getItems",
      timeout:5000, // 5 seconds.
      runTest:function () {
        var d = new doh.Deferred();
        folder.getItems().then(d.getTestCallback(function (result) {
          items = result;
          doh.t(result && result.length !== 0);
        }), 500);
        return d;
      }
    }
  ]);