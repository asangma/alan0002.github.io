dojo.provide("esri.tests.arcgis.PortalItem");

var item, comment, rating;

doh.register("PortalItem",
  [
    {
      name:"getItems",
      timeout:5000, // 5 seconds.
      runTest:function () {
        var d = new doh.Deferred();
        user.getItems().then(d.getTestCallback(function (result) {
          item = result && result.length && result[0];
          doh.t(result && result.length !== 0);
        }), 500);
        return d;
      }
    },
    {
      name:"addComment",
      timeout:5000, // 5 seconds.
      runTest:function () {
        var d = new doh.Deferred();
        item.addComment("This is my comment").then(d.getTestCallback(function (result) {
          comment = result;
          doh.t(result !== null);
        }), 500);
        return d;
      }
    },

    {
      name:"getComments",
      timeout:5000, // 5 seconds.
      runTest:function () {
        var d = new doh.Deferred();
        item.getComments().then(d.getTestCallback(function (result) {
          doh.t(result && result.length !== 0);
        }), 500);
        return d;
      }
    },
    {
      name:"deleteComment",
      timeout:5000, // 5 seconds.
      runTest:function () {
        var d = new doh.Deferred();
        item.deleteComment(comment).then(d.getTestCallback(function (result) {
          doh.t(result.success);
        }),
          d.getTestCallback(function (error) {
            doh.t(result.success);
          }),
          500);
        return d;
      }
    },

    {
      name:"addRating",
      timeout:5000, // 5 seconds.
      runTest:function () {
        var d = new doh.Deferred();
        item.addRating(4).then(d.getTestCallback(
          function (result) {
            rating = result;
            doh.t(result !== null);
          }),
          d.getTestCallback(function (error) {
            doh.t(true);
          }), 500);
        return d;
      }
    },

    {
      name:"getRating",
      timeout:5000, // 5 seconds.
      runTest:function () {
        var d = new doh.Deferred();
        item.getRating().then(d.getTestCallback(function (result) {
          doh.t(result);
        }), 500);
        return d;
      }
    },

    {
      name:"removeRating",
      timeout:5000, // 5 seconds.
      runTest:function () {
        var d = new doh.Deferred();
        item.deleteRating(rating).then(d.getTestCallback(function (result) {
          doh.t(result);
        }), 500);
        return d;
      }
    }

  ]);