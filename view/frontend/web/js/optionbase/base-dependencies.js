/* global $ */
/* global _ */
(function () {
    'use strict';

    if (!$.breezemap['mage/template']) {
        $.breezemap['mage/template'] = _.template.bind(_);
    }

    if (!$.breezemap.uiRegistry) {
        $.breezemap.uiRegistry = {
            get: function (name) {
                return window[name]
            },
            set: function (name, value) {
                window[name] = value
            }
        };
    }
})();
