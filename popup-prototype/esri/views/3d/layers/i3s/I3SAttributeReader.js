define([
      "dojo/_base/lang",
      "./I3SUtil",
      "../../support/PromiseLightweight"
  ],
  function (lang, I3SUtil, PromiseLightweight) {

    // TODO: probably not the best utf8 decoder. Replace?
    var decodeUtf8 = function (data, offset, length) {
      var result = "";
      var i = 0;
      var c = 0;
      var c2 = 0;
      var c3 = 0;

      while (i < length) {
        c = data[offset + i];

        if (c < 128) {
          result += String.fromCharCode(c);
          i++;
        } else if (c > 191 && c < 224) {
          if( i+1 >= length ) {
            throw new Error("UTF-8 Decode failed. Two byte character was truncated.");
          }
          c2 = data[offset + i+1];
          result += String.fromCharCode( ((c&31)<<6) | (c2&63) );
          i += 2;
        } else {
          if (i+2 >= length) {
            throw new Error("UTF-8 Decode failed. Multi byte character was truncated.");
          }
          c2 = data[offset + i+1];
          c3 = data[offset + i+2];
          result += String.fromCharCode( ((c&15)<<12) | ((c2&63)<<6) | (c3&63) );
          i += 3;
        }
      }
      return result;
    };

    var I3SAttributeReader = {

    readBinaryHeader: function(buffer, headerSchema) {
      var header = {
        byteOffset: 0,
        byteCount: 0,
        fields: Object.create(null)
      };
      var byteOffset = 0;
      for (var i = 0; i<headerSchema.length; i++) {
        var headerElement = headerSchema[i];
        var type = headerElement.valueType || headerElement.type;
        var TypedArrayClass = I3SUtil.valueType2TypedArrayClassMap[type];
        var view = new TypedArrayClass(buffer, byteOffset, 1);
        header.fields[headerElement.property] = view[0];
        byteOffset+= view.byteLength;
      }
      header.byteCount = byteOffset;
      return header;
    },

    readStringArray: function(count, lengthArray, byteArray) {
      var result = [];
      var stringLength;

      var offset = 0;
      var index;
      for (index = 0; index < count; index += 1) {
        stringLength = lengthArray[index];
        if (stringLength > 0) {
          result.push(decodeUtf8(byteArray, offset, stringLength - 1));
          // check 0 termination
          if (byteArray[offset+stringLength-1] !== 0)
          {
            throw new Error("invalid string array: missing null termination.");
          }
        } else {
          // spec: A String-Array is capable of supporting null attribute values (a 0 byte count value indicates a null string
          result.push(null);
        }
        offset += stringLength;
      }
      return result;
    },

    createTypedView: function(buffer, dataIndexEntry) {
      var TypedArrayClass = I3SUtil.valueType2TypedArrayClassMap[dataIndexEntry.valueType];
      return new TypedArrayClass(buffer, dataIndexEntry.byteOffset, dataIndexEntry.count);
    },
    createRawView: function(buffer, dataIndexEntry) {
      return new Uint8Array(buffer, dataIndexEntry.byteOffset, dataIndexEntry.byteCount);
    },

    createAttributeDataIndex: function(buffer, header, attributeStorageInfo) {
      var index = {
        byteOffset: header.byteCount,
        byteCount: 0,
        entries: Object.create(null)
      };
      var byteOffset = header.byteCount;
      for (var i=0; i<attributeStorageInfo.ordering.length; i++) {
        var name = attributeStorageInfo.ordering[i];
        var entry = lang.clone(attributeStorageInfo[name]);
        entry.count = header.fields.count;
        if (entry.valueType === "String") {
          entry.byteOffset = byteOffset;
          entry.byteCount = header.fields[name+"ByteCount"];
          if (entry.encoding !== "UTF-8") {
            throw new Error("Unsupported String encoding: '"+entry.encoding+"'.");
          }
        } else if (I3SUtil.isValueType(entry.valueType)) {
          var bytesPerValue = I3SUtil.getBytesPerValue(entry.valueType);
          // compute alignment
          byteOffset += (byteOffset % bytesPerValue !== 0) ? (bytesPerValue-(byteOffset % bytesPerValue)) : 0;
          entry.byteOffset = byteOffset;
          entry.byteCount = bytesPerValue * entry.valuesPerElement * entry.count;
        } else {
          throw new Error("Unsupported valueType: '"+entry.valueType+"'.");
        }
        byteOffset += entry.byteCount;
        index.entries[name] = entry;
      }
      index.byteCount = byteOffset - index.byteOffset;
      return index;
    },

    // Read the binary attributes and return them as an array
    readBinary: function(attributeStorageInfo, buffer) {
      var header = I3SAttributeReader.readBinaryHeader(buffer, attributeStorageInfo.header);

      // hacky workaround for trailing space bug
      if (attributeStorageInfo["attributeByteCounts "] && !attributeStorageInfo.attributeByteCounts) {
        console.error("Warning: Trailing space in 'attributeByteCounts '.");
        attributeStorageInfo.attributeByteCounts = attributeStorageInfo["attributeByteCounts "];
      }

      // create data index
      var index = this.createAttributeDataIndex(buffer, header, attributeStorageInfo);

      // Sanity check
      var expectedSize = index.byteOffset + index.byteCount;
      if (expectedSize > buffer.byteLength) {
        throw new Error("invalid attribute array length\n(expected: "+expectedSize+" bytes, got: "+buffer.byteLength+" bytes).");
      }
      if (expectedSize < buffer.byteLength) {
        console.error("Warning: attribute array too long\n(expected: "+expectedSize+" bytes, got: "+buffer.byteLength+" bytes).");
      }

      var valuesEntry = index.entries.attributeValues;
      if (valuesEntry) {
        if (valuesEntry.valueType === "String") {
          var countsEntry = index.entries.attributeByteCounts;
          var countsArray = I3SAttributeReader.createTypedView(buffer, countsEntry);
          var valuesArray = I3SAttributeReader.createRawView(buffer, valuesEntry);
          return I3SAttributeReader.readStringArray(countsEntry.count, countsArray, valuesArray);
        } else {
          return I3SAttributeReader.createTypedView(buffer, valuesEntry);
        }
      }
      throw new Error("Bad attributeStorageInfo specification.");
    },

    // Load all attributes
    loadAll: function(loader, nodeURL, attributeStorageInfos, attributeData) {
      var length = attributeData.length;
      var promises = [];
      for (var i=0; i<length; i++) {
        promises.push(I3SAttributeReader.load(loader, nodeURL, attributeStorageInfos[i], attributeData[i]));
      }
      return PromiseLightweight.join(promises);
    },

    // load a single attribute
    load: function(loader, nodeURL, attributeStorageInfo, attributeData) {
      var promise = new PromiseLightweight.Promise();
      var pathAttribute = I3SUtil.concatUrl(nodeURL, attributeData.href)+"/";
      attributeData.hrefConcat = pathAttribute;

      loader.request(pathAttribute,"binary").then(function(url, data) {
        promise.done(I3SAttributeReader.readBinary(attributeStorageInfo, data));
      },function(err){
         promise.reject(err);
      });
      return promise;
    }
  };

  return I3SAttributeReader;
});