/**
 * Popup object
 * have a 4 parameters, required only name
 * name - it's name of popup, something like of id
 * width - popup width, ex. '500', without 'px'
 * height - popup height, ex. '300', without 'px'
 * top - popup top style, ex. '20%'
 * left - popup left style, ex '30%'
 *
 * How use, example:
 *      var myPopup = new Popup('myPopup', 600, 400, null, '25%');
 *      myPopup.show();
 *      
 * Html example:
 *
 * <div class="bloomnation-modal" name="myPopup">
 *      <div class="bloomnation-modal-header"></div>
 *      <div class="bloomnation-modal-body"></div>
 *      <div class="bloomnation-modal-footer"></div>
 * </div>
 */
var Popup = function() {
    this.initialize.apply(this, arguments);
};
Popup.prototype = {
    initialize: function (name, width, height, top, left) {
        // Constructor
        if (name) {
            this.element = document.querySelector('.bloomnation-modal[name="' + name + '"]');
            this.setStyles(width, height, top, left);
        } else {
            console.warn('First param "name" for Popup is required');
        }
    },
    setStyles: function (width, height, top, left) {
        // Set style if values isset
        if (width) {
            this.element.style.width = width + 'px';
        }
        if (height) {
            this.element.style.height = height + 'px';
        }
        if (top) {
            this.element.style.top = top;
        }
        if (left) {
            this.element.style.left = left;
        }

        return this;
    },
    show: function () {
        // show popup
        this.element.style.display = 'block';
        return this;
    },
    hide: function () {
        // hide popup
        this.element.style.display = 'none';
        return this;
    }
};