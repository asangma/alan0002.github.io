dojo.provide("esri.tests.arcgis.PortalGroup");

doh.register("PortalGroup",
  [
    {
      name:"getGroups",
      timeout:5000, // 5 seconds.
      runTest:function () {
        var d = new doh.Deferred();
        user.getGroups().then(d.getTestCallback(function (result) {
          groups = result;
          group = groups[0];
          doh.t(result && result.length !== 0);
        }), 500);
        return d;
      }
    },
    {
      name:"getMembers",
      timeout:5000, // 5 seconds.
      runTest:function () {
        var d = new doh.Deferred();
        group.getMembers().then(d.getTestCallback(function (result) {
          members = result;
          doh.t(result && result.length !== 0);
        }), 500);
        return d;
      }
    },
    {
      name:"queryItemsAll",
      timeout:5000, // 5 seconds.
      runTest:function () {
        var d = new doh.Deferred();
        group.queryItems().then(d.getTestCallback(function (result) {
          doh.t(result && result.results && result.results.length !== 0);
        }), 500);
        return d;
      }
    },
    {
      name:"queryItemsQuery",
      timeout:5000, // 5 seconds.
      runTest:function () {
        var d = new doh.Deferred();
        group.queryItems('addresses').then(d.getTestCallback(function (result) {
          doh.t(result && result.results && result.results.length !== 0);
        }), 500);
        return d;
      }
    },
    {
      name:"queryItemsQueryNoItem",
      timeout:5000, // 5 seconds.
      runTest:function () {
        var d = new doh.Deferred();
        group.queryItems('addresses1').then(d.getTestCallback(function (result) {
          doh.f(result && result.results && result.results.length !== 0);
        }), 500);
        return d;
      }
    }
  ]);