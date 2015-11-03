define([
    "./utils/assertRequest",
    "./utils/Intent",

    "dijit/Dialog",
    "dijit/registry",
    "dojo/on",
    "dojo/dom",
    "dojo/Deferred",

    "esri/kernel",
    "esri/identity/IdentityManager"
  ],
  function(
    assertRequest, Intent,
    Dialog, registry,  on, dom, Deferred,
    esriKernal
  ) {

    var executeTest = assertRequest.executeTest,
      dataFormats = assertRequest.dataFormats;

    return {

      /**
       * The following requests are tested:
       *
       * esriRequest({
       *  url: "secureurl",
       *  handleAs: "json"
       * });
       *
       */
      "standalone": {

        "get": function () {
          var dfd = this.async(10000);

          var expected = new Intent();
          expected.isXhrGet = true;
          expected.corsDetection = true;
          expected.tokenError = true;
          expected.isXhrPostForToken = true;
          expected.isXhrGetWithToken = true;

          /**
           * automatically enters creds whenever dialog box is created
           */
          on.once(esriKernal.id, 'dialog-create', function(){
            registry.byId("dijit_Dialog_0").onShow = function(){
              dom.byId('dijit_form_ValidationTextBox_0').value = "user1";
              dom.byId('dijit_form_ValidationTextBox_1').value = "user1";
              dom.byId('dijit_form_Button_0').click();
            };
          });

          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["secure_featureLayer"], intent, expected);

        },

        "subsequent get": function () {
          var dfd = this.async(10000);

          var expected = new Intent();
          expected.isXhrGet = true;
          expected.corsDetection = true;
          expected.isXhrGetWithToken = true;

          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["secure_featureLayer"], intent, expected);
        },

        "Mock get": function () {
          var dfd = this.async(10000);

          var expected = new Intent();
          expected.isXhrGet = true;
          expected.corsDetection = true;
          expected.tokenError = true;
          expected.isXhrPostForToken = true;
          expected.isXhrGetWithToken = true;

          /**
           * automatically enters creds whenever dialog box is displayed
           */
          registry.byId("dijit_Dialog_0").onShow = function(){
            dom.byId('dijit_form_ValidationTextBox_0').value = "user2";
            dom.byId('dijit_form_ValidationTextBox_1').value = "user2";
            dom.byId('dijit_form_Button_0').click();
          };

          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["secure_mockLayer"], intent, expected);
        },

        "subsequent Mock get": function () {
          var dfd = this.async(10000);

          var expected = new Intent();
          expected.isXhrGet = true;
          expected.corsDetection = true;
          expected.isXhrGetWithToken = true;

          var intent = new Intent();
          executeTest(dfd, "GET", dataFormats["secure_mockLayer"], intent, expected);
        },
      }
    }
  });
