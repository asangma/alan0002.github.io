dojo.provide("esri.tests.arcgis.Portal");



function signin(username, password, timeToStart) {
  setTimeout(dojo.hitch(this, function () {
    dijit.byId('dijit_form_ValidationTextBox_0').set('value', username);
    dijit.byId('dijit_form_ValidationTextBox_1').set('value', password);
    dijit.byId('dijit_form_Button_0').onClick();
  }), timeToStart || 1000);
}

doh.register("Portal",
  [
    {
      name:"constructor",
      timeout:5000, // 5 seconds.
      runTest:function () {
        console.log("constructor");
        var d = new doh.Deferred();
        portal = new esri.arcgis.Portal('http://' + portalUrl);
        dojo.connect(portal, "onLoad", d.getTestCallback(function (result) {
          portal = result;
          doh.t(result.length !== null);
        }))
        return d;
      }
    },
    {
      name:"signin",
      timeout:5000, // 5 seconds.
      setUp:function () {
        signin(portalUser, portalUserPass, 1500);
      },
      runTest:function () {
        var d = new doh.Deferred();
        portal.signIn().then(d.getTestCallback(function (result) {
          user = result;
            console.log("signin user:"+ user);
          doh.t(result && result.length !== 0);
        }), 500);
        return d;
      }
    },
    {
      name:"queryGroups",
      timeout:5000, // 5 seconds.
      runTest:function () {
        var d = new doh.Deferred();
        portal.queryGroups('ESRI Maps and Data').then(d.getTestCallback(function (result) {
          doh.t(result && result.total > 0);
        }));
      }
    },
    {
      name:"queryGroupsQueryParams",
      timeout:5000, // 5 seconds.
      runTest:function () {
        var d = new doh.Deferred();
        portal.queryGroups({'q':'maps', 'num':5}).then(d.getTestCallback(function (result) {
          doh.t(result && result.results && result.results.length === 5);
        }), 500);
        return d;
      }
    },
    {
      name:"queryItems",
      timeout:5000, // 5 seconds.
      runTest:function () {
        var d = new doh.Deferred();
        portal.queryItems('map').then(d.getTestCallback(function (result) {
          doh.t(result && result.length !== 0);
        }), 500);
        return d;
      }
    },
    {
      name:"queryItemsQueryParams",
      timeout:5000, // 5 seconds.
      runTest:function () {
        var d = new doh.Deferred();
        portal.queryItems({'q':'map', 'num':5}).then(d.getTestCallback(function (result) {
          doh.t(result && result.results && result.results.length === 5);
        }), 500);
        return d;
      }
    },
    {
      name:"queryUsers",
      timeout:5000, // 5 seconds.
      runTest:function () {
        var d = new doh.Deferred();
        portal.queryUsers('k').then(d.getTestCallback(function (result) {
          doh.t(result && result.length !== 0);
        }), 500);
        return d;
      }
    },
    {
      name:"queryUsersQueryParams",
      timeout:5000, // 5 seconds.
      runTest:function () {
        var d = new doh.Deferred();
        portal.queryUsers({'q':'k', 'num':5}).then(d.getTestCallback(function (result) {
          doh.t(result && result.results && result.results.length === 5);
        }), 500);
        return d;
      }
    }
  ]);