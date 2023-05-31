define([
    'jquery',
    'underscore'
], function ($, _) {
    'use strict';

    const key = _.findKey($.breezemap, (item) => {
            return typeof item.addCandidate === 'function'
                && typeof item.removeCandidate === 'function';
        });

    if (key) $.breezemap.mwImageReplacer = $.breezemap[key];
});
