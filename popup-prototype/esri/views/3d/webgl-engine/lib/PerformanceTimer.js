define(["./Util"], function (Util) {
  return function PerformanceTimer(filterSize) {
    var filterSamples = new Array(filterSize);
    var filterSampleIndex = 0;
    var lastTime = NaN;
    var totalTime = 0.0;
    var numMeasurements = 0;

    var tsStart;

    this.reset = function() {
      filterSampleIndex = 0;

      for (var i = 0; i < filterSize; i++) {
        filterSamples[i] = NaN;
      }
    };
    this.reset();

    this.start = function() {
      tsStart = Util.performance.now();
    };

    this.stop = function() {
      var tsStop = Util.performance.now();
      lastTime = tsStop - tsStart;
      totalTime += lastTime;
      numMeasurements++;

      if (filterSize) {
        filterSamples[filterSampleIndex] = lastTime;
        filterSampleIndex = (filterSampleIndex + 1) % filterSize;
      }
      return lastTime;
    };

    this.getLast = function() {
      return lastTime;
    };

    var add = function(a, b) { return a + b; };
    
    this.getLastFiltered = function() {
      return filterSamples.reduce(add) / filterSamples.length;
    };

    this.getAverage = function() {
      return totalTime / numMeasurements;
    };

    this.getTotal = function() {
      return totalTime;
    };

    this.getNumMeasurements = function() {
      return numMeasurements;
    };
  };
});