(function () {
    'use strict';

    if (!$.breezemap.uiRegistry) {
        $.breezemap.uiRegistry = {
            get: function (name) {
                return window[name];
            },
            set: function (name, value) {
                window[name] = value;
            }
        };
    }
})();
