define(
[
  "dojo/_base/array",
  "dojo/_base/kernel",
  "dojo/_base/lang",
  "dojo/date",
  "dojo/number",
  "dojo/date/locale"
],
function(
  array, kernel, lang,
  dojoDate, dojoNumber, dateLocale
) {
  
  function getParts(arr, obj, cb) {
    return [ 
      lang.isString(arr) ? arr.split("") : arr, 
      obj || kernel.global,
      // FIXME: cache the anonymous functions we create here?
      lang.isString(cb) ? new Function("item", "index", "array", cb) : cb
    ];
  }
  
  function isDefined(value) {
    return (value !== undefined) && (value !== null);
  }

  var _TEMPLATE_WILDCARD = "${*}",
//      _TEMPLATE_WILDCARD_STRING = "${key} = ${value}<br/>",
      _FORMATTERS = [ "NumberFormat", "DateString", "DateFormat" ], tagsRegex = /<\/?[^>]+>/g;
  
  function cleanup(value) {
    return isDefined(value) ? value : "";
  }

  function exec(key, data, template) {
    /********
     * Parse
     ********/
    var parts = template.match(/([^\(]+)(\([^\)]+\))?/i),
        funcName = lang.trim(parts[1]),
        value = data[key],
        dateVal,

        // Examples for parts[2]:
        // https://developers.arcgis.com/javascript/jshelp/intro_formatinfowindow.html
        //  "(places: 0)"
        //  "(datePattern: 'M/d/y', selector: 'date')"
        //  "(datePattern: 'h \\'o\\'\\'clock\\' a, zzzz', selector: 'date')"
        // TODO
        // Parse-out options instead of eval-ing?
        // But parsing out property names and their values is complex and 
        // elaborate. See the complexity of string.replace calls below.
        args = JSON.parse(
                // We need to convert the text into a JSON object specification
                // conformant with JSON.parse.
          
                // Examples:
                //  (places: 0) converted to {"places": 0}
          
                //  (datePattern: 'M/d/y', selector: 'date')
                //    converted to
                //  {"datePattern":"M/d/y","selector":"date"}
          
                //  (datePattern: 'h \\'o\\'\\'clock\\' a, zzzz', selector: 'date')
                //    converted to
                //  {"datePattern":"h \'o\'\'clock\' a, zzzz","selector":"date"}
          
                (parts[2] ? lang.trim(parts[2]) : "{}")
                 .replace(/^\(/, "{")
                 .replace(/\)$/, "}")
                  
                  // Wraps un-quoted property names with double-quotes
                  // as expected by JSON.parse
                 .replace(/([{,])\s*([0-9a-zA-Z\_]+)\s*:/gi, '$1"$2":')
                  
                  // ":'  converted to ":"
                 .replace(/\"\s*:\s*\'/gi, '":"')
                  
                  // ', converted to ",
                  // '} converted to "}
                 .replace(/\'\s*(,|\})/gi, '"$1')
               ),
        
        // utcOffset is specified in minutes. Positive
        // value indicates offset to the West of UTC/GMT.
        // Negative otherwise
        utcOffset = args.utcOffset;
        
    //console.log("[func] = ", funcName, " [args] = ", dojo.toJson(args));

    /**********
     * Execute
     **********/
    if (array.indexOf(_FORMATTERS, funcName) === -1) {
      // unsupported function
      //console.warn("unknown function: ", funcName);

      // Assume this is a user-defined global function and execute it
      var ref = lang.getObject(funcName);
      if (lang.isFunction(ref)) {
        value = ref(value, key, data, args);
      }
    }
    else if (
      typeof value === "number" || 
      (typeof value === "string" && value && !isNaN(Number(value)))
    ) {
      value = Number(value);
      
      switch(funcName) {
        case "NumberFormat":
            return dojoNumber.format(value, args);
        case "DateString":
          dateVal = new Date(value);
          
          if (args.local || args.systemLocale) {
            // American English; Uses local timezone
            
            if (args.systemLocale) {
              // Uses OS locale's conventions
              // toLocaleDateString and toLocaleTimeString are better than toLocaleString
              return dateVal.toLocaleDateString() + (args.hideTime ? "" : (" " + dateVal.toLocaleTimeString()));

              // Example: "Wednesday, December 31, 1969 4:00:00 PM"
              
              // Related Chromium bug:
              // http://code.google.com/p/chromium/issues/detail?id=3607
              // http://code.google.com/p/v8/issues/detail?id=180
            }
            else {
              // toDateString and toTimeString are better than toString
              return dateVal.toDateString() + (args.hideTime ? "" : (" " + dateVal.toTimeString()));
            }
          }
          else {
            // American English; Uses universal time convention (w.r.t GMT)
            dateVal = dateVal.toUTCString();
            if (args.hideTime) {
              dateVal = dateVal.replace(/\s+\d\d\:\d\d\:\d\d\s+(utc|gmt)/i, "");
            }
            return dateVal;

            // Example: "Thu, 01 Jan 1970 00:00:00 GMT"
            // NOTE: IE writes out UTC instead of GMT
          }
          break;
          
        case "DateFormat":

          dateVal = new Date(value);
          
          if (isDefined(utcOffset)) {
            dateVal = dojoDate.add(
              dateVal, 
              "minute", 
              // Offset "at" dateVal. Not offset "right now".
              (dateVal.getTimezoneOffset() - utcOffset)
            );
          }
          
          return dateLocale.format(dateVal, args);

      }
    }
      
    return cleanup(value);
  }
  
  function fixJson(obj, recursive) {
    // Helper method to remove properties with undefined value.
    // Notes:
    // - This should happen in dojo.toJson. It cannot allow an
    //   invalid json value like undefined. See http://json.org
    var prop;
    
    if (recursive) {
      for (prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          if (obj[prop] === undefined) {
            delete obj[prop];
          }
          else if (obj[prop] instanceof Object) {
            fixJson(obj[prop], true);
          }
        }
      }
    }
    else {
      for (prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          if (obj[prop] === undefined) {
            delete obj[prop];
          }
        }
      } // for
    }
    return obj;
  }

  var esriLang = {
    /*
     * Compare two objects.
     * 
     * @return {boolean} `true` if a equals b, `false` otherwise
     * @private
     */
    equals: function equals(a, b){
      var result = 
        // same object
        a === b

        // same number
        || ((typeof a === "number" && isNaN(a)) && (typeof b === "number" && isNaN(b)))

        // same Date
        || (lang.isFunction((a || {}).getTime) && lang.isFunction((b || {}).getTime) && a.getTime() == b.getTime())

        // implements equals
        || (lang.isFunction((a || {}).equals) && a.equals(b))
        || (lang.isFunction((b || {}).equals) && b.equals(a))

        || false;

      return result;
    },
    
    valueOf: function(/*Array*/ array, /*Object*/ value) {
      //summary: Similar to dojo.indexOf, this function returns the first property
      // matching argument value. If property not found, null is returned
      // array: Array: Array to look in
      // value: Object: Object being searched for
      var i;
      for (i in array) {
        if (array[i] == value) {
          return i;
        }
      }
      return null;
    },
    
    stripTags: function (data) {
      if (data) {
        // get type of data
        var t = typeof data;
        
        if (t === "string") {
          // remove tags from a string
          data = data.replace(tagsRegex, "");
        }
        else if (t === "object") {
          var item;
          
          // remove tags from an object
          for (item in data) {
            var currentItem = data[item];
            
            if (currentItem && typeof currentItem === "string") {
              //strip html tags
              currentItem = currentItem.replace(tagsRegex, "");
            }
            
            // set item back on data
            data[item] = currentItem;
          }
        }
      }
      
      return data;
    },
    
    substitute: function(data, template, options) {
      //summary: A function to substitute the argument data, using a template.
      // data: Array: Data object to be substituted
      // template?: String: Template string to use for substitution
      // first?: boolean: If no template, and only first data element is to be returned. Note, different browsers may interpret the for...in loop differently, thus returning different results.
      
      //  Normalize options (for backward compatibility)
      var first, dateFormat, nbrFormat;
      if (isDefined(options)) {
        if (lang.isObject(options)) {
          first = options.first;
          dateFormat = options.dateFormat;
          nbrFormat = options.numberFormat;
        }
        else {
          first = options;
        }
      }
      //options = options || {};
      //console.log("first = ", first);
      
      /*var transformFn = function(value, key) {
        if (value === undefined || value === null) {
          return "";
        }
        return value;
      };*/
      
      if (!template || template === _TEMPLATE_WILDCARD) {
        var s = [], val, i;
            /*d = {
                  key: null,
                  value: null
                },
            i,
            _tws = _TEMPLATE_WILDCARD_STRING;*/
        
        s.push("<table><tbody>");
        
        for (i in data) {
          /*d.key = i;
          d.value = data[i];
          s.push(dojo.string.substitute(_tws, d, cleanup));*/
          val = data[i];
          
          if (dateFormat && array.indexOf(dateFormat.properties || "", i) !== -1) {
            val = exec(i, data, dateFormat.formatter || "DateString");
          }
          else if (nbrFormat && array.indexOf(nbrFormat.properties || "", i) !== -1) {
            val = exec(i, data, nbrFormat.formatter || "NumberFormat");
          }
  
          s.push("<tr><th>" + i + "</th><td>" + cleanup(val) + "</td></tr>");
          
          if (first) {
            break;
          }
        }
        s.push("</tbody></table>");
        return s.join("");
      }
      else {
        //return dojo.string.substitute(template, data, transformFn);
        
        return lang.replace(template, lang.hitch({obj:data}, function(_, key){
          //console.log("Processing... ", _);
          
          var colonSplit = key.split(":");
          if (colonSplit.length > 1) {
            key = colonSplit[0];
            colonSplit.shift();
            return exec(key, this.obj, colonSplit.join(":"));
          }
          else {
            //console.log("No function");
            
            // Lookup common date format options
            if (dateFormat && array.indexOf(dateFormat.properties || "", key) !== -1) {
              return exec(key, this.obj, dateFormat.formatter || "DateString");
            }
            
            // Lookup common number format options
            if (nbrFormat && array.indexOf(nbrFormat.properties || "", key) !== -1) {
              return exec(key, this.obj, nbrFormat.formatter || "NumberFormat");
            }
          }
          
          return cleanup(this.obj[key]);
        }), /\$\{([^\}]+)\}/g);
      }
    },
    
    filter: function(arr, callback, thisObject) {
      var _p = getParts(arr, thisObject, callback), outArr = {}, i;
      arr = _p[0];
    
      for (i in arr) {
        if (_p[2].call(_p[i], arr[i], i, arr)) {
          outArr[i] = arr[i];
        }
      }
    
      return outArr; // Array
    },
    
    isDefined: isDefined,
    fixJson: fixJson
  };

  return esriLang;

});
