(function(h) {

    'use strict';

    /**
     * Class Delivery fee widget
     *
     * @class DeliveryFeeWidget
     * @augments {OrderWidget} orderWidget
     */
    function DeliveryFeeWidget (orderWidget) {

        var self = this;

        orderWidget.prepareWidget(self);

        /**
         * Set message using response
         *
         * @param {Object} response
         */
        self.setMessageByResponse = function (response) {
            if (response) {
                h(self.elements.message).show();
                if(response.zip) {
                    var message = '';
                    self.getOrderWidget().setZip(response.zip);
                    if (!response.delivery) {
                        if (response.zone_disabled) {
                            message = self.messages.zone_disabled;
                        } else if (response.box) {
                            message = self.messages.box_not_found;
                        } else {
                            message = self.messages.not_found;
                        }
                        h(self.elements.message).setMessage(message || self.messages.not_found, response);
                    } else if (response.fee) {
                        message = response.box ? self.messages.box_found : self.messages.found;
                        response.fee = h.formatPrice(response.fee, 2, false);
                        h(self.elements.message).setMessage(message || self.messages.found, response);
                    } else {
                        if (self.messages.found_and_free) {
                            message = response.box ? self.messages.box_found_and_free : self.messages.found_and_free;
                            h(self.elements.message).setMessage(message || self.messages.found_and_free, response);
                        } else {
                            message = response.box ? self.messages.box_not_found : self.messages.not_found;
                            h(self.elements.message).setMessage(message || self.messages.not_found, response);
                        }
                    }
                    if (self.elements.show_zip_check_button && self.params.show_zip_check_button.text_after_submit) {
                        self.elements.show_zip_check_button.text = self.params.show_zip_check_button.text_after_submit;
                    }
                } else {
                    h(self.elements.message).setMessage(self.messages.initial);
                }
            }
        };

        /**
         * Hide message
         */
        self.hideMessage = function() {
            h(self.elements.message).hide();
        };

        /**
         * Validate zip code
         *
         * @param {string} zip
         * @returns {boolean}
         */
        self.validateZip = function(zip) {
            return /^\d{5}$/.test(String(zip));
        };

        /**
         * Get current calendar widget
         *
         * @returns {DeliveryCalendarWidget|boolean}
         */
        self.getCalendarWidget = function() {
            if (!self.getOrderWidget()) {

                return false;
            }

            var calendarWidget = self.getOrderWidget().params.widgets.DeliveryCalendarWidget;
            if (!calendarWidget) {

                return false;
            }

            return calendarWidget;
        };

        /**
         * Update a delivery widgets (calendar, timer) after getting response
         *
         * @param {Object} response
         */
        self.updateDeliveryWidgets = function(response) {
            var order_widget = self.getOrderWidget();
            if (order_widget) {
                var calendar_widget = order_widget.params.widgets.DeliveryCalendarWidget;
                if (calendar_widget) {
                    calendar_widget.update({
                        today_delivery_available: response.same_day_available,
                        cutoff_timestamp: response.cutoff_timestamp
                    });
                }
                var timer_widget = order_widget.params.widgets.DeliveryTimerWidget;
                if (timer_widget) {
                    if (!response.same_day_available) {
                        timer_widget.stop();
                    } else {
                        timer_widget.start(response.cutoff_timestamp);
                    }
                }
            }
        };

        /**
         * Ajax callback
         *
         * @param {(string|Object)} response
         * @param {string} zip
         * @private
         */
        self._ajaxCallback = function(response, zip) {
            if (typeof response === 'string') {
                response = JSON.parse(response);
            }
            if ((typeof response == 'object') && response.success) {
                response.zip = zip;
                if (self.elements.zip_input) {
                    h(self.elements.zip_input).setValue(zip);
                }
                self.setMessageByResponse(response);
                self.updateDeliveryWidgets(response);
            } else {
                h(self.elements.message).setMessage(self.messages.error);
            }

            self.afterSendRequest(response);
            if (self.events && (typeof self.events.after_ajax === 'function')) {
                self.events.after_ajax(response);
            }
        };

        /**
         * Event: after sending request
         *
         * @param {Object} response
         */
        self.afterSendRequest = function(response)
        {

        };

        /**
         * Event: before sending request
         *
         * @param {Object}
         */
        self.beforeSendRequest = function()
        {
            self.hideCheckZipBox();
            if (self.elements.show_zip_check_button && self.params.show_zip_check_button.text_after_submit) {
                self.elements.show_zip_check_button.text = self.params.show_zip_check_button.text_after_submit;
            }
        };

        /**
         * Send request for checking zip code
         *
         * @param {string} zip
         */
        self.checkZipForDeliveryRequest = function(zip) {
            self.beforeSendRequest();
            if (self.events && (typeof self.events.before_ajax === 'function')) {
                self.events.before_ajax();
            }

            var data = self.params.ajax.data;
            data.zip = zip;

            var orderWidget = self.getCalendarWidget();
            if (orderWidget) {
                data.delivery_date = orderWidget.getDeliveryDate();
            }

            h.ajax(
                self.params.ajax.url,
                data,
                function(response) {
                    self._ajaxCallback(response, zip);
                },
                function(xhr, errorThrown, textStatus) {
                    h(self.elements.message).setMessage(self.messages.error);
                    if (self.events && (typeof self.events.error_ajax === 'function')) {
                        self.events.error_ajax();
                    }
                }
            );
        };

        /**
         * Validate zip code and send request
         */
        self.sendRequest = function() {
            var zip = h(self.elements.zip_input).getValue();
            if (self.elements.zip_input && zip) {
                if (self.validateZip(zip)) {
                    self.checkZipForDeliveryRequest(zip);
                }
            }
        };

        /**
         * Send request to update delivery fee
         */
        self.updateDeliveryFee = function() {
            var zip = h(self.elements.zip_input).getValue();
            if (!zip) {
                zip = self.getOrderWidget().getZip();
            }

            if (self.validateZip(zip)) {
                self.checkZipForDeliveryRequest(zip);
            }
        };

        /**
         * Show box with zip input
         */
        self.showCheckZipBox = function () {
            if (self.elements.zip_check && self.elements.show_zip_check_button && self.elements.zip_input) {
                h(self.elements.zip_check).show();
                h(self.elements.show_zip_check_button).hide();
            }
        };

        /**
         * Hide box with zip input
         */
        self.hideCheckZipBox = function () {
            if (self.elements.zip_check && self.elements.show_zip_check_button) {
                setTimeout(function() {
                    h(self.elements.zip_check).hide();
                    h(self.elements.show_zip_check_button).show();
                }, 100);
            }
        };

        /**
         * Event: on key press in zip input
         *
         * @param {Object} evt
         */
        self.onKeyPressZipInput = function (evt) {
            if (evt.which == 13 || evt.keyCode == 13){
                evt.preventDefault();
                self.sendRequest();
            }
        };

        /**
         * Event: on click by submit button
         *
         * @param evt
         */
        self.onClickSubmitButton = function(evt) {
            evt.preventDefault();
            self.sendRequest();
        };

        /**
         * Event: on click by button for showing Check Zip Box
         *
         * @param evt
         */
        self.onClickShowZipCheckButton = function(evt) {
            evt.preventDefault();
            self.showCheckZipBox();
        };

        /**
         * Init widget
         *
         * @param opts
         */
        self.init = function (opts) {
            var defaultOpts = {
                elements: {},
                events: {},
                ajax: {
                    data: {}
                },
                messages: {
                    initial: 'Add a zip code for delivery details',
                    found: '${fee} Hand delivery for {zip}',
                    box_found: 'Shipping starting from ${fee} for {zip}',
                    found_and_free: 'FREE Hand delivery for {zip}',
                    box_found_and_free: 'Shipping starting from $0.00 for {zip}',
                    not_found: 'Oh no! The florist does not deliver to {zip}',
                    box_not_found: 'Oh no! The florist does not ship to {zip}',
                    zone_disabled: 'Oh no! The florist does not deliver to {zip} on your selected date. Try another day.',
                    error: 'Unknown error, please try again later.'
                },
                params: {
                    show_zip_check_button: {
                        text_before_submit: 'Add zip',
                        text_after_submit: 'Change zip'
                    }
                }
            };

            self.initWidget(self, defaultOpts, opts);

            // Event Listeners
            h(self.elements.submit_button).setEvent('click', self.onClickSubmitButton);
            h(self.elements.zip_input).setEvent('keypress', self.onKeyPressZipInput);
            h(self.elements.show_zip_check_button).setEvent('click', self.onClickShowZipCheckButton);

            return self;
        };
    }

    return window.DeliveryFeeWidget = DeliveryFeeWidget;

} (BnHelper));