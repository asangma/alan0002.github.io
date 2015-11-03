define(["../../../../core/declare", "dojo/Deferred",

  "../../webgl-engine/Stage",
  "../../webgl-engine/lib/Texture",
  "../../webgl-engine/lib/Util"],
function(
  declare, Deferred,
  Stage, Texture, Util
) {
  var assert = Util.assert;

  var TextureCollection = declare(null, {
    constructor: function(streamDataSupplier, stage) {
      this._streamDataSupplier = streamDataSupplier;
      this._stage = stage;
      this._textureRecords = {};
      this._loadedHandler = this._loadedHandler.bind(this);
      this._errorHandler = this._errorHandler.bind(this);
    },

    acquire: function(uri, allocator /* optional - uses HTTP request if not given */) {
      var clientDfd;
      var textureRecord = this._textureRecords[uri];
      if (textureRecord) {
        textureRecord.referenceCount++;
        return textureRecord.texture || textureRecord.clientDfd;
      } else {
        if (allocator) {
          var texture = allocator(uri);
          this._stage.add(Stage.ModelContentType.TEXTURE, texture);
          textureRecord = {
            texture: texture,
            referenceCount: 1
          };
          this._textureRecords[uri] = textureRecord;
          return texture;
        }
        else {
          // propert URL or data URI
          clientDfd = new Deferred();
          var loaderDfd = this._streamDataSupplier.request(uri, "image");
          this._textureRecords[uri] = {
            clientDfd: clientDfd,
            loaderDfd: loaderDfd,
            texture: null,
            referenceCount: 1
          };
          loaderDfd.then(this._loadedHandler, this._errorHandler);
          return clientDfd.promise;
        }
      }
    },

    release: function(uri) {
      var textureRecord = this._textureRecords[uri];
      if (textureRecord) {
        if (textureRecord.referenceCount < 1) {
          console.warn("TextureCollection: reference count is < 1 for " + uri);
        }
        textureRecord.referenceCount--;
        if (textureRecord.referenceCount < 1) {
          if (textureRecord.texture) {
            this._stage.remove(Stage.ModelContentType.TEXTURE, textureRecord.texture.getId());
            textureRecord.texture = null;
          } else {
            this._streamDataSupplier.cancel(textureRecord.loaderDfd);
          }
          delete this._textureRecords[uri];
        }
      }
      else {
        console.warn("TextureCollection: texture doesn't exist: " + uri);
      }
    },

    isInUse: function(url) {
      var textureRecord = this._textureRecords[url];
      assert(!textureRecord || textureRecord.referenceCount > 0, "texture record with zero reference count");
      return !!textureRecord;
    },

    _loadedHandler: function(url, img, docType) {
      var textureRecord = this._textureRecords[url];
      assert(textureRecord && !textureRecord.texture);
      var texture = new Texture(img, "symbol", { width: img.width, height: img.height});
      this._stage.add(Stage.ModelContentType.TEXTURE, texture);
      textureRecord.texture = texture;
      textureRecord.clientDfd.resolve(texture);
    },

    _errorHandler: function(url) {
      var textureRecord = this._textureRecords[url];
      assert(textureRecord && !textureRecord.texture);
      textureRecord.clientDfd.reject();
    }
  });

  return TextureCollection;
});
