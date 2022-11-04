/* global $ */
(() => {
    'use strict';

    if (!$.fn.mage) {
        /**
         * Copied form original Magento code
         * magento/magento2-base/lib/web/mage/mage.js
         */
        $.fn.mage = function (component, config) {
            config = config || {};

            this.each(function (index, el) {
                const $el = $(el);

                $el[component].bind($el, config)
            });

            return this;
        };
    }
})();
