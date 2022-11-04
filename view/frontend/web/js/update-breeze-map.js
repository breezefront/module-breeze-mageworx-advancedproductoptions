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

    [
        'dropdown',
        'radio',
        'checkbox',
        'empty'
    ].forEach(
        (name) =>
            $.breezemap[`text!MageWorx_OptionFeatures/template/option/gallery/${name}.html`] =
                $(`#MageWorx_OptionFeatures_option_gallery_${name}`).html()
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
