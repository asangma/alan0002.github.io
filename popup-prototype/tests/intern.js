define({
    // The port on which the instrumenting proxy will listen
  proxyPort: 9000,

  // A fully qualified URL to the Intern proxy
  proxyUrl: 'http://localhost:9000/',
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

  loaderOptions: {
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
        name: 'test-utils',
        location: 'tests/support/test-utils'
      },
      {
        name: 'sinonFakeServer',
        location: 'tests/support',
        main: 'sinonFakeServer'
      },
      {
        name: 'FeatureService',
        location: 'tests/support/mocking/FeatureService'
      },
      {
        name: 'mocking',
        location: 'tests/support/mocking'
      }
    ]
  },

  /*
  suites: [
    'tests/unit/all'
  ],
  */

  functionalSuites: [
    'tests/functional/all'
  ],

  // A regular expression matching URLs to files that should not be included in code coverage analysis
  excludeInstrumentation: /^(?:tests|node_modules|dojo)\//
});
