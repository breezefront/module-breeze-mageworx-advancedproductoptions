/* global $ */
(function () {
    'use strict';

    function getNoVendor(name) {
        const nameNoVendor = name.replace('mageworx', '');

        return nameNoVendor.charAt(0).toLowerCase() + nameNoVendor.slice(1);
    }

    function _getFromFn(name) {

        return $.fn[name] && $.fn[name].bind($.fn)
    }

    const mageworxAdpRegistry = {
        get: function (name) {
            const nameNoVendor = getNoVendor(name);

            if (!window[name]) {
                window.name = _getFromFn(name) || _getFromFn(nameNoVendor);
            }
        },

        set: function (name, value) {
            window[name] = value;
        }
    }

    $.breezemap.optionSwatches = $.fn.optionSwatches && $.fn.optionSwatches.bind($.fn);
    if (!$.breezemap.uiRegistry) {
        $.breezemap.uiRegistry = mageworxAdpRegistry;
    }
})();
