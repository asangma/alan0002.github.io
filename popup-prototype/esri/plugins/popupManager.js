define([
  "../views/PopupManager"
], function(PopupManager) {
  return {
    add: function(target, options) {
      if (!target.popupManager) {
        target.popupManager = new PopupManager(options);
        target.popupManager.view = target;
      }
    },

    remove: function(target) {
      var popupManager = target.popupManager;
      if (popupManager) {
        popupManager.destroy();
        target.popupManager = null;
      }
    }
  };
});
