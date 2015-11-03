define([
    "intern!tdd",
    "intern/chai!assert",
    "esri/layers/support/LabelClass"
], function(tdd, assert, LabelClass) {
  tdd.suite("esri/layers/support/LabelClass", function () {
    tdd.test("getRequiredFields", function () {
      var test = function (json, expected) {
          var lc = new LabelClass(json);
          var actual = lc.getRequiredFields();
          assert.equal(actual.length, expected.length, "number of fields");
          expected.forEach(function(f) {
              assert.isTrue(actual.indexOf(f) > -1, "field returned: " + f);
          });
      };
      test({labelExpression: ""},[]);
      test({labelExpression: "[f1]"},["f1"]);
      test({labelExpression: "[f1][f2]"},["f1","f2"]);
      test({where: "f1 = 0"},["f1"]);
      test({where: "f1 = 0 AND f2 = 0"},["f1", "f2"]);
      test({where: "f1 > 0 AND f1 < 4"},["f1"]);
      test({where: "f1 = 0",labelExpression: "[f2]"},["f1","f2"]);
      test({where: "f1 = 0",labelExpression: "[f1]"},["f1"]);
      test({where: "f1 = 0",labelExpression: "[f1]"},["f1"]);
    });

    tdd.test("formatField", function() {
      assert.equal(LabelClass.formatField("f1","foo",{},[],undefined), "foo", "default");
      assert.equal(LabelClass.formatField("f1","foo",{f1:null}, [{name:"f1"}],undefined), "", "null");
      assert.equal(LabelClass.formatField("f1","foo",{f1:"bar"},[{name:"f1"}],undefined), "bar", "standard");
      assert.equal(LabelClass.formatField("f2","foo",{f1:"bar"},[{name:"f1"}],undefined), "foo", "notfound");

      var date = new Date(2015,09,21,12,00,00);

      assert.equal(LabelClass.formatField("f1","",{f1:date.valueOf()},[{name:"f1", type:"esriFieldTypeDate"}],undefined), "10/21/2015", "date");
      assert.equal(LabelClass.formatField("f1","",{f1:date.valueOf()},[{name:"f1", type:"esriFieldTypeDate"}],{dateFormat:"longDate"}), "Wednesday, October 21, 2015", "date with format");

      assert.equal(LabelClass.formatField("f1","",{f1:17.356},[{name:"f1", type:"esriFieldTypeInteger"}],undefined), "17.356", "number format");
      assert.equal(LabelClass.formatField("f1","",{f1:17.356},[{name:"f1", type:"esriFieldTypeInteger"}],{numberFormat:{ places:1, digitSeparator:"."}}), "17.4", "number format");
      //assert.equal(LabelClass.formatField("f1","",{f1:17.356},[{name:"f1", type:"esriFieldTypeInteger"}],{numberFormat:{ places:2, digitSeparator:","}}), "17,36", "number"); separator not supported
    });

    tdd.test("buildLabelText", function() {
      assert.equal(LabelClass.buildLabelText("",{},[],undefined), "", "empty");
      assert.equal(LabelClass.buildLabelText("{f1}",{},[],undefined), "{f1}", "default");
      assert.equal(LabelClass.buildLabelText("{f1}",{f1:"foo"},[{name:"f1"}],undefined), "foo", "standard");
      assert.equal(LabelClass.buildLabelText("{f1}{f1}",{f1:"foo"},[{name:"f1"}],undefined), "foofoo", "twice");
      assert.equal(LabelClass.buildLabelText("{f1}{f2}",{f1:"foo"},[{name:"f1"}],undefined), "foo{f2}", "onenotfound");
      assert.equal(LabelClass.buildLabelText("{f1}{f2}",{f1:"foo",f2:"bar"},[{name:"f1"},{name:"f2"}],undefined), "foobar", "two");
    });

    tdd.test("evaluateWhere", function() {
      assert.equal(LabelClass.evaluateWhere("f1 = 0",{}),      false, "undefined");
      assert.equal(LabelClass.evaluateWhere("f1 = 0",{f1:0}),  true,  "0=0");
      assert.equal(LabelClass.evaluateWhere("f1 = 0",{f1:1}),  false, "1=0");
      assert.equal(LabelClass.evaluateWhere("f1 > 0",{f1:0}),  false, "0>0");
      assert.equal(LabelClass.evaluateWhere("f1 > 0",{f1:1}),  true,  "1>0");
      assert.equal(LabelClass.evaluateWhere("f1 >= 1",{f1:0}), false, "0>=1");
      assert.equal(LabelClass.evaluateWhere("f1 >= 1",{f1:1}), true,  "1>=1");
      assert.equal(LabelClass.evaluateWhere("f1 < 1",{f1:0}),  true,  "0<1");
      assert.equal(LabelClass.evaluateWhere("f1 < 1",{f1:1}),  false, "1<1");
      assert.equal(LabelClass.evaluateWhere("f1 <= 0",{f1:0}), true,  "0<=1");
      assert.equal(LabelClass.evaluateWhere("f1 <= 0",{f1:1}), false, "1<=1");
      assert.equal(LabelClass.evaluateWhere("f1 > 0 AND f1 < 2",{f1:0}), false, "0 > 0 AND 0 < 2");
      assert.equal(LabelClass.evaluateWhere("f1 > 0 AND f1 < 2",{f1:1}), true,  "1 > 0 AND 1 < 2");
      assert.equal(LabelClass.evaluateWhere("f1 > 0 AND f1 < 2",{f1:2}), false, "2 > 0 AND 2 < 2");
      assert.equal(LabelClass.evaluateWhere("f1 = 0 OR f1 = 2",{f1:0}),  true,  "0 = 0 OR 0 = 2");
      assert.equal(LabelClass.evaluateWhere("f1 = 0 OR f1 = 2",{f1:1}),  false, "1 = 0 OR 1 = 2");
      assert.equal(LabelClass.evaluateWhere("f1 = 0 OR f1 = 2",{f1:2}),  true,  "2 = 0 OR 2 = 2");
    });


  });
});
