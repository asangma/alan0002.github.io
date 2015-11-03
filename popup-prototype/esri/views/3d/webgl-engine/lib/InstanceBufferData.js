define(["./Util"], function (Util) {

  return function InstanceBufferData(instanceDataSize, initialCapacity) {
    if (initialCapacity === undefined) {
      initialCapacity = 4*instanceDataSize;
    } else {
      initialCapacity = Util.nextHighestPowerOfTwo(initialCapacity*instanceDataSize);
    }

    var array = new Float32Array(initialCapacity);
    var zeroItem = new Float32Array(instanceDataSize);
    var endSlot = 0;

    var emptySlots = [];
    var emptySlotsIdx = 0;
    var id2slot = {};
    var slot2id = new Array(initialCapacity);

    this.prepareFree = function(count) {
      emptySlots.length += count;
    };

    this.free = function(id) {
      var slot = id2slot[id];
      if (slot != null) {
        emptySlots[emptySlotsIdx++] = slot;
        slot2id[slot] = undefined;
      }
    };

    this.prepareAllocate = function(count) {
      var additionalSlots = count - emptySlotsIdx;
      if (additionalSlots > 0) {
        this._resizeArray((endSlot+additionalSlots)*instanceDataSize);
      }
    };

    this.allocate = function(id) {
      var slot;
      if (emptySlotsIdx > 0) {
        slot = emptySlots[--emptySlotsIdx];
      }
      else {
        slot = endSlot++;
      }
      id2slot[id] = slot;
      slot2id[slot] = id;
      return slot;
    };

    this.getSlot = function(id) {
      return id2slot[id];
    };

    this.getOffset = function(slot) {
      return slot*instanceDataSize;
    };

    this.getArray = function() {
      return array;
    };

    this.fill = function(slot, offset, data) {
      array.set(data, slot*instanceDataSize + offset);
    };

    this.compact = function() {
      if (emptySlotsIdx > 0) {
        emptySlots.length = emptySlotsIdx;
        emptySlots.sort(function(a, b) { return a - b; });

        // remove unused slots at the end
        while ((emptySlotsIdx > 0) && (emptySlots[emptySlotsIdx-1] === endSlot)) {
          emptySlotsIdx--;
          endSlot--;
        }

        // fill unused slots in the interior
        while (emptySlotsIdx > 0) {
          emptySlotsIdx--;
          var oldSlot = endSlot-1;
          var newSlot = emptySlots[emptySlotsIdx];
          var oldOffset = oldSlot*instanceDataSize;
          var newOffset = newSlot*instanceDataSize;
          // copy data of last used slot to empty slot
          array.set(array.subarray(oldOffset, oldOffset + instanceDataSize), newOffset);
          array.set(zeroItem, oldOffset);

          // update slot <-> id accounting
          var id = slot2id[oldSlot];
          slot2id[oldSlot] = undefined;
          slot2id[newSlot] = id;
          id2slot[id] = newSlot;

          endSlot--;
        }
      }
      this._resizeArray(endSlot*instanceDataSize);
      emptySlots.length = 0;
      return array;
    };

    this._resizeArray = function(targetLength) {
      var newLength, newArray;
      if (targetLength > array.length) {
        newLength = array.length || 1;
        while (newLength < targetLength) {
          newLength *= 2;
        }
        newArray = new Float32Array(newLength);
        newArray.set(array);
        array = newArray;
      } else if (targetLength <= array.length / 2) {
        newLength = array.length;
        var targetLength2 = 2 * targetLength;
        while (newLength >= targetLength2) {
          newLength /= 2;
        }
        newArray = new Float32Array(newLength);
        newArray.set(array.subarray(0, newLength));
        array = newArray;
      }
    };
  };
});