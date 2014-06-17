(function ($) {
    $.extend(true, window, {
        "Ext": {
            "Plugins": {
                "HeaderFilter": HeaderFilter
            }
        }
    });

    HeaderFilter.defaults = {
        buttonImage: "../images/down.png",
        filterImage: "../images/filter.png",
        sortAscImage: "../images/sort-asc.png",
        sortDescImage: "../images/sort-desc.png",
        sortMenuitems: true,
        textFilter: true,
        messages: {
            "ok": "OK",
            "clear": "Clear",
            "cancel": "Cancel",
            "textFilter": "Filter",
            "selectAll": "Select All",
            "sortAsc": "Sort Ascending",
            "sortDesc": "Sort Descending",
            "empty": "empty",
            "trueDesc": "True",
            "falseDesc": "False"
        },
        maxItems: 300,
        menuButtonCssClass:             'slick-header-menubutton',
        headerMenuCssClass:             'slick-header-menu',
        optionsContainerCssClass:       'filter-options',
        textfilterContainerCssClass:    'textfilter',
        commandButtonsContainerClass:   'commands'
    };

    /*
    Based on SlickGrid Header Menu Plugin (https://github.com/mleibman/SlickGrid/blob/master/plugins/slick.headermenu.js)

    (Can't be used at the same time as the header menu plugin as it implements the dropdown in the same way)

    */


    function textFilter(menu, col){
        var 
            $li = $("<div class='slick-header-menuitem'></div>"),
            el_id = "columnfilter-" + col.id;

        function onInputValueChanged(e){
            var value = $(e.target).val();
            menu.filtervalue = value;
            col.filter(value);
        }

        $('<label for="' +el_id+ '">')
            .text('Filter:')
            .append($('<br/>'))
            .appendTo($li);

        $('<input type="text" id="' +el_id+ '">')
            .val(menu.filtervalue)
            .on('change', onInputValueChanged)
            .appendTo($li);

        return $li;
    }



    function HeaderFilter(options) {
        var grid;
        var self = this;
        var handler = new Slick.EventHandler();
        var $menu;


        function init(g) {
            options = $.extend(true, {}, HeaderFilter.defaults, options);
            grid = g;
            handler.subscribe(grid.onHeaderCellRendered, handleHeaderCellRendered)
                   .subscribe(grid.onBeforeHeaderCellDestroy, handleBeforeHeaderCellDestroy)
                   .subscribe(grid.onClick, handleBodyMouseDown)
                   .subscribe(grid.onColumnsResized, columnsResized);

            grid.setColumns(grid.getColumns());

            $(document.body).bind("mousedown", handleBodyMouseDown);
        }


        function destroy() {
            hideMenu();
            handler.unsubscribeAll();
            $(document.body).unbind("mousedown", handleBodyMouseDown);
        }

        function handleBodyMouseDown(e) {
            if ($menu && $menu[0] != e.target && !$.contains($menu[0], e.target)) {
                hideMenu();
            }
        }

        function hideMenu() {
            if ($menu) {
                $menu.remove();
                $menu = null;
            }
        }

        function handleHeaderCellRendered(e, args) {
            var column = args.column;
            if (column.filterable === false) return;

            var $el = $("<div></div>")
                .addClass("slick-header-menubutton")
                .data("column", column);

            if (options.buttonImage) {
                $el.css("background-image", "url(" + options.buttonImage + ")");
            }

            $el.bind("click", showFilter).appendTo(args.node);
        }

        function handleBeforeHeaderCellDestroy(e, args) {
            $(args.node)
                .find(".slick-header-menubutton")
                .remove();
        }

        function addMenuItem(menu, columnDef, title, command, image) {
            var $item = $("<div class='slick-header-menuitem'>")
                         .data("command", command)
                         .data("column", columnDef)
                         .bind("click", handleMenuItemClick)
                         .appendTo(menu);

            var $icon = $("<div class='slick-header-menuicon'>")
                         .appendTo($item);

            if (image) {
                $icon.css("background-image", "url(" + image + ")");
            }

            $("<span class='slick-header-menucontent'>")
                .text(title)
                .appendTo($item);
        }


        /*
         *  main filter popup.
         *  shown when pressing menubutton
         */
        function showFilter(e) {
            e.stopPropagation();
            e.preventDefault();

            var columnDef = $(this).data("column");
            columnDef.filterValues = columnDef.filterValues || [];
            getMenu().empty();

            /*
            if (options.sortMenuitems){
                addMenuItem($menu, columnDef, options.messages.sortAsc, 'sort-asc', options.sortAscImage);
                addMenuItem($menu, columnDef, options.messages.sortDesc, 'sort-desc', options.sortDescImage);
            }
            */

            //if (columnDef.textFilter){
            $('<div class="'+options.textfilterContainerCssClass+'">').appendTo($menu);
                createTextFilter(columnDef);
            //}

            $('<div class="'+options.optionsContainerCssClass+'">').appendTo($menu);
            createSelectOptionsFilter(columnDef, getFilterValues(columnDef) );

            $('<div class="'+options.commandButtonsContainerClass+'">').appendTo($menu);
            createCommandButtons(columnDef);

            var offset = $(this).offset();
            var left = offset.left - $menu.width() + $(this).width() - 8;

            $menu.css("top", offset.top + $(this).height())
                 .css("left", (left > 0 ? left : 0));

            $menu.find("."+options.textfilterContainerCssClass).find(":input").focus();
        }


        /*
         *  select listbox with all the available options
         *  showing only when item count is lower than options.maxItems
         */
        function createSelectOptionsFilter(columnDef, config){
            var items = config.items;
            //workingFilters is a copy of the filters to enable apply/cancel behaviour
            columnDef.workingFilters = columnDef.filterValues.slice();

            var $parent = getMenu().find('.'+options.optionsContainerCssClass);

            if ($parent.length === 0){
                throw new TypeError('$parent not found for select options. className: '+options.optionsContainerCssClass);
            }

            var info = config.overBoundary ?
                "> "+config.items.length :
                "showing "+ config.items.length;

            $parent.empty();

            $info = $('<span>').text(info).appendTo($parent);

            var filterOptions = "<label><input type='checkbox' value='-1' />("+options.messages.selectAll+")</label>";

            for (var i = 0; i < items.length; i++) {
                var filtered = _.contains(columnDef.workingFilters, items[i].value);

                filterOptions += "<label><input type='checkbox' value='" + i + "'" + 
                                (filtered ? " checked='checked'" : "") +
                                " data-filtervalue='"+ items[i].value +"'"+
                                "/>" + items[i].title + "</label>";
            }

            var $filter = $parent.append($(filterOptions));

            $(':checkbox', $filter).bind('click', function () {
                changeWorkingFilter(items, columnDef.workingFilters, $(this));
            });
        }


        function createCommandButtons(columnDef){
            var $parent = getMenu().find("."+options.commandButtonsContainerClass);

            if ($parent.length === 0){
                return;
                throw new TypeError('$parent not found for command buttons. className: '+options.commandButtonsContainerClass);
            }

            $('<button>'+options.messages.ok+'</button>')
                .appendTo($parent)
                .bind('click', function (ev) {
                    columnDef.filterValues = columnDef.workingFilters.splice(0);
                    setColumnFilterState(columnDef, columnDef.filterValues.length > 0 || isValue(columnDef.textFilterValue) );
                    handleApply(ev, columnDef);
                });

            $('<button>'+options.messages.clear+'</button>')
                .appendTo($parent)
                .bind('click', function (ev) {
                    columnDef.filterValues.length = 0;
                    columnDef.textFilterValue = null;
                    delete columnDef.workingFilters;
                    setColumnFilterState(columnDef, false);
                    handleApply(ev, columnDef);
                });

            $('<button>'+options.messages.cancel+'</button>')
                .appendTo($parent)
                .bind('click', hideMenu);
        }


        function createTextFilter(columnDef){
            var $menu = getMenu();
            var $parent = $menu.find("."+options.textfilterContainerCssClass);
            var value = columnDef.textFilterValue;

            $('<label>').text(options.messages.textFilter).appendTo($parent);

            $('<input type="text">')
                .val(value)
                .on('change', function(e){
                    var value = $(e.target).val();
                    columnDef.textFilterValue = isValue(value) ? value : null;
                    createSelectOptionsFilter(columnDef, getFilterValues(columnDef, value) );
                })
                .appendTo($parent);
        }



        function columnsResized() {
            hideMenu();
        }

        function changeWorkingFilter(filterItems, workingFilters, $checkbox) {
            var value = $checkbox.val();
            var $filter = $checkbox.parent().parent();

            if ($checkbox.val() < 0) {
                // Select All
                if ($checkbox.prop('checked')) {
                    $(':checkbox', $filter).prop('checked', true);
                    workingFilters = _.pluck(filterItems.slice(0), "value");
                } else {
                    $(':checkbox', $filter).prop('checked', false);
                    workingFilters.length = 0;
                }
            } else {
                var index = _.indexOf(workingFilters, filterItems[value].value);

                if ($checkbox.prop('checked') && index < 0) {
                    workingFilters.push(filterItems[value].value);
                }
                else {
                    if (index > -1) {
                        workingFilters.splice(index, 1);
                    }
                }
            }

            return workingFilters;
        }

        function setColumnFilterState(columnDef, isFiltered){
            columnDef.isFiltered = isFiltered;
            columnDef.filterPriority = _.filter(grid.getColumns(), isColumnFiltered).length-1;

            var idx = grid.getColumnIndex(columnDef.id);
            var 
                $button = getColumnHeader(columnDef.id).find('.'+options.menuButtonCssClass),
                image = "url(" + (isFiltered ? options.filterImage : options.buttonImage) + ")";

            $button.css("background-image", image);

            console.log(columnDef);
        }


        function handleApply(e, columnDef) {
            hideMenu();
            self.onFilterApplied.notify({ "grid": grid, "column": columnDef }, e, self);
            e.preventDefault();
            e.stopPropagation();
        }

        function sanitizeFilterValue(value, column, datacontext){
            var title = value;
            if (typeof value === 'undefined' || value === null || value === ''){
                title = options.messages.empty;
            }
            else if (value === false) {
                title = options.messages.falseDesc;
            }
            else if (value === true) {
                title = options.messages.trueDesc;
            }
            else if (column.textFormatter){
                title = column.getFormattedText(null, null, value, column, datacontext);
            }

            return { title: title, value: value };
        }


        function isColumnFiltered(column){
            return column.isFiltered;
        }


        function getFilterValues(column, value){
            if (value==null && column.textFilterValue != null){
                value = column.textFilterValue;
            }

            // if there's any filter applied then work only on subset
            if (isColumnFiltered(column) || _.any(grid.getColumns(), isColumnFiltered)){
                // Filter based on current dataView subset only
                console.log('subset');
                var dataView = grid.getData();
                return _getFilterValues(column, dataView.getLength(), function(i){ return dataView.getItem(i); }, value);                
            }
            else {
                // Filter based all available values
                console.log('all');
                var data = grid.getData().getItems();
                return _getFilterValues(column, data.length, function(i){ return data[i]; }, value);
            }
        }


        function _getFilterValues(column, len, next, filterValue){
            var seen = [], items = [], elem, v, row;
            var overBoundary = false;
            var shouldFilter = filterValue != null;

            function evalItem(item, row){
                v = sanitizeFilterValue( item, column, row );

                if (shouldFilter && v.title.toString().toLowerCase().indexOf(filterValue) === -1){
                    return;
                }

                if (!_.contains(seen, v.value)){
                    seen.push(v.value);
                    items.push(v);
                }

                if (items.length > options.maxItems){
                    overBoundary = true;
                }
            }

            for (var i=0; i<len; i++) {
                if (overBoundary){
                    break;
                }

                row = next(i);
                elem = row[column.field];

                if (_.isArray(elem)){
                    _.each(elem, function(p){ evalItem(p, row); });
                    continue;
                }

                evalItem( elem );
            }

            return {
                items: _.sortBy(items, function (v) { return v.title; }),
                overBoundary: overBoundary
            };
        }

        function handleMenuItemClick(e) {
            var command = $(this).data("command");
            var columnDef = $(this).data("column");

            hideMenu();

            self.onCommand.notify({
                "grid": grid,
                "column": columnDef,
                "command": command
            }, e, self);

            e.preventDefault();
            e.stopPropagation();
        }


        /***
         *  returns the header element for the given column ID
         */
        function getColumnHeader(columnId){
            var idx = grid.getColumnIndex(columnId);
            var $headers = $(grid.getContainerNode()).find('.slick-header > .slick-header-columns');

            return $headers.children().eq(idx);
        }

        /***
         *  returns the currently shown menu element
         */
        function getMenu(){
            if (!$menu) {
                $menu = $("<div class='slick-header-menu'>").appendTo(document.body);
            }
            return $menu;
        }


        function isValue(val){
            return typeof val !== 'undefined' && val !== null && val !== '';
        }


        $.extend(this, {
            "init": init,
            "destroy": destroy,
            "onFilterApplied": new Slick.Event(),
            "onCommand": new Slick.Event()
        });
    }
})(jQuery);