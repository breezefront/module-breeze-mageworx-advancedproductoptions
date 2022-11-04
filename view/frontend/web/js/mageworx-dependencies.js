(() => {
    'use strict';

    /**
     * Implement simple tooltip for for swatches
     */
    $.widget('mageworx.qtip', {
        options: {
                delay: 200,                             //how much ms before tooltip to show
                tooltipClass: 'swatch-option-tooltip'  //configurable, but remember about css
            },

        /**
         * {@inheritdoc}
         */
        _init: function () {
            var $widget = this,
                $this = this.element,
                $element = $('.' + $widget.options.tooltipClass),
                timer,
                $text;

            if (!$element.length) {
                $element = $('<div class="' +
                    $widget.options.tooltipClass +
                    '"><div class="text"></div><div class="corner"></div></div>'
                );
                $('body').append($element);
            }

            $text = $element.find('.text');

            $this.hover(function () {
                if ($this.hasClass('disabled')) {
                    return;
                }
                timer = setTimeout(function () {
                    $text.html($widget.options.content.text);

                    $element.css({
                        left: $this.offset().left,
                        top: $this.offset().top + $this.height() + 10,
                        display: 'block'
                    });
                }, $widget.options.delay);
            }, function () {
                $element.css({
                    display: 'none'
                });
                clearTimeout(timer);
            });

            $(document).on('tap.qtip', function () {
                $element.hide();
                clearTimeout(timer);
            });

            $this.on('tap', function (event) {
                event.stopPropagation();
            });
        },

        destroy: function () {
            $(document).off('tap.qtip');
            this._super();
        }
    });

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
