(function(h) {

    'use strict';

    /**
     * Class Order widget
     *
     * @class OrderWidget
     */
    function OrderWidget () {

        var self = this;

        /**
         * Global functions, that will be set to widgets in prepareWidget()
         */
        self.global_functions = {

            /**
             * Get order widget
             *
             * @returns {OrderWidget}
             */
            getOrderWidget: function() {
                return self.order_widget;
            },

            /**
             * Debug
             *
             * @param {string} title
             * @param {string} message
             */
            debug: function(title, message) {
                if (self.getOrderWidget() && self.getOrderWidget().params.debug_mode) {
                    h.debug(title, message);
                }
            },

            /**
             * Get type of widget
             *
             * @param {Object} widget
             * @returns {string}
             */
            getWidgetType: function (widget) {
                return h.getObjectType(widget);
            },

            /**
             * Prepare timezone of vendor
             *
             * @param {string} timezone
             * @returns {string}
             */
            prepareVendorTimeZone: function(timezone)
            {
                var new_timezone = timezone;
                switch (timezone) {
                    case 'CST':
                        new_timezone = 'America/Chicago';
                        break;
                    case 'PST':
                        new_timezone = 'America/Los_Angeles';
                        break;
                    case 'AKST':
                        new_timezone = 'America/Anchorage';
                        break;
                }

                if (!new_timezone) {
                    new_timezone = 'America/Los_Angeles';
                }

                return new_timezone;
            },

            /**
             * Check if the pickup only ordering is activated
             *
             * @returns {boolean}
             */
            isPickupOnlyOrdering: function()
            {
                if (typeof self.elements.pickup_only !== 'object') {
                    return false;
                }

                return !!parseInt(h(self.elements.pickup_only).getValue());
            },

            /**
             * Check if the delivery only ordering is activated
             *
             * @returns {boolean}
             */
            isDeliveryOnlyOrdering: function()
            {
                if (typeof self.elements.delivery_only !== 'object') {
                    return false;
                }

                return !!parseInt(h(self.elements.delivery_only).getValue());
            },

            /**
             * Init widget using options
             *
             * @param {Object} widget
             * @param {Object} defaultOpts
             * @param {Object=} opts
             */
            initWidget: function(widget, defaultOpts, opts) {
                h.setOptions(widget, defaultOpts);
                h.setOptions(widget, opts);
                h.convertOptionsToElements(widget.elements);

                self.debug('init ' + self.getWidgetType(widget), widget);
            },

            /**
             * Get message
             *
             */
            getMessage: function() {
                return h(self.elements.message).value;
            },

            /**
             * Show message
             *
             * @param {string} msg
             * @param {Object=} replace
             */
            showMessage: function(msg, replace) {
                h(self.elements.message)
                    .setMessage(msg, replace)
                    .show();
            },

            /**
             * Hide message
             *
             */
            hideMessage: function() {
                h(self.elements.message).hide();
            },

            /**
             * Set zip code
             *
             * @param {string} zip code
             */
            setZip: function(zip) {
                if (self.getOrderWidget()) {
                    self.getOrderWidget().params.zip = zip;
                }
            },

            /**
             * Get zip code
             *
             */
            getZip: function() {
                if (self.getOrderWidget()) {
                    return self.getOrderWidget().params.zip;
                }

                return null;
            }
        };

        /**
         * Copy methods from self.global_functions to widget
         *
         * @param widget
         */
        self.prepareWidget = function(widget) {
            if (widget && (typeof self.global_functions == 'object')) {
                for (var key in self.global_functions) {
                    widget[key] = self.global_functions[key];
                }
                widget.order_widget = self;

                if (self.params) {
                    var widget_type = self.getWidgetType(widget);
                    self.params.widgets[widget_type] = widget;
                }
            }
        };

        self.onClickOrderButton = function(e) {
            e.preventDefault();
            return self.submitOrder('order');
        };

        self.onClickAddButton = function() {
            return self.submitOrder('add_to_cart');
        };


        self.submitOrder = function(submit_type) {
            h(self.elements.message).hide();
            h(self.elements.success_message).hide();

            var can_submit = true;

            if (!self.params.status) {
                h(self.elements.message)
                    .setMessage(self.messages.not_available)
                    .show();

                can_submit = false;
            }

            var calendar_widget = self.params.widgets.DeliveryCalendarWidget;
            if (calendar_widget) {
                var delivery_date = calendar_widget.getDeliveryDate();
                if (!delivery_date) {
                    h(self.elements.message)
                        .setMessage(self.messages.error_select_date)
                        .show();

                    can_submit = false;
                }
            }

            if (can_submit) {
                if (typeof jQuery !== 'undefined') {
                    if (self.isPickupOnlyOrdering() && !self.isDeliveryOnlyOrdering() &&
                        !jQuery('#instorePickupDialog').data('proceed-confirmed')) {
                        jQuery('#instorePickupDialog .selected-date').text(jQuery('#delivery_date').val());
                        jQuery('#instorePickupDialog').modal({
                            backdrop: 'static'
                        });

                        return;
                    }

                    if (jQuery('#instorePickupDialog').length) {
                        jQuery('#instorePickupDialog').removeData('proceed-confirmed');
                    }
                }

                var form = h(self.elements.order_form);
                if (self.params.ajax && form) {
                    var url = form.getAttribute('action');

                    if (self.events && (typeof self.events.before_ajax === 'function')) {
                        self.events.before_ajax(self, h);
                    }

                    h.ajax(
                        url,
                        form.serialize(),
                        function(response) {
                            if (typeof response === 'string') {
                                response = JSON.parse(response);
                            }
                            if (response.status == 'ERROR') {
                                var message = self.messages.error_ajax;
                                if (self.params.use_ajax_message) {
                                    message = response.message;
                                }
                                h(self.elements.message)
                                    .setMessage(message)
                                    .show();
                                if (self.events && (typeof self.events.error_ajax === 'function')) {
                                    self.events.error_ajax(self, h);
                                }
                            } else if (response.redirect) {
                                response.submit_type = submit_type;
                                if (self.events && (typeof self.events.after_ajax === 'function')) {
                                    self.dispatchAddToCartEvent();
                                    self.events.after_ajax(self, h, response);
                                }
                            }
                        },
                        function(xhr, errorThrown, textStatus) {
                            h(self.elements.message)
                                .setMessage(self.messages.error_ajax)
                                .show();

                            if (self.events && (typeof self.events.error_ajax === 'function')) {
                                self.events.error_ajax(self, h);
                            }

                            h.send_debug(self.params.debug_url, xhr, errorThrown, textStatus);
                        }
                    );
                } else {
                    self.dispatchAddToCartEvent();
                    self.elements.order_form.submit();
                }
            }

        };

        self.dispatchAddToCartEvent = function() {
            var price = null;

            if (typeof pricingWidget === 'object') {
                var switcher = pricingWidget.getActiveSwitchButton();
                if (typeof switcher === 'object') {
                    price = parseFloat(switcher.getAttribute('data-price')) || null;
                }
            }

            try {
                document.dispatchEvent(new CustomEvent('add_to_cart', {detail: {price: price}}));
            } catch (e) {}
        };

        /**
         * Init widget
         *
         * @param {Object=} opts
         */
        self.init = function (opts) {
            self.prepareWidget(self);

            var defaultOpts = {
                elements: {},
                messages: {
                    error_select_date: 'Please select a delivery date.',
                    error_ajax: 'Sorry, but something went wrong. Please try again later.',
                    not_available: 'This is not available for sale.',
                    delivery_not_available: 'Sorry same day deliver is unavailable in {zip}.<br/>Select a new Date or Zip.'
                },
                params: {
                    widgets: {},
                    status: true,
                    zip: null,
                    debug_mode: false
                }
            };

            self.initWidget(self, defaultOpts, opts);
            // Event Listeners
            h(self.elements.order_button).setEvent('click', self.onClickOrderButton);
            h(self.elements.add_to_cart).setEvent('click', self.onClickAddButton);

            return self;
        };

    }

    return window.OrderWidget = OrderWidget;

} (BnHelper));