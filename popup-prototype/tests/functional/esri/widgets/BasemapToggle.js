define([
  'intern!object',
  'intern/chai!assert',
  'require'
], function(registerSuite, assert, require){

  var url = './BasemapToggle.html';

  registerSuite(function(){
    var session1;
    var session2;

    return {
      name: 'esri/widgets/BasemapToggle (functional)',

      setup: function(){
        session1 = this.remote.get(require.toUrl(url));
      },

      'Verify widget start-up': function(){
        return Promise.all([
          session1.findByClassName('esri-basemap-title').getVisibleText(),
          session1.findByClassName('esri-basemap-bg').getAttribute('style')
        ]).then(function(results){
          assert.equal(results[0], 'Imagery with Labels', 'Initial title in the widget should match');
          assert.include(results[1], 'hybrid.jpg', 'Initial background image in the widget should match');
        });
      },

      'Verify clicking the widget': function(){
        session2 = session1.end().findById('BasemapToggleDiv').click().sleep(4000);

        return Promise.all([
          session2.findByClassName('esri-basemap-title').getVisibleText(),
          session2.findByClassName('esri-basemap-bg').getAttribute('style')
        ]).then(function(results){
              assert.equal(results[0], 'Topographic', 'Title of the widget after clicking should match');
              assert.include(results[1], 'topo.jpg', 'Background image of the widget after clicking should match');
        });
      },

      'Verify the basemap': function(){
        return session2.findAllByCssSelector('.esri-view-surface .esri-display-object')
          .then(function(results){
            assert.equal(results.depth, 2 , 'There should be two .esri-display-object under .esri-view-surface');
          });
      }
    }
  });
});