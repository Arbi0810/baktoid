/*
    datepickr 3.0 - pick your date not your nose

    ** Modified by Adam Schuld **
    To include blackout dates
    ** updatedby Andu **
    To include active dates fall in blackout dates

    https://github.com/joshsalverda/datepickr

    Copyright © 2014 Josh Salverda <josh.salverda@gmail.com>
    This program is free software. It comes without any warranty, to
    the extent permitted by applicable law. You can redistribute it
    and/or modify it under the terms of the Do What The Fuck You Want
    To Public License, Version 2, as published by Sam Hocevar. See
    http://www.wtfpl.net/ for more details.
*/

var datepickr = function (selector, config) {
    'use strict';
    var elements,
        createInstance,
        instances = [],
        i;

    datepickr.prototype = datepickr.init.prototype;

    createInstance = function (element) {
        if (element._datepickr) {
            element._datepickr.destroy();
        }
        element._datepickr = new datepickr.init(element, config);
        return element._datepickr;
    };

    if (selector.nodeName) {
        return createInstance(selector);
    }

    elements = datepickr.prototype.querySelectorAll(selector);

    if (elements.length === 1) {
        return createInstance(elements[0]);
    }

    for (i = 0; i < elements.length; i++) {
        instances.push(createInstance(elements[i]));
    }
    return instances;
};

/**
 * @constructor
 */
