define([
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/date/locale",
    
  "../../core/numberUtils",
    
  "dojo/i18n!../../nls/jsapi",
  "dojo/i18n!dojo/cldr/nls/gregorian"
],
function(lang, array, djDate, numberUtils, nlsJsapi, gregorian) {
  
  var utils = {},

      // http://www.w3.org/TR/MathML2/bycodes.html
      specialChars = {
        // less-than or equal to
        lte: "<=",
          
        // greater-than or equal to
        gte: ">=",
        
        // less-than
        lt: "<",
        
        // greater-than
        gt: ">",
        
        // percent sign
        pct: "%"
      },

      dateIntervalSize = {
        // Order = lowest interval to highest interval.
        millisecond:   0,
        second: 1,
        minute: 2,
        hour:   3,
        day:    4,
        month:  5,
        year:   6
      },

      // Date and time components listed in "dateFormatOptions" will be
      // combined using "dateTimeFormat-medium" definition.
      // Examples (depends on the locale): 
      //   "{1}, {0}"
      //   "{1} {0}"
      dateFormatLength = "dateTimeFormat-medium",

      dateFormatOptions = {
        // Display both date and time components:
        millisecond:   [
          { formatLength: "long", selector: "date" },
          { formatLength: "medium", selector: "time" }
        ],
  
        second: [
          { formatLength: "long", selector: "date" },
          { formatLength: "medium",selector: "time" }
        ],
  
        minute: [
          { formatLength: "long", selector: "date" },
          { formatLength: "short", selector: "time" }
        ],
  
        hour:   [
          { formatLength: "long", selector: "date" },
          { formatLength: "short", selector: "time" }
        ],
  
        // Just display the date.
        day:    [ { formatLength: "long", selector: "date" } ],
        month:  [ { formatLength: "long", selector: "date" } ],
  
        // Just display the year.
        year:   [ { selector: "year" } ]
      };
  
  lang.mixin(utils, {
  
    createColorStops: function(parameters) {
      // Creates color stops using the given <values> and <colors>.
      // If <labelIndexes> is not provided, labels will be created 
      // for all stops.
      var values = parameters.values,
          colors = parameters.colors,
          labelIndexes = parameters.labelIndexes,
          stops = [];
  
      stops = array.map(values, function(value, idx) {
        var labelPrefix = "";
    
        // Add label prefix for the first and last stops.
        if (idx === 0) {
          // less-than sign
          labelPrefix = specialChars.lt + " ";
        }
        else if (idx === (values.length - 1)) {
          // greater-than sign
          labelPrefix = specialChars.gt + " ";
        }
    
        return {
          value: value,
          color: colors[idx],
      
          label: (!labelIndexes || array.indexOf(labelIndexes, idx) > -1)
            ? ( labelPrefix + numberUtils.format(value) )
            : null
        };
      });
      
      return stops;
    },
  
    updateColorStops: function(parameters) {
      // Updates one or more of the given <stops> based on the changes
      // described in <changes>. 
      // New values are rounded and labels are formatted.
      var stops = parameters.stops,
          changes = parameters.changes,
          changedIndexes = [],
          roundedValues,
          
          values = array.map(stops, function(stop) {
            return stop.value;
          });
    
      //console.log("stops = ", values);
      //console.log("changes = ", changes);
    
      array.forEach(changes, function(changeInfo) {
        changedIndexes.push(changeInfo.index);
        values[changeInfo.index] = changeInfo.value;
      });
    
      //console.log("values = ", values);
  
      roundedValues = numberUtils.round(values, { indexes: changedIndexes });
    
      //console.log("values (rounded) = ", roundedValues);
    
      array.forEach(stops, function(stop, idx) {
        stop.value = values[idx];
      
        var labelPrefix = "";
      
        // Add label prefix for the first and last stops.
        if (idx === 0) {
          // less-than sign
          labelPrefix = specialChars.lt + " ";
        }
        else if (idx === (stops.length - 1)) {
          // greater-than sign
          labelPrefix = specialChars.gt + " ";
        }
      
        // Update label only if the stop has an existing label.
        stop.label = (stop.label != null)
          ? ( labelPrefix + numberUtils.format(roundedValues[idx]) )
          : null;
      });
    },
  
    createClassBreakLabel: function(parameters) {
      // Creates label for a class break with the given <minValue> and 
      // <maxValue>.
      var min = parameters.minValue,
          max = parameters.maxValue,
          isFirst = parameters.isFirstBreak,
          normType = parameters.normalizationType,
          
          prefix = isFirst ? "" : (specialChars.gt + " "),
          
          suffix = (normType === "percent-of-total")
            ? specialChars.pct
            : "";
      
      // Format values first.
      min = (min == null) ? "" : numberUtils.format(min);
      max = (max == null) ? "" : numberUtils.format(max);
      
      return prefix + 
        min + suffix + " " + 
        nlsJsapi.smartMapping.minToMax + " " + 
        max + suffix;
    },
    
    setLabelsForClassBreaks: function(parameters) {
      // Assigns labels for the given <classBreaks>.
      // Performs rounding of values for labels if <round> is true - 
      // break values are not rounded.
      var breaks = parameters.classBreaks,
          classMethod = parameters.classificationMethod,
          normType = parameters.normalizationType,
          values = [];
      
      if (breaks && breaks.length) {
        if (classMethod === "standard-deviation") {
          // We don't have sufficient information to create labels for 
          // standard deviation method:
          // Breaks only have raw field range - not the standard deviation
          // range corresponding to the field range.
          console.log("setLabelsForClassBreaks: cannot set labels for class breaks generated using 'standard-deviation' method.");
        }
        else {
          if (parameters.round) {
            // [1] Round break values first.
            values.push(breaks[0].minValue);
  
            // Extract break values into a flat array.
            array.forEach(breaks, function(brk) {
              values.push(brk.maxValue);
            });
  
            values = numberUtils.round(values);
  
            // [2] Create labels using rounded values.
            array.forEach(breaks, function(brk, idx) {
              brk.label = utils.createClassBreakLabel({
                minValue: (idx === 0) ? values[0] : values[idx],
                maxValue: values[idx + 1],
                isFirstBreak: (idx === 0),
                normalizationType: normType
              });
            });
          }
          else {
            array.forEach(breaks, function(brk, idx) {
              brk.label = utils.createClassBreakLabel({
                minValue: brk.minValue,
                maxValue: brk.maxValue,
                isFirstBreak: (idx === 0),
                normalizationType: normType
              });
            });
          }
        }
      }
    },
    
    updateClassBreak: function(parameters) {
      // Updates class break(s) with changes described in <change>.
      // More than one class break may be affected by the change.
      // Modifies <minValue>, <maxValue> and <label> of the affected
      // breaks.
      var breaks = parameters.classBreaks,
          classMethod = parameters.classificationMethod,
          normType = parameters.normalizationType,
          change = parameters.change,
          index = change.index,
          newValue = change.value,
          minIdx = -1, maxIdx = -1, breakInfo,
          numClasses = breaks.length;
      
      if (classMethod === "standard-deviation") {
        // We don't have sufficient information to create labels for 
        // standard deviation method:
        // Breaks only have raw field range - not the standard deviation
        // range corresponding to the field range.
        console.log("updateClassBreak: cannot update labels for class breaks generated using 'standard-deviation' method.");
        return;
      }
      
      // Find affected break indexes from the flat array index.
      if (index === 0) {
        minIdx = index;
      }
      else if (index === numClasses) {
        maxIdx = index - 1;
      }
      else {
        maxIdx = index - 1;
        minIdx = index;
      }

      // Update break values and labels for affected breaks.
      // Check validity of the indexes first.
      if (minIdx > -1 && minIdx < numClasses) {
        breakInfo = breaks[minIdx];
        
        breakInfo.minValue = newValue;
        
        breakInfo.label = utils.createClassBreakLabel({
          minValue: breakInfo.minValue,
          maxValue: breakInfo.maxValue,
          isFirstBreak: (minIdx === 0),
          normalizationType: normType
        });
      }
      
      if (maxIdx > -1 && maxIdx < numClasses) {
        breakInfo = breaks[maxIdx];

        breakInfo.maxValue = newValue;
        
        breakInfo.label = utils.createClassBreakLabel({
          minValue: breakInfo.minValue,
          maxValue: breakInfo.maxValue,
          isFirstBreak: (maxIdx === 0),
          normalizationType: normType
        });
      }

      // TODO
      // It is possible that labels may have rounded values when this method 
      // is called. In this scenario:
      // Let say the given <change> affects just the minValue of a break. We'll 
      // be updating the label using the newValue as the new minValue and the
      // un-rounded value of maxValue. Now, the rounding that is already applied 
      // to the maxValue inside that label is gone - leaving the next break which 
      // has this rounded maxValue for its minValue as it was before i.e. the
      // affected break and the next break are inconsistent and have 
      // discontinued labels.
    },
  
    calculateDateFormatInterval: function(dateValues) {
      // Returns the optimal date/time interval by analyzing the given 
      // date values.
      // The optimal interval is the minimun interval between any two 
      // date values.
      var i, j, len = dateValues.length,
          dateA, dateB, differences,
          diffInterval, diffSize,
          minIntervalSize, minInterval,
          overallMinSize = Infinity, overallMinInterval;
      
      //console.log("dateValues = ", dateValues);
      
      // Create js date objects so that we can query their date/time components.
      dateValues = array.map(dateValues, function(value) {
        return new Date(value);
      });
      
      // Compare each date with every other date.
      for (i = 0; i < len - 1; i++) {
        dateA = dateValues[i];
        
        differences = [];
        minIntervalSize = Infinity;
        minInterval = "";
        
        // Compare dateA against other date values in the forward sequence.
        for (j = i + 1; j < len; j++) {
          dateB = dateValues[j];
          
          diffInterval = (
            ( (dateA.getFullYear() !== dateB.getFullYear()) && "year" ) ||
            ( (dateA.getMonth()    !== dateB.getMonth())    && "month" ) ||
            ( (dateA.getDate()     !== dateB.getDate())     && "day" ) ||
            ( (dateA.getHours()    !== dateB.getHours())    && "hour" ) ||
            ( (dateA.getMinutes()  !== dateB.getMinutes())  && "minute" ) ||
            ( (dateA.getSeconds()  !== dateB.getSeconds())  && "second" ) || 
            "millisecond"
          );
          
          diffSize = dateIntervalSize[diffInterval];
  
          // Calculate the minimum interval between dateA and other date values.
          if (diffSize < minIntervalSize) {
            minIntervalSize = diffSize;
            minInterval =  diffInterval;
          }
          
          differences.push(diffInterval);
        }
        
        //console.log(" minInterval = ", minInterval, differences);
        
        // Calculate the minimun interval between any two date values.
        if (minIntervalSize < overallMinSize) {
          overallMinSize = minIntervalSize;
          overallMinInterval =  minInterval;
        }
      }
      
      //console.log(" overallMinInterval = ", overallMinInterval);
      
      return overallMinInterval;
    },
    
    createUniqueValueLabel: function(parameters) {
      // Returns a label for the given <value>.
      var value = parameters.value,
          fieldInfo = parameters.fieldInfo,
          domain = parameters.domain,
          interval = parameters.dateFormatInterval,
  
          label = String(value),
          domainName = (domain && domain.codedValues)
            ? domain.getName(value)
            : null;
  
      if (domainName) {
        label = domainName;
      }
      else if (typeof value === "number") {
        if (fieldInfo.type === "esriFieldTypeDate") {
          // Date format
          var dateValue = new Date(value);
          
          if (interval && dateFormatOptions[interval]) {
            var components = array.map(
              dateFormatOptions[interval],
              function(options) {
                return djDate.format(dateValue, options);
              }
            ).reverse();
            
            // components reversed to match dateFormatLength.
  
            // Date-time concatenation code borrowed from dojo/date/locale.format.
            label = (components.length == 1)
              ? components[0]
              : gregorian[dateFormatLength]
                .replace(/\'/g, "")
                .replace(/\{(\d+)\}/g, function(match, key){
                  return components[key];
                });
          }
          else {
            label = djDate.format(dateValue);
          }
        }
        else {
          // Number format:
          // Add group and decimal separators based on current locale, 
          // but retain precision.
          label = numberUtils.format(value);
        }
      }
  
      // Generate renderer returns date values in this format:
      // "10/5/2012 12:00:00 AM"
      // 1. We don't know the timezone of this date
      // 2. We don't know if the date pattern is m/d/y or d/m/y.
      // Let's just use the date string as label.
  
      return label;
    }
    
  });
  
  

  return utils;
});
