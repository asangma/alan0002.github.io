define([
  'intern!object',
  'intern/chai!assert',
  'require'
], function(registerSuite, assert, require){

  var url = './SimpleMarkerSymbol.html';

  registerSuite(function(){
    var session;
    return {
      name: 'esri/layers/SimpleMarkerSymbol (functional)',

      setup: function(){
        session = this.remote
          .get(require.toUrl(url))
          .findById('x')
          .click()
          .type('4549921')
          .end()
          .findById('y')
          .click()
          .type('4549921')
          .end()
          .findById('execute')
          .click()
          .end();
      },

      getSymbol: function(){
        return session
          .findById('text')
          .getVisibleText()
          .then(function(data){
            var sym = JSON.parse(data);
            assert.equal(sym.type, 'esriSMS', 'values should be equal');
            assert.equal(sym.style, 'esriSMSSquare', 'values should be equal');
            assert.equal(sym.color[0], 240, 'red should be equal');
            assert.equal(sym.color[1], 96, 'green should be equal');
            assert.equal(sym.color[2], 96, 'blue should be equal');
            assert.equal(sym.color[3], 255, 'transparency should be equal');
            assert.equal(sym.size, 12, 'size should be equal');
            assert.equal(sym.outline.width, 1.5, 'width should be equal');
            assert.equal(sym.outline.style, 'esriSLSSolid', 'outline style should be equal');
            assert.equal(sym.outline.color[0], 89, 'outline color should be equal');
          });
      },

      getSymbolCount: function(){
        return session
          .findById('x')
          .clearValue()
          .click()
          .type('4549921')
          .end()
          .findById('y')
          .clearValue()
          .click()
          .type('454992')
          .end()
          .findById('execute')
          .click()
          .end()
          .findAllByTagName('path')
          .then(function(data){
            assert.equal(data.length, 2, 'values should be equal');
          });
      }
    }
  });
});