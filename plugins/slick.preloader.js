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
    }

    function destroy() { }

    function getPreloader(toPosition){
      var $t = $(container);

      if (!this.$p){
        this.$p = $('<div class="cyc-grid-preloader"><img src="images/preloader-hbar.gif"/></div>').appendTo(document.body);
      }

      if (toPosition){
        var pos = $t.offset(), height = $t.height(), width = $t.width();
        this.$p
          .css("position", "absolute")
          .css("top", pos.top + height/2 - this.$p.height()/2 )
          .css("left", pos.left + width/2 - this.$p.width()/2 );
      }
      return this.$p;
    }

    function show(){
      getPreloader(true).show();
    }

    function hide(){
      getPreloader().fadeOut();
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