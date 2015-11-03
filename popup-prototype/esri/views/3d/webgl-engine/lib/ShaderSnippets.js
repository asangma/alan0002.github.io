/* jshint forin:false */
define(["./Util", "dojox/xml/parser"], function(Util, parser) {
  var assert = Util.assert;
  var VertexAttrConstants = Util.VertexAttrConstants;

  var ShaderSnippets = function() {
    for (var vac in VertexAttrConstants) {
      this[VertexAttrConstants[vac]] = VertexAttrConstants[vac];
    }

    this._parse = function(shadersXmlString) {
      var xml = parser.parse(shadersXmlString);

      var elements = xml.getElementsByTagName("snippet");

      var regex1 = /\$[a-zA-Z0-9]+[ \t]*/;
      var regex2 = /[\$\s]+/g;

      for(var i = 0; i < elements.length; i++) {
        var name = elements[i].getAttribute("name");
        assert(this[name] === undefined);
        var text = elements[i].textContent;

        var n;
        //var uses = {};
        while ( (n = text.match(regex1)) !== null)
        {
          var cut = n[0].replace(regex2,"");
          var r = this[cut];
          assert(r !== undefined);
          //uses[cut] = true;
          text = text.replace(n[0],r);
        }
        this[name] = text;
//        uses = subtractObjects(uses, {position: true, uv0: true, normal: true, auxpos1: true, auxpos2: true});
//        for (var u in uses)
//          console.log(name.toString()+"->"+u);
      }
    };
  };

  return ShaderSnippets;
});
