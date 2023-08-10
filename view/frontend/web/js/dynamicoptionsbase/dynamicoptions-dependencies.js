define([
    'jquery'
], function ($) {
    'use strict';

    $.breezemap.dynamicOptionsDefaultCalculator = {
        calculate: function (dynamicOptions, pricePerUnit) {
            var dynamicPrice = 1;

            $.each(dynamicOptions, (index, element) => {
                if (typeof element['value'] !== 'undefined' && element.value) {
                    dynamicPrice *= element['value'];
                } else if (index !== 'price_per_unit') {
                    dynamicPrice *= 0;
                }
            });

            dynamicPrice *= pricePerUnit;

            return dynamicPrice;
        }
    };
});
