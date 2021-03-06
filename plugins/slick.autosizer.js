(function ($) {
  // register namespace
  $.extend(true, window, {
    "Slick": {
      "AutoSizer": AutoSizer
    }
  });

  var defaults = {
    "pollInterval": 1500
  };

  function AutoSizer(options) {
    var 
      _isDestroyed,
      _options = $.extend(true, defaults, options),
      $container = $(_options.container),
      h,ch;

    if ($container.length !== 1){
      throw new Error('missing argument: container');
    }

    function init(grid) {
      pollSizeChanged();
    }

    function destroy() {
      _isDestroyed = true;
    }

    function pollSizeChanged(){
      if (_isDestroyed) return;

      ch = $container.height();
      if (h !== ch){
        h = ch;
        $container.trigger('resize.slickgrid');
      }

      setTimeout(pollSizeChanged, _options.pollInterval);
    }

    $.extend(this, {
      "init": init,
      "destroy": destroy
    });
  }
})(jQuery);