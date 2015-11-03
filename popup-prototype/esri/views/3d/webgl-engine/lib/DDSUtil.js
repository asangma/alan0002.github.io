/*
 * Copyright (c) 2012 Brandon Jones
 *
 * This software is provided 'as-is', without any express or implied
 * warranty. In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 *    1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 *
 *    2. Altered source versions must be plainly marked as such, and must not
 *    be misrepresented as being the original software.
 *
 *    3. This notice may not be removed or altered from any source
 *    distribution.
 */

// Original code: http://blog.tojicode.com/2011/12/compressed-textures-in-webgl.html

/* jshint forin:false, bitwise:false */
define([], function() {
  "use strict";

  // DDS values and structures referenced from:
  // http://msdn.microsoft.com/en-us/library/bb943991.aspx/
  var DDS_MAGIC = 0x20534444;

  var DDSD_MIPMAPCOUNT = 0x20000;
  var DDPF_FOURCC = 0x4;


  // DXT formats, from:
  // http://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_s3tc/
  var COMPRESSED_RGB_S3TC_DXT1_EXT  = 0x83F0;
  //var COMPRESSED_RGBA_S3TC_DXT1_EXT = 0x83F1;
  var COMPRESSED_RGBA_S3TC_DXT3_EXT = 0x83F2;
  var COMPRESSED_RGBA_S3TC_DXT5_EXT = 0x83F3;

  function fourCCToInt32(value) {
    return value.charCodeAt(0) +
      (value.charCodeAt(1) << 8) +
      (value.charCodeAt(2) << 16) +
      (value.charCodeAt(3) << 24);
  }

  function int32ToFourCC(value) {
    return String.fromCharCode(
        value & 0xff,
        (value >> 8) & 0xff,
        (value >> 16) & 0xff,
        (value >> 24) & 0xff
    );
  }

  var FOURCC_DXT1 = fourCCToInt32("DXT1");
  var FOURCC_DXT3 = fourCCToInt32("DXT3");
  var FOURCC_DXT5 = fourCCToInt32("DXT5");

  var headerLengthInt = 31; // The header length in 32 bit ints

  // Offsets into the header array
  var off_magic = 0;

  var off_size = 1;
  var off_flags = 2;
  var off_height = 3;
  var off_width = 4;

  var off_mipmapCount = 7;

  var off_pfFlags = 20;
  var off_pfFourCC = 21;

  // Little reminder for myself where the above values come from
  /*DDS_PIXELFORMAT {
   int32 dwSize; // offset: 19
   int32 dwFlags;
   char[4] dwFourCC;
   int32 dwRGBBitCount;
   int32 dwRBitMask;
   int32 dwGBitMask;
   int32 dwBBitMask;
   int32 dwABitMask; // offset: 26
   };

   DDS_HEADER {
   int32 dwSize; // 1
   int32 dwFlags;
   int32 dwHeight;
   int32 dwWidth;
   int32 dwPitchOrLinearSize;
   int32 dwDepth;
   int32 dwMipMapCount; // offset: 7
   int32[11] dwReserved1;
   DDS_PIXELFORMAT ddspf; // offset 19
   int32 dwCaps; // offset: 27
   int32 dwCaps2;
   int32 dwCaps3;
   int32 dwCaps4;
   int32 dwReserved2; // offset 31
   };*/

  /**
   * Parses a DDS file from the given arrayBuffer and uploads it into the currently bound texture
   *
   * @param {WebGLRenderingContext} gl WebGL rendering context
   * @param {TypedArray} arrayBuffer Array Buffer containing the DDS files data
   * @param {boolean} [loadMipmaps] If false only the top mipmap level will be loaded, otherwise all available mipmaps will be uploaded
   *
   * @returns {number} Number of mipmaps uploaded, 0 if there was an error
   */
  var uploadDDSLevels = function (gl, arrayBuffer, loadMipmaps) {
    var header = new Int32Array(arrayBuffer, 0, headerLengthInt),
      fourCC, blockBytes, internalFormat,
      width, height, dataLength, dataOffset,
      byteArray, mipmapCount, i;

    if(header[off_magic] != DDS_MAGIC) {
      console.error("Invalid magic number in DDS header");
      return 0;
    }

    if(!header[off_pfFlags] & DDPF_FOURCC) {
      console.error("Unsupported format, must contain a FourCC code");
      return 0;
    }

    fourCC = header[off_pfFourCC];
    switch(fourCC) {
      case FOURCC_DXT1:
        blockBytes = 8;
        internalFormat = COMPRESSED_RGB_S3TC_DXT1_EXT;
        break;

      case FOURCC_DXT3:
        blockBytes = 16;
        internalFormat = COMPRESSED_RGBA_S3TC_DXT3_EXT;
        break;

      case FOURCC_DXT5:
        blockBytes = 16;
        internalFormat = COMPRESSED_RGBA_S3TC_DXT5_EXT;
        break;

      default:
        console.error("Unsupported FourCC code:", int32ToFourCC(fourCC));
        return null;
    }

    mipmapCount = 1;
    if(header[off_flags] & DDSD_MIPMAPCOUNT && loadMipmaps !== false) {
      mipmapCount = Math.max(1, header[off_mipmapCount]);
    }

    width = header[off_width];
    height = header[off_height];
    dataOffset = header[off_size] + 4;

    //fill all levels, even if not specified. wgl seems to need up to 1x1, even for rect textures
    //reuse data for unspecified levels to make it complete
    for(i = 0; ; ++i) {

      if (i<mipmapCount) {
        dataLength = Math.floor((width + 3) / 4) * Math.floor((height + 3) / 4) * blockBytes;
        byteArray = new Uint8Array(arrayBuffer, dataOffset, dataLength);
      }

      gl.compressedTexImage2D(gl.TEXTURE_2D, i, internalFormat, width, height, 0, byteArray);
      dataOffset += dataLength;

      if (width==1 && height==1) {
        break;
      }

      width = Math.max(1,width>>1);
      height = Math.max(1,height>>1);
    }

    return {
      mipmapCount: mipmapCount,
      width: width,
      height: height
    };
  };


  var DDSUtil = {
    uploadDDSLevels: uploadDDSLevels
  };

  return DDSUtil;
});