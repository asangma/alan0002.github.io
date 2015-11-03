/* jshint forin:false */
define(["../../../core/declare"], function(declare) {

  var Document = function(data, size) {
    this.data = data;
    this.size = Math.floor(size / 1024);
  };

  //not used anymore
  var LruCache = declare(null, {
    documents:undefined,
    _maxDataSize:undefined,     // in KB
    _cachedDataSize:undefined,   // in KB
    _lruQueue:undefined,

    constructor: function(maxSize) {
      this._maxDataSize = maxSize;

      this.documents = {};
      this._maxDataSize = 0;     // in KB
      this._cachedDataSize = 0;   // in KB
      this._lruQueue = [];

    },

    setMaxSize: function(maxSize) {
      this._maxDataSize = maxSize;
    },

    has: function(docId) {
      return this.documents[docId] != null;
    },

    insert: function(docId, data, size) {
      var doc = new Document(data, size);
      this.documents[docId] = doc;
      this._cachedDataSize += doc.size;
      if (this._cachedDataSize > this._maxDataSize) {
        this._collect();
      }
    },

    use: function(docId) {
      var doc = this.documents[docId];
      if (doc) {
        this._lruQueue.push(docId);
      }
      return doc;
    },

    _collect: function() {
      while (this._cachedDataSize > this._maxDataSize*0.75) {
        if (this._lruQueue.length < 1) {
          break;
        }
        var docId = this._lruQueue.shift();
        var doc = this.documents[docId];
        if (doc) {
          delete this.documents[docId];
          this._cachedDataSize -= doc.size;
        }
      }
    },

    getStats: function()
    {
      return {
        numDocs:Object.keys(this.documents).length,
        size: this._cachedDataSize
      };
    }
  });

  return LruCache;
});
