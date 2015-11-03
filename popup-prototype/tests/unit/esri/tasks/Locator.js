define([
  "../../../support/sinonFakeServer!createFakeServer",

  "esri/geometry/Point",
  "esri/geometry/SpatialReference",

  "esri/tasks/Locator",
  "esri/tasks/support/AddressCandidate",

  "intern!object",

  "intern/chai!assert"
],
function(
  createFakeServer,
  Point, SpatialReference,
  Locator, AddressCandidate,
  registerSuite,
  assert
) {

  var locatorUrl = "/arcgis-js-api-4.0/rest/services/Locators/ESRI_Geocode_USA/GeocodeServer",
      server,
      locator;

  registerSuite({

    name: "esri/tasks/Locator",

    beforeEach: function() {
      server = createFakeServer();
      locator = new Locator(locatorUrl);
    },

    afterEach: function() {
      server.restore();
    },

    "addressToLocations()": function() {

      var address = {
        Address: "4728 Loma de Plata",
        City: "El Paso",
        State: "TX",
        Zip: "79934"
      };

      var def = this.async(0);

      server.respondWith(
        locatorUrl + "/findAddressCandidates?Address=4728%20Loma%20de%20Plata&City=El%20Paso&State=TX&Zip=79934&f=json",
        "{\"spatialReference\":{\"wkid\":4326},\"candidates\":[{\"address\":\"79934\",\"location\":{\"x\":-106.41428399999995,\"y\":31.930788000000121},\"score\":100,\"attributes\":{}},{\"address\":\"EL PASO, TX\",\"location\":{\"x\":-106.49096900000001,\"y\":31.763210000000015},\"score\":100,\"attributes\":{}}]}"
      );

      locator.addressToLocations(address).then(def.callback(doAssertion));
      server.respond();

      function doAssertion(candidates) {
        assert.isNotNull(candidates);

        var firstCandidate = candidates[0];
        var secondCandidate = candidates[1];

        assert.instanceOf(firstCandidate, AddressCandidate);
        assert.instanceOf(secondCandidate, AddressCandidate);

        assert.instanceOf(firstCandidate.location, Point);

        assert.closeTo(firstCandidate.location.x, -106.414284, .00001);
        assert.closeTo(firstCandidate.location.y, 31.9307880000001, .00001);

        assert.closeTo(secondCandidate.location.x, -106.490969, .00001);
        assert.closeTo(secondCandidate.location.y, 31.76321, .00001);
      }

    },

    "addressesToLocations()": function() {

      var addresses = {
        addresses: [
          {
            "OBJECTID": 1,
            "Address": "380 New York St",
            "Neighborhood": "",
            "City": "Redlands",
            "Subregion": "",
            "Region": "CA"
          },
          {
            "OBJECTID": 2,
            "Address": "1 World Way",
            "Neighborhood": "",
            "City": "Los Angeles",
            "Subregion": "",
            "Region": "CA"
          }
        ]
      };

      var def = this.async(0);

      server.respondWith(
        locatorUrl + "/geocodeAddresses?addresses=%7B%22records%22%3A%5B%7B%22attributes%22%3A%7B%22OBJECTID%22%3A1%2C%22Address%22%3A%22380%20New%20York%20St%22%2C%22Neighborhood%22%3A%22%22%2C%22City%22%3A%22Redlands%22%2C%22Subregion%22%3A%22%22%2C%22Region%22%3A%22CA%22%7D%7D%2C%7B%22attributes%22%3A%7B%22OBJECTID%22%3A2%2C%22Address%22%3A%221%20World%20Way%22%2C%22Neighborhood%22%3A%22%22%2C%22City%22%3A%22Los%20Angeles%22%2C%22Subregion%22%3A%22%22%2C%22Region%22%3A%22CA%22%7D%7D%5D%7D&f=json",
        '{"spatialReference":{"wkid":4326,"latestWkid":4326},"locations":[{"address":"380 New York St, Redlands, California, 92373","location":{"x":-117.1956660249997,"y":34.056490511000447},"score":100,"attributes":{"ResultID":1,"Loc_name":"USA.PointAddress","Status":"M","Score":100,"Match_addr":"380 New York St, Redlands, California, 92373","Addr_type":"PointAddress","Type":"","PlaceName":"","Place_addr":"","Phone":"","URL":"","Rank":"","AddBldg":"","AddNum":"380","AddNumFrom":"","AddNumTo":"","Side":"R","StPreDir":"","StPreType":"","StName":"New York","StType":"St","StDir":"","StAddr":"380 New York St","Nbrhd":"","City":"Redlands","Subregion":"","Region":"California","Postal":"92373","PostalExt":"","Country":"USA","LangCode":"ENG","Distance":0,"X":-117.195667,"Y":34.056491000000001,"DisplayX":-117.195311,"DisplayY":34.056109999999997,"Xmin":-117.19666700000001,"Xmax":-117.194667,"Ymin":34.055491000000004,"Ymax":34.057490999999999}},{"address":"1 World Way, Los Angeles, California, 90045","location":{"x":-118.39755050499969,"y":33.944139708000478},"score":100,"attributes":{"ResultID":2,"Loc_name":"USA.StreetAddress","Status":"M","Score":100,"Match_addr":"1 World Way, Los Angeles, California, 90045","Addr_type":"StreetAddress","Type":"","PlaceName":"","Place_addr":"","Phone":"","URL":"","Rank":"","AddBldg":"","AddNum":"1","AddNumFrom":"1","AddNumTo":"57","Side":"R","StPreDir":"","StPreType":"","StName":"World","StType":"Way","StDir":"","StAddr":"1 World Way","Nbrhd":"","City":"Los Angeles","Subregion":"","Region":"California","Postal":"90045","PostalExt":"","Country":"USA","LangCode":"ENG","Distance":0,"X":-118.397552,"Y":33.944139999999997,"DisplayX":-118.397552,"DisplayY":33.944139999999997,"Xmin":-118.398552,"Xmax":-118.396552,"Ymin":33.94314,"Ymax":33.945140000000002}}]}'
      );

      locator.addressesToLocations(addresses).then(def.callback(doAssertion));
      server.respond();

      function doAssertion(results) {
        var expectedLocations = [
          {
            "address": "380 New York St, Redlands, California, 92373",
            "location": {
              "x": -117.1956660249997,
              "y": 34.056490511000447
            },
            "score": 100,
            "attributes": {
              "ResultID": 1,
              "Loc_name": "USA.PointAddress",
              "Status": "M",
              "Score": 100,
              "Match_addr": "380 New York St, Redlands, California, 92373",
              "Addr_type": "PointAddress",
              "Type": "",
              "PlaceName": "",
              "Place_addr": "",
              "Phone": "",
              "URL": "",
              "Rank": "",
              "AddBldg": "",
              "AddNum": "380",
              "AddNumFrom": "",
              "AddNumTo": "",
              "Side": "R",
              "StPreDir": "",
              "StPreType": "",
              "StName": "New York",
              "StType": "St",
              "StDir": "",
              "StAddr": "380 New York St",
              "Nbrhd": "",
              "City": "Redlands",
              "Subregion": "",
              "Region": "California",
              "Postal": "92373",
              "PostalExt": "",
              "Country": "USA",
              "LangCode": "ENG",
              "Distance": 0,
              "X": -117.195667,
              "Y": 34.056491000000001,
              "DisplayX": -117.195311,
              "DisplayY": 34.056109999999997,
              "Xmin": -117.19666700000001,
              "Xmax": -117.194667,
              "Ymin": 34.055491000000004,
              "Ymax": 34.057490999999999
            }
          },
          {
            "address": "1 World Way, Los Angeles, California, 90045",
            "location": {
              "x": -118.39755050499969,
              "y": 33.944139708000478
            },
            "score": 100,
            "attributes": {
              "ResultID": 2,
              "Loc_name": "USA.StreetAddress",
              "Status": "M",
              "Score": 100,
              "Match_addr": "1 World Way, Los Angeles, California, 90045",
              "Addr_type": "StreetAddress",
              "Type": "",
              "PlaceName": "",
              "Place_addr": "",
              "Phone": "",
              "URL": "",
              "Rank": "",
              "AddBldg": "",
              "AddNum": "1",
              "AddNumFrom": "1",
              "AddNumTo": "57",
              "Side": "R",
              "StPreDir": "",
              "StPreType": "",
              "StName": "World",
              "StType": "Way",
              "StDir": "",
              "StAddr": "1 World Way",
              "Nbrhd": "",
              "City": "Los Angeles",
              "Subregion": "",
              "Region": "California",
              "Postal": "90045",
              "PostalExt": "",
              "Country": "USA",
              "LangCode": "ENG",
              "Distance": 0,
              "X": -118.397552,
              "Y": 33.944139999999997,
              "DisplayX": -118.397552,
              "DisplayY": 33.944139999999997,
              "Xmin": -118.398552,
              "Xmax": -118.396552,
              "Ymin": 33.94314,
              "Ymax": 33.945140000000002
            }
          }
        ];

        var firstResult,
            expectedFirstResult,
            secondResult,
            expectedSecondResult;

        assert.lengthOf(results, 2);

        firstResult = results[0];
        expectedFirstResult = expectedLocations[0];

        assert.equal(firstResult.address, expectedFirstResult.address);
        assert.instanceOf(firstResult.location, Point);
        assert.deepEqual(firstResult.location.x, expectedFirstResult.location.x);
        assert.deepEqual(firstResult.location.y, expectedFirstResult.location.y);
        assert.equal(firstResult.score, expectedFirstResult.score);
        assert.deepEqual(firstResult.attributes, expectedFirstResult.attributes);

        secondResult = results[1];
        expectedSecondResult = expectedLocations[1];

        assert.equal(secondResult.address, expectedSecondResult.address);
        assert.instanceOf(secondResult.location, Point);
        assert.deepEqual(secondResult.location.x, expectedSecondResult.location.x);
        assert.deepEqual(secondResult.location.y, expectedSecondResult.location.y);
        assert.equal(secondResult.score, expectedSecondResult.score);
        assert.deepEqual(secondResult.attributes, expectedSecondResult.attributes);
      }

    },

    "locationToAddress()": function() {

      var locationJson = {
        x: -106.490969,
        y: 31.763210000000015,
        spatialReference: {
          wkid: 4326
        }
      };

      var location = Point.fromJSON(locationJson);

      var def = this.async(0);

      server.respondWith(
        locatorUrl + "/reverseGeocode?location=%7B%22x%22%3A-106.490969%2C%22y%22%3A31.763210000000015%2C%22spatialReference%22%3A%7B%22wkid%22%3A4326%7D%7D&f=json",
        "{\"address\":{\"Address\":\"STHY 20\",\"City\":\"EL PASO\",\"State\":\"TX\",\"Zip\":\"79902\",\"Loc_name\":\"Street_Address\"},\"location\":{\"x\":-106.49097463999999,\"y\":31.763216510000063,\"spatialReference\":{\"wkid\":4326}}}"
      );

      locator.locationToAddress(location).then(def.callback(doAssertion));
      server.respond();

      function doAssertion(result) {

        var expectedAddress = {
          Address: "STHY 20",
          City: "EL PASO",
          State: "TX",
          Zip: "79902",
          Loc_name: "Street_Address"
        };

        assert.deepEqual(result.address, expectedAddress);

        assert.instanceOf(result.location, Point);

        assert.closeTo(result.location.x, -106.490969, .00001);
        assert.closeTo(result.location.y, 31.763210000000015, .00001);

        assert.equal(result.score, 100);
      }

    },

    "locationToAddress() – different outSpatialReference": function() {

      var locationJson = {
        x: -106.490969,
        y: 31.763210000000015,
        spatialReference: {
          wkid: 4326
        }
      };

      var location = Point.fromJSON(locationJson);

      var def = this.async(0);

      locator.set("outSpatialReference", new SpatialReference(102100));

      server.respondWith(
        locatorUrl + "/reverseGeocode?outSR=%7B%22wkid%22%3A102100%7D&location=%7B%22x%22%3A-106.490969%2C%22y%22%3A31.763210000000015%2C%22spatialReference%22%3A%7B%22wkid%22%3A4326%7D%7D&f=json",
        "{\"address\":{\"Address\":\"STHY 20\",\"City\":\"EL PASO\",\"State\":\"TX\",\"Zip\":\"79902\",\"Loc_name\":\"Street_Address\"},\"location\":{\"x\":-11854521.071004208,\"y\":3732269.0894003608,\"spatialReference\":{\"wkid\":102100}}}"
      );

      locator.locationToAddress(location).then(def.callback(doAssertion));
      server.respond();

      function doAssertion(result) {

        var expectedAddress = {
          Address: "STHY 20",
          City: "EL PASO",
          State: "TX",
          Zip: "79902",
          Loc_name: "Street_Address"
        };

        assert.deepEqual(result.address, expectedAddress);

        assert.instanceOf(result.location, Point);

        assert.closeTo(result.location.x, -11854521.071004208, .00001);
        assert.closeTo(result.location.y, 3732269.0894003608, .00001);
        assert.equal(result.location.spatialReference.wkid, 102100);

        assert.equal(result.score, 100);
      }

    },

    "suggestLocations()": function() {

      var suggestion = {
        text: "El Paso"
      };

      var def = this.async(0);

      server.respondWith(
        locatorUrl + "/suggest?f=json&text=El%20Paso",
        '{"suggestions":[{"text":"El Paso, Texas, United States","magicKey":"GST7YMc0AM9UOsE9HhFtGTyVGST7YMc0AM9UOsE9DbTVHgA9HhB0Zcp0OhNtGMytaikZQBoAUsxGQDgtIS9GOghnYnwZGPTq7iAm7Py_CR4PIic2BR4caocpOh9bZgKZQoc3YSyaagDIZhkZJgauGb9AD1FF","isCollection":false},{"text":"El Paso del Norte, Chihuahua, Mexico","magicKey":"GST7YMc0AM9UOsE9HhFtGTyVGST7YMc0AM9UOsE9DbTVHgA9HhB0Zcp0OhNtGMytaikZQBx7U5d7U58tIS9GOghnYnwZGPTq7iAm7Py_CR4PIic2BR4caocpOh9bZgKZQFc3YSyaagDIZhkZJgauGb9AD1FF","isCollection":false},{"text":"El Paso Int\'l Airport, 6701 Convair Rd El Paso, TX 79925","magicKey":"GST7YMc0AM9UOsE9HhFtGTyVGST7YMc0AM9UOsE9DbTVHgA9HhB0Zcp0OhNtGMytaikZQBNAMsoKQ58tIS9GOghnYnwZGPTq7iAm7Py_CR4PIic2BR4caocpOh9bZgKZQ1c3YSyaagDIZhkZJgauGb9AD1FF","isCollection":false},{"text":"El Paso International Airport, El Paso, Texas, United States","magicKey":"GST7YMc0AM9UOsE9HhFtGTyVGST7YMc0AM9UOsE9DbTVHgA9HhB0Zcp0OhNtGMytaikZQBoAUsxKQBxtIS9GOghnYnwZGPTq7iAm7Py_CR4PIic2BR4caocpOh9bZgKZUNc3YSyaagDIZhkZJgauGb9AD1FF","isCollection":false},{"text":"El Paso County, Colorado, United States","magicKey":"GST7YMc0AM9UOsE9HhFtGTyVGST7YMc0AM9UOsE9DbTVHgA9HhB0Zcp0OhNtGMytaikZQBoaM5VKM5ktIS9GOghnYnwZGPTq7iAm7Py_CR4PIic2BR4caocpOh9bZgKZUoc3YSyaagDIZhkZJgauGb9AD1FF","isCollection":false}]}'
      );

      locator.suggestLocations(suggestion).then(def.callback(doAssertion));
      server.respond();

      function doAssertion(suggestions) {

        var expectedSuggestions = [
          {
            "text": "El Paso, Texas, United States",
            "magicKey": "GST7YMc0AM9UOsE9HhFtGTyVGST7YMc0AM9UOsE9DbTVHgA9HhB0Zcp0OhNtGMytaikZQBoAUsxGQDgtIS9GOghnYnwZGPTq7iAm7Py_CR4PIic2BR4caocpOh9bZgKZQoc3YSyaagDIZhkZJgauGb9AD1FF",
            "isCollection": false
          },
          {
            "text": "El Paso del Norte, Chihuahua, Mexico",
            "magicKey": "GST7YMc0AM9UOsE9HhFtGTyVGST7YMc0AM9UOsE9DbTVHgA9HhB0Zcp0OhNtGMytaikZQBx7U5d7U58tIS9GOghnYnwZGPTq7iAm7Py_CR4PIic2BR4caocpOh9bZgKZQFc3YSyaagDIZhkZJgauGb9AD1FF",
            "isCollection": false
          },
          {
            "text": "El Paso Int'l Airport, 6701 Convair Rd El Paso, TX 79925",
            "magicKey": "GST7YMc0AM9UOsE9HhFtGTyVGST7YMc0AM9UOsE9DbTVHgA9HhB0Zcp0OhNtGMytaikZQBNAMsoKQ58tIS9GOghnYnwZGPTq7iAm7Py_CR4PIic2BR4caocpOh9bZgKZQ1c3YSyaagDIZhkZJgauGb9AD1FF",
            "isCollection": false
          },
          {
            "text": "El Paso International Airport, El Paso, Texas, United States",
            "magicKey": "GST7YMc0AM9UOsE9HhFtGTyVGST7YMc0AM9UOsE9DbTVHgA9HhB0Zcp0OhNtGMytaikZQBoAUsxKQBxtIS9GOghnYnwZGPTq7iAm7Py_CR4PIic2BR4caocpOh9bZgKZUNc3YSyaagDIZhkZJgauGb9AD1FF",
            "isCollection": false
          },
          {
            "text": "El Paso County, Colorado, United States",
            "magicKey": "GST7YMc0AM9UOsE9HhFtGTyVGST7YMc0AM9UOsE9DbTVHgA9HhB0Zcp0OhNtGMytaikZQBoaM5VKM5ktIS9GOghnYnwZGPTq7iAm7Py_CR4PIic2BR4caocpOh9bZgKZUoc3YSyaagDIZhkZJgauGb9AD1FF",
            "isCollection": false
          }
        ];

        assert.deepEqual(suggestions, expectedSuggestions);
      }

    }

  });

});
