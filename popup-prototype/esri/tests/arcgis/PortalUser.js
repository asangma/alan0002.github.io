dojo.provide("esri.tests.arcgis.PortalUser");

doh.register("PortalUser",
  [
    {
      name:"getGroups",
      timeout:5000, // 5 seconds.
      runTest:function () {
        var d = new doh.Deferred();
          console.log("user..."+user);
          console.log("users..."+users);
        user.getGroups().then(d.getTestCallback(function (result) {
          groups = result;
          doh.t(result && result.length !== 0);
        }), 500)
        return d;
      }
    },
    {
      name:"getFolders",
      timeout:5000, // 5 seconds.
      runTest:function () {
        var d = new doh.Deferred();
        user.getFolders().then(d.getTestCallback(function (result) {
          folders = result;
          doh.t(result && result.length !== 0 && result[0].title === "TestFolder");
        }), 500)
        return d;
      }
    },
    {
      name:"getNotifications",
      timeout:5000, // 5 seconds.
      runTest:function () {
        var d = new doh.Deferred();
        user.getNotifications().then(d.getTestCallback(function (result) {
          doh.t(result && result.length !== 0);
        }), 500)
        return d;
      }
    },
    {
      name:"getInvitations",
      timeout:5000, // 5 seconds.
      runTest:function () {
        var d = new doh.Deferred();
        user.getGroupInvitations().then(d.getTestCallback(function (result) {
          doh.t(result && result.length !== 0);
        }), 500)
        return d;
      }
    },
    {
      name:"getTags",
      timeout:5000, // 5 seconds.
      runTest:function () {
        var d = new doh.Deferred();
        user.getTags().then(d.getTestCallback(function (result) {
          doh.t(result && result.tags && result.tags.length);
        }), 500)
        return d;
      }
    },
    {
      name:"getItems",
      timeout:5000, // 5 seconds.
      runTest:function () {
        var d = new doh.Deferred();
        user.getItems((folders && folders.length && folders[0].id) || null).then(d.getTestCallback(function (result) {
          doh.t(result && result.length);
        }), 500)
        return d;
      }
    }
  ]);