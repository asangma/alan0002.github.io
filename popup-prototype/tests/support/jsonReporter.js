define([
  'dojo/node!fs'
], function(fs){

  var report = {
    name: '',
    testsCount: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    time: 0,
    tests: []
  };

  var TestSuite = function(testSuite){
    this.name = testSuite.name;
    this.testsCount = testSuite.numTests;
    this.passed = testSuite.numTests - testSuite.numFailedTests - testSuite.numSkippedTests;
    this.failed = testSuite.numFailedTests;
    this.skipped = testSuite.numSkippedTests;
    this.time = testSuite.timeElapsed;
    this.tests = [];
    var i;
    for(i=0; i<testSuite.tests.length; i++){
      var temp = testSuite.tests[i];

      if(temp.id){
        var testCase = new TestCase(temp);
        this.tests.push(testCase);
      } else{
        var testSuite = new TestSuite(temp);
        this.tests.push(testSuite);
      }
    }
  };

  var TestCase = function(testCase){
    this.id = testCase.id;
    this.name = testCase.name;
    this.time = testCase.timeElapsed;
    this.status = testCase.hasPassed;
    this.skipped = testCase.skipped ? true : false;
    this.error = testCase.error;
  };

  function jsonReporter() {

    this.suiteEnd = function (suite) {
      if (suite.name === 'chromeonanyplatform') {
        return;
      }

      report.name = suite.name;
      report.testsCount = suite.numTests;
      report.passed = suite.numTests - suite.numFailedTests - suite.numSkippedTests;
      report.failed = suite.numFailedTests;
      report.skipped = suite.numSkippedTests;
      report.time = suite.timeElapsed;

      /*
      var i = (suite.publishAfterSetup)? 1: 0;
      if(suite.tests.length === 1){
        i = 0;
      }
      */

      for(var i=0; i<suite.tests.length; i++){
        var temp = suite.tests[i];
        var testSuite = new TestSuite(temp);

        report.tests.push(testSuite);
      }


    };

    this.runEnd = function() {
      console.log("writing report.json...");
      fs.writeFileSync('./tests/support/output/report.json', JSON.stringify(report));
      console.log("report.json completed...");
    }
  };

  return jsonReporter;

});