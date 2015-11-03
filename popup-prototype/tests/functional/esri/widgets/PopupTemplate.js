define([
  'intern!object',
  'intern/chai!assert',
  'require'
], function(registerSuite, assert, require){

  var url = './PopupTemplate.html';

  registerSuite(function(){
    var session;

    return {
      name: 'esri/widgets/PopupTemplate (functional)',

      setup: function(){
        session = this.remote.get(require.toUrl(url)).setFindTimeout(10000).findByTagName('path').moveMouseTo(51, 93)
          .clickMouseButton(0).end().sleep(1000);
      },

      'Verify Popup': function(){
        return Promise.all([
          session.findByCssSelector('.main-section > .header').getVisibleText(),
          session.findByCssSelector('.main-section b').getVisibleText()
        ]).then(function(results){
          assert.equal(results[0], 'Marriage in NY, Zip Code: 11101', 'Error: title should match.');
          assert.equal(results[1], 'Marriage Rate: 44%', 'Error: first line should match');
        });
      }
    }
  });
});