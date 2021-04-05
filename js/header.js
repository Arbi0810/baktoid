document.addEventListener('DOMContentLoaded', function(evt) {
    'use strict';

    /**
     * Toggles the nav dropdown menu
     */
    var dropdownNav = (function() {
        var toggle = document.getElementById('dropdown-nav-toggle--js'),
            dropdown = document.getElementById('dropdown-nav--js'),
            DROPDOWN_CLASS_VISIBLE = 'dropdown-nav--visible';

        function toggleAriaExpanded(el) {
            el.setAttribute('aria-expanded', dropdown.classList.contains(DROPDOWN_CLASS_VISIBLE))
        }

        function initEventListeners() {
            toggle.addEventListener('click', function(evt) {
                evt.stopPropagation();
                dropdown.classList.toggle(DROPDOWN_CLASS_VISIBLE);
                toggleAriaExpanded(toggle)
            });

            dropdown.addEventListener('click', function(evt) {
                evt.stopPropagation();
            });

            document.addEventListener('click', function(evt) {
                dropdown.classList.remove(DROPDOWN_CLASS_VISIBLE);
                toggleAriaExpanded(toggle);
            });
        }

        function init() {
            if (toggle && dropdown) {
               initEventListeners();
            }
        }

        return {
            init: init
        };
    })();

    dropdownNav.init();
});
