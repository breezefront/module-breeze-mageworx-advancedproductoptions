/* global $ */
/* global window */
(function () {
    'use strict';

    [
        'optionSwatches',
        'optionFeatures',
        'optionFeaturesIsDefault',
        'optionAdditionalImages'
    ].forEach(
        (component) =>
            $.breezemap[component] = $.fn[component] && $.fn[component].bind($.fn)
    );

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
