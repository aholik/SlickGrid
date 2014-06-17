(function ($) {
  // register namespace
  $.extend(true, window, {
    "Slick": {
      "ValidationTooltips": ValidationTooltips
    }
  });

  function ValidationTooltips(opts) {
    var 
      grid,
      options = $.extend(true, {}, ValidationTooltips.defaults, opts);

    function init(gridInstance) {
      grid = gridInstance;
      grid.onValidationError.subscribe(handleValidationError);
      grid.onBeforeCellEditorDestroy.subscribe(handleBeforeCellEditDestroy);
    }

    function destroy() {
      grid.onValidationError.unsubscribe(handleValidationError);
      grid.onBeforeCellEditorDestroy.unsubscribe(handleBeforeCellEditDestroy);
    }

    function handleValidationError(e, args){
      var
        validationResult = args.validationResults,
        errorMessage = validationResult.msg;

      ValidationTooltips.tooltip.set($(args.cellNode), errorMessage, args);
    }

    function handleBeforeCellEditDestroy(e, args){
      ValidationTooltips.tooltip.clear($(args.grid.getActiveCellNode()), args);
    }

    $.extend(this, {
      "init": init,
      "destroy": destroy
    });
  }

  ValidationTooltips.defaults = {
    "className": "cell-tooltip-validation-error"
  };


  ValidationTooltips.tooltip = {
    set: function($el, title){
      // backup title if any
      if (!$el.data('slick-validation-prev-title')){
        $el.data('slick-validation-prev-title', $el[0].title || 'null');
      }
      $el[0].title = errorMessage;
    },
    clear: function($el){
      var prevTitle = $el.data('slick-validation-prev-title');

      if (prevTitle){
        $el.removeData('slick-validation-prev-title');
        if (prevTitle === 'null'){
          $el.removeAttr('title');
        }
        else {
          $el.prop('title', prevTitle);
        }
      }
    }
  };

})(jQuery);