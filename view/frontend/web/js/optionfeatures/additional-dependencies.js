/* global window */
/* global cash */
(function () {
    'use strict';

    /**
     * We have to register global jQuery.
     * Becuase of direct access to it in MageWorx_OptionFeatures/js/swatches/additional:323
     */
    window.jQuery = cash;
})();
