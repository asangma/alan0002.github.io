# arcgis-js-api-intern-tests

arcgis-js-api uses intern framework for testing.

### Prerequisites
 * Install [node.js] (https://nodejs.org/).
 * install grunt-cli using the command `npm install -g grunt-cli`.
 * Before running the npm scripts, you need to install the dev dependencies by using the command `npm install`.
 * Create a file named `grunt-config.json` in the root of the project. And enter `"base": "<url>"` in the file, where `<url>` is the server url where the arcgis-js-api is running. For example, if the arcgis-js-api is running from `http://hostname.esri.com:9090/arcgis-js-api/` then enter the following in `grunt-config.json` file: `"base": "http://hostname.esri.com:9090/arcgis-js-api"`. To run the unit tests of `request`, you need to setup a proxy. Once the proxy is setup ([setting up proxy] (https://devtopia.esri.com/WebGIS/arcgis-js-api/tree/4.0master/tests#resource-proxy-for-request-tests)), enter the url in this json file. You also need to enter the `"nodeServer": <url>` where <url> is `http://hostname:9099` your node server will be running. Below is an example of `grunt-config.json` file:

```
  {
    "base": "http://mbalumuri.esri.com:8080/arcgis-js-api-4.0",
    "proxy": "http://mbalumuri.esri.com:8080/proxy/proxy.jsp",
    "nodeServer": "http://mbalumuri.esri.com:9099"
  }
```

### Getting Started

In intern, you can run the tests using:
 * browser client
 * Node.js client
 * test runner

##### Unit Tests

We have used the browser client to run the unit tests as the tests can be run directly in a browser. You can execute the unit tests by using the command `npm test`.

```
npm test // shortcut for: npm run test
```

`test` is an npm script which executes the command `grunt unitTest`. The grunt task `unitTest` uses `grunt-concurrent` plugin to execute the `startNodeServer` and `open:unitTest` tasks concurrently. The `open:unitTest` task, uses `grunt-open` plugin to navigate to the url `http://hostname/project-name/node_modules/intern/client.html?config=tests/intern&suites=tests/unit/all`. You can also specify other reporters in the url, if you want. You can also just specify the suites that you want to execute in the url. Example, `http://hostname/project-name/node_modules/intern/client.html?config=tests/intern&reporters=console&suites=tests/unit/esri/core/lang`.

##### Functional Tests

We have used test runner to run the functional tests. The functional tests can be executed using the command `npm run functional`. The test runner can execute both unit and functional tests, if we have specified the unit tests path in the suites array of the intern config. But we have separated out the unit tests, because the `request` tests would fail because of the cross-origin issues as the test runner starts intern server on a different domain. 

```
npm run functional
```

`functional` is an npm script which executes the command `grunt functionalTest --force`. The parameter `--force` is used in the grunt command because, it prevents grunt from halting, even if there are any errors in the previous tasks. This task uses `grunt-selenium-plugin` to download selenium and chrome driver if required and also to start/stop the selenium server. Once the selenium server is started, intern tests are executed before stopping the selenium server. Then `grunt-open` plugin is used to navigate to the url `http://hostname/project-name/tests/support/runner.html`. The default reporter for intern-runner is jsonReporter which stores the results of tests in json file. Then the runner.html uses this json file to display the results executed by intern-runner. You can also change the reporter in the gruntconfig, if you want.

##### All Tests

All the tests, both unit and functional tests can be executed using the command `npm run all-tests`.

```
npm run all-tests
```

`all-tests` is an npm script which executes the command `grunt allTests --force`. The parameter `--force` is used in the grunt command because, it prevents grunt from halting, even if there are any errors in the previous tasks. This task uses `grunt-concurrent` plugin, to execute the unit and functional tests concurrently. The `startNodeServer` and `open:unitTest` tasks executes the unit tests and the `functionalTest` task executes the functional tests.

## Folder Structure

All the files related to testing are placed in the `tests` folder of the root directory. Following is the structure of the tests folder:

```
- tests
    + functional
    - support
        + lib
        + mocking
        + output
        - jsonReporter.js
        - runner.html
    + unit
    - intern.js
    - README.md
```

 * The functional folder consists of the functional tests.  These tests may use selenium.  The folder structure inside functional folder should be similar to the folder structure of your project. For example, if you want to write functional tests for `esri/map.js` then place those tests in `/tests/functional/esri/map.js`. And then you should load the `map.js` test suite in `all.js` file of the functional folder as-well. This `all.js` file contains all the functional test suites that will be executed.
 * The unit folder consists of the unit tests.  These tests should not require selenium.  The folder structure inside unit folder should be similar to the folder structure of your project. For example, if you want to write unit tests for `esri/lang.js` then place those tests in `/tests/unit/esri/lang.js`. And then you should load the `lang.js` test suite in `all.js` file of the unit folder as-well. This `all.js` file contains all the unit test suites that will be executed.
 * The `intern.js` file in the tests folder will have all the configuration to run the tests.
 * The support folder consists of the lib, mocking, output and custom jsonReporter that are required to support intern to run the tests.
 * All the custom reporters of intern should be placed in `tests/support` folder.
 * The grunt-selenium-plugin downloads the chrome driver and selenium jar to the `/tests/support/lib` folder.
 * All the files that are used for mocking should be placed in `/tests/support/mocking` folder.
 * The `jsonReporter` outputs the report file to `/test/support/output` folder which will be consumed by `runner.html` to display the test results. The `runner.html` is opened after the intern-runner is executed.

### Test Interface

We are using Object interface for writing the tests. Below is an example:

```
define(function (require) {
  var registerSuite = require('intern!object');

  registerSuite({
    name: 'Suite name',

    setup: function () {
      // executes before suite starts;
      // can also be called `before` instead of `setup`
    },

    teardown: function () {
      // executes after suite ends;
      // can also be called `after` instead of `teardown`
    },

    beforeEach: function (test 3.0) {
      // executes before each test
    },

    afterEach: function (test 3.0) {
      // executes after each test
    },

    'Test foo': function () {
      // a test case
    },

    'Test bar': function () {
      // another test case
    },

    /* … */
  });
});
```

For more info, you can look at https://theintern.github.io/intern/#interface-object.
For info on writing unit tests intern, go to https://theintern.github.io/intern/#writing-unit-test.
For info on writing functional tests intern, go to https://theintern.github.io/intern/#writing-functional-test.
Here is the link to Chai assertion library - http://chaijs.com/api/assert/


## Importing Sinon

Sinon can be imported into the test modules by using `intern/order!sinon`. The intern/order plugin is used to load modules. And the path to the sinon.js is defined in the intern.js as shown below:

```
loader: {
    packages: [
      {
        name: 'sinon',
        location: 'node_modules/sinon/lib',
        main: 'sinon'
      }
    ]
  },
```

## Mocking using Sinon

Sinon is used to mock sample responses from the server using fakeServer functionality of sinon. It replaces the browsers xhr with a fakexhr and returns our sample responses. For more info on Fake Server go to: http://sinonjs.org/docs/#fakeServer.

We need to make sure that the fake server is not replacing the xhrs of Intern's proxy server. So when creating a fake server, use `createFakeServer` function of `sinonFakeServer.js` located at `tests\support` folder. It filters out the interns request.

### Example

In the below example, when an xhr is triggered by QueryTask's execute function, it is replaced by the sinon's fake xhr which sends the json from sampleQueryResponse.json in string format. The `server.respondwith` function map this json string response to a specific url that original xhr is trying to hit. If the urls match then fake response is sent. This is done by `server.respond` function.

```
  define([
    'intern!object',
    'intern/chai!assert',
    'sinonFakeServer!createFakeServer',
    'esri/tasks/support/Query',
    'esri/tasks/QueryTask',
    'esri/tasks/support/FeatureSet',
    'dojo/text!FeatureService/sampleQueryResponse.json'
  ], function(registerSuite, assert, createFakeServer, Query, QueryTask, FeatureSet, sampleQueryResponse){
    var server, query, featureLayerUrl, queryTask;

    registerSuite({
      name: 'esri/tasks/QueryTask',

      setup: function(){
        featureLayerUrl = '/arcgis-js-api-4.0/rest/services/Demographics/ESRI_Census_USA/MapServer/5';
      },

      beforeEach: function(){
        queryTask = new QueryTask(featureLayerUrl);
        query = new Query();
        server = createFakeServer();
      },

      afterEach: function(){
        server.restore();
      },

      teardown: function () {},

      execute: function(){
        query.text = 'California';
        query.returnGeometry = false;
        query.outFields = ["SQMI", "STATE_NAME", "STATE_FIPS"];

        var dfd = this.async(10000);
        server.respondWith("GET", featureLayerUrl + '/query?f=json&text=California&where=&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=SQMI%2CSTATE_NAME%2CSTATE_FIPS',
          [200, { "Content-Type": "application/json" }, sampleQueryResponse]);

        queryTask.execute(query).then(
          dfd.callback(function(result) {
            assert.instanceOf(result, FeatureSet, 'result should be an instance of FeatureSet');
            dfd.resolve();
          }), function(e) {
            dfd.reject(e);
          });

        server.respond();
      }

  });
```

## Node Server is used to serve static content from the files

You can start this node server from grunt in the `startNodeServer` task:

```
    grunt.registerTask('startNodeServer', 'Runs Node Server', function() {
      var done = this.async();        
      var nodeUrl = properties.nodeServer;
      var host = nodeUrl.split(":")[1].split("//")[1];
      var port = nodeUrl.split(":")[2];    
      var options = {
        // The command to execute. It should be in the system path.
        cmd: "node",
        // An array of arguments to pass to the command.
        args: ["./tests/support/NodeServer/server.js", "./tests/support/mocking/Samples/", host, port]
      };    
      function doneFunction(error, result, code) {
        console.log(result);
        done();
      }    
      grunt.util.spawn(options, doneFunction);    
    });      
```

You must specify static files directory in the 2nd index and the hostname and port are retrieved from the `grunt-config.json` file and placed in the 3rd and 4th index of the args array of options object which is used by `grunt.util.spawn` to start the node server. If you don't specify the hostname and port, localhost and 9099 will be taken by default.

Now you can retrieve the content from the static files by calling the url: `http://hostname.esri.com:9099/v1/api/json`. This means, it gets the content from the file `tests/support/mocking/Samples/json.json`. You can change the base or the port where node server runs, in the grunt.js file.

## resource-proxy for request tests

If you already have a proxy setup on your machine, just enter the url in grunt-config.json file as shown below:

```
{
  "base": "http://mbalumuri.esri.com:8080/arcgis-js-api-4.0",
  "proxy": "http://mbalumuri.esri.com:8080/proxy/proxy.jsp",
  "nodeServer": "http://mbalumuri.esri.com:9099"
}
```

If you don't have, please make sure that have deployed the `java` folder of the `resource-proxy` app (https://github.com/Esri/resource-proxy/releases/tag/v1.0) in your tomcat server before running the tests.

Once you have deployed the app, add the node server url in the `Java/WEB-INF/classes/proxy.config` as shown below:

```
  <?xml version="1.0" encoding="utf-8" ?>
  <ProxyConfig allowedReferers="*"
                  logFile="proxy_log.log"
                  logLevel="INFO"
                  mustMatch="true">
    <serverUrls>
      <serverUrl url="http://services.arcgisonline.com"
          matchAll="true"/>
  	<serverUrl url="http://localhost:9099"
          matchAll="true"/>
    </serverUrls>
  </ProxyConfig>
  <!-- See https://github.com/Esri/resource-proxy for more information -->
```

## Intern Configuration

You can specify what browser should be used to run the tests. Modify the `environments` variable of the intern config as shown below:

```
  environments: [{
    browserName: 'chrome'
  }],
```

By default, the Dojo 2 AMD loader is used; this can be changed to another loader that provides an AMD-compatible API with useLoader. You can also change the configuration options for the module loader as-well. If you need to stub modules for testing, then you can use map configuration option to use one function instead of another. Below is an example where `tests/support/mocking/esri/fakeEsriRequest` is executed instead of `esri/request` in `esri/tasks/QueryTask` module only. If that request function needs to be stubbed in every module during the tests, then you can use the wildcard `*` instead of `esri/tasks/QueryTask` in the map config.

```
  loader: {
    packages: [
      {
        name: 'esri',
        location: 'esri'
      },
      {
        name: 'sinon',
        location: 'node_modules/sinon/lib',
        main: 'sinon'
      },
      {
        name: 'sinonFakeServer',
        location: 'tests/support',
        main: 'sinonFakeServer'
      },
      {
        name: 'FeatureService',
        location: 'tests/support/mocking/FeatureService'
      }
    ],
    map: {
      'esri/tasks/QueryTask': {
        'esri/request': 'tests/support/mocking/esri/fakeEsriRequest'
      }
    }
  },
```

The intern.js file consists of the configuration required to run the tests. All the unit test suites should be given in `suites` array and the functional test suites in the `functionalSuites` array or all.js of the corresponding folders. The intern-runner runs the `suites` array first and `functionalSuites` array next. But we have separated out the unit tests, because the `request` tests would fail because of the cross-origin issues as the test runner starts intern server on a different domain. Hence have removed the suites array in our current intern config file.

```
  suites: [
    'tests/unit/all'
  ],
  functionalSuites: [
    'tests/functional/all'
  ],
```

## Grunt Configuration
The Gruntfile.js in the root directory consists of the configuration required to execute the tasks. It automates all the tasks that needs to be done, before running the intern tests. In the initConfig, we can specify the reporters for intern based on the way you would like to view the test results.

 * The `allTests` task registered to grunt executes the `startNodeServer` task and `seleniumTests` task concurrently with the use of `grunt-concurrent` plugin. The `seleniumTests` task uses the `grunt-selenium-plugin` and the `grunt-open plugins`. It consists of an array of sub-tasks to be executed in sequential order.
    * So, it first executes the startSelenium task of the `grunt-selenium-plugin` which downloads the selenium server and the chrome driver (if chrome is used). Once the downloads are complete, it starts the selenium server at http://127.0.0.1:4444 by default. But you specify custom host, port, browser, selenium versions and download paths in the `options` of the `startSelenium` in the `grunt.initConfig`. For more info on this plugin go to [link] (https://www.npmjs.com/package/grunt-selenium-plugin).
    * Now, the `intern-runner` task is executed. By default intern-runner uses `jsonReporter` which outputs the results of tests in a json file that can be located at `tests/support/output`. You can change the reporter in the `options` config of intern in `grunt.initConfig`.
    * As the tests are complete now, the `stopSelenium` task is executed to stop the selenium server by `grunt-selenium-plugin`.
    * Now, `open:allTests` task is executed to display the tests results in a browser. The `grunt-open` plugin is used to open the `runner.html` file that uses json file exported by the `jsonReporter` to display the results executed by `intern-runner`.

 * The `unitTest` task registered to grunt executes the `startNodeServer` task and `open:unitTest` task concurrently with the use of `grunt-concurrent` plugin. The `open:unitTest` task uses the `grunt-open` plugin to open the `client.html` of the intern in a browser. Once it opens, the browser-client executes the unit tests and displays the results on the browser. The intern's html reporter (client.html) is the default reporter for executing and displaying the results of unit tests.

```
    open: {
      unitTest: {
        path: properties.base + '/node_modules/intern/client.html?config=tests/intern&suites=tests/unit/all'
      },
      functionalTest: {
        path: properties.base + '/tests/support/runner.html'
      }
    },
    intern: {
      runner: {
        options: {
          config: 'tests/intern',
          runType: 'runner',
          reporters: ['tests/support/jsonReporter']
        }
      }
    },
    startSelenium: {
      options: {
        host: 'localhost',
        port: 4445,
        browser: 'firefox',
        version: '2.43',
        subversion: '1',
        libpath: 'tests/support/lib'
      }
    },
    concurrent: {
      allTests: ['startNodeServer', 'open:unitTest', 'functionalTest'],
      unitTests: ['startNodeServer', 'open:unitTest']
    }

    ...

    grunt.registerTask('functionalTest', 'Run all intern tests on standalone selenium server', function() {
      grunt.task.run(['startSelenium', 'intern:runner', 'stopSelenium', 'open:functionalTest']);
    });
    grunt.registerTask('allTests', 'Run all intern tests on standalone selenium server', function() {
      grunt.task.run(['concurrent:allTests']);
    });
    grunt.registerTask('unitTest', 'Run unit intern tests on browser client', function() {
      grunt.task.run(['concurrent:unitTests']);
    });
    grunt.registerTask('startNodeServer', 'Runs Node Server', function() {
      var done = this.async();        
      var nodeUrl = properties.nodeServer;
      var host = nodeUrl.split(":")[1].split("//")[1];
      var port = nodeUrl.split(":")[2];    
      var options = {
        // The command to execute. It should be in the system path.
        cmd: "node",
        // An array of arguments to pass to the command.
        args: ["./tests/support/NodeServer/server.js", "./tests/support/mocking/Samples/", host, port]
      };    
      function doneFunction(error, result, code) {
        console.log(result);
        done();
      }    
      grunt.util.spawn(options, doneFunction);    
    });
```
