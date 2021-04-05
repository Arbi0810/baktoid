(function () {
  function CustomEvent ( event, params ) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
    return evt;
   }

  CustomEvent.prototype = window.Event.prototype;

  window.CustomEvent = CustomEvent;
})();

(function(window) {

    'use strict';

    function define_BnHelper (element) {

        var self = {};

        if (element) {
            if (typeof element === 'string') {
                element = document.querySelector(element);
            }
        }

        self.element = element;

        /**
         * Copy data from one object into another
         *
         * @param {Object} destination
         * @param {Object} opts
         * @private
         */
        self._copy = function(destination, opts) {
            for (var key in opts) {
                destination[key] = opts[key];
            }
        };

        self.global_function = {

            /**
             * Ger current element
             *
             * @returns {*}
             */
            getElement: function() {
                if (self.isObject()) {
                    return self.element;
                }

                return false;
            },

            /**
             * Find element by query selector in another element
             *
             * @param {string} selector
             * @returns {(boolean|Object)}
             */
            find: function(selector) {
                if (selector) {
                    if (self.getElement() && typeof self.getElement().querySelector === 'function') {
                        return self.getElement().querySelector(selector);
                    } else {
                        return document.querySelector(selector);
                    }
                }

                return false;
            },

            /**
             * Find all elements by query selector in another element
             *
             * @param {string} selector
             * @returns {(boolean|Object)}
             */
            findAll: function(selector) {
                if (selector) {
                    if (self.getElement() && typeof self.getElement().querySelectorAll === 'function') {
                        return self.getElement().querySelectorAll(selector);
                    } else {
                        return document.querySelectorAll(selector);
                    }
                }

                return false;
            },

            /**
             * Find parent object by selector
             *
             * @param {string} selector
             * @returns {boolean|Object}
             */
            closest: function(selector) {
                if (selector && self.getElement()) {
                    return self.getElement().closest(selector);
                }

                return false;
            },

            /**
             * Checking, that element is object
             *
             * @param {Object=} element
             * @returns {boolean}
             */
            isObject: function(element) {
                if (typeof element !== 'undefined') {
                    return element && (typeof element === 'object');
                } else {
                    return self.element && (typeof self.element === 'object');
                }
            },

            /**
             * Set event to element
             *
             * @param {string} event - click, keypress, blur, etc.
             * @param {function} callback
             * @returns {BnHelper}
             */
            setEvent: function(event, callback) {
                if (self.isObject()) {
                    self.getElement().addEventListener(event, callback, false);
                }

                return self;
            },

            /**
             * Set a message to element using pattern and replacements
             *
             * @param {string} message
             * @param {Object=} replace
             * @returns {BnHelper}
             *
             * @example
             * //$5 Hand delivery for 90210
             * self.setMessage("${fee} Hand delivery for {zip}", {fee: 5, zip: 90210});
             */
            setMessage: function (message, replace) {
                if (self.isObject()) {
                    if (self.isObject(replace)) {
                        for (var key in replace) {
                            var value = replace[key];
                            message = message.replace('{' + key + '}', value);
                        }
                    }

                    if (self.getElement().innerHTML != message) {
                        self.getElement().innerHTML = message;
                    }
                }

                return self;
            },

            /**
             * Send ajax request
             *
             * @param {string} url
             * @param {Object} data
             * @param {function} callback
             * @param {function=} fail_callback
             */
            ajax: function(url, data, callback, fail_callback) {
                if (typeof jQuery !== 'undefined') {
                    jQuery.ajax({
                        url: url,
                        dataType: 'json',
                        type: 'post',
                        data: data,
                        xhrFields: {
                            withCredentials: true
                        },
                        success: callback,
                        error: fail_callback
                    });
                } else {
                    ajax.post(url, data, callback, 'async', fail_callback);
                }
            },

            /**
             * Send debug information via ajax
             *
             * @param {string} url
             * @param {Object} xhr
             * @param {string} errorThrown
             * @param {string} textStatus
             */
            send_debug: function(url, xhr, errorThrown, textStatus) {
                if (url) {
                    var ct = xhr.getResponseHeader("content-type") || '',
                        response_text = xhr.responseText;

                    if (ct.indexOf('html') > -1) {
                        response_text = 'HTML Content';
                    }
                    if (ct.indexOf('json') > -1) {
                        response_text = JSON.parse(xhr.responseJSON);
                    }

                    self.ajax(url, {
                        dd: {
                            status: xhr.status,
                            errorThrown: errorThrown,
                            textStatus: textStatus,
                            url: document.URL,
                            responseText: response_text,
                            userAgent: navigator.userAgent
                        },
                        t: 1,
                        form_key: window.FORM_KEY
                    });
                }
            },

            /**
             * Serialize form
             *
             * @param {Object} form
             * @returns {(boolean|string)}
             */
            serialize: function(form) {
                if (typeof form === 'undefined') {
                    form = self.getElement();
                }

                if (!form || form.nodeName !== "FORM") {
                    return false;
                }
                var i, j, q = [];
                for (i = form.elements.length - 1; i >= 0; i = i - 1) {
                    if (form.elements[i].name === "") {
                        continue;
                    }
                    switch (form.elements[i].nodeName) {
                        case 'INPUT':
                            switch (form.elements[i].type) {
                                case 'text':
                                case 'hidden':
                                case 'password':
                                case 'button':
                                case 'reset':
                                case 'submit':
                                    q.push(form.elements[i].name + "=" + encodeURIComponent(form.elements[i].value));
                                    break;
                                case 'checkbox':
                                case 'radio':
                                    if (form.elements[i].checked) {
                                        q.push(form.elements[i].name + "=" + encodeURIComponent(form.elements[i].value));
                                    }
                                    break;
                                case 'file':
                                    break;
                            }
                            break;
                        case 'TEXTAREA':
                            q.push(form.elements[i].name + "=" + encodeURIComponent(form.elements[i].value));
                            break;
                        case 'SELECT':
                            switch (form.elements[i].type) {
                                case 'select-one':
                                    q.push(form.elements[i].name + "=" + encodeURIComponent(form.elements[i].value));
                                    break;
                                case 'select-multiple':
                                    for (j = form.elements[i].options.length - 1; j >= 0; j = j - 1) {
                                        if (form.elements[i].options[j].selected) {
                                            q.push(form.elements[i].name + "=" + encodeURIComponent(form.elements[i].options[j].value));
                                        }
                                    }
                                    break;
                            }
                            break;
                        case 'BUTTON':
                            switch (form.elements[i].type) {
                                case 'reset':
                                case 'submit':
                                case 'button':
                                    q.push(form.elements[i].name + "=" + encodeURIComponent(form.elements[i].value));
                                    break;
                            }
                            break;
                    }
                }

                return q.join("&");
            },

            /**
             * Convert html to DOM element
             *
             * @param {string} html
             * @returns {Node}
             */
            convertHtmlToElement: function(html) {
                var div = document.createElement('div');
                div.innerHTML = html;

                return div.firstChild;
            },

            /**
             * Set display style to element
             *
             * @param {string} value
             * @returns {BnHelper}
             */
            display: function(value) {
                if (self.isObject()) {
                    self.getElement().style.display = value;
                }

                return self;
            },

            /**
             * Hide element
             *
             * @returns {BnHelper}
             */
            hide: function() {
                return self.display('none');
            },

            /**
             * Show element
             *
             * @returns {BnHelper}
             */
            show: function() {
                return self.display('inline-block');
            },

            /**
             * Checking, that element has class
             *
             * @param {string} className
             * @returns {boolean}
             */
            hasClass: function(className) {
                var classes = self.getClasses();
                return classes && className && classes.indexOf(className) !== -1;
            },

            /**
             * Get classes of element
             *
             * @returns {(boolean|Array)}
             */
            getClasses: function() {
                if (self.isObject()) {
                    var classes = self.getElement().className;
                    classes = classes
                        .replace(/\s+/g, ' ')
                        .trim()
                        .split(' ');

                    return classes;
                }

                return false;
            },

            /**
             * Set classes to element
             *
             * @param {(Array|boolean)} classes
             */
            setClasses: function(classes) {
                if (self.isObject()) {
                    if (!classes) {
                        classes = [];
                    }
                    classes = self.removeArrayDuplicates(classes);
                    self.getElement().className = classes.join(' ');
                }

                return self;
            },

            /**
             * Add class to element
             *
             * @param {string} className
             */
            addClass: function(className) {
                if (self.isObject() && className && !self.hasClass(className)) {
                    var classes = self.getClasses();
                    if (!classes) {
                        classes = [];
                    }
                    classes.push(className);
                    self.setClasses(classes);
                }

                return self;
            },

            /**
             * Remove class of element
             *
             * @param {string} className
             */
            removeClass: function(className) {
                if (self.isObject() && className) {
                    var classes = self.getClasses(classes);
                    if (classes) {
                        var index = classes.indexOf(className);
                        if (index !== -1) {
                            classes.splice(index, 1);
                            self.setClasses(classes);
                        }
                    }
                }

                return self;
            },

            /**
             * Remove classes of element
             */
            removeClasses: function() {
                self.setClasses(false);
                return self;
            },

            /**
             * Trigger event of element
             *
             * @param {string} event_name
             * @returns {BnHelper}
             */
            triggerEvent: function(event_name) {
                if (self.isObject()) {
                    var event;
                    try {
                        event = new Event(event_name);
                    } catch(e) {
                        event = new CustomEvent(event_name);
                    }
                    self.getElement().dispatchEvent(event);
                }

                return self;
            },

            /**
             * Get value of element
             *
             * @returns {(boolean|string)}
             */
            getValue: function() {
                if (self.isObject()) {
                    return self.getElement().value;
                }

                return false;
            },

            /**
             * Set value to element
             *
             * @param {string} value
             * @returns {BnHelper}
             */
            setValue: function(value) {
                if (self.isObject()) {
                    self.getElement().value = value;
                        self.triggerEvent('change');
                }

                return self;
            },

            /**
             * Get attribute of element
             *
             * @param {string} attribute
             * @returns {(boolean|string)}
             */
            getAttribute: function(attribute) {
                if (self.isObject() && attribute) {
                    return self.getElement().getAttribute(attribute);
                }

                return false;
            },

            /**
             * Set attribute to element
             *
             * @param {string} attribute
             * @param {string} value
             * @returns {BnHelper}
             */
            setAttribute: function(attribute, value) {
                if (self.isObject() && attribute) {
                    self.getElement().setAttribute(attribute, value);
                }

                return self;
            },

            /**
             * Remove attribute from element
             *
             * @param {string} attribute
             * @returns {BnHelper}
             */
            removeAttribute: function(attribute) {
                if (self.isObject() && attribute) {
                    self.getElement().removeAttribute(attribute);
                }

                return self;
            },

            /**
             * Get data-attribute of element
             *
             * @param {string} attribute
             * @returns {(boolean|string)}
             */
            getData: function(attribute) {
                if (attribute) {
                    return self.getAttribute('data-' + attribute);
                }

                return false;
            },

            /**
             * Set data-attribute to element
             *
             * @param {string} attribute
             * @param {string} value
             * @returns {BnHelper}
             */
            setData: function(attribute, value) {
                if (attribute) {
                    self.setAttribute('data-' + attribute, value);
                }

                return self;
            },

            /**
             * Get html from element
             *
             * @returns {(boolean|string)}
             */
            getHtml: function() {
                if (self.isObject()) {
                    return self.getElement().innerHTML;
                }

                return false;
            },

            /**
             * Set html into element
             *
             * @param {string} html
             * @returns {BnHelper}
             */
            setHtml: function(html) {
                if (self.isObject()) {
                    self.getElement().innerHTML = html;
                }

                return self;
            },

            /**
             * Get outer html from element
             *
             * @returns {(boolean|string)}
             */
            getOuterHtml: function() {
                if (self.isObject()) {
                    return self.getElement().outerHTML;
                }

                return false;
            },

            /**
             * Remove duplicates from array
             *
             * @param {Array} arr
             * @returns {Array}
             */
            removeArrayDuplicates: function (arr) {
                var result = [];
                if (arr) {
                    var seen = {},
                        len = arr.length,
                        j = 0;

                    for (var i = 0; i < len; i++) {
                        var item = arr[i];
                        if (seen[item] !== 1) {
                            seen[item] = 1;
                            result[j++] = item;
                        }
                    }
                }

                return result;
            },

            /**
             * Checking, that element in array
             *
             * @param {*} value
             * @returns {boolean}
             */
            inArray: function(value) {
                var arr = self.getElement();
                return (Array.isArray(arr) && arr.indexOf(value) !== -1)
            },

            /**
             * Debug
             *
             * @param {string} title
             * @param {string} message
             */
            debug: function(title, message) {
                var log_message = title;
                if (typeof message !== 'undefined') {
                    log_message = [];
                    log_message[title] = message;
                }
                if (log_message) {
                    console.log(log_message);
                }
            },

            /**
             * Set options from object to another object
             *
             * @param {Object} destination
             * @param {Object} opts
             * @returns {BnHelper}
             */
            setOptions: function(destination, opts) {
                if (self.isObject(opts)) {
                    for (var key in opts) {
                        var value = opts[key];
                        if (self.isObject(destination[key]) && self.isObject(value)) {
                            self.setOptions(destination[key], value);
                        } else {
                            destination[key] = value;
                        }
                    }
                }

                return self;
            },

            /**
             * Convert query selectors to objects
             *
             * @param {Object} destination
             */
            convertOptionsToElements: function(destination) {
                if (self.isObject(destination)) {
                    for (var key in destination) {
                        if (!self.isObject(destination[key])) {
                            destination[key] = self.find(destination[key]);
                        }
                    }
                }
            },

            /**
             * Get type of element
             *
             * @param {Object} element
             * @returns {(boolean|string)}
             */
            getObjectType: function (element) {
                if (self.isObject(element)) {
                    return element.constructor.name;
                }

                return false;
            },

            /**
             * Round Number
             *
             * @param {number} number
             * @param {number} decimal_points
             * @param {boolean=} include_dollar
             * @returns {string}
             */
            formatPrice: function(number, decimal_points, include_dollar) {
                var formatted_price = '';

                number = parseFloat(number);

                if (!decimal_points) {
                    formatted_price = Math.round(number);
                } else {
                    formatted_price = self.roundNumber(number, decimal_points).toFixed(decimal_points);
                }

                if ((typeof include_dollar === 'undefined') || include_dollar) {
                    formatted_price = '$' + formatted_price;
                }

                return formatted_price;
            },

            /**
             * Round number by using numbers represented in exponential notation
             *
             * @param {number} number
             * @param {number} decimal_points
             * @returns {number}
             */
            roundNumber: function(number, decimal_points) {
                return Number(Math.round(Number(number + 'e+' + decimal_points)) + 'e-' + decimal_points);
            },

            /**
             * Each
             *
             * @param {function} callback
             */
            each: function(callback) {
                if (self.getElement() && (typeof callback === 'function')) {
                    var element_type = self.getObjectType(self.element);
                    if ((element_type === 'Array') || (element_type === 'NodeList')) {
                        for (var i = 0; i < self.element.length; ++i) {
                            callback(self.element[i], i);
                        }
                    } else {
                        for (var key in self.element) {
                            callback(self.element[key], key);
                        }
                    }
                }
            },

          /**
           * Get full date
           *
           * @param {object} date js date object
           * @returns {string} full formatted date
           */
            getFullDateString: function(date) {
                date = moment(date);
                var dayOfWeek = date.format('dddd');
                var month = date.format('MMMM');
                var day = date.format('D');
                var year = date.format('YYYY');
                return dayOfWeek + ', ' + month + ' ' + day + ', '  + year;
            },

        };

        /**
         * Copy methods into self for using it like BnHelper('#test').hide();
         */
        self._copy(self, self.global_function);

        return self;
    }

    if (typeof BnHelper === 'undefined') {
        /**
         * Copy methods into BnHelper for using it like BnHelper.ajax(...);
         */
        define_BnHelper()._copy(define_BnHelper, define_BnHelper().global_function);
        window.BnHelper = define_BnHelper;
    }

} (window));
