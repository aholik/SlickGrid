(function ($) {
  // register namespace
  $.extend(true, window, {
    "Slick": {
      "CheckboxSelectColumn": CheckboxSelectColumn
    }
  });


  function CheckboxSelectColumn(options) {
    var 
      _grid,
      _self = this,
      _handler = new Slick.EventHandler(),
      _selectedRows = {},
      _defaults = {
        columnId: "_checkbox_selector",
        cssClass: null,
        toolTip: "Select/Deselect All",
        width: 30,
        rowselector: true   // is it a column for grid row selection
      },
      _options = $.extend(true, {}, _defaults, options);

    var selectionChanged = new Slick.Event();

    function init(grid) {
      _grid = grid;
      
      if (_options.rowselector === true){
        _handler.subscribe(_grid.onSelectedRowsChanged, handleSelectedRowsChanged);
      }
      
      _handler
        .subscribe(_grid.onClick, handleClick)
        .subscribe(_grid.onHeaderClick, handleHeaderClick)
        .subscribe(_grid.onKeyDown, handleKeyDown);
    }

    function destroy() {
      _handler.unsubscribeAll();
    }

    /**
     *  grid selected rows changed handler
     */
    function handleSelectedRowsChanged(e, args) {
      var 
        selection = _grid.getSelectedRows(),
        lookup = {}, row, i, 
        tx_args = {};  //eventargs to transmit

      for (i = 0, len=selection.length; i < len; i++) {
        row = selection[i];
        lookup[row] = true;
               
        // it was not selected
        if (typeof _selectedRows[row] === 'undefined'){  
          (tx_args.add || (tx_args.add = [])).push(row);
          _grid.invalidateRow(row);
        }
        delete _selectedRows[row];
      }
      
      // the remaining contains the deleted items
      for (i in _selectedRows) {
        _grid.invalidateRow(i);
        (tx_args.del || (tx_args.del = [])).push( _selectedRows[i] );
      }
      _selectedRows = lookup;
      _grid.render();

      if (selection.length == _grid.getDataLength()) {
        _grid.updateColumnHeader(_options.columnId, "<input type='checkbox' checked='checked'>", _options.toolTip);
      } else {
        _grid.updateColumnHeader(_options.columnId, "<input type='checkbox'>", _options.toolTip);
      }
      
      selectionChanged.notify(tx_args);
    }

    function handleKeyDown(e, args) {
    
      if (e.which == 32) {
        if (_grid.getColumns()[args.cell].id === _options.columnId) {
          // if editing, try to commit
          if (!_grid.getEditorLock().isActive() || _grid.getEditorLock().commitCurrentEdit()) {
            toggleRowSelection(args.row);
          }
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      }
    }

    function handleClick(e, args) {
      // clicking on a row selects checkbox
      if (_grid.getColumns()[args.cell].id === _options.columnId && $(e.target).is(":checkbox")) {
        // if editing, try to commit
        if (_grid.getEditorLock().isActive() && !_grid.getEditorLock().commitCurrentEdit()) {
          e.preventDefault();
          e.stopImmediatePropagation();
          return;
        }

        toggleRowSelection(args.row);
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    }

    function toggleRowSelection(row) {
      if (_options.rowselector !== false){
        if (_selectedRows[row]) {
          _grid.setSelectedRows($.grep(_grid.getSelectedRows(), function (n) {
            return n != row;
          }));
        } else {
          _grid.setSelectedRows(_grid.getSelectedRows().concat(row));
        }
      }
    }

    function handleHeaderClick(e, args) {
      if (args.column.id == _options.columnId && $(e.target).is(":checkbox")) {
        // if editing, try to commit
        if (_grid.getEditorLock().isActive() && !_grid.getEditorLock().commitCurrentEdit()) {
          e.preventDefault();
          e.stopImmediatePropagation();
          return;
        }

        if ($(e.target).is(":checked")) {
          var rows = [];
          for (var i = 0; i < _grid.getDataLength(); i++) {
            rows.push(i);
          }
          _grid.setSelectedRows(rows);
        } else {
          _grid.setSelectedRows([]);
        }
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    }

    function getColumnDefinition() {
      return {
        id: _options.columnId,
        name: "<input type='checkbox'>",
        toolTip: _options.toolTip,
        field: "sel",
        width: _options.width,
        resizable: false,
        sortable: false,
        nofilter: true,
        hideable: false,
        cssClass: _options.cssClass,
        formatter: checkboxSelectionFormatter
      };
    }

    function checkboxSelectionFormatter(row, cell, value, columnDef, dataContext) {
      if (dataContext) {
        return _selectedRows[row] ? "<input type='checkbox' checked='checked'>" : "<input type='checkbox'>";
      }
      return null;
    }

    $.extend(this, {
      "init": init,
      "destroy": destroy,

      "getColumnDefinition": getColumnDefinition,
      "selectionChanged": selectionChanged
    });
  }
})(jQuery);