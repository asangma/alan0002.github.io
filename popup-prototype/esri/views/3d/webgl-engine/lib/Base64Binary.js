// jshint bitwise:false

define([], function () {

/*
Copyright (c) 2011, Daniel Guerrero
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
* Redistributions of source code must retain the above copyright
notice, this list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright
notice, this list of conditions and the following disclaimer in the
documentation and/or other materials provided with the distribution.
* Neither the name of the Daniel Guerrero nor the
names of its contributors may be used to endorse or promote products
derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL DANIEL GUERRERO BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/**
* Uses the new array typed in javascript to binary base64 encode/decode
* at the moment just decodes a binary base64 encoded
* into either an ArrayBuffer (decodeArrayBuffer)
* or into an Uint8Array (decode)
*
* References:
* https://developer.mozilla.org/en/JavaScript_typed_arrays/ArrayBuffer
* https://developer.mozilla.org/en/JavaScript_typed_arrays/Uint8Array
*/

var Base64Binary = {
  //_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
  
  _char2idx : {
    "A" : 0,
    "B" : 1,
    "C" : 2,
    "D" : 3,
    "E" : 4,
    "F" : 5,
    "G" : 6,
    "H" : 7,
    "I" : 8,
    "J" : 9,
    "K" : 10,
    "L" : 11,
    "M" : 12,
    "N" : 13,
    "O" : 14,
    "P" : 15,
    "Q" : 16,
    "R" : 17,
    "S" : 18,
    "T" : 19,
    "U" : 20,
    "V" : 21,
    "W" : 22,
    "X" : 23,
    "Y" : 24,
    "Z" : 25,
    "a" : 26,
    "b" : 27,
    "c" : 28,
    "d" : 29,
    "e" : 30,
    "f" : 31,
    "g" : 32,
    "h" : 33,
    "i" : 34,
    "j" : 35,
    "k" : 36,
    "l" : 37,
    "m" : 38,
    "n" : 39,
    "o" : 40,
    "p" : 41,
    "q" : 42,
    "r" : 43,
    "s" : 44,
    "t" : 45,
    "u" : 46,
    "v" : 47,
    "w" : 48,
    "x" : 49,
    "y" : 50,
    "z" : 51,
    "0" : 52,
    "1" : 53,
    "2" : 54,
    "3" : 55,
    "4" : 56,
    "5" : 57,
    "6" : 58,
    "7" : 59,
    "8" : 60,
    "9" : 61,
    "+" : 62,
    "/" : 63,
    "=" : 64
  },

  decode : function(input) {
    // get last chars to see if are valid
    var lkey1 = this._char2idx[input.charAt(input.length - 1)];
    var lkey2 = this._char2idx[input.charAt(input.length - 2)];

    var bytes = (input.length / 4) * 3;
    
    if (lkey1 == 64) {
      bytes--; // padding chars, so skip
    }
    
    if (lkey2 == 64) {
      bytes--; // padding chars, so skip
    }

    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;
    var j = 0;

    var ab = new ArrayBuffer(bytes);
    var byteView = new Uint8Array(ab);

    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

    for (i = 0; i < bytes; i += 3) {
      // get the 3 octects in 4 ascii chars
      enc1 = this._char2idx[input.charAt(j++)];
      enc2 = this._char2idx[input.charAt(j++)];
      enc3 = this._char2idx[input.charAt(j++)];
      enc4 = this._char2idx[input.charAt(j++)];

      chr1 = (enc1 << 2) | (enc2 >> 4);
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      chr3 = ((enc3 & 3) << 6) | enc4;

      byteView[i] = chr1;
      
      if (enc3 != 64) {
        byteView[i + 1] = chr2;
      }
      
      if (enc4 != 64) {
        byteView[i + 2] = chr3;
      }
    }

    return ab;
  },
  
  decodeFloat32 : function(input) {
    return new Float32Array(this.decode(input));
  },
  
  decodeUint32 : function(input) {
    return new Uint32Array(this.decode(input));
  },  
  
  decodeInt32 : function(input) {
    return new Int32Array(this.decode(input));
  },
    
  _lookup : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",

  encode : function(uint8) {

    if (!(uint8 instanceof Uint8Array)) {
      uint8 = new Uint8Array(uint8.buffer, uint8.byteOffset, uint8.byteLength);
    }

    var i, extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2
                        // bytes
    output = "", temp, length;

    // go through the array every three bytes, we"ll deal with trailing stuff
    // later
    for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
      temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
      output += this._lookup[temp >> 18 & 0x3F] + this._lookup[temp >> 12 & 0x3F]
          + this._lookup[temp >> 6 & 0x3F] + this._lookup[temp & 0x3F];
    }

    // pad the end with zeros, but make sure to not forget the extra bytes
    switch (extraBytes) {
    case 1:
      temp = uint8[uint8.length - 1];
      output += this._lookup[temp >> 2];
      output += this._lookup[(temp << 4) & 0x3F];
      output += "==";
      break;
    case 2:
      temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1]);
      output += this._lookup[temp >> 10];
      output += this._lookup[(temp >> 4) & 0x3F];
      output += this._lookup[(temp << 2) & 0x3F];
      output += "=";
      break;
    }

    return output;
  }
};

return Base64Binary;

//AMD TODO: dont polute global, return an object, eg.:return engine.lib.Base64;
});