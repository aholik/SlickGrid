(function ($) {
  // register namespace
  $.extend(true, window, {
    "Slick": {
      "Preloader": Preloader
    }
  });

  function Preloader(container) {
    var 
      _self = this,
      _grid;

    function init(grid) {
      _grid = grid;
      return this;
    }

    function destroy() { }

    function getPreloader(center){
      var $grid = $(_grid.getContainerNode());

      if (!this.$preloader){
        this.$preloader = $('<div>').addClass('slick-preloader')
          .append($('<div>').addClass('slick-preloader-inner'))
          .appendTo($grid);
      }

      var pos = $grid.offset(), height = $grid.height(), width = $grid.width();
      var $inner = $grid.find('.slick-preloader-inner');
      $inner
        .css("position", "relative")
        .css("top", height/2 - $inner.height()/2 )
        .css("left", width/2 - $inner.width()/2 );

      return this.$preloader;
    }

    function show(){
      getPreloader().show();
      return this;
    }

    function hide(){
      getPreloader().fadeOut();
      return this;
    }


    // loader handling (remotemodel)
    // =============================

    var isDataLoading = [];

    function onLoaderDataLoading(){
      isDataLoading.push(true);
      show();
    }

    function onLoaderDataLoaded(e, args) {
      isDataLoading.pop();
      if (!isDataLoading.length) hide();
    }

    function onLoaderDataLoadError(e, args){
      isDataLoading.pop();
      if (!isDataLoading.length) hide();
    }

    function onLoaderDataLoadAbort(e, args){
      isDataLoading.pop();
      if (!isDataLoading.length) hide();
    }

    function registerLoader(loader){
      loader.onDataLoading.subscribe(onLoaderDataLoading);
      loader.onDataLoaded.subscribe(onLoaderDataLoaded);
      loader.onDataLoadError.subscribe(onLoaderDataLoadError);
      loader.onDataLoadAbort.subscribe(onLoaderDataLoadAbort);
    }

    function unregisterLoader(loader){
      loader.onDataLoading.unsubscribe(onLoaderDataLoading);
      loader.onDataLoaded.unsubscribe(onLoaderDataLoaded);
      loader.onDataLoadError.unsubscribe(onLoaderDataLoadError);
      loader.onDataLoadAbort.unsubscribe(onLoaderDataLoadAbort);
    }

    $.extend(this, {
      "init": init,
      "destroy": destroy,
      "show": show,
      "hide": hide,

      "registerLoader": registerLoader,
      "unregisterLoader": unregisterLoader
    });
  }

})(jQuery);