define([],
  function () {
    var config = {
      portalUrl: "http://devext.arcgis.com",
      portalUrl2: "http://qaext.arcgis.com",
      analysisServer: "http://analysisdev.arcgis.com/arcgis/rest/services/tasks/GPServer",
      auth: {
        "portalApp": true,
        "email": "analytics",
        "token": "1kDGnHrNZSENoj9gnCknom_usT8T2XmlBQh8tXfMbk5wxV1RgEc66h2BOk9Q5btOFhXlzs_zcyX7TeVTjzbJIs9pW8m2XzEkuHMDjmTnWIbn9nYMvCuB7jBl4IGn7Wz1KBnZlJsHH-Nf5a5iOaeyicd2vEXg6-tRd_9n1tT7ABcDYqhxW087JwDK4DiAorudzPGd69gGMKlhM5PgflttDQ..",
        "culture": "en",
        "region": "WO",
        "expires": 1420073969777,
        "persistent": true,
        "allSSL": false,
        "accountId": "f126c8da131543019b05e4bfab6fc6ac",
        "role": "account_admin"
      },
      pointHostedFSLayer: "http://servicesdev.arcgis.com/f126c8da131543019b05e4bfab6fc6ac/arcgis/rest/services/KeystonePipeline_PlanData/FeatureServer/0"

    };
    return config;
  });