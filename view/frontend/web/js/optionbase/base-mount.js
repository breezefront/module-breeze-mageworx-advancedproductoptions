/* global $ */
(function () {
    'use strict';

    $(document).on('breeze:mount:optionBase', function (event, data) {
        $(data.el).optionBase(data.settings);
    });
})();
