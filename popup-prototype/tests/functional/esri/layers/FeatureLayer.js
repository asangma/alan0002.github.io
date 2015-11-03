define([
  'intern!object',
  'intern/chai!assert',
  'require'
], function(registerSuite, assert, require){

  var url = './FeatureLayer.html';

  registerSuite(function(){
    var session;

    return {
      name: 'esri/layers/FeatureLayer (functional)',

      setup: function(){
        session = this.remote.get(require.toUrl(url)).setFindTimeout(10000);
      },

      'Verify Features': function(){
        return Promise.all([
          session.findAllByTagName('circle'),
          session.findByTagName('circle').getAttribute('fill')
        ]).then(function(results){
          assert.equal(results[0].length, 1148, 'Error: number of features should match.');
          assert.equal(results[1], 'rgb(227, 139, 79)', 'Error: the fill attribute should match.');
        });
      }
    }
  });
});
