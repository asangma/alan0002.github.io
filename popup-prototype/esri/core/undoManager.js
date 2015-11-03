define(
[
  "./declare",
  "./Evented"
],
function(declare, Evented) {

/***************************
 * esri.UndoManager
 ***************************/
var UndoManager = declare([Evented], {
  declaredClass: "esri.UndoManager",
  maxOperations: 10,
  canUndo: false,
  canRedo: false,
  position: 0,
  length: 0,
  
  constructor: function (params) {
    params = params || {};
    if (params.maxOperations) {
      this.maxOperations = params.maxOperations;
    }
    this._historyStack = [];
  },

  add: function (operation) {
    // if maxOperation <= 0, it implies unlimited number of undo steps
    if (this.maxOperations > 0) {
      while (this._historyStack.length >= this.maxOperations) {
        this._historyStack.shift();
      }
    }
    this._historyStack.splice(this.position, 0, operation);
    this.position++;
    this.clearRedo();
    this.emit("add");
    this._checkAvailability();
  },

  undo: function () {
    if (this.position === 0) {
      return null;
    }
    var operation = this.peekUndo();
    this.position--;
    if (operation) {
      operation.performUndo();
    }
    this.emit("undo");
    this._checkAvailability();
  },

  redo: function () {
    if (this.position === this._historyStack.length) {
      return null;
    }
    var operation = this.peekRedo();
    this.position++;
    if (operation) {
      operation.performRedo();
    }
    this.emit("redo");
    this._checkAvailability();
  },

  _checkAvailability: function () {
    this.length = this._historyStack.length;
    if (this.length === 0) {
      this.canRedo = false;
      this.canUndo = false;
    } else if (this.position === 0) {
      this.canRedo = true;
      this.canUndo = false;
    } else if (this.position === this.length) {
      this.canUndo = true;
      this.canRedo = false;
    } else {
      this.canUndo = true;
      this.canRedo = true;
    }
    this.emit("change");
  },

  clearUndo: function () {
    this._historyStack.splice(0, this.position);
    this.position = 0;
    this._checkAvailability();
  },

  clearRedo: function () {
    this._historyStack.splice(this.position, this._historyStack.length - this.position);
    this.position = this._historyStack.length;
    this._checkAvailability();
  },

  peekUndo: function () {
    if (this._historyStack.length > 0 && this.position > 0) {
      return this.get(this.position - 1);
    }
  },

  peekRedo: function () {
    if (this._historyStack.length > 0 && this.position < this._historyStack.length) {
      return this.get(this.position);
    }
  },

  get: function (idx) {
    return this._historyStack[idx];
  },

  remove: function (idx) {
    if (this._historyStack.length > 0) {
      this._historyStack.splice(idx, 1);
      if (this.position > 0) {
        if (idx < this.position) {
          this.position--;
        }
      }
      this._checkAvailability();
    }
  },

  destroy: function () {
    this._historyStack = null;
  }
});

return UndoManager;  
});
