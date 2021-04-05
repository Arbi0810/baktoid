(function(h) {

    'use strict';

    /**
     * Class Pricing widget
     *
     * @class PricingWidget
     * @augments {OrderWidget} orderWidget
     */
    function PricingWidget (orderWidget) {

        var self = this;

        orderWidget.prepareWidget(self);

        /**
         * Get Switcher Buttons
         *
         * @returns {Array|boolean}
         */
        self.getSwitcherButtons = function() {
            return h(self.elements.switcher).findAll(self.params.selectors.switcher_option);
        };

        /**
         * Animate price after changing
         *
         * @param {Object} element
         */
        self.notifyPriceChanged = function(element) {
            if (element) {
                element.addClass(self.params.switcher_options.changed_price_class);
                window.setTimeout(function() {
                    element.removeClass(self.params.switcher_options.changed_price_class);
                }, 350);
            }
        };

        /**
         * Get current delivery date
         *
         * @returns {string}
         */
        self.getDeliveryDate = function () {
            return h(self.elements.delivery_date).getValue();
        };

        /**
         * Get holiday pricing by date
         *
         * @param {Object} date
         * @returns {(boolean|Object)}
         */
        self.getPricingChangeByDate = function(date) {
            if (h(self.params.pricing_changes).isObject() && self.params.pricing_changes.length && date) {
                var timestamp = moment.utc(date).unix();
                for (var index = 0; index < self.params.pricing_changes.length; ++index) {
                    var pricing_changes = self.params.pricing_changes[index],
                        from_date = moment.utc(pricing_changes.from_date).unix(),
                        to_date = moment.utc(pricing_changes.to_date).unix();
                    if (pricing_changes.price && (from_date <= timestamp) && (to_date >= timestamp)) {
                        return pricing_changes;
                    }
                }
            }

            return false;
        };

        /**
         * Calculate price using "Price changes"
         *
         * @param {number} price
         * @param {Object} pricing_change
         * @returns {number}
         */
        self.calculatePriceByPricingChange = function (price, pricing_change) {
            if (pricing_change) {
                var new_price = price,
                    value = pricing_change.price;

                if (pricing_change.type == 'percent') {
                    value = price * pricing_change.price / 100;
                }

                if (pricing_change.action == 'dec') {
                    new_price = price - value;
                } else {
                    new_price = price + value;
                }

                if (pricing_change.type == 'percent') {
                    new_price = Math.ceil(new_price);
                }

                price = new_price;
            }

            return price;
        };

        /**
         * Calculate pricing
         *
         * @param {Object} date
         */
        self.calculatePricing = function (date) {
            var active_switch_button = self.getActiveSwitchButton(),
                price_label = h(self.elements.price_label),
                price = parseFloat(price_label.getData('price'));

            if (active_switch_button) {
                price = parseFloat(h(active_switch_button).getData('price'));
            }

            // Handle surge pricing when no date has been selected
            if (!date) {
                for (var index = 0; index < self.params.pricing_changes.length; ++index) {
                    var pricing_changes = self.params.pricing_changes[index];
                    if (pricing_changes.surge_flag) {
                        date = pricing_changes.from_date;
                        break;
                    }
                }
            }

            var pricing_change = self.getPricingChangeByDate(date);

            // Set prices for every switch button
            var switch_buttons = self.getSwitcherButtons();
            if (h.isObject(switch_buttons) && switch_buttons.length &&
                self.params.selectors.switcher_option_price_label) {
                for (var key in switch_buttons) {
                    var button = switch_buttons[key],
                        button_price = parseFloat(h(button).getData('price'));
                    if (button_price) {
                        var new_price = self.calculatePriceByPricingChange(button_price, pricing_change),
                            button_price_label = h(h(button).find(self.params.selectors.switcher_option_price_label));
                        new_price = h.formatPrice(new_price, 2);
                        if (button_price_label.getHtml() != new_price) {
                            button_price_label.setHtml(new_price);
                            self.notifyPriceChanged(button_price_label);
                        }
                    }
                }
            }

            // Set prices to price label
            var new_price = self.calculatePriceByPricingChange(price, pricing_change),
                formatted_new_price = h.formatPrice(new_price, 2);

            if (price_label.getHtml() != formatted_new_price) {
                self.notifyPriceChanged(price_label);
                h(self.elements.modification_input).setValue(new_price);
                price_label.setHtml(formatted_new_price);
            }
        };

        /**
         * Get active switch button
         *
         * @returns {(boolean|Object)}
         */
        self.getActiveSwitchButton = function() {
            var switch_buttons = self.getSwitcherButtons();

            for (var key in switch_buttons) {
                var button = switch_buttons[key];
                if (h(button).hasClass(self.params.switcher_options.active_class)) {
                    return button;
                }
            }

            return false;
        };

        /**
         * Event: on click by switch button
         *
         * @param e
         */
        self.onClickSwitchButton = function(e) {
            var switch_buttons = self.getSwitcherButtons();

            for (var key in switch_buttons) {
                var button = switch_buttons[key];
                h(button).removeClass(self.params.switcher_options.active_class);
            }

            h(this).addClass(self.params.switcher_options.active_class);
            h(self.elements.upgrade_input).setValue(h(this).getData('upgrade'));
            h(self.elements.price_description).setHtml(h(this).getData('description'));

            self.calculatePricing(self.getDeliveryDate());
        };

        /**
         * Event: on chnage delivery date
         *
         * @param e
         */
        self.onChangeDeliveryDate = function(e) {
            var date = h(this).getValue();
            self.calculatePricing(date);

        };

        /**
         * Prepare widget
         */
        self.prepareWidget = function() {
            var switch_buttons = self.getSwitcherButtons();
            if (switch_buttons && switch_buttons.length == 1) {
                h(self.elements.switcher).hide();
            }

            if (switch_buttons && switch_buttons.length) {
                h(switch_buttons[0]).triggerEvent('click');
            }
        };

        /**
         * Init widget
         *
         * @param {Object} opts
         */
        self.init = function (opts) {
            var defaultOpts = {
                elements: {},
                messages: {},
                params: {
                    selectors: {
                        switcher_option: '.switcher_option'
                    },
                    switcher_options: {
                        active_class: 'active',
                        disabled_class: 'disabled',
                        changed_price_class: 'isChanged'
                    },
                    pricing_changes: []
                }
            };

            self.initWidget(self, defaultOpts, opts);

            h(self.elements.delivery_date).setEvent('change', self.onChangeDeliveryDate);
            var switch_buttons = self.getSwitcherButtons();
            for (var key in switch_buttons) {
                var switch_button = switch_buttons[key];
                h(switch_button).setEvent('click', self.onClickSwitchButton);
            }

            self.prepareWidget();

            return self;
        };

    }

    return window.PricingWidget = PricingWidget;

} (BnHelper));
