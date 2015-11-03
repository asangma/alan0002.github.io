define([], function() {

  /**
   * Structure
   * @private
   */
  var OldValues = function(copyFn) {
    this._slots = [];
    this._copyFn = copyFn;
  };
  
  OldValues.prototype = {
    current: null,

    _slots: null,
    _copyFn: null,
    _size: 0,
    _used: 0,
    
    add: function(item) {
      if (!item) {
        return item;
      }
      var slots = this._slots;
      if (this._used === this._size) {
        slots[this._used++] = item;
        this._size++;
        this.current = undefined;
      }
      else {
        this.current = slots.splice(this._used++, 1, item)[0];
        this._copyFn(this.current, item);
      }
      return this.current;
    },
    
    reset: function() {
      this._used = 0;
    },
    
    destroy: function() {
      this._used = this._size = 0;
      this.current = this._slots = null;
    }
  };

  return OldValues;

});