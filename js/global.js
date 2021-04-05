if (window.BN === undefined) window.BN = {};

BN.Global = (function ($) {
    var self = this,
        $body = null,
        location = window.location,
        path = location.pathname,
        urlParams = {};

    var init = function () {
        parseParams();
    };

    // check validity of email
    var isValidEmail = function (email) {
        /**
         * regex from http://www.regular-expressions.info/email.html
         */
        var re = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[A-Z]{2}|com|org|net|gov|mil|biz|info|mobi|name|aero|jobs|museum|edu)\b$/i;
        return re.test(email);
    };

    var parseParams = function () {
        var match,
            pl = /\+/g,  // Regex for replacing addition symbol with a space
            search = /([^&=]+)=?([^&]*)/g,
            decode = function (s) {
                return decodeURIComponent(s.replace(pl, " "));
            },
            query = window.location.search.substring(1);

        self.urlParams = {};
        while (match = search.exec(query)) {
            urlParams[decode(match[1])] = decode(match[2]);
        }
    };

    return {
        init: init,
        isValidEmail: isValidEmail,
        querystring: urlParams
    };
})(jQuery);

jQuery(document).ready(function ($) {
    $(document).ajaxError(function (e, jqxhr, settings, exception) {
        if (jqxhr.readyState == 0 || jqxhr.status == 0) {
            return;
        }
    });
    $.ajaxSetup({
        beforeSend: function (jqXHR, settings) {
            jqXHR.bloomUrl = settings.url;
        }
    });
    BN.Global.init();
});

/**
 * JavaScript equivalent to  php sprintf function
 * http://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format
 *
 * "{0} is dead, but {1} is alive! {0} {2}".format("ASP", "ASP.NET")
 * outputs:
 * ASP is dead, but ASP.NET is alive! ASP {2}
 *
 */
// First, checks if it isn't implemented yet.
if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined'
                ? args[number]
                : match
                ;
        });
    };
}
