(function(h) {

    'use strict';

    /**
     * Class Delivery class widget
     *
     * @class DeliveryCalendarWidget
     * @augments {OrderWidget} orderWidget
     */
    function DeliveryCalendarWidget(orderWidget) {

        var self = this;

        orderWidget.prepareWidget(self);

        /**
         * Format date to yyyy-mm-dd
         *
         * @param {string} date
         * @returns {string}
         */
        self.formatDate = function(date) {
            var d = new Date(date),
                month = '' + (d.getMonth() + 1),
                day = '' + d.getDate(),
                year = d.getFullYear();

            if (month.length < 2) month = '0' + month;
            if (day.length < 2) day = '0' + day;

            return [year, month, day].join('-');
        };

        /**
         * Checking, that date is available for delivery
         *
         * @param {string} date
         * @returns {boolean}
         */
        self.isAvailableDate = function(date) {
            var formatter_date = date.format('YYYY-MM-DD');
            if (h(self.params.whitelist_dates).inArray(formatter_date)) {

                return true;
            }
            if (h(self.params.closed_dates).inArray(formatter_date) ||
                h(self.params.blackout_dates).inArray(formatter_date)) {
                return false;
            }

            var formatted_day = date.format('dddd');
            if (h(self.params.closed_days).inArray(formatted_day)) {
                return false;
            }

            return true;
        };

        /**
         * Get vendor today date
         *
         * @param {boolean=} formatted_date
         * @returns {string}
         */
        self.getTodayDate = function (formatted_date) {
            if ((typeof formatted_date !== 'undefined') && formatted_date) {
                return self.params.vendor_today_date;
            }
            return moment(self.params.vendor_today_date);
        };

        /**
         * Get next day
         *
         * @param {Object} date
         * @returns {Object}
         */
        self.getNextDate = function (date) {
            date = date.add(1, 'days');
            return date;
        };

        /**
         * Get next available day
         *
         * @param {Object} date
         * @returns {Object}
         */
        self.getNextAvailableDate = function (date) {
            var next_date = self.getNextDate(date);
            if (!self.isAvailableDate(next_date)) {
                var current_iteration = self.getCurrentSearchIteration();
                if (current_iteration > self.getMaxSearchIteration()) {
                    self.resetCurrentSearchIteration();
                    return false;
                } else {
                    self.setCurrentSearchIteration(current_iteration + 1);
                }
                return self.getNextAvailableDate(date);
            }

            return date;
        };

        /**
         * Get current delivery date
         *
         * @returns {*}
         */
        self.getDeliveryDate = function () {
            return h(self.elements.delivery_date).getValue();
        };

        /**
         * Get current fee widget
         *
         * @returns {DeliveryFeeWidget|boolean}
         */
        self.getFeeWidget = function() {
            if (!self.getOrderWidget()) {

                return false;
            }

            var feeWidget = self.getOrderWidget().params.widgets.DeliveryFeeWidget;
            if (!feeWidget) {

                return false;
            }

            return feeWidget;
        };

        /**
         * Change current delivery date
         *
         * @param value
         */
        self.setDeliveryDate = function (value) {
            var isChanged = self.params.prev_delivery_date != value;
            self.params.prev_delivery_date = value;
            h(self.elements.delivery_date)
                .setValue(value)
                .triggerEvent('change');
            if (self.events && (typeof self.events.change_date === 'function')) {
                self.events.change_date(self, value);
            }

            if (isChanged && value && self.getFeeWidget()) {
                self.getFeeWidget().updateDeliveryFee();
            }
        };

        /**
         * Check if there is chosen today delivery option which is disabled
         *
         * @returns {boolean}
         */
        self.isChosenDisabledTodayDelivery = function() {
            if (!self.canDeliveryToday() && self.isChosenDeliveryToday()) {
                return true;
            }

            // Hide possible error messages in case if we didn't get the error situation with today delivery
            self.hideMessage();

            return false;
        };

        /**
         * Check if there is chosen pickup only day
         *
         * @returns {boolean}
         */
        self.isChosenPickupOnlyDay = function() {
            var deliveryDate = self.getDeliveryDate();
            deliveryDate = self.formatDate(deliveryDate)

            if (h(self.params.pickup_only_dates).inArray(deliveryDate)) {
                return true;
            }

            return false;
        };

        self.isStorePickupEnabled = function() {
            return self.params.pickup_only_dates.length;
        };

        self.applyPickupOnlyRules = function() {
            if (self.getOrderWidget().isDeliveryOnlyOrdering()) {
                if (self.isChosenPickupOnlyDay()) {
                    if (h('.orderForm-checkout .buttonContainer--order .orderForm-order-now').getElement()) {
                        h('.orderForm-checkout .buttonContainer--order .orderForm-order-now').getElement().innerText = 'Temporarily Unavailable';
                        h('.orderForm-checkout .buttonContainer--order .orderForm-order-now').getElement().disabled = true;
                    } else if (h('#orderForm .order_submitBtn').getElement()) {
                        h('#orderForm .order_submitBtn').getElement().innerText = 'Temporarily Unavailable';
                        h('#orderForm .order_submitBtn').getElement().disabled = true;
                    }
                } else {
                    if (h('.orderForm-checkout .buttonContainer--order .orderForm-order-now').getElement()) {
                        h('.orderForm-checkout .buttonContainer--order .orderForm-order-now').getElement().innerText = 'Order Now';
                        h('.orderForm-checkout .buttonContainer--order .orderForm-order-now').getElement().disabled = false;
                    } else if (h('#orderForm .order_submitBtn').getElement()) {
                        h('#orderForm .order_submitBtn').getElement().innerText = 'Order Now';
                        h('#orderForm .order_submitBtn').getElement().disabled = false;
                    }
                }
            } else {
                if (self.isChosenPickupOnlyDay()) {
                    h('#pickup-only-widget').show();
                    h('#pickup-only-widget').getElement().style.display = 'block';
                    h('#delivery-fee-widget').hide();
                    h(self.elements.pickup_only).setValue(1);
                } else {
                    h('#pickup-only-widget').hide();
                    h('#delivery-fee-widget').show();
                    h(self.elements.pickup_only).setValue(0);
                }
            }
        };

      /**
       * If user already selected date from SERP, display a button next to calendar with selected date
       */
        self.onSelectCalendarDateWithPreselectedDate = function() {
            if (self.isChosenDisabledTodayDelivery()) {
                return;
            }

            var date = self.getDeliveryDate(),
                dateButton = self.getDateButton(),
                date = moment(date);

            self.setButtonText(dateButton, self.buttons.default, {moment_date: date});
            self.setDeliveryDate(self.getDeliveryDate());

            if (self.isStorePickupEnabled()) {
                self.applyPickupOnlyRules();
            }
            if (document.activeElement.classList.contains('datepickr-day')) {
                const orderFormSubmitButton = h('#orderForm .order_submitBtn').getElement();
                if (orderFormSubmitButton) {
                    orderFormSubmitButton.focus()
                }
            }
        };

        /**
         * Event: on select date in calendar
         */
        self.onSelectCalendarDate = function() {
            if (self.isChosenDisabledTodayDelivery()) {
                return;
            }

            var date = self.getDeliveryDate();

            if (self.selectSwitchButton(date, false)) {
                self.resetCalendarButtonText({moment_date: date});
            } else {
                var button = self.getCalendarButton(),
                    date = moment(date);

                self.setCalendarButtonText({moment_date: date});
                h(button).addClass(self.params.switcher_options.active_class);
            }
            self.setDeliveryDate(self.getDeliveryDate());

            if (self.isStorePickupEnabled()) {
                self.applyPickupOnlyRules();
            }
            if (document.activeElement.classList.contains('datepickr-day')) {
                const orderFormSubmitButton = h('#orderForm .order_submitBtn').getElement();
                if (orderFormSubmitButton) {
                    orderFormSubmitButton.focus()
                }
            }
        };

        /**
         * Event: on click by switch button
         */
        self.onClickSwitchButton = function(e) {
            var date = h(this).getData('date'),
                button = self.getSwitcherButtonByDate(date);

            if (self.isChosenDisabledTodayDelivery()) {
                return;
            }

            if (date && (!h(button).hasClass(self.params.switcher_options.disabled_class) ||
                    h(button).hasClass(self.params.switcher_options.calendar_button_class))) {
                self.resetCalendarButtonText({moment_date: date});
                self.selectSwitchButton(date, true);
                self.setDeliveryDate(date);
            }

            if (self.isStorePickupEnabled()) {
                self.applyPickupOnlyRules();
            }
        };

        /**
         * Reset current iteration for searching next available day
         */
        self.resetCurrentSearchIteration = function() {
            self.setCurrentSearchIteration(0);
        };

        /**
         * Set current iteration for searching next available day
         */
        self.setCurrentSearchIteration = function(iteration) {
            self.params.switcher_options.current_search_iteration = iteration;
        };

        /**
         * Get current iteration for searching next available day
         *
         * @returns {number}
         */
        self.getCurrentSearchIteration = function() {
            return self.params.switcher_options.current_search_iteration;
        };

        /**
         * Get max iteration for searching next available day
         *
         * @returns {number}
         */
        self.getMaxSearchIteration = function() {
            return self.params.switcher_options.max_search_iteration;
        };

        /**
         * Get switcher buttons
         *
         * @returns {Array|boolean}
         */
        self.getSwitcherButtons = function () {
            return h(self.elements.switcher).findAll(self.params.selectors.switcher_option);
        };

        /**
         * Get switcher button by date
         *
         * @param {(string|Object)} date
         * @returns {(boolean|Object)}
         */
        self.getSwitcherButtonByDate = function(date) {
            var switch_buttons = self.getSwitcherButtons();

            if (h.isObject(date)) {
                date = date.format('MM/DD/YYYY');
            }

            for (var key in switch_buttons) {
                var button = switch_buttons[key];
                if (h(button).getData('date') == date) {
                    return button;
                }
            }

            return false;
        };

        /**
        * Get static date button
        */
        self.getDateButton = function() {
            var buttons = self.getSwitcherButtons();

            if (h(buttons).isObject() && buttons.length) {
                return h(buttons).find('.' + self.params.switcher_options.date_button_class);
            }

            return false;
        };

        /**
         * Get calendar button
         *
         * @returns {Object}
         */
        self.getCalendarButton = function () {
            var buttons = self.getSwitcherButtons();

            if (h(buttons).isObject() && buttons.length) {
                return h(buttons).find('.' + self.params.switcher_options.calendar_button_class);
            }

            return false;
        };

        /**
         * Get today button
         *
         * @returns {Object}
         */
        self.getTodayButton = function () {
            var buttons = self.getSwitcherButtons();

            if (self.params.switcher_options.use_today_button && h(buttons).isObject() && buttons.length) {
                return h(buttons).find('.' + self.params.switcher_options.today_button_class);
            }

            return false;
        };

        /**
         * Check if chosen delivery is today
         *
         * @param chosenDay
         */
        self.isChosenDeliveryToday = function (chosenDay) {
            var day = typeof chosenDay !== 'undefined' ? chosenDay : self.getDeliveryDate();
            if (day && day === self.getTodayDate().format('MM/DD/YYYY')) {
                return true;
            }

            return false;
        };

        /**
         * Disable today delivery
         */
        self.disableTodayDelivery = function () {
            var todayButton = h(self.getTodayButton()),
                todayDate = self.getTodayDate();

            if (self.isChosenDeliveryToday()) {
                self.showMessage(self.getOrderWidget().messages.delivery_not_available, {zip: self.getOrderWidget().getZip()});
                self.setCalendarButtonText({}, 'init');
            }

            if (todayButton) {
                todayButton.addClass(self.params.switcher_options.disabled_class);
                if (todayButton.hasClass(self.params.switcher_options.active_class)) {
                    todayButton.removeClass(self.params.switcher_options.active_class);

                    // notify user that cutoff as passed
                    if (typeof notification !== 'undefined' && notification instanceof Object) {
                        notification.showError(self.getMessage());
                    }
                }
            }
            self.setSwitcherAriaLabel(todayButton, self.getUnavailableAriaLabel(todayDate));
            todayDate.add(1, 'days');
            self.params.min_available_date = todayDate.valueOf();
        };

        /**
         * Enable today delivery
         */
        self.enableTodayDelivery = function () {
            var todayButton = h(self.getTodayButton());
            todayButton.removeClass(self.params.switcher_options.disabled_class);

            self.params.min_available_date = self.getTodayDate().valueOf();
        };

        /**
         * Checking availability for delivery today
         *
         * @returns {boolean}
         */
        self.canDeliveryToday = function () {
            var date = self.getTodayDate(),
                is_available_date = self.isAvailableDate(date),
                cutoff_moment = moment(self.params.cutoff_timestamp).tz(self.params.vendor_timezone),
                now_moment = moment().tz(self.params.vendor_timezone);

            return self.params.today_delivery_available && is_available_date
                && (cutoff_moment.diff(now_moment) > 0) && (now_moment.diff(date) > 0);
        };

        /**
         * Prepare switcher when there's a pre-selected delivery date
         */
        self.preparePreselectedSwitcher = function () {
            self.elements.switcher = h.find(self.elements.switcher);
            if (h(self.elements.switcher).isObject()) {
                var html = '';

                var date_button = h.convertHtmlToElement(self.buttons.default.template);
                h(date_button)
                    .addClass(self.params.switcher_options.date_button_class)
                    .addClass(self.params.switcher_options.active_class);
                date_button.id = 'date_button--js';
                html += h(date_button).getOuterHtml() + "\r\n";

                var calendar_button = h.convertHtmlToElement(self.buttons.calendar.template);
                h(calendar_button).addClass(self.params.switcher_options.calendar_button_class);

                calendar_button.id = "switcher_option--calendar";

                html += h(calendar_button).getOuterHtml();
                h(self.elements.switcher).setHtml(html);
            }
        };

        /**
         * Prepare switcher
         */
        self.prepareSwitcher = function () {
            self.elements.switcher = h.find(self.elements.switcher);
            if (h(self.elements.switcher).isObject()) {
                var html = '';

                if (self.params.switcher_options.use_today_button) {
                    var today_button = h.convertHtmlToElement(self.buttons.today.template);
                    h(today_button).addClass(self.params.switcher_options.today_button_class);
                    html += h(today_button).getOuterHtml() + "\r\n";
                }

                var calendar_button = h.convertHtmlToElement(self.buttons.calendar.template);
                h(calendar_button).addClass(self.params.switcher_options.calendar_button_class);

                calendar_button.id = "switcher_option--calendar";

                for (var i = 0; i < self.params.switcher_options.count_default_buttons; i++) {
                    html += self.buttons.default.template + "\r\n";
                }
                html += h(calendar_button).getOuterHtml();
                h(self.elements.switcher).setHtml(html);
            }
        };

      /**
       *
       * @param {object} element
       * @returns {object} element
       */
        self.getSwitcherOptionWrapper = function (element) {
            return element.find('.switcher_option_wrapper')
        };

      /**
       *
       * @param {object} element
       * @param {string} label
       */
        self.setAriaLabel = function (element, label) {
            element.setAttribute('aria-label', label)
        };

      /**
       *
       * @param {object} date js date object
       * @returns {string} label
       */
        self.getAvailableAriaLabel = function (date) {
            return 'Choose ' + h.getFullDateString(date) + ' for your delivery date. It\'s available';
        };

      /**
       *
       * @param date
       * @returns {string}
       */
        self.getUnavailableAriaLabel = function (date) {
            return h.getFullDateString(date) + ' is not available for delivery.';
        };

      /**
       *
       * @param {object} element
       * @param {string} label
       */
        self.setSwitcherAriaLabel = function (element, label) {
            if (element.hasClass(self.params.switcher_options.date_button_class)) {
                let $button = self.getSwitcherOptionWrapper(element);
                self.setAriaLabel($button, label)
            }
        };

      /**
       * set Aria label for preselected date
       */
      self.setPreselectedAriaLabel = function () {
            var date_button_class = self.params.switcher_options.date_button_class;
            var active_button_class = self.params.switcher_options.active_class;
            var button = h(self.elements.widget).find('.' + date_button_class + '.' + active_button_class);
            self.setSwitcherAriaLabel(h(button), self.getAvailableAriaLabel(self.params.delivery_date));
        };

        /**
         * Set text for "today" button
         *
         * @param {Object} params
         * @param {string=} message_type
         */
        self.setTodayButtonText = function(params, message_type) {
            var button = self.getTodayButton();
            self.setButtonText(button, self.buttons.today, params, message_type);
        };

        /**
         * Set text for "calendar" button
         *
         * @param {Object} params
         * @param {string=} message_type
         */
        self.setCalendarButtonText = function(params, message_type) {
            var button = self.getCalendarButton();
            self.setButtonText(button, self.buttons.calendar, params, message_type);
        };

        /**
         * Reset text for "calendar" button
         *
         * @param {Object} params
         */
        self.resetCalendarButtonText = function (params) {
            self.setCalendarButtonText(params, 'reset');
        };

        /**
         * Set text for default button
         *
         * @param {Object} button
         * @param {Object} params
         * @param {string=} message_type
         */
        self.setDefaultButtonText = function(button, params, message_type) {
            self.setButtonText(button, self.buttons.default, params, message_type);
        };

        /**
         * Set text for button
         *
         * @param {Object} button
         * @param {Object} button_options
         * @param {Object} params
         * @param {string=} message_type
         */
        self.setButtonText = function (button, button_options, params, message_type) {
            if (h(button).isObject()) {
                var wrapper = h(button).find(button_options.selector_wrapper),
                    message = '';

                if (typeof message_type !== 'undefined') {
                    message = button_options.message[message_type];
                    if (!h.isObject(message)) {
                        message = button_options.message.init;
                    }
                } else {
                    message = button_options.message.default;
                }

                if (!h.isObject(message)) {
                    message = {
                        text: ''
                    }
                }

                if (h.isObject(params)) {
                    var date = params.moment_date;
                    if (date && h.isObject(message.date_format)) {
                        for (var key in message.date_format) {
                            var date_format = message.date_format[key];
                            params[key] = date.format(date_format);
                        }
                    }
                    h(wrapper).setMessage(message.text, params);
                } else {
                    h(wrapper).setMessage(message.text);
                }
            }
        };

        /**
         * Select switch button by date
         *
         * @param {string} date
         * @returns {boolean}
         */
        self.selectSwitchButton = function(date) {
            var switch_buttons = self.getSwitcherButtons(),
                is_selected = false;

            for (var key in switch_buttons) {
                var button = switch_buttons[key];
                h(button).removeClass(self.params.switcher_options.active_class);
                if (h(button).getData('date') == date) {
                    h(button).addClass(self.params.switcher_options.active_class);
                    is_selected = true;
                }
            }

            return is_selected;
        };

        /**
         * Update widget
         *
         * @param {Object} params
         */
        self.update = function (params) {
            h.setOptions(self.params, params);
            var switch_buttons = self.getSwitcherButtons(),
                date = self.getTodayDate();

            for (var key in switch_buttons) {
                var button = switch_buttons[key];
                if (!h(button).hasClass(self.params.switcher_options.calendar_button_class) && date) {
                    if (h(button).hasClass(self.params.switcher_options.today_button_class)) {
                        self.setTodayButtonText({moment_date: date});
                    } else {
                        self.setDefaultButtonText(button, {moment_date: date});
                    }
                    h(button).setData('date', date.format('MM/DD/YYYY'));
                    self.resetCurrentSearchIteration();
                    self.setSwitcherAriaLabel(h(button), self.getAvailableAriaLabel(date));
                    date = self.getNextAvailableDate(date);
                }
            }

            if (self.params.delivery_date) {
                self.setCalendarButtonText(params, 'preselectedDate');
            } else {
                self.setCalendarButtonText(params, 'init');
            }

            if (self.canDeliveryToday()) {
                self.enableTodayDelivery();
            } else {
                self.disableTodayDelivery();
            }

            var closedDates = self.params.closed_dates;
            closedDates.concat(self.elements.blackout_dates);
            closedDates = h.removeArrayDuplicates(closedDates);

            // Creates a lightweight datepickr object
            if (self.elements.datepickr) {
                self.datepickr = datepickr(self.elements.datepickr, {
                    dateFormat: 'm/d/Y',
                    altInput: self.elements.delivery_date,
                    altFormat: 'm/d/Y',
                    minDate: self.params.min_available_date,
                    maxDate: self.getTodayDate().add(1, 'year').valueOf(),
                    omitDays: self.params.closed_days,
                    omitDates: closedDates,
                    activeDates: self.params.whitelist_dates
                });
            }

            if (self.params.datepickr_wrapper_class) {
                var wrapper = h(self.elements.widget).find('.datepickr-wrapper');
                h(wrapper).addClass(self.params.datepickr_wrapper_class);
            }

            if (self.getDeliveryDate()) {
                if (self.params.delivery_date) {
                    self.setPreselectedAriaLabel();
                    self.onSelectCalendarDateWithPreselectedDate();

                } else {
                    self.onSelectCalendarDate();
                }
            }
            self.debug('Calendar widget (update)', self);
        };

        /**
         * Re init widget
         *
         */
        self.reinit = function() {
            return self.init(self.initial_options);
        };

        /**
         * key event for select calendar picker with enter
         */
        self.onSelectWithEnter = function(e) {
              var datepickrWrapper = document.querySelector('.datepickr-wrapper');
              if (e.key === 'Enter') {
                  datepickrWrapper.classList.toggle('open');
              }
        };

        /**
         * Init widget
         *
         * @param opts
         */
        self.init = function (opts) {
            var defaultOpts = {
                datepickr: null,
                elements: {},
                buttons: {
                    default: {
                        template:
                            '<li class="switcher_option date-button">' +
                                '<span class="switcher_option_btn_wrapper"><button type="button" class="switcher_option_wrapper"></button></span>' +
                            '</li>',
                        selector_wrapper: 'span button',
                        message: {
                            default: {
                                text: '<span class="weekday">{row_top}</span><span class="date">{row_bottom}</span>',
                                date_format: {
                                    row_top: 'ddd',
                                    row_bottom: 'MMM D'
                                }
                            }
                        }
                    },
                    today: {
                        template:
                            '<li class="switcher_option date-button">' +
                                '<span class="switcher_option_btn_wrapper"><button type="button" class="switcher_option_wrapper"></button></span>' +
                            '</li>',
                        selector_wrapper: 'span button',
                        message: {
                            default: {
                                text: '<span class="weekday">Today</span><span class="date">{row_bottom}</span>',
                                date_format: {
                                    row_bottom: 'MMM D'
                                }
                            }
                        }
                    },
                    calendar: {
                        template:
                            '<li class="switcher_option date-button">' +
                                '<span class="js-open-calendar switcher_option_btn_wrapper">' +
                                    '<button type="button" class="switcher_option_wrapper calendar" aria-label="Choose delivery date"></button>' +
                                '</span>' +
                                '<input id="datepickr" type="text" name="delivery" value="" readonly tabindex="-1"/>' +
                            '</li>',
                        selector_wrapper: 'span button',
                        message: {
                            init: {
                                text: '<span class="top">Full</span><br><span class="bottom">Calendar</span>'
                            },
                            preselectedDate: {
                                text: '<span class="top">Change</span><br><span class="bottom">Date</span>'
                            },
                            default: {
                                text: '<span class="top">{row_top}</span><br><span class="bottom">{row_bottom}</span>',
                                date_format: {
                                    row_top: 'ddd',
                                    row_bottom: 'MMM D'
                                }
                            },
                            reset: {
                                text: '<span class="top">Full</span><br><span class="bottom">Calendar</span>'
                            }
                        }
                    }
                },
                params: {
                    vendor_timezone: 'America/Los_Angeles',
                    selectors: {
                        switcher_option: '.switcher_option'
                    },
                    switcher_options: {
                        count_default_buttons: 2,
                        use_today_button: true,
                        today_button_class: 'today-button',
                        calendar_button_class: 'calendar-button',
                        date_button_class: 'date-button',
                        active_class: 'active',
                        disabled_class: 'disabled',
                        max_search_iteration: 100,
                        current_search_iteration: 0
                    },
                    datepickr_wrapper_class: 'after',
                    blackout_dates: [],
                    whitelist_dates: [],
                    closed_days: [],
                    closed_dates: [],
                    pickup_only_dates: [],
                    min_available_date: 0,
                    delivery_date: false
                }
            };

            h.setOptions(self, defaultOpts);
            self.initial_options = opts;
            h.setOptions(self, opts);
            self.params.vendor_timezone = self.prepareVendorTimeZone(self.params.vendor_timezone);

            if (self.params.delivery_date) {
                self.preparePreselectedSwitcher();
            } else {
                self.prepareSwitcher();
            }

            h.convertOptionsToElements(self.elements);

            // Set events
            if (self.params.delivery_date) {
                h(window).setEvent('datepickrSelectDate', self.onSelectCalendarDateWithPreselectedDate);
            } else {
                h(window).setEvent('datepickrSelectDate', self.onSelectCalendarDate);
            }
            var switch_buttons = self.getSwitcherButtons();
            for (var key in switch_buttons) {
                var switch_button = switch_buttons[key];
                h(switch_button).setEvent('click', self.onClickSwitchButton);
            }

            var calendar = document.querySelector('.calendar');
            h(calendar).setEvent('keydown', self.onSelectWithEnter);

            return self;
        };

    }

    return window.DeliveryCalendarWidget = DeliveryCalendarWidget;

} (BnHelper));
