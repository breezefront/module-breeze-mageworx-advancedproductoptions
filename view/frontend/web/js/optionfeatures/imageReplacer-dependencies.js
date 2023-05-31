/* global $ */
(function () {
    'use strict';

    if (!$.Deferred) {
        // https://stackoverflow.com/a/68851118
        $.Deferred = () => {
            function Defer() {
                const self = this;

                self.promise = () => {
                    return new Promise((resolve, reject) => {
                        self.resolve = resolve;
                        self.reject = reject;
                    });
                };
            }

            return new Defer();
        }
    }

    if (!$.when) {
        $.when = (promise) => {
            return promise;
        }
    }
})();
