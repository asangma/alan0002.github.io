define([
  'intern!object',
  'intern/chai!assert',
  'require'
], function(registerSuite, assert, require){

  var url = './GraphicsLayer.html';

  registerSuite(function(){
    var session;

    return {
      name: 'esri/layers/GraphicsLayer (functional)',

      setup: function(){
        session = this.remote.get(require.toUrl(url)).setFindTimeout(10000);
      },

      'Verify Point': function(){
        return Promise.all([
          session.findByTagName('circle').getAttribute('fill'),
          session.findByTagName('circle').getAttribute('stroke'),
          session.findByTagName('circle').getAttribute('r')
        ]).then(function(results){
          assert.equal(results[0], 'rgb(226, 119, 40)', "Fill attribute of circle should be the same.");
          assert.equal(results[1], 'rgb(255, 255, 255)', "Stroke attribute of circle should be the same.");
          assert.equal(results[2], '8', "R attribute of circle should be the same. (Might be problematic!)");
        });
      },

      'Verify Polyline': function(){
        return Promise.all([
          session.findByTagName('path').getAttribute('fill'),
          session.findByTagName('path').getAttribute('stroke')
        ]).then(function(results){
          assert.equal(results[0], 'none', "Error: fill attribute of Polyline.");
          assert.equal(results[1], 'rgb(226, 119, 40)', "Error: stroke of polyline");
        });
      },

      'Verify Polygon': function(){
         return session.end().findAllByTagName('path').then(function(results){
           return Promise.all([
             results[1].getAttribute('fill'),
             results[1].getAttribute('stroke')]);
         }).then(function(results){
           assert.equal(results[0], 'rgb(227, 139, 79)', "Error: polygon fill");
           assert.equal(results[1], 'rgb(255, 255, 255)', 'Error: polygon stroke');
         });
      }
    }
  });
});
