/***
 * Contains basic SlickGrid formatters.
 * @module Formatters
 * @namespace Slick
 */

(function ($) {
  // register namespace
  $.extend(true, window, {
    "Slick": {
      "Formatters": {
        "Chain": Chain,
        "Concatenator": Concatenator,
        "PercentComplete": PercentCompleteFormatter,
        "PercentCompleteBar": PercentCompleteBarFormatter,
        "YesNo": YesNoFormatter,
        "Checkmark": CheckmarkFormatter,
        "ReferenceValue": ReferenceValueFormatter,
        "LinkFormatter": LinkFormatter,
        "DateFormatter": DateFormatter
      }
    }
  });

  function PercentCompleteFormatter(row, cell, value, columnDef, dataContext) {
    if (value == null || value === "") {
      return "-";
    } else if (value < 50) {
      return "<span style='color:red;font-weight:bold;'>" + value + "%</span>";
    } else {
      return "<span style='color:green'>" + value + "%</span>";
    }
  }

  function PercentCompleteBarFormatter(row, cell, value, columnDef, dataContext) {
    if (value == null || value === "") {
      return "";
    }

    var color;

    if (value < 30) {
      color = "red";
    } else if (value < 70) {
      color = "silver";
    } else {
      color = "green";
    }

    return "<span class='percent-complete-bar' style='background:" + color + ";width:" + value + "%'></span>";
  }

  function YesNoFormatter(row, cell, value, columnDef, dataContext) {
    return value ? "Yes" : "No";
  }

  function CheckmarkFormatter(row, cell, value, columnDef, dataContext) {
    return value ? "<img src='../images/tick.png'>" : "";
  }

  function ReferenceValueFormatter(row, cell, value, columnDef, dataContext) {
    var options = typeof columnDef.options === 'function' ? columnDef.options() : args.column.options;
    value = ko.utils.unwrapObservable(value);

    if (options){
      var match;
      for(var i in options){
        if (options[i].id == value || options[i].key == value){
          match = options[i];
          break;
        }
      }

      if (match){
        return match.value || match.label || value;
      }
    }
    return value;
  }

  /*
   *  utility for chaining formatters
   */
  function Chain(){
    var formatters = Array.prototype.slice.call(arguments);

    return function(row, cell, value, columnDef, dataContext){
      var val = value;
      for(var i in formatters){
        val = formatters[i](row, cell, val, columnDef, dataContext);
      }
      return val;
    };
  }

  /*
   * Presents data as href by substituting 
   * url template with values 
   */
  function LinkFormatter(options){
    var urlTemplate = typeof options === 'string' ? options : options.urlTemplate;
    var matches = urlTemplate.match(/:(\w+)/g);
    var splatParams = [], i, result, val;

    for(i in matches){
      splatParams.push(matches[i].substring(1));
    }

    var len = splatParams.length;

    return function(row, cell, value, columnDef, dataContext){
      result = urlTemplate;
      for(i=0; i<len; i++){
        val = dataContext[splatParams[i]];
        if ( typeof val !== null ){
          result = result.replace(':'+splatParams[i], val);
        }
      }
      return (typeof value !== 'undefined' && value !== null) ? ('<a href="'+result+'">' + value + '</a>') : null;
    };
  }

  /*
   *  depends on Moment.js 
   *  (http://momentjs.com/)
   */
  function DateFormatter(options){
    var hasMoment = typeof moment !== 'undefined';

    return function(row, cell, value, columnDef, dataContext){
      if (!hasMoment) return value;

      if (value && options && options.format){
        return moment(value).format(options.format);
      }
      return '';
    };
  }

  function Concatenator(fields, separator){
    if (typeof separator === 'undefined'){ separator = ' '; }
    if (typeof fields === 'string'){
      fields = fields.split(',');
    }
    var len = fields.length, data;

    return function(row, cell, value, columnDef, dataContext){
      var result = [];
      for(var i=0; i<len; i++){
        data = dataContext[ fields[i] ];
        if (data){
          result.push(data);
        }
      }
      return result.join(separator);
    };
  }

})(jQuery);