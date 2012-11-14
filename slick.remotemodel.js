(function ($) {
  function RemoteModel(options) {
    options = options || {};
    var
      PAGESIZE = options.pagesize || 50,
      data = { length: 0 },
      searchstr, sortcol, sortdir = 1,
      _ajaxOptions = options.ajaxOptions || {},
      urlRoot = options.url,
      url,
      queryStringSep,
      h_request,
      req; // ajax request

    var urlSplit = urlRoot.split('/');
    queryStringSep = urlSplit[urlSplit.length-1].indexOf('?') > -1 ? '&' : '?';

    // events
    var onDataLoading = new Slick.Event();
    var onDataLoaded = new Slick.Event();
    var onDataLoadError = new Slick.Event();
    var onDataLoadAbort = new Slick.Event();

    function init() {
    }

    function isDataLoaded(from, to) {
      for (var i = from; i <= to; i++) {
        if (data[i] === undefined || data[i] === null) {
          return false;
        }
      }

      return true;
    }


    function clear() {
      for (var key in data) {
        delete data[key];
      }
      data.length = 0;
    }


    function ensureData(from, to, ajaxOptions, force) {
      ajaxOptions = ajaxOptions || {};
      if (req) {
        req.abort();
        for (var i = req.fromPage; i <= req.toPage; i++)
          data[i * PAGESIZE] = undefined;
      }

      if (from < 0) {
        from = 0;
      }

      var fromPage = Math.floor(from / PAGESIZE);
      var toPage = Math.floor(to / PAGESIZE);

      while (data[fromPage * PAGESIZE] !== undefined && fromPage < toPage)
        fromPage++;

      while (data[toPage * PAGESIZE] !== undefined && fromPage < toPage)
        toPage--;

      if (fromPage > toPage || ((fromPage == toPage) && data[fromPage * PAGESIZE] !== undefined) && (force !== true) ) {
        // TODO:  look-ahead
        return;
      }

      var queryParams = {};

      if (searchstr){
        queryParams.query = searchstr;
      }
      // further flter query parameters:
      $.extend(queryParams, ajaxOptions.filter);

      // paging
      queryParams.offset = fromPage * PAGESIZE;
      queryParams.count = ((toPage - fromPage) * PAGESIZE) + PAGESIZE;

      // TODO: sorting

      url = urlRoot + '?' + $.map(queryParams, function(v,k){ return k+'='+v; }).join('&');

      if (h_request !== null) {
        clearTimeout(h_request);
      }

      h_request = setTimeout(function(){
        for (var i = fromPage; i <= toPage; i++) {
          data[i * PAGESIZE] = null; // null indicates a 'requested but not available yet'
        }

        onDataLoading.notify({from: from, to: to});

        req = $.ajax(/*$.extend(*/{
          url: url,
          contentType: 'application/json',
          dataType: 'json',
          success: onSuccess,
          error: function(err){
            onError(fromPage, toPage, err);
          }
        }/*, ajaxOptions)*/);

        req.fromPage = fromPage;
        req.toPage = toPage;
      }, 50);
    }


    function onError(fromPage, toPage, error) {
      if (error && error.statusText == 'abort' ) {
        onDataLoadAbort.notify({
          fromPage: fromPage,
          toPage: toPage,
          error: error
        });
        return;
      }

      console.error("error loading pages " + fromPage + " to " + toPage, error);
      onDataLoadError.notify({
        fromPage: fromPage,
        toPage: toPage,
        error: error
      });
    }

    function onSuccess(resp) {
      //Solution to keep the data array bounded to pagesize: Call the clear method to have only PAGESIZE elements in the data array at any given point
      clear();

      var
        from = req.fromPage * PAGESIZE,
        to = from + resp.results.length;

      data.length = parseInt(resp.count, 10);

      for (var i = 0, len = resp.results.length; i < len; i++) {
        data[from + i] = resp.results[i];
        data[from + i].index = from + i;
      }

      req = null;

      onDataLoaded.notify({ from: from, to: to, urlTemplates: resp.urlTemplates, count: resp.results.length, total: resp.count });
    }


    function reloadData(from, to) {
      for (var i = from; i <= to; i++)
        delete data[i];

      ensureData(from, to, options);
    }


    function setSort(column, dir) {
      sortcol = column;
      sortdir = dir;
      clear();
    }

    function setSearch(str) {
      searchstr = str;
      clear();
    }

    init();

    return {
      // properties
      "data": data,

      // methods
      "clear": clear,
      "isDataLoaded": isDataLoaded,
      "ensureData": ensureData,
      "reloadData": reloadData,
      "setSort": setSort,
      "setSearch": setSearch,

      // events
      "onDataLoading": onDataLoading,
      "onDataLoaded": onDataLoaded,
      "onDataLoadError" : onDataLoadError,
      "onDataLoadAbort": onDataLoadAbort
    };
  }

  // Slick.Data.RemoteModel
  $.extend(true, window, { Slick: { Data: { RemoteModel: RemoteModel }}});
})(jQuery);