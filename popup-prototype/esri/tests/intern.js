define({
  // The port on which the instrumenting proxy will listen
  proxyPort: 9000,

  // A fully qualified URL to the Intern proxy
  proxyUrl: 'http://localhost:9000/',
  useLoader: {
    'host-node': 'dojo/dojo',
    'host-browser': 'node_modules/dojo/dojo.js'
  },


  // Default desired capabilities for all environments. Individual capabilities can be overridden by any of the
  // specified browser environments in the `environments` array below as well. See
  // https://code.google.com/p/selenium/wiki/DesiredCapabilities for standard Selenium capabilities and
  // https://saucelabs.com/docs/additional-config#desired-capabilities for Sauce Labs capabilities.
  // Note that the `build` capability will be filled in with the current commit ID from the Travis CI environment
  // automatically
  capabilities: {
    'selenium-version': '2.41.0'
  },

  // Browsers to run integration testing against. Note that version numbers must be strings if used with Sauce
  // OnDemand. Options that will be permutated are browserName, version, platform, and platformVersion; any other
  // capabilities options specified for an environment will be copied as-is
  environments: [{
    browserName: 'chrome'
  }],

  // Maximum number of simultaneous integration tests that should be executed on the remote WebDriver service
  maxConcurrency: 1,

  // Name of the tunnel class to use for WebDriver tests
  /*tunnel: 'SauceLabsTunnel',
  tunnelOptions: {
    username: 'subgan82',
    accessKey: 'c91dfa80-59b6-42ee-ae95-d2c1fd0483a9'
  },*/
  tunnel: 'NullTunnel',
  tunnelOptions: {},
  loader: {
    packages: [{
      name: 'dgrid',
      location: '../../dgrid'
    }, {
      name: 'dijit',
      location: '../../dijit'
    }, {
      name: 'dojo',
      location: '../../dojo'
    }, {
      name: 'dojox',
      location: '../../dojox'
    }, {
      name: 'esri',
      location: 'esri'
    }, {
      name: 'put-selector',
      location: '../../put-selector'
    }, {
      name: 'xstyle',
      location: '../../xstyle'
    }]
  },

  suites: [
    'esri/tests/analysis/all'
  ],
  //functionalSuites: ['esri/tests/analysis/all'],

  reporters: ['console'],

  // A regular expression matching URLs to files that should not be included in code coverage analysis
  excludeInstrumentation: /./
});