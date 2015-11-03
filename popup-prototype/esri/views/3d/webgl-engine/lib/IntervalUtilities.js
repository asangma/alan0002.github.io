define([], function () {
  /*
  Defines utility functions for working with multiple intervals. (eg. face index ranges)

  An interval is an array with two elements, whit the first and the last value of the interval.
  The first and last value are included in the range defined by the interval.
  These functions work on arrays of intervals.
  */

  var IntervalUtilities = {};

  IntervalUtilities.copyIntervals = function(intervals) {
    var inv = [];

    for (var idx = 0; idx<intervals.length; idx++) {
      var interv = intervals[idx];
      inv.push([interv[0], interv[1]]);
    }

    return inv;
  };

  IntervalUtilities.convertFaceToIndexRange = function(intervals,faceSize) {
    for (var idx = 0; idx < intervals.length; idx++) {
      var interv = intervals[idx];

      interv[0] = interv[0] * faceSize;
      interv[1] = interv[1] * faceSize + (faceSize - 1);

    }
  };

  IntervalUtilities.sortIntervals = function(intervals) {
    // sort the intervals based on start time
    return intervals.sort(function(a,b){
      if(a[0] == b[0]){
        return a[1] > b[1] ? 1 : a[1] < b[1] ? -1 : 0;
      }
      return a[0] > b[0] ? 1 : a[0] < b[0] ? -1 : 0;
    });
  };

  IntervalUtilities.intersectIntervals = function(intervals, intersectionInterval) {
    if (intervals.length <= 0) {
      return [];
    }

    var r = [];
    for (var i = 0 ; i < intervals.length; i++) {
      var interv = intervals[i];

      if (interv[1] < intersectionInterval[0] || interv[0] > intersectionInterval[1]) {
        continue;
      }

      var intCropped = [interv[0], interv[1]];

      if (intCropped[0] < intersectionInterval[0]) {
        intCropped[0] = intersectionInterval[0];
      }

      if (intCropped[1] > intersectionInterval[1]) {
        intCropped[1] = intersectionInterval[1];
      }

      r.push(intCropped);
    }

    return r;
  };

  IntervalUtilities.mergeIntervals = function(intervals)
  {
    if (intervals.length <= 0) {
      return [];
    }

    // Create an empty stack of intervals
    var s = [];

    intervals = this.sortIntervals(intervals);

    // push the first interval to stack
    s.push(intervals[0]);

    // Start from the next interval and merge if necessary
    for (var i = 1 ; i < intervals.length; i++) {
      // get interval from stack top
      var top = s[s.length-1];

      // if current interval is not overlapping with stack top,
      // push it to the stack
      if (top[1] + 1 < intervals[i][0]) {
        s.push( intervals[i] );
      }
      // Otherwise update the ending time of top if ending of current
      // interval is more
      else if (top[1] < intervals[i][1]) {
        top[1] = intervals[i][1];
        s.pop();
        s.push(top);
      }
    }

    return s;
  };

  IntervalUtilities.invertIntervals = function(interval, maxValue) {
    var inv = [];
    var start = 0;

    for (var idx = 0; idx < interval.length; idx++) {
      var interv = interval[idx];

      if (interv[0] > start) {
        inv.push([start, interv[0] - 1]);
      }

      start = interv[1]+1;
    }

    if (start<=maxValue) {
      inv.push([start, maxValue]);
    }

    return inv;
  };


  IntervalUtilities.offsetIntervals = function(intervals, offset) {
    var intervalsOffseted = [];

    for (var i = 0; i < intervals.length; i++) {
      var faceRange = intervals[i];
      intervalsOffseted.push([faceRange[0] + offset, faceRange[1] + offset]);
    }

    return intervalsOffseted;
  };

  return IntervalUtilities;
});