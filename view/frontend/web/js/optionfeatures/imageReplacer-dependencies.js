/* global $ */
(function () {
    'use strict';

    if (!$.when) {
        $.when = (promise) => {
            return promise;
        }
    }
})();
