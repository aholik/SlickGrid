(function ($) {
  // register namespace
  $.extend(true, window, {
    "Slick": {
      "State": State
    }
  });

  var lstorage = function(){
    var localStorage = window.localStorage;

    if (typeof localStorage === 'undefined'){
      console.error('localstorage is not available. slickgrid statepersistor disabled.');
    }

    return {
      get: function(key){
        if (!localStorage) return;
        try {
          var d = localStorage.getItem(key);
          if (d) return JSON.parse(d);
        }
        catch(exc) {
          console.error(exc);
        }
      },
      set: function(key, obj){
        if (!localStorage) return;
        //console.log("persisting", obj);
        if (obj){
          obj = JSON.stringify(obj);
        }
        localStorage.setItem(key, obj);
      }
    };
  };

  var defaults = {
    key_prefix: "slickgrid:",
    storage: new lstorage()
  };

  function State(options) {
    options = $.extend(true, {}, defaults, options);

    var _grid, _cid,
      _store = options.storage;

    function init(grid) {
      _grid = grid;
      _cid = grid.cid || options.cid;
      if (_cid){
        grid.onColumnsResized.subscribe(save);
        grid.onColumnsReordered.subscribe(save);
        grid.onSort.subscribe(save);
      }
      else {
        console.warn("grid has no client id. state persisting is disabled.");
      }
    }

    function destroy() {
      grid.onSort.unsubscribe(save);
      grid.onColumnsReordered.unsubscribe(save);
      grid.onColumnsResized.unsubscribe(save);
      save();
    }

    function save(){
      if (_cid && _store){
        var state = {
          sortcols: _grid.getSortColumns(),
          viewport: _grid.getViewport(),
          columns: getColumns()
        };

        return _store.set(options.key_prefix + _cid, state);
      }
    }

    function restore(){
      if (_cid && _store){
        var dfd = $.Deferred();

        $.when(_store.get(options.key_prefix + _cid))
          .then(function success(state){
            if (state){
              if (state.sortcols){
                _grid.setSortColumns(state.sortcols);
              }
              if (state.viewport){
                _grid.scrollRowIntoView(state.viewport.top, true);
              }
              if (state.columns){
                _grid.setColumns(state.columns);
              }
            }
            dfd.resolve(state);
          }, function failure(err){
            dfd.reject(err);
          });

        return dfd.promise();
      }
    }

    function getColumns(){
      var cols = _grid.getColumns();

      //console.log(cols);
      return cols;
      /*
      var result = [];
      for(var i in cols){
        if ()
      }
      */
    }

    /*
     *  API
     */
    $.extend(this, {
      "init": init,
      "destroy": destroy,
      "save": save,
      "restore": restore
    });
  }
})(jQuery);