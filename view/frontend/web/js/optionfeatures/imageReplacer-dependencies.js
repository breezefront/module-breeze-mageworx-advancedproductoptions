/* global $ */
(function () {
    'use strict';

    if (!$.Deferred) {
        // https://stackoverflow.com/a/68851118
        $.Deferred = () => {
            function Defer() {
                var promise = new Promise((resolve, reject) => {
                    this.resolve = resolve;
                    this.reject = reject;
                });

                this.promise = () => promise;
            }

            return new Defer();
        };
    }

    if (!$.when) {
        $.when = (promise) => {
            return promise;
        }
    }
})();
