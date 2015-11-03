define([
  "dojo/number",
  "dojo/i18n!dojo/cldr/nls/number"
],
function(dojoNumber, nlsNumber) {
  
  // Sorts numbers in ascending order.
  var numericAscending = function(a, b) {
    return a - b;
  };

  ////////////////////
  // Module value
  ////////////////////

  var numberUtils = {
  
    // This regex matches an integer or fractional number - positive or negative.
    _reNumber: /^-?(\d+)(\.(\d+))?$/i,

    getDigits: function(number) {
      // Returns number of digits in the integer and fractional parts of the
      // given numeric value.
      var numString = String(number),
          match = numString.match(numberUtils._reNumber),
          retVal = {
            integer: 0,
            fractional: 0
          };

      if (match && match[1]) {
        retVal.integer = match[1].split("").length;

        // Integer digits can also be calculated using this logic:
        // var adjust = (num > 0) ? Math.floor(num) : Math.ceil(num);
        // adjust = Math.abs(adjust);
        // return Math.floor( Math.log(adjust) / Math.LN10 );


        retVal.fractional = match[3] ? match[3].split("").length : 0;

        // Fractional digits can also be calculated using this logic:
        //  var e = 1;
        //
        //  while (Math.round(number * e) / e !== number) {
        //    e *= 10;
        //  }
        //
        //  // Max precision returned seems to be 15
        //  return Math.round( Math.log(e) / Math.LN10 );
      }
      else if (numString.toLowerCase().indexOf("e") > -1) {
        // Number in exponential notation.
        // Ex: 1.4868420127616598e-7, 134e25, 134e-25 etc
        var parts = numString.split("e"),
            numericPart = parts[0],
            powerOfTen = parts[1],
            digits, isPosPower;
        
        if (numericPart && powerOfTen) {
          // Convert strings to numbers.
          numericPart = Number(numericPart);
          powerOfTen = Number(powerOfTen);
          
          // Is the power positive?
          isPosPower = powerOfTen > 0;
          
          // Get the absolute value of power.
          if (!isPosPower) {
            powerOfTen = Math.abs(powerOfTen);
          }
          
          digits = numberUtils.getDigits(numericPart);
          
          // Update "digits" using powerOfTen value.
          if (isPosPower) {
            digits.integer += powerOfTen;
            
            if (powerOfTen > digits.fractional) {
              digits.fractional = 0;
            }
            else {
              digits.fractional -= powerOfTen;
            }
          }
          else {
            digits.fractional += powerOfTen;
  
            if (powerOfTen > digits.integer) {
              digits.integer = 1;
            }
            else {
              digits.integer -= powerOfTen;
            }
          }
          
          retVal = digits;
        }
      }

      return retVal;
    },

    getFixedNumbers: function(number, fractionDigits) {
      var num1, num2;

      num1 = Number( number.toFixed(fractionDigits) );

      if (num1 < number) {
        // num2 will be larger than num1/number
        num2 = num1 + ( 1 / Math.pow(10, fractionDigits) );
      }
      else {
        // num2 will be smaller than num1/number
        num2 = num1 - ( 1 / Math.pow(10, fractionDigits) );
      }

      // Returns two numbers (equivalent to floor and ceil of the given number):
      // One less than the given number.
      // The other greater than the given number.
      return [ num1, num2 ];
    },

    getPctChange: function(number, fixedNumber, prev, next) {
      // Returns the absolute percent change of the given number
      // (after it has been changed to <fixedNumber>)
      // w.r.t its nearby numbers given as <prev> and <next>.
      var change = {
            prev: null,
            next: null
          },

          oldDiff, newDiff, diffChange;

      if (prev != null) {
        oldDiff = number - prev;
        newDiff = fixedNumber - prev;
        diffChange = newDiff - oldDiff;

        change.prev = Math.floor(Math.abs( (diffChange * 100) / oldDiff ));
      }

      if (next != null) {
        oldDiff = next - number;
        newDiff = next - fixedNumber;
        diffChange = newDiff - oldDiff;

        change.next = Math.floor(Math.abs( (diffChange * 100) / oldDiff ));
      }

      return change;
    },

    round: function(numbers, options) {
      var numbersCopy = numbers.slice(0),
          number, prev, next,
          digits, fractionDigits,
          fixedNumber, fixedNumbers,
          i, j, found, index,
          pctTolerance = (!options || options.tolerance == null) ? 2 : options.tolerance,
          indexes = options && options.indexes;

      //console.log("Numbers: ", numbers);
      //console.log("Percent tolerance: ", pctTolerance);
      
      // Find stops that need to be rounded.
      if (indexes) {
        indexes.sort(numericAscending);
      }
      else {
        // Get indexes of all numbers.
        // All stop values will be rounded.
        indexes = [];
        
        for (i = 0; i < numbersCopy.length; i++) {
          indexes.push(i);
        }
      }

      //console.log("indexes: ", indexes);

      for (i = 0; i < indexes.length; i++) {
        index = indexes[i];
        number = numbersCopy[index];

        prev = (index === 0) ? null : numbersCopy[index - 1];
        next = (index === (numbersCopy.length - 1)) ? null : numbersCopy[index + 1];

        digits = numberUtils.getDigits(number);
        fractionDigits = digits.fractional;

        //console.log(number, digits, prev, next);

        // Let's reduce the precision of fractional numbers.
        if (fractionDigits) {
          j = 0;
          found = false;

          // Keep iterating until we find an optimal precision.
          while (j <=  fractionDigits && !found) {
            fixedNumbers = numberUtils.getFixedNumbers(number, j);

            // Use the adjusted/fixed number only if it introduces minimal change
            // in the sequence.
            fixedNumber = fixedNumbers[0];
            found = numberUtils.hasMinimalChange(number, fixedNumber, prev, next, pctTolerance);

            j++;
          }

          if (found) {
            // Update the sequence with the fixed number so that the next number
            // in sequence can be adjusted based on it.
            numbersCopy[index] = fixedNumber;
          }
        }
      }

      //console.log("Fixed: ", numbersCopy);
      return numbersCopy;
    },

    hasMinimalChange: function(number, fixedNumber, prev, next, pctTolerance) {
      // Returns true if the given <fixedNumber> has changed minimally with
      // respect to the nearby numbers in the sequence given by <prev> and <next>.
      var change = numberUtils.getPctChange(number, fixedNumber, prev, next),
          prevOk, nextOk, isMinimal;

      //console.log(" ", change, fixedNumber);

      // It is considered minimal change if one of the following conditions is true:
      // 1. Change w.r.t <prev> is atmost <pctTolerance> AND
      //    Change w.r.t <next> is atmost <pctTolerance>
      // 2. Sum of change w.r.t <prev> and <next> is atmost twice the <pctTolerance>.
      prevOk = (change.prev == null || change.prev <= pctTolerance);
      nextOk = (change.next == null || change.next <= pctTolerance);

      isMinimal = (prevOk && nextOk)
        || ( (change.prev + change.next) <= (2 * pctTolerance) );

      return isMinimal;
    },
    
    // This regex matches "dot or comma + trailing zeros" in formatted numbers of this pattern:
    // 234,234.0000000 (lang=en)
    // 234.234,0000000 (lang=de)
    _reAllZeros: new RegExp("\\" + nlsNumber.decimal + "0+$", "g"),
  
    // This regex matches "last digit + trailing zeros" in formatted numbers of this pattern:
    // 234,234.23423400000 (lang=en)
    // 234.234,23423400000 (lang=de)
    _reSomeZeros: new RegExp("(\\d)0*$", "g"),
    
    format: function(value, options) {
      // Formats the given numeric value based on the current locale.
      //   options: same as dojoNumber.__FormatOptions
      
      // By default, we want the formatted string to retain the numeric 
      // precision as much as allowed by the browser:
      // dojo/number.format uses decimal pattern defined in the current  
      // locale. Setting "round" to -1 is not sufficient to suppress that 
      // behavior. We will set "places" to 20 and remove insignificant
      // trailing zeros after.
      options = options || {
        places: 20,
        round: -1
      };
      
      var formattedStr = dojoNumber.format(value, options);
  
      // Remove insignificant trailing zeros
      if (formattedStr) {
        formattedStr = formattedStr
          .replace(numberUtils._reSomeZeros, "$1")
          .replace(numberUtils._reAllZeros, "");
      }
      
      return formattedStr;
    }

  };

  return numberUtils;
});
