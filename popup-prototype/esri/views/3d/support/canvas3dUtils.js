define([],
  function() {

    var canvas3dUtils = {

      dataURItoBlob: function(dataURI) {
        // convert base64 to raw binary data held in a string
        // doesn"t handle URLEncoded DataURIs
        var byteString = atob(dataURI.split(",")[1]);

        // separate out the mime component
        var mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];

        // write the bytes of the string to an ArrayBuffer
        var ab = new ArrayBuffer(byteString.length);
        var ia = new Uint8Array(ab);
        for (var i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], {
          "type": mimeString
        });
      }
    };
    return canvas3dUtils;
  });
