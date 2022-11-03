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
                type = parseInt($this.data('option-type'), 10),
                label = $this.data('option-label'),
                thumb = $this.data('option-tooltip-thumb'),
                value = $this.data('option-tooltip-value'),
                width = $this.data('thumb-width'),
                height = $this.data('thumb-height'),
                $image,
                $title;

            if (!$element.length) {
                $element = $('<div class="' +
                    $widget.options.tooltipClass +
                    '" style="display: none"><div class="text"></div><div class="corner"></div></div>'
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
                        top: $this.offset().top + $this.height() + 10
                    }).show();
                }, $widget.options.delay);
            }, function () {
                $element.hide();
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
})();
