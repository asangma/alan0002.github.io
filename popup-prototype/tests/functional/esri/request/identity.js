define([
  'intern!object',
  'intern/chai!assert',
  'require'
], function(registerSuite, assert, require){

  var url = './identity.html';

  registerSuite({
    name: 'esri/request (identity tests)',

    setup: function(){

    },

    getData: function(){

      return this.remote
        .get(require.toUrl(url))
        .setFindTimeout(5000)
        .findByXpath('id("dijit_form_ValidationTextBox_0")')
        .moveMouseTo(98, 4)
        .clickMouseButton(0)
        .pressKeys('user1')
        .end()
        .findByXpath('id("dijit_form_ValidationTextBox_1")')
        .moveMouseTo(72, 9)
        .clickMouseButton(0)
        .pressKeys('user1')
        .end()
        .findByXpath('id("dijit_Dialog_0")/DIV[2]/DIV[2]/SPAN[1]/INPUT[1]')
        .moveMouseTo(7.234375, 14)
        .clickMouseButton(0)
        .findByXpath('id("text")')
        .getVisibleText()
        .then(function(data){
          var text = JSON.parse(data);
          assert.equal(text.currentVersion, 10.3, "should be equal");
        });

    }

  });
});