datepickr.init = function (element, instanceConfig) {
    'use strict';
    var self = this,
        defaultConfig = {
            dateFormat: 'F j, Y',
            omitDates: [],
            omitDays: [],
            activeDates:[],
            altFormat: null,
            altInput: null,
            minDate: null,
            maxDate: null,
            shorthandCurrentMonth: false,
            minimalWeekdayLabel: false,
            afterShow: null,
            useArrows: false
        },
        calendarContainer = document.createElement('div'),
        navigationCurrentMonth = document.createElement('span'),
        calendar = document.createElement('table'),
        calendarBody = document.createElement('tbody'),
        wrapperElement,
        currentDate = new Date(),
        wrap,
        date,
        formatDate,
        monthToStr,
        isSpecificDay,
        buildWeekdays,
        blackoutDays,
        blackoutDates,
        specialDates,
        transitionMonth,
        transitionPrevMonth,
        transitionNextMonth,
        parseDateString,
        normalizeOmittedDays,
        normalizeOmittedDates,
        normalizeActiveDates,
        buildDays,
        setAriaLabel,
        updateAriaLabels,
        getMonthNavAriaLabels,
        updateNavigationCurrentMonth,
        buildMonthNavigation,
        handleYearChange,
        documentClick,
        calendarClick,
        keyboardInput,
        fireEvent,
        buildCalendar,
        getOpenEvent,
        getNextMonth,
        getPrevMonth,
        bind,
        open,
        close,
        destroy,
        init;

    calendarContainer.className = 'datepickr-calendar';
    navigationCurrentMonth.className = 'datepickr-current-month';
    instanceConfig = instanceConfig || {};

    wrap = function () {
        wrapperElement = document.createElement('div');
        wrapperElement.className = 'datepickr-wrapper';
        self.element.parentNode.insertBefore(wrapperElement, self.element);
        wrapperElement.appendChild(self.element);
    };

    date = {
        current: {
            year: function () {
                return currentDate.getFullYear();
            },
            month: {
                integer: function () {
                    return currentDate.getMonth();
                },
                string: function (shorthand) {
                    var month = currentDate.getMonth();
                    return monthToStr(month, shorthand);
                }
            },
            day: function () {
                return currentDate.getDate();
            }
        },
        month: {
            string: function () {
                return monthToStr(self.currentMonthView, self.config.shorthandCurrentMonth);
            },
            numDays: function () {
                // checks to see if february is a leap year otherwise return the respective # of days
                return self.currentMonthView === 1 && (((self.currentYearView % 4 === 0) && (self.currentYearView % 100 !== 0)) || (self.currentYearView % 400 === 0)) ? 29 : self.l10n.daysInMonth[self.currentMonthView];
            }
        }
    };

    formatDate = function (dateFormat, milliseconds) {
        var formattedDate = '',
            dateObj = new Date(milliseconds),
            formats = {
                d: function () {
                    var day = formats.j();
                    return (day < 10) ? '0' + day : day;
                },
                D: function () {
                    return self.l10n.weekdays.shorthand[formats.w()];
                },
                j: function () {
                    return dateObj.getDate();
                },
                l: function () {
                    return self.l10n.weekdays.longhand[formats.w()];
                },
                w: function () {
                    return dateObj.getDay();
                },
                F: function () {
                    return monthToStr(formats.n() - 1, false);
                },
                m: function () {
                    var month = formats.n();
                    return (month < 10) ? '0' + month : month;
                },
                M: function () {
                    return monthToStr(formats.n() - 1, true);
                },
                n: function () {
                    return dateObj.getMonth() + 1;
                },
                U: function () {
                    return dateObj.getTime() / 1000;
                },
                y: function () {
                    return String(formats.Y()).substring(2);
                },
                Y: function () {
                    return dateObj.getFullYear();
                }
            },
            formatPieces = dateFormat.split('');

        self.forEach(formatPieces, function (formatPiece, index) {
            if (formats[formatPiece] && formatPieces[index - 1] !== '\\') {
                formattedDate += formats[formatPiece]();
            } else {
                if (formatPiece !== '\\') {
                    formattedDate += formatPiece;
                }
            }
        });

        return formattedDate;
    };

    monthToStr = function (date, shorthand) {
        if (shorthand === true) {
            return self.l10n.months.shorthand[date];
        }

        return self.l10n.months.longhand[date];
    };

    isSpecificDay = function (day, month, year, comparison) {
        return day === comparison && self.currentMonthView === month && self.currentYearView === year;
    };

    buildWeekdays = function () {
        var weekdayContainer = document.createElement('thead'),
            firstDayOfWeek = self.l10n.firstDayOfWeek,
            weekdays = self.l10n.weekdays.shorthand;

        if (self.config.minimalWeekdayLabel) {
            weekdays = self.l10n.weekdays.minimal;
        }

        if (firstDayOfWeek > 0 && firstDayOfWeek < weekdays.length) {
            weekdays = [].concat(weekdays.splice(firstDayOfWeek, weekdays.length), weekdays.splice(0, firstDayOfWeek));
        }

        weekdayContainer.innerHTML = '<tr><th>' + weekdays.join('</th><th>') + '</th></tr>';
        calendar.appendChild(weekdayContainer);
    };

    parseDateString = function( dateString ) {
        // format: '2015-02-13'
        var dateArray = dateString.split('-');
        return new Date(parseInt(dateArray[0], 10), (parseInt(dateArray[1], 10) - 1), parseInt(dateArray[2], 10)).getTime();
    };

    normalizeOmittedDays = function(){
        if (self.config.omitDays.length){
            self.blackoutDays = self.config.omitDays.map(function(d){
                return self.l10n.weekdays.longhand.indexOf(d);
            });
        }
    };

    normalizeOmittedDates = function(){
        // Normalize any omitted days by rounding them
        if (self.config.omitDates.length) {
            self.blackoutDates = self.config.omitDates.map(function(d) {
                // Convert to numbers
                return parseDateString(d);
            });
        }
    };

    normalizeActiveDates = function(){
        // Normalize any active days by rounding them
        if (self.config.activeDates.length) {
            self.specialDates = self.config.activeDates.map(function(d) {
                // Convert to numbers
                return parseDateString(d);
            });
        }
    };
    buildDays = function () {
        var firstOfMonth = new Date(self.currentYearView, self.currentMonthView, 1).getDay(),
            numDays = date.month.numDays(),
            calendarFragment = document.createDocumentFragment(),
            row = document.createElement('tr'),
            dayCount,
            dayNumber,
            today = '',
            selected = '',
            disabled = '',
            tabIndex,
            focusDay,
            ariaLabel,
            thisDate;

        // Offset the first day by the specified amount
        firstOfMonth -= self.l10n.firstDayOfWeek;
        if (firstOfMonth < 0) {
            firstOfMonth += 7;
        }

        dayCount = firstOfMonth;
        calendarBody.innerHTML = '';

        // Add spacer to line up the first day of the month correctly
        if (firstOfMonth > 0) {
            row.innerHTML += '<td colspan="' + firstOfMonth + '">&nbsp;</td>';
        }


        // Start at 1 since there is no 0th day
        for (dayNumber = 1; dayNumber <= numDays; dayNumber++) {
            // if we have reached the end of a week, wrap to the next line
            if (dayCount === 7) {
                calendarFragment.appendChild(row);
                row = document.createElement('tr');
                dayCount = 0;
            }

            today = isSpecificDay(date.current.day(), date.current.month.integer(), date.current.year(), dayNumber) ? ' today' : '';

            disabled = '';
            thisDate = new Date(self.currentYearView, self.currentMonthView, dayNumber);
            // check for disabled days
            if (self.config.omitDays.length > 0){

                if (self.blackoutDays.indexOf(thisDate.getDay()) > -1){
                    disabled = ' disabled';
                }
            }

            // check for disabled dates
            if (self.config.omitDates.length > 0){

                if (self.blackoutDates.indexOf(thisDate.getTime()) > -1){
                    disabled = ' disabled';
                }
            }

            if (self.config.minDate || self.config.maxDate) {

                if (self.config.minDate && thisDate < self.config.minDate) {
                    disabled = ' disabled';
                }

                if (self.config.maxDate && thisDate > self.config.maxDate) {
                    disabled = ' disabled';
                }
            }

            //check for special active days
            if (self.config.activeDates.length > 0){
                if (self.specialDates.indexOf(thisDate.getTime()) > -1){
                    disabled = '';
                }
            }

            if (self.selectedDate) {
                selected = isSpecificDay(self.selectedDate.day, self.selectedDate.month, self.selectedDate.year, dayNumber) ? ' selected' : '';

                // today disabled dates cannot be selected
                if (selected && today && disabled) {
                    selected = '';
                    fireEvent.call(window, 'datepickrDeliveryNotAvailable', null);
                }
            }

            var fullDate = BnHelper.getFullDateString(thisDate);
            if (disabled) {
                ariaLabel = fullDate + ' is not available for delivery.'
            } else {
                ariaLabel = 'Choose ' + fullDate + ' for your delivery date. It\'s available.'
            }

            if (!focusDay && !disabled) {
                tabIndex = 0;
                focusDay = dayNumber;
            } else {
                tabIndex = -1;
            }

            row.innerHTML += '<td class="' + today + selected + disabled + '"><span class="datepickr-day" tabindex="' + tabIndex + '" aria-label="' + ariaLabel + '">' + dayNumber + '</span></td>';
            dayCount++;
        }

        calendarFragment.appendChild(row);
        calendarBody.appendChild(calendarFragment);
    };

    updateNavigationCurrentMonth = function () {
        navigationCurrentMonth.innerHTML = date.month.string() + ' ' + self.currentYearView;
    };

    setAriaLabel = function (element, label) {
      element.setAttribute('aria-label', label)
    };

    updateAriaLabels = function () {
        var monthSelectorPrev = '.datepickr-prev-month';
        var monthSelectorNext = '.datepickr-next-month';

        var ariaLabelPrevMonth = getMonthNavAriaLabels(monthSelectorPrev);
        var ariaLabelNextMonth = getMonthNavAriaLabels(monthSelectorNext);

        var prevMonth = document.querySelector(monthSelectorPrev);
        var nextMonth = document.querySelector(monthSelectorNext);

        setAriaLabel(prevMonth, ariaLabelPrevMonth);
        setAriaLabel(nextMonth, ariaLabelNextMonth);
    };

    getMonthNavAriaLabels = function (classSelector) {
        switch(classSelector) {
            case '.datepickr-prev-month':
                return 'Move backwards to ' + getPrevMonth();
            case '.datepickr-next-month':
                return 'Move forward to ' + getNextMonth();
        }
    };

    buildMonthNavigation = function () {
        var months = document.createElement('div'),
            monthNavigation;

        var ariaLabelPrevMonth = getMonthNavAriaLabels('.datepickr-prev-month');
        var ariaLabelNextMonth = getMonthNavAriaLabels('.datepickr-next-month');

        if (self.config.useArrows) {
            monthNavigation  = '<button type="button" class="fa fa-arrow-left datepickr-prev-month" aria-label="' + ariaLabelPrevMonth + '"></button>';
            monthNavigation += '<button type="button" class="fa fa-arrow-right datepickr-next-month" aria-label="' + ariaLabelNextMonth + '"></button>';
        } else {
            monthNavigation  = '<button type="button" class="datepickr-prev-month" aria-label="' + ariaLabelPrevMonth + '">Prev</button>';
            monthNavigation += '<button type="button" class="datepickr-next-month" aria-label="' + ariaLabelNextMonth + '">Next</button>';
        }

        months.className = 'datepickr-months';
        months.innerHTML = monthNavigation;

        months.appendChild(navigationCurrentMonth);
        updateNavigationCurrentMonth();
        calendarContainer.appendChild(months);
    };

    handleYearChange = function () {
        if (self.currentMonthView < 0) {
            self.currentYearView--;
            self.currentMonthView = 11;
        }

        if (self.currentMonthView > 11) {
            self.currentYearView++;
            self.currentMonthView = 0;
        }
    };

    documentClick = function (event) {
        var parent;
        if (event.target !== self.element && event.target !== wrapperElement) {
            parent = event.target.parentNode;
            if (parent !== wrapperElement) {
                while (parent !== wrapperElement) {
                    parent = parent.parentNode;
                    if (parent === null) {
                        close();
                        break;
                    }
                }
            }
        }
    };

    transitionMonth = function (updateMonthCb) {
        updateMonthCb();
        handleYearChange();
        updateNavigationCurrentMonth();
        updateAriaLabels();
        buildDays();
    };

    transitionPrevMonth = function () {
        transitionMonth(function () {
            self.currentMonthView--
        });
    };

    transitionNextMonth = function () {
        transitionMonth(function () {
            self.currentMonthView++
        });
    };

    calendarClick = function (event) {
        var target = event.target,
            targetClass = target.className,
            currentTimestamp;

        if (targetClass) {
            // allow the target to have more than one class and still be clickable
            if (
                targetClass.indexOf('datepickr-prev-month') > -1 ||
                targetClass.indexOf('datepickr-next-month') > -1
            ) {
                if (targetClass.indexOf('datepickr-prev-month') > -1) {
                    transitionPrevMonth();
                } else {
                    transitionNextMonth();
                }
            } else if (targetClass === 'datepickr-day' && !self.hasClass(target.parentNode, 'disabled')) {
                self.selectedDate = {
                    day: parseInt(target.innerHTML, 10),
                    month: self.currentMonthView,
                    year: self.currentYearView
                };

                currentTimestamp = new Date(self.currentYearView, self.currentMonthView, self.selectedDate.day).getTime();

                if (self.config.altInput) {
                    if (self.config.altFormat) {
                        self.config.altInput.value = formatDate(self.config.altFormat, currentTimestamp);
                    } else {
                        // I don't know why someone would want to do this... but just in case?
                        self.config.altInput.value = formatDate(self.config.dateFormat, currentTimestamp);
                    }
                }

                self.element.value = formatDate(self.config.dateFormat, currentTimestamp);

                // Call trigger with not modify event, this trigger can listen all included js files
                // needed for IE because ie modifies event
                fireEvent.call(window, 'datepickrSelectDate', event);

                close();
                buildDays();
            }
        }
    };

    getNextMonth = function () {
        return new moment(date.month.string() + ' ' + self.currentYearView).add(1, 'month').format('MMMM YYYY')
    };

    getPrevMonth = function () {
        return new moment(date.month.string() + ' ' + self.currentYearView).subtract(1, 'month').format('MMMM YYYY')
    };

    buildCalendar = function () {
        buildMonthNavigation();
        buildWeekdays();
        buildDays();

        calendar.appendChild(calendarBody);
        calendarContainer.appendChild(calendar);

        wrapperElement.appendChild(calendarContainer);
    };

    getOpenEvent = function () {
        return 'click';
    };

    // Create custom event
    fireEvent = function (event, data) {
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent(event, true, true ); // event type,bubbling,cancelable
        evt.detail = data;
        return !this.dispatchEvent(evt);
    };

    bind = function () {
        self.addEventListener(self.element, getOpenEvent(), open, false);
        self.addEventListener(calendarContainer, 'click', calendarClick, false);
        self.addEventListener(calendarContainer, 'keydown', keyboardInput, false);
    };

    open = function () {
        self.addEventListener(document, 'click', documentClick, false);
        self.addClass(wrapperElement, 'open');
        if (typeof self.config.afterShow == 'function') {
            self.config.afterShow();
        }
    };

    close = function () {
        self.removeEventListener(document, 'click', documentClick, false);
        self.removeClass(wrapperElement, 'open');
    };

    destroy = function () {
        var parent,
            element;

        self.removeEventListener(document, 'click', documentClick, false);
        self.removeEventListener(self.element, getOpenEvent(), open, false);

        parent = self.element.parentNode;
        parent.removeChild(calendarContainer);
        element = parent.removeChild(self.element);
        parent.parentNode.replaceChild(element, parent);
    };

    keyboardInput = function (event) {
        var target = event.target;
        var days = document.querySelectorAll('.datepickr-day');
        var currentIndex = Array.prototype.indexOf.call(days, target);
        var targetHasClass = self.hasClass.bind(null, target);
        var isTargetMonthPrev = targetHasClass('datepickr-prev-month');
        var isTargetMonthNext = targetHasClass('datepickr-next-month');
        var isTargetDay = targetHasClass('datepickr-day');
        var initialFocusDay = document.querySelector("[tabindex='0']");
        var focusDay;

        switch (event.key) {
            case 'ArrowRight':
                if (isTargetMonthPrev || isTargetMonthNext) {
                    focusDay = initialFocusDay
                } else if (isTargetDay && target.innerText === days[days.length - 1].innerText) {
                    transitionNextMonth();
                    focusDay = document.querySelector('.datepickr-day');
                } else if (isTargetDay) {
                    focusDay = days[currentIndex + 1];
                }
                break;
            case 'ArrowLeft':
                if (isTargetMonthPrev || isTargetMonthNext) {
                    focusDay = initialFocusDay
                } else if (isTargetDay && target.innerText === '1') {
                    transitionPrevMonth();
                    days = document.querySelectorAll('.datepickr-day');
                    focusDay = days[days.length - 1];
                } else if (isTargetDay) {
                    focusDay = days[currentIndex - 1];
                }
                break;
            case 'Tab':
                if (isTargetDay || (isTargetMonthNext && !initialFocusDay)) {
                    event.preventDefault();
                    document.querySelector('.datepickr-prev-month').focus()
                }
                return;
            case 'Enter':
                if (isTargetDay) {
                    calendarClick(event);
                } else if (isTargetMonthPrev) {
                    transitionPrevMonth()
                } else if (isTargetMonthNext) {
                    transitionNextMonth();
                }
                event.preventDefault();
                return;
        }

        if (focusDay && isTargetDay) {
            focusDay.focus();
            target.setAttribute('tabindex', '-1');
            focusDay.setAttribute('tabindex', '0');
        } else if (focusDay) {
            focusDay.focus();
        }
    };

    init = function () {
        var config,
            parsedDate;

        self.config = {};
        self.destroy = destroy;

        for (config in defaultConfig) {
            self.config[config] = instanceConfig[config] || defaultConfig[config];
        }

        self.element = element;

        if (self.element.value) {
            parsedDate = Date.parse(self.element.value);
        }

        if (parsedDate && !isNaN(parsedDate)) {
            parsedDate = new Date(parsedDate);
            self.selectedDate = {
                day: parsedDate.getDate(),
                month: parsedDate.getMonth(),
                year: parsedDate.getFullYear()
            };
            self.currentYearView = self.selectedDate.year;
            self.currentMonthView = self.selectedDate.month;
            self.currentDayView = self.selectedDate.day;
        } else {
            self.selectedDate = null;
            self.currentYearView = date.current.year();
            self.currentMonthView = date.current.month.integer();
            self.currentDayView = date.current.day();
        }

        wrap();
        normalizeOmittedDays();
        normalizeOmittedDates();
        normalizeActiveDates();
        buildCalendar();
        bind();
    };

    init();

    return self;
};

datepickr.init.prototype = {
    hasClass: function (element, className) { return element.classList.contains(className); },
    addClass: function (element, className) { element.classList.add(className); },
    removeClass: function (element, className) { element.classList.remove(className); },
    forEach: function (items, callback) { [].forEach.call(items, callback); },
    querySelectorAll: document.querySelectorAll.bind(document),
    isArray: Array.isArray,
    addEventListener: function (element, type, listener, useCapture) {
        element.addEventListener(type, listener, useCapture);
    },
    removeEventListener: function (element, type, listener, useCapture) {
        element.removeEventListener(type, listener, useCapture);
    },
    l10n: {
        weekdays: {
            minimal: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
            shorthand: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            longhand: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        },
        months: {
            shorthand: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            longhand: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        },
        daysInMonth: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
        firstDayOfWeek: 0
    }
};