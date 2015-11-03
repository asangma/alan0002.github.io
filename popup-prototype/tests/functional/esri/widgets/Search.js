define([
  'intern!object',
  'intern/chai!assert',
  'require'
], function(registerSuite, assert, require){

  var url = './Search.html';

  registerSuite(function(){
    var session;

    return {
      name: 'esri/widgets/Search (functional)',

      setup: function(){
        session = this.remote.get(require.toUrl(url))
          .findById('searchDiv_input').click().type('380 New York St, Redlands, California, USA').end()
          .findByClassName('esri-submit').click().end();
      },

      'Verify Popup': function(){
        return session
          .sleep(3000)
          .findByClassName('esri-more-item')
          .getVisibleText()
          .then(function(data){
            assert.equal(data, '380 New York St, Redlands, California, 92373', 'values should be equal');
          });
      },

      'Verify Marker': function() {
        return session
          .findById('coorindates')
          .getVisibleText()
          .then(function(data){
            var marker = JSON.parse(data);
            assert.equal(marker.x, -13046161.849304594, 'values should be equal');
            assert.equal(marker.y, 4036389.86668915, 'values should be equal');
          });
      }
    }
  });
});