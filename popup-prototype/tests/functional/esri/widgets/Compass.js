define([
  'intern!object',
  'intern/chai!assert',
  'require'
], function(registerSuite, assert, require){

  var url = './Compass.html';

  registerSuite(function(){
    var session;

    return {
      name: 'esri/widgets/Compass (functional)',

      setup: function(){
        session = this.remote.get(require.toUrl(url));
      },

      'Widget start-up': function(){
        return Promise.all([
          session.findById('compassDiv').getAttribute('class'),
          session.findByCssSelector('#compassDiv > div').getAttribute('style')
        ]).then(function(results){
          assert.equal(results[0], 'esri-compass', 'Class of the compassDiv should match');
          assert.notEqual(results[1], 'transform: rotateZ(0deg); -webkit-transform: rotateZ(0deg);', 'The rotation should not be 0');
        });
      },

      'Widget actions': function(){
        var sub_session = session.end().findById('compassDiv').click().end().sleep(2000);

        return sub_session.findByCssSelector('#compassDiv div').getAttribute('style')
          .then(function(style){
            assert.equal(style, 'transform: rotateZ(0deg);', 'The rotation should not be 0');
          });
      }
    }
  });
});