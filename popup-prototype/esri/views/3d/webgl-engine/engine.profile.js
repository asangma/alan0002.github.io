var profile = (function() {
  copyOnly = function(filename, mid) {
    var list = {
      "package.json" : 1,
      "engine.profile.js" : 1
    };

    return (mid in list);
  };

  return {
    resourceTags : {
      copyOnly : function(filename, mid) {
        return copyOnly(filename, mid);
      },

      amd : function(filename, mid) {
        return /\.js$/.test(filename);
      }
    }
  };
})();
