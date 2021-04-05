(function(h) {

    'use strict';

    /**
     * Class Delivery timer widget
     *
     * @class DeliveryTimerWidget
     * @augments {OrderWidget} orderWidget
     */
    function DeliveryTimerWidget (orderWidget) {

        var self = this;

        orderWidget.prepareWidget(self);

        /**
         * Get delivery fee widget, that related via order widget
         *
         * @returns {(boolean|DeliveryCalendarWidget)}
         */
        self.getDeliveryCalendarWidget = function() {
            var order_widget = self.getOrderWidget();
            if (order_widget) {
                return order_widget.params.widgets.DeliveryCalendarWidget;
            }

            return false;
        };

        /**
         * Disable today delivery
         */
        self.disableTodayDelivery = function() {
            var calendar_widget = self.getDeliveryCalendarWidget();
            if (calendar_widget) {
                window.setTimeout(function() {
                    calendar_widget.update({});
                }, 1000);
            }
        };

        /**
         * Timer callback
         *
         * @private
         */
        self._timer = function() {
            var cutoff_moment = moment(self.params.cutoff_timestamp).tz(self.params.vendor_timezone),
                now_moment = moment().tz(self.params.vendor_timezone),
                hours = cutoff_moment.diff(now_moment, 'hours'),
                minutes = cutoff_moment.diff(now_moment, 'minutes'),
                seconds = cutoff_moment.diff(now_moment, 'seconds');

            if (seconds <= 0) {
                self.stop();
                self.disableTodayDelivery();
            } else {
                h(self.elements.widget).show();
                var message = self.messages.default;
                if (!hours) {
                    message = self.messages.only_minutes;
                    if (!minutes) {
                        message = self.messages.only_seconds;
                    }
                }
                h(self.elements.message).setMessage(message, {
                    hours: hours,
                    minutes: minutes % 60,
                    seconds: seconds - minutes * 60
                });
            }
        };

        /**
         * Checking availability for delivery today
         *
         * @returns {boolean}
         */
        self.canDeliveryToday = function() {
            var calendar_widget = self.getDeliveryCalendarWidget();
            return calendar_widget && calendar_widget.canDeliveryToday();
        };

        /**
         * Stop timer
         */
        self.stop = function () {
            h(self.elements.widget).hide();
            if (self.params.timer_handler) {
                clearInterval(self.params.timer_handler);
            }
            self.params.interval = 0;
        };

        /**
         * Start timer
         *
         * @param {number} cutoff
         */
        self.start = function (cutoff) {
            self.stop();
            self.params.cutoff_timestamp = cutoff;
            if (self.canDeliveryToday()) {
                self._timer();
                self.params.timer_handler = setInterval(self._timer, 1000);
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
                messages: {
                    default: '<span>Need it today?</span> Order within <span class="hours">{hours}</span> hrs <span class="minutes">{minutes}</span> mins.',
                    only_minutes: '<span>Need it today?</span> Order within <span class="minutes">{minutes}</span> mins.',
                    only_seconds: '<span>Need it today?</span> Order within <span class="seconds">{seconds}</span> secs.'
                },
                params: {
                    vendor_timezone: 'America/Los_Angeles',
                    cutoff: 0,
                    timer_handler: null
                }
            };

            self.initWidget(self, defaultOpts, opts);
            self.params.vendor_timezone = self.prepareVendorTimeZone(self.params.vendor_timezone);

            return self;
        };

    }

    return window.DeliveryTimerWidget = DeliveryTimerWidget;

} (BnHelper));