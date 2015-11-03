define([
  "intern!object",
  "intern/chai!assert",

  "dojo/_base/lang",

  "esri/core/Collection",
  "esri/layers/support/StreamPurger"
], function(
  registerSuite, assert,
  lang,
  Collection, StreamPurger
) {

  registerSuite({

    //main suite
    name: "esri/layers/support/StreamPurger",

    //----------------------------------------------------
    //
    // Tests for constructor options and internal methods
    //
    //----------------------------------------------------
    "internal method tests": {
      setup: function(){
        this.layerId = "layer";
        var cnt = 1;
        this.makeFeature = function(){
          var id = cnt++;
          return {
            id: id,
            attributes: {
              id: id
            },
            geometry: {}
          };
        };
      },

      beforeEach: function(){
        this.controller = {
          layer: {
            id: this.layerId,
            watch: function () {}
          },
          graphicsCollection: new Collection()
        };
      },

      afterEach: function(){
        this.controller = null;
      },

      "constructor Controller": function() {
        //console.log("this: ", this);
        var purger = new StreamPurger(this.parent.controller);
        assert.equal(purger.layer.id, this.parent.layerId, "Object passed to constructor without controller property should be treated as the controller");
      },

      "constructor Object": function() {
        var purger = new StreamPurger({
          controller: this.parent.controller
        });
        assert.equal(purger.layer.id, this.parent.layerId, "Object passed to constructor with controller property; controller should be extracted");
      },

      "defaults": function() {
        var purger = new StreamPurger(this.parent.controller);
        assert.equal(purger.idField, "id", "Default value for 'id' field should be 'id'");
        assert.equal(purger.parentField, "parent", "Default value for 'parent' field should be 'parent'");
      },

      "get index of item using item": function(){
        var purger = new StreamPurger(this.parent.controller);
        var feature1 = this.parent.makeFeature();
        var feature2 = this.parent.makeFeature();
        purger.graphicsCollection.addItem(feature1);
        purger.graphicsCollection.addItem(feature2);
        var index = purger._getIndexOfItem(feature1);
        assert.notEqual(index, -1, "_getIndexOfItem should not return -1");
        var foundFeature = purger.graphicsCollection.getItemAt(index);
        assert.deepEqual(feature1, foundFeature, "index of item should be index of first feature added");
      },

      "get index of item using id": function(){
        var purger = new StreamPurger(this.parent.controller);
        var feature1 = this.parent.makeFeature();
        var feature2 = this.parent.makeFeature();
        purger.graphicsCollection.addItem(feature1);
        purger.graphicsCollection.addItem(feature2);
        var index = purger._getIndexOfItem(feature1.id);
        assert.notEqual(index, -1, "_getIndexOfItem should not return -1");
        var foundFeature = purger.graphicsCollection.getItemAt(index);
        assert.deepEqual(feature1, foundFeature, "index of item should be index of first feature added");
      }
    },

    //------------------------------------
    //
    // Tests for purging by display count
    //
    //------------------------------------
    "display count purge tests": {
      setup: function(){
        this.layerId = "layer";
        var cnt = 1;
        this.makeFeature = function(){
          var id = cnt++;
          return {
            id: id,
            attributes: {
              id: id
            },
            geometry: {}
          };
        };
      },

      beforeEach: function(){
        this.controller = {
          layer: {
            watch: function () {}
          },
          graphicsCollection: new Collection()
        };
      },

      "displayCount set": function(){
        lang.mixin(this.parent.controller.layer, {
          purgeOptions: {
            displayCount: 5
          }
        });
        var purger = new StreamPurger(this.parent.controller);
        assert.equal(purger.displayCount, 5, "displayCount property should match layer's purgeOptions.displayCount");
      },

      "displayCount - add feature array": function(){
        lang.mixin(this.parent.controller.layer, {
          purgeOptions: {
            displayCount: 1
          }
        });
        var purger = new StreamPurger(this.parent.controller);
        var features = [];
        features.push(this.parent.makeFeature());
        features.push(this.parent.makeFeature());
        features.push(this.parent.makeFeature());
        purger.graphicsCollection.addItems(features);

        var dfd = this.async(500);
        setTimeout(dfd.callback(function(){
          assert.equal(purger.graphicsCollection.length, 1, "Purger's graphics collection should have 1 item since displayCount is 1");
          assert.deepEqual(purger.graphicsCollection.getItemAt(0), features[2], "The last feature added to the purger should be the last purged");
        }), 200);
      },

      "displayCount - add features individually": function(){
        lang.mixin(this.parent.controller.layer, {
          purgeOptions: {
            displayCount: 1
          }
        });
        var purger = new StreamPurger(this.parent.controller);
        var feature1 = this.parent.makeFeature();
        purger.graphicsCollection.addItem(feature1);
        var feature2 = this.parent.makeFeature();
        purger.graphicsCollection.addItem(feature2);
        var feature3 = this.parent.makeFeature();
        purger.graphicsCollection.addItem(feature3);

        var dfd = this.async(500);
        setTimeout(dfd.callback(function(){
          assert.equal(purger.graphicsCollection.length, 1, "Purger's graphics collection should have 1 item since displayCount is 1");
          assert.deepEqual(purger.graphicsCollection.getItemAt(0), feature3, "The last feature added to the purger should be the last purged");
        }), 200);
      }
    },

    //----------------------------
    //
    // Tests for purging by tracks
    //
    //----------------------------
    "track purge tests": {
      setup: function(){
        var cnt = 1;
        this.trackIdField = "track";
        this.makeFeature = function(trackId){
          return {
            id: cnt++,
            attributes: {
              track: trackId
            },
            geometry: {}
          };
        };
      },

      beforeEach: function(){
        this.controller = {
          layer: {
            watch: function () {}
          },
          graphicsCollection: new Collection()
        };
      },

      afterEach: function(){
        this.controller = null;
      },

      "layer - no trackIdField": function() {
        var purger = new StreamPurger(this.parent.controller);
        assert.equal(purger._doTrackPurge, false, "_doTrackPurge property should be false if layer does not have trackIdField");
      },

      "layer - with trackIdField": function() {
        lang.mixin(this.parent.controller.layer, {
          trackIdField: this.parent.trackIdField
        });
        var purger = new StreamPurger(this.parent.controller);
        assert.equal(purger._doTrackPurge, true, "_doTrackPurge property should be true if layer has trackIdField");
      },

      "no maxTrackPoints": function(){
        lang.mixin(this.parent.controller.layer, {
          trackIdField: this.parent.trackIdField
        });
        var purger = new StreamPurger(this.parent.controller);
        var features = [];
        features.push(this.parent.makeFeature("1"));
        features.push(this.parent.makeFeature("2"));
        features.push(this.parent.makeFeature("1"));
        purger.graphicsCollection.addItems(features);

        var dfd = this.async(500);
        setTimeout(dfd.callback(function(){
          assert.equal(purger.graphicsCollection.length, 3, "Purger's graphics collection should have 3 items since no maxTrackPoints set");
        }), 200);
      },

      "maxTrackPoints set to 1": function(){
        lang.mixin(this.parent.controller.layer, {
          trackIdField: this.parent.trackIdField,
          maximumTrackPoints: 1
        });
        var purger = new StreamPurger(this.parent.controller);
        var features = [];
        features.push(this.parent.makeFeature("1"));
        features.push(this.parent.makeFeature("2"));
        features.push(this.parent.makeFeature("1"));
        purger.graphicsCollection.addItems(features);

        var dfd = this.async(500);
        setTimeout(dfd.callback(function(){
          assert.equal(purger.graphicsCollection.length, 2, "Purger's graphics collection should have 2 items since maxTrackPoints is 1");
        }), 200);
      }
    },

    //----------------------------
    //
    // Tests for purging by time
    //
    //----------------------------
    "timePurgeTests": {
      beforeEach: function(){
        this.controller = {
          layer: {
            watch: function () {}
          },
          graphicsCollection: new Collection()
        };
      },

      afterEach: function(){
        this.controller = null;
      },

      "bin using endTimeField calculation": {
        setup: function(){
          var cnt = 1;
          this.endTimeField = "endTime";
          this.makeFeature = function(endTime){
            return {
              id: cnt++,
              attributes: {
                endTime: endTime
              },
              geometry: {}
            };
          };
        },
        "layer - with endTimeField": function() {
          lang.mixin(this.parent.parent.controller.layer, {
            timeInfo: {
              endTimeField: "endTime"
            }
          });
          var purger = new StreamPurger(this.parent.parent.controller);
          //console.log("purger: ", purger);
          assert.equal(purger._doTimePurge, true, "_doTimePurge property should be true if layer has timeInfo.endTimeField");
        },

        "features added without end time field": function() {
          lang.mixin(this.parent.parent.controller.layer, {
            timeInfo: {
              endTimeField: "endTime"
            }
          });
          var purger = new StreamPurger(this.parent.parent.controller);

          var feature = this.parent.makeFeature();
          purger.graphicsCollection.addItem(feature);
          assert.deepEqual(purger._featuresByTime, {}, "purger's _featuresByTime object should be empty if feature added with no endTimeField value");
        },

        "features added with end time field": function() {
          lang.mixin(this.parent.parent.controller.layer, {
            timeInfo: {
              endTimeField: "endTime"
            }
          });
          var purger = new StreamPurger(this.parent.parent.controller);
          var expireTime = Date.now() + 200;
          var secondTime = Math.ceil(expireTime/1000) * 1000;
          var feature = this.parent.makeFeature(expireTime);
          purger.graphicsCollection.addItem(feature);

          var dfd = this.async(500);
          setTimeout(dfd.callback(function(){
            //console.log("purger._featuresByTime: ", purger._featuresByTime);
            assert.property(purger._featuresByTime, secondTime, "purger's _featuresByTime object should have a property that is feature's end time rounded to next second");
            assert.equal(purger._featuresByTime[secondTime].length, 1, "purger's _featuresByTime bin should contain three features");
          }), 200);
        }
      },

      "bin using purgeOptions.Age calculation": {
        setup: function(){
          var cnt = 1;
          this.startTimeField = "start";
          this.makeFeature = function(startTime){
            return {
              id: cnt++,
              attributes: {
                start: startTime
              },
              geometry: {}
            };
          };
        },

        beforeEach: function(){
          lang.mixin(this.parent.controller.layer, {
            purgeOptions: {
              age: 0.03
            },
            timeInfo: {
              startTimeField: this.startTimeField
            }
          });
        },

        "layer - with purgeOptions.age": function() {
          var purger = new StreamPurger(this.parent.parent.controller);
          assert.equal(purger._doTimePurge, true, "_doTimePurge property should be true if layer purgeOptions.age set");
        },

        "features added without startTime": function() {
          var purger = new StreamPurger(this.parent.parent.controller);
          var expireTime = Date.now() + 1800; //expire time is 1800 ms, (0.03* 1000)*60, after now
          var secondTime = Math.ceil(expireTime/1000) * 1000;
          var feature = this.parent.makeFeature();
          purger.graphicsCollection.addItem(feature);

          var dfd = this.async(500);
          setTimeout(dfd.callback(function(){
            assert.property(purger._featuresByTime, secondTime, "purger's _featuresByTime object should have a property that is feature's end time rounded to next second");
            assert.equal(purger._featuresByTime[secondTime].length, 1, "purger's _featuresByTime bin should contain three features");
          }), 200);
        },

        "features added with startTime": function() {
          var purger = new StreamPurger(this.parent.parent.controller);
          var startTime = Date.now() - 5000;
          var expireTime = startTime + 1800; //expire time is 1800 ms, (0.03* 1000)*60, after startTime
          var secondTime = Math.ceil(expireTime/1000) * 1000;
          var feature = this.parent.makeFeature(startTime);
          purger.graphicsCollection.addItem(feature);

          var dfd = this.async(500);
          setTimeout(dfd.callback(function(){
            assert.property(purger._featuresByTime, secondTime, "purger's _featuresByTime object should have a property that is feature's end time rounded to next second");
            assert.equal(purger._featuresByTime[secondTime].length, 1, "purger's _featuresByTime bin should contain three features");
          }), 200);
        }
      },

      "purging features by time": {
        setup: function(){
          var cnt = 1;
          this.endTimeField = "endTime";
          this.makeFeature = function(endTime){
            return {
              id: cnt++,
              attributes: {
                endTime: endTime
              },
              geometry: {}
            };
          };
        },

        "feature added that already expired": function(){
          lang.mixin(this.parent.parent.controller.layer, {
            timeInfo: {
              endTimeField: "endTime"
            }
          });
          var purger = new StreamPurger(this.parent.parent.controller);
          purger._lastEndTimeCheck = Date.now() - 2000;
          var expireTime1 = Date.now() - 1000;
          var secondTime1 = Math.ceil(expireTime1/1000) * 1000;
          var feature1 = this.parent.makeFeature(expireTime1);
          var expireTime2 = Date.now() + 10000;
          var secondTime2 = Math.ceil(expireTime2/1000) * 1000;
          var feature2 = this.parent.makeFeature(expireTime2);
          purger.graphicsCollection.addItems([feature1, feature2]);

          var dfd = this.async(2000);
          setTimeout(dfd.callback(function(){
            assert.notProperty(purger._featuresByTime, secondTime1, "purger's _featuresByTime object should not have expired time bin");
            assert.property(purger._featuresByTime, secondTime2, "purger's _featuresByTime object should have non-expired time bin");
            assert.equal(purger.graphicsCollection.length, 1, "purger's _featuresByTime bin should contain one unexpired feature");
            assert.deepEqual(purger.graphicsCollection.getItemAt(0), feature2, "purger's graphics collection should contain the unexpired feature");
          }), 200);
        }
      }
    }
  });
});
