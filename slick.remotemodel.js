(function ($) {

  var defaults = {
    "pagesize": 50,
    "page_margin": 150,

    "responseItemsMemberName":          "items",
    "responseTotalCountMemberName":     "total",
    "responseItemsCountMemberName":     "count",
    "responseOffsetMemberName":         "offset",
    "responseLimitMemberName":          "limit",
    "responseIdentitiesMemberName":     "identities",
    "adapter": new PagingAdapter()
  };

  function PagingAdapter(options){
    options = $.extend({}, defaults, options);

    return {
      dataLoaded: function(resp){
        var 
          items = resp[options.responseItemsMemberName],
          from = req.fromPage * options.pagesize,
          to = from + items.length,
          count = items.length,
          total = parseInt(resp[options.responseTotalCountMemberName], 10);

        return {
          items: items,
          from: from,
          to: to,
          count: count,
          total: total,
          identities: resp[options.responseItemsMemberName]
        };
      }
    };
  }

  function ArrayAdapter(options){
    return {
      dataLoaded: function(resp){
        return {
          items: resp,
          from: 0,
          to: resp.lenth,
          count: resp.length,
          total: resp.length
        };
      }
    };
  }


  function RemoteModel(options) {
    options = $.extend({}, defaults, options);
    var
      _slickgrid,
      _lastRequestOptions,
      _identities,
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
    var
      onDataLoading = new Slick.Event(),
      onDataLoaded = new Slick.Event(),
      onDataLoadError = new Slick.Event(),
      onDataLoadAbort = new Slick.Event();


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
      
      // calculating pages
      from = Math.max(0, from);
      var 
        fromPage = Math.floor(from / options.pagesize),
        toPage = Math.floor(to / options.pagesize);

      while (data[fromPage * options.pagesize] !== undefined && fromPage < toPage){
        fromPage++;
      }

      while (data[toPage * options.pagesize] !== undefined && fromPage < toPage){
        toPage--;
      }

      if (fromPage > toPage || ((fromPage == toPage) && data[fromPage * options.pagesize] !== undefined) && (force !== true) ) {
        // TODO:  look-ahead
        return;
      }
      
      // ------------------------------
      // hack to ensure not bombing server with the same requests
      var fullOpts = $.extend(true,{}, ajaxOptions, { from: fromPage, to: toPage, search: searchstr });
      if (!force && _.isEqual(fullOpts, _lastRequestOptions)){
        return false;
      }
      _lastRequestOptions = fullOpts;
      // ------------------------------
      
      // it there's a running request we cancel it. TODO: not cancel but save the result
      if (req) {
        req.abort();
        for (var i = req.fromPage; i <= req.toPage; i++)
          data[i * options.pagesize] = undefined;
      }
      
      // building query
      var queryParams = {};

      if (searchstr){
        queryParams.query = searchstr;
      }
      // further flter query parameters:
      $.extend(queryParams, ajaxOptions.filter);

      // paging
      queryParams.$skip = fromPage * options.pagesize;
      queryParams.$top = ((toPage - fromPage) * options.pagesize) + options.pagesize;

      /* TODO: sorting
      utils.each(_sortOptions, function(s){
        queryParams['s__'+s.field] = s.direction === 'asc' ? 1 : -1;
      });
      */
      
      url = urlRoot + '?' + $.param(queryParams).replace(/\%24/g, '$');

      if (h_request !== null) {
        clearTimeout(h_request);
      }

      h_request = setTimeout(function(){
        for (var i = fromPage; i <= toPage; i++) {
          data[i * options.pagesize] = null; // null indicates a 'requested but not available yet'
        }

        onDataLoading.notify({from: from, to: to});

        req = $.ajax({
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
      //Solution to keep the data array bounded to pagesize + window: Call the clear method to have only 2*PAGESIZE elements in the data array at any given point
      clear();
      var tx = options.adapter.dataLoaded(resp);

      data.length = tx.total;

      for (var i = 0; i < tx.count; i++) {
        data[tx.from + i] = tx.items[i];
        data[tx.from + i].index = tx.from + i;
      }

      _identities = tx.identities;

      req = null;
     
      onDataLoaded.notify({ 
        from: tx.from,
        to: tx.to,
        count: tx.count,
        total: tx.total,
        identities: _identities
      });
    }


    function reloadData(from, to) {
      for (var i = from; i <= to; i++){
        delete data[i];
      }

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

    function getIdentities(){
      return _identities;
    }


    /*
     *  Plugin
     */
    function init(slickgrid){
      _slickgrid = slickgrid;
      slickgrid.onViewportChanged.subscribe(onGridViewportChanged);
      slickgrid.onSort.subscribe(onGridSort);
      onDataLoaded.subscribe(updatreGridOnDataLoaded);
    }

    function destroy(){
      onDataLoaded.unsubscribe(updatreGridOnDataLoaded);
      _slickgrid.onSort.unsubscribe(onGridSort);
      _slickgrid.onViewportChanged.unsubscribe(onGridViewportChanged);
    }

    function onGridViewportChanged(){
      var vp = _slickgrid.getViewport();
      ensureData(vp.top, vp.bottom);
    }

    function onGridSort(e, args){
      setSort(args.sortCol.field, args.sortAsc ? 1 : -1);
      var vp = _slickgrid.getViewport();
      ensureData(vp.top, vp.bottom);
    }

    function updatreGridOnDataLoaded(e,args){
      for (var i = args.from; i <= args.to; i++) {
        _slickgrid.invalidateRow(i);
      }
      _slickgrid.updateRowCount();
      _slickgrid.render();
    }



    return {
      // properties
      "data": data,
      "defaults": defaults,

      // methods
      "clear": clear,
      "init": init,
      "isDataLoaded": isDataLoaded,
      "ensureData": ensureData,
      "reloadData": reloadData,
      "setSort": setSort,
      "setSearch": setSearch,
      "getIdentities": getIdentities,

      // events
      "onDataLoading": onDataLoading,
      "onDataLoaded": onDataLoaded,
      "onDataLoadError" : onDataLoadError,
      "onDataLoadAbort": onDataLoadAbort
    };
  }


  // Slick.Data.RemoteModel
  RemoteModel.PagingAdapter = PagingAdapter;
  RemoteModel.ArrayAdapter = ArrayAdapter; 
  $.extend(true, window, { Slick: { Data: { RemoteModel2: RemoteModel }}});
})(jQuery);