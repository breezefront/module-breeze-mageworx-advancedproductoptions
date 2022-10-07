$.widget('mageworxOptionBase', {
    component: 'optionBase',

    options: {
        optionConfig: {},
        systemConfig: {},
        productConfig: {},
        productQtySelector: '#qty',
        productPriceInfoSelector: '.product-info-price',
        mageworxAdditionalPriceInfoSelector: '.mageworx-product-final-price',
        extendedOptionsConfig: {},
        priceHolderSelector: '.price-box',
        dateDropdownsSelector: '[data-role=calendar-dropdown]',
        optionsSelector: '.product-custom-option',
        optionHandlers: {},
        optionTemplate: '<%= data.label %>' +
        '<% if (data.finalPrice.value) { %>' +
        ' +<%- data.finalPrice.formatted %>' +
        '<% } %>',
        controlContainer: 'dd',
        priceTemplate: '<span class="price"><%- data.formatted %></span>',
        localePriceFormat: {},
        productFinalPriceExclTax: 0.0,
        productRegularPriceExclTax: 0.0,
        productFinalPriceInclTax: 0.0,
        productRegularPriceInclTax: 0.0,
        configUrl: '',
        priceDisplayMode: 0,
        catalogPriceContainsTax: false,
        configurableContainerSelector: '[data-role=swatch-options]',
        configurableSelector: '.swatch-option'
    },
    updaters: {},

    /**
     * @private
     */
    _init: function initPriceBundle() {
        var self = this;
        _.each( this.updaters, function(value, key) {
            try {
                self.triggerAfterInitPrice(self.getUpdater(key));
            } catch (e) {
                console.log('Error:');
                console.log(e);
            }
        });

        this.processApplyChanges();
    },

    onUpdatePrice: function onUpdatePrice(event, prices) {
        return this.updatePrice(prices);
    },

    _create: function create() {
        var self = this;
        // $(document).on('breeze:load', () => {

            window.mageworxOptionBase = self;

            // Get existing updaters from registry
            var updaters = window.mageworxOptionUpdaters;
            if (!updaters) {
                updaters = {};
            }

            var sortOrderArray = Object.keys(updaters).sort(function(a, b) {
                return a - b;
            });

            // Add each updater according to sort order
            $.each(sortOrderArray, function( key, value ) {
                if (!updaters.hasOwnProperty(value)) {
                    return;
                }
                self.addUpdater(value, updaters[value])
            });

            // Bind option change event listener
            self.addOptionChangeListeners();
            $('#product-options-wrapper').show();
        // });
    },

    /**
     * Add updater to the collection
     * Trigger first run of updater
     * @param name
     * @param updater
     */
    addUpdater: function addUpdater(name, updater) {
        var updaterInstance;
        var self = this;
        try {
            updaterInstance = this.getUpdater(name);
        } catch (e) {
            updaterInstance = null;
        }

        if (updaterInstance) {
            updaterInstance.options = updater.options;
            if (self.options.productId != window.productId && !self.options.isInUpdateProcess) {
                self.getBaseConfig().then(function(data) {
                    try {
                        self.runUpdater(updaterInstance);
                    } catch (e) {
                        console.log('Error:');
                        console.log(e);
                    }
                }).catch(function(e) {
                    console.log(e)
                });
            } else if (self.options.productId == window.productId) {
                try {
                    self.runUpdater(updaterInstance);
                } catch (e) {
                    console.log('Error:');
                    console.log(e);
                }
            }
        } else {
            this.updaters[name] = updater;
            try {
                updaterInstance = this.getUpdater(name);
                this.runUpdater(updaterInstance);
            } catch (e) {
                console.log('Error:');
                console.log(e);
            }
        }
    },

    getBaseConfig: function getBaseConfig() {
        var self = this;
        self.options.isInUpdateProcess = true;

        return new Promise(function(resolve, reject) {
            $.ajax({
                url: self.options.configUrl,
                data: {
                    productId: window.productId
                },
                success: function(data) {
                    $.each(data, function (index, element) {
                        self.options[index] = JSON.parse(element);
                    });
                    self.options.isInUpdateProcess = false;
                    resolve(data) // Resolve promise and go to then()
                },
                error: function(e) {
                    self.options.isInUpdateProcess = false;
                    reject(e) // Reject the promise and go to catch()
                }
            });
        });
    },

    /**
     * Get updater by name from collection
     * @param name
     * @returns {*}
     */
    getUpdater: function (name) {
        if (_.isUndefined(this.updaters[name])) {
            throw 'Undefined updater with name: ' + name;
        }

        return this.updaters[name];
    },

    /**
     * Run all updaters (first run)
     */
    runUpdater: function (updater) {
        var handler = updater.firstRun;
        if (typeof handler != 'undefined' && handler && handler instanceof Function) {
            handler.apply(updater, [this.options.optionConfig, this.options.productConfig, this, updater]);
        }
    },

    /**
     * Run all updaters (after init price)
     */
    triggerAfterInitPrice: function (updater) {
        var handler = updater.afterInitPrice;
        if (typeof handler != 'undefined' && handler && handler instanceof Function) {
            handler.apply(updater, [this.options.optionConfig, this.options.productConfig, this, updater]);
        }
    },

    /**
     * Add event listener on each option change (for updaters)
     */
    addOptionChangeListeners: function addListeners() {
        var self = this;
        $(this.options.optionsSelector, this.getFormElement()).on('change', this.optionChanged.bind(this));

        //for configurable
        var $configurableSwatchContainer = $(this.options.configurableContainerSelector);
        $configurableSwatchContainer.on('click', this.options.configurableSelector, function () {
            if (self.isAnyOptionSelected() || self.isNonSelectableOptionsUsed()) {
                self.processApplyChanges();
            }
        });

        //for product qty
        $('body').on('change', this.options.productQtySelector, function () {
            self.processApplyChanges();
        });
    },

    /**
     * Collect and apply all logic from APO extensions which add something to option value title
     * example: price templates, stock messages, etc
     */
    setOptionValueTitle: function setOptionValueTitle(newOptionConfig)
    {
        var form  = this.getFormElement(),
            options = $('.product-custom-option', form),
            self = this,
            config = self.options,
            optionConfig = config.optionConfig,
            priceSymbol = config.localePriceFormat.priceSymbol;

        if (!_.isUndefined(newOptionConfig)) {
            optionConfig = newOptionConfig;
        }

        this._updateSelectOptions(options.filter('select'), optionConfig, priceSymbol);
        this._updateInputOptions(options.filter('input'), optionConfig, priceSymbol);
    },

    /**
     * Make changes to select options
     * @param options
     * @param opConfig
     * @param priceSymbol
     */
    _updateSelectOptions: function(options, opConfig, priceSymbol)
    {
        var self = this;
        options.each(function (index, element) {
            var $element = $(element);

            if ($element.hasClass('datetime-picker') ||
                $element.hasClass('text-input') ||
                $element.hasClass('input-text') ||
                $element.attr('type') == 'file'
            ) {
                return true;
            }

            var optionId = $.catalog.priceUtils.findOptionId($element),
                optionConfig = opConfig[optionId];

            $element.find('option').each(function (idx, option) {
                var $option = $(option),
                    optionValue = $option.val();

                if (!optionValue && optionValue !== 0) {
                    return;
                }

                var optionValueConfig = optionConfig[optionValue];

                self.getOptionText($option, optionValueConfig, priceSymbol);
            });
        });
    },

    /**
     * Make changes to select options
     * @param options
     * @param opConfig
     * @param priceSymbol
     */
    _updateInputOptions: function(options, opConfig, priceSymbol)
    {
        var self = this;
        options.each(function (index, element) {
            var $element = $(element);

            if ($element.hasClass('datetime-picker') ||
                $element.hasClass('text-input') ||
                $element.hasClass('input-text') ||
                $element.attr('type') == 'file'
            ) {
                return true;
            }

            var optionId = $.catalog.priceUtils.findOptionId($element),
                optionValue = $element.val();

            if (!optionValue && optionValue !== 0) {
                return;
            }

            var optionConfig = opConfig[optionId],
                optionValueConfig = optionConfig[optionValue];

            self.getOptionText($element.next('label'), optionValueConfig, priceSymbol);
        });
    },

    /**
     * Formatting information about the option text
     * @param $option
     * @param optionValueConfig
     * @param priceSymbol
     */
    getOptionText: function($option, optionValueConfig, priceSymbol)
    {
        var title = optionValueConfig && optionValueConfig.name,
            valuePrice = $.catalog.priceUtils.formatPrice(optionValueConfig.prices.finalPrice.amount),
            stockMessage = '',
            specialPriceDisplayNode = '';

        if (optionValueConfig) {
            if (!_.isEmpty(optionValueConfig.special_price_display_node)) {
                specialPriceDisplayNode = optionValueConfig.special_price_display_node;
            }
            if (!_.isEmpty(optionValueConfig.stockMessage)) {
                stockMessage = optionValueConfig.stockMessage;
            }
            if (!_.isEmpty(optionValueConfig.title)) {
                title = optionValueConfig.title;
            }
            if (optionValueConfig.prices.basePrice.amount) {
                if(optionValueConfig.prices.finalPrice.amount
                    && optionValueConfig.prices.finalPrice.amount > optionValueConfig.prices.basePrice.amount
                ) {
                    valuePrice = optionValueConfig.prices.finalPrice.amount;
                } else {
                    valuePrice = optionValueConfig.prices.basePrice.amount;
                }
            }
        }
        if (specialPriceDisplayNode) {
            $option.text(title + ' ' + specialPriceDisplayNode + ' ' + stockMessage);
        } else if (stockMessage) {
            if (parseFloat(optionValueConfig.prices.finalPrice.amount) > 0) {
                $option.text(title + ' +' + priceSymbol + valuePrice + ' ' + stockMessage);
            } else if (parseFloat(optionValueConfig.prices.finalPrice.amount) < 0) {
                valuePrice = - valuePrice;
                $option.text(title + ' -'+ priceSymbol + valuePrice + ' ' + stockMessage);
            } else {
                $option.text(title + ' ' + stockMessage);
            }
        }
    },

    /**
     * Custom behavior on getting options:
     * now widget able to deep merge accepted configuration with instance options.
     * @param  {Object}  options
     * @return {$.Widget}
     * @private
     */
    _setOptions: function setOptions(options) {
        $.extend(true, this.options, options);
        return this._super(options);
    },

    /**
     * Find corresponding form element in DOM
     * Throws exception when form is not found
     * @returns {$}
     */
    getFormElement: function () {
        var $form;
        if (this.options.systemConfig.area === 'adminhtml') {
            $form = $('#product_composite_configure_form');
        } else if (this.element.is('form')) {
            $form = this.element;
        } else {
            $form = this.element.closest('form');
        }

        if ($form.length === 0) {
            throw 'Invalid or empty form element';
        }

        return $form;
    },

    /**
     * Custom option change-event handler
     * @param {Event} event
     * @private
     */
    optionChanged: function onOptionChanged(event) {
        var option = $(event.target);
        option.data('optionContainer', option.closest(this.options.controlContainer));

        $.each(this.updaters, function (i, e) {
            var handler = e.update;
            if (handler && handler instanceof Function) {
                handler.apply(e, [option, this.options.optionConfig, this.options.productConfig, this]);
            }
        }.bind(this));

        this.processApplyChanges();
    },

    /**
     * Process applyChanges events of APO extensions
     */
    processApplyChanges: function processApplyChanges() {
        $.each(this.updaters, function (i, e) {
            var handler = e.applyChanges;
            if (handler && handler instanceof Function) {
                handler.apply(e, [this, this.options.productConfig]);
            }
        }.bind(this));
    },

    /**
     * Set product final price
     * @param finalPrice
     */
    setProductFinalPrice: function (finalPrice) {
        var config = this.options,
            format = config.priceFormat,
            template = config.priceTemplate,
            $pc = $(config.productPriceInfoSelector).find('[data-price-type="finalPrice"]'),
            templateData = {};

        if (_.isUndefined($pc)) {
            return;
        }

        if (finalPrice < 0) {
            finalPrice = 0;
        }

        template = _.template(template);
        templateData.data = {
            value: finalPrice,
            formatted: $.catalog.priceUtils.formatPrice(finalPrice, format)
        };

        // $pc.hide();
        setTimeout(function () {
            $pc.html(template(templateData));
            // $pc.fadeIn(500);
        }, 110)
    },

    /**
     * Set product final price
     * @param finalPrice
     */
    setAdditionalProductFinalPrice: function (finalPrice) {
        var config = this.options,
            format = config.priceFormat,
            template = config.priceTemplate,
            $pc = $(config.mageworxAdditionalPriceInfoSelector).find('[data-price-type="finalPrice"]'),
            templateData = {};

        if (_.isUndefined($pc)) {
            return;
        }

        if (finalPrice < 0) {
            finalPrice = 0;
        }

        template = _.template(template);
        templateData.data = {
            value: finalPrice,
            formatted: $.catalog.priceUtils.formatPrice(finalPrice, format)
        };

        $pc.hide();
        setTimeout(function () {
            $pc.html(template(templateData));
            $pc.fadeIn(500);
        }, 110)
    },

    setProductPriceExclTax: function (priceExcludeTax) {
        var config = this.options,
            format = config.priceFormat,
            template = config.priceTemplate,
            $pc = $(config.productPriceInfoSelector).find('[data-price-type="basePrice"]'),
            templateData = {};

        if (_.isUndefined($pc)) {
            return;
        }

        if (priceExcludeTax < 0) {
            priceExcludeTax = 0;
        }

        template = _.template(template);
        templateData.data = {
            value: priceExcludeTax,
            formatted: $.catalog.priceUtils.formatPrice(priceExcludeTax, format)
        };

        $pc.hide();
        setTimeout(function () {
            $pc.html(template(templateData));
            $pc.fadeIn(500);
        }, 110)
    },

    setAdditionalProductPriceExclTax: function (priceExcludeTax) {
        var config = this.options,
            format = config.priceFormat,
            template = config.priceTemplate,
            $pc = $(config.mageworxAdditionalPriceInfoSelector).find('[data-price-type="basePrice"]'),
            templateData = {};

        if (_.isUndefined($pc)) {
            return;
        }

        if (priceExcludeTax < 0) {
            priceExcludeTax = 0;
        }

        template = _.template(template);
        templateData.data = {
            value: priceExcludeTax,
            formatted: $.catalog.priceUtils.formatPrice(priceExcludeTax, format)
        };

        $pc.hide();
        setTimeout(function () {
            $pc.html(template(templateData));
            $pc.fadeIn(500);
        }, 110)
    },

    /**
     * Set product regular price
     * @param regularPrice
     */
    setProductRegularPrice: function (regularPrice) {
        var config = this.options,
            format = config.priceFormat,
            template = config.priceTemplate,
            $pc = $(config.productPriceInfoSelector).find('[data-price-type="oldPrice"]'),
            templateData = {};

        if (_.isUndefined($pc)) {
            return;
        }

        if (regularPrice < 0) {
            regularPrice = 0;
        }

        template = _.template(template);
        templateData.data = {
            value: regularPrice,
            formatted: $.catalog.priceUtils.formatPrice(regularPrice, format)
        };

        // $pc.hide();
        setTimeout(function () {
            $pc.html(template(templateData));
            // $pc.fadeIn(500);
        }, 110)
    },

    /**
     * Set product regular price
     * @param regularPrice
     */
    setAdditionalProductRegularPrice: function (regularPrice) {
        var config = this.options,
            format = config.priceFormat,
            template = config.priceTemplate,
            $pc = $(config.mageworxAdditionalPriceInfoSelector).find('[data-price-type="oldPrice"]'),
            templateData = {};

        if (_.isUndefined($pc)) {
            return;
        }

        if (regularPrice < 0) {
            regularPrice = 0;
        }

        template = _.template(template);
        templateData.data = {
            value: regularPrice,
            formatted: $.catalog.priceUtils.formatPrice(regularPrice, format)
        };

        $pc.hide();
        setTimeout(function () {
            $pc.html(template(templateData));
            $pc.fadeIn(500);
        }, 110)
    },

    /**
     * Check by the option id is it an one-time option
     * @param optionId
     * @returns {boolean}
     */
    isOneTimeOption: function (optionId) {
        var config = this.options;

        return config.extendedOptionsConfig &&
            config.extendedOptionsConfig[optionId] &&
            config.extendedOptionsConfig[optionId]['one_time'] &&
            config.extendedOptionsConfig[optionId]['one_time'] != '0';
    },

    /**
     * Check if any of non-selectableoption (date/time/datetime, file, input, textarea) has value
     * @returns {boolean}
     */
    isNonSelectableOptionsUsed: function () {
        var self = this,
            form = this.getFormElement(),
            options = $(this.options.optionsSelector, form),
            isUsed = false;

        options.filter('input[type="text"], textarea, input[type="file"]').each(function (index, element) {
            var $element = $(element),
                value = $element.val();

            if (!_.isUndefined(value) && value.length > 0) {
                isUsed = true;
                return;
            }
        });
        return isUsed;
    },

    /**
     * Get price from html
     *
     * @param element
     * @returns {number}
     */
    getPriceFromHtmlElement: function getPrice(element) {
        var pricePattern = this.options.localePriceFormat,
            ds = pricePattern.decimalSymbol,
            gs = pricePattern.groupSymbol,
            pf = pricePattern.pattern,
            ps = pricePattern.priceSymbol,
            price = 0,
            html = $(element).text(),
            priceCalculated;

        priceCalculated = parseFloat(html.replace(new RegExp("'\'" + gs, 'g'), '')
            .replace(new RegExp("'\'" + ds, 'g'), '.')
            .replace(/[^0-9\.,]/g, ''));

        if (priceCalculated) {
            price = priceCalculated;
        }

        return price;
    },

    getOptionHtmlById: function (optionId) {
        var $el = $(this.options.optionsSelector + '[name^="options[' + optionId + ']"]', this.getFormElement())
            .first()
            .closest('.field[data-option_id]');
        if ($el.length == 0) {
            $el = $(this.options.optionsSelector + '[name^="options_' + optionId + '_file"]', this.getFormElement())
                .first()
                .closest('.field[data-option_id]');
        }
        return $el;
    },

    /**
     * Check is product catalog price already contains tax
     * @returns {number}
     */
    isPriceWithTax: function () {
        return this.toBoolean(this.options.catalogPriceContainsTax);
    },

    /**
     * Get price display mode for prices on the product view page:
     * 1 - without tax
     * 2 - with tax
     * 3 - both (with and without tax)
     * @returns {number}
     */
    getPriceDisplayMode: function () {
        return parseInt(this.options.priceDisplayMode);
    },

    /**
     * Convert value to the boolean type
     * @param value
     * @returns {boolean}
     */
    toBoolean: function (value) {
        return !(value == 0 ||
            value == "0" ||
            value == false);
    },

    /**
     * Parse option ID from the data-selector attribute of the option
     * @param $option
     * @returns {int|NaN}
     */
    getOptionId: function ($option) {
        //compatibility with ie11
        if (navigator.userAgent.indexOf('rv:11') == -1) {
            var regExp = /(options\[){1}(\d+)+(\]){1}/;
            var re = new RegExp(regExp.source, 'g');
        } else {
            var re = new RegExp("/(options\[){1}(\d+)+(\]){1}/", "g");
        }
        re.test($option.attr('data-selector'));

        return parseInt(RegExp.$2);
    },


    getDateDropdownConfig: function (optionConfig, siblings)
    {
        var isNeedToUpdate = true;

        siblings.each(function (index, el) {
            isNeedToUpdate = isNeedToUpdate && !!$(el).val();
        });

        return isNeedToUpdate ? optionConfig : {};
    },

    getApoData: function getApoData() {
        if (_.isUndefined(window.apoData)) {
            window.apoData = {};
        }
        return window.apoData;
    },

    isAnyOptionSelected: function isAnyOptionSelected() {
        var isAnyOptionSelected = false,
            self = this;
        $.each(self.getApoData(), function( index, value ) {
            if (!_.isUndefined(value) && value.length > 0) {
                isAnyOptionSelected = true;
            }
        });
        return isAnyOptionSelected;
    },

    getNewlyShowedOptionValues: function getNewlyShowedOptionValues() {
        if (_.isArray(window.newlyShowedOptionValues) !== true) {
            window.newlyShowedOptionValues = [];
        }
        return window.newlyShowedOptionValues;
    },

    addNewlyShowedOptionValue: function addNewlyShowedOptionValue(optionValue) {
        if (_.isArray(window.newlyShowedOptionValues) !== true) {
            window.newlyShowedOptionValues = [];
        }
        var index = window.newlyShowedOptionValues.indexOf(optionValue);
        if (index === -1) {
            window.newlyShowedOptionValues.push(optionValue);
        }
    },

    removeNewlyShowedOptionValue: function addNewlyShowedOptionValue(optionValue) {
        if (_.isArray(window.newlyShowedOptionValues) !== true) {
            window.newlyShowedOptionValues = [];
        }
        var index = window.newlyShowedOptionValues.indexOf(optionValue);
        if (index !== -1) {
            window.newlyShowedOptionValues.splice(index, 1);
        }
    },

    getSelectedData: function getSelectedData() {
        if (_.isUndefined(window.apoSelectedData)) {
            window.apoSelectedData = {};
        }
        return window.apoSelectedData;
    },

    collectSelectedData: function collectSelectedData() {
        window.apoSelectedData = {};

        var self = this,
            form = this.getFormElement(),
            config = this.options,
            options = $(config.optionsSelector, form);

        options.filter('select').each(function (index, element) {
            var $element = $(element),
                optionId = $.catalog.priceUtils.findOptionId($element),
                optionConfig = config.optionConfig && config.optionConfig[optionId],
                values = $element.val();

            if (_.isUndefined(values) || !values) {
                return;
            }

            if (!Array.isArray(values)) {
                values = [values];
            }

            $(values).each(function (i, valueId) {
                if (_.isUndefined(optionConfig[valueId])) {
                    if (_.isUndefined(optionConfig.prices)) {
                        return;
                    }

                    var dateDropdowns = $element.parent().find(config.dateDropdownsSelector);
                    if (!_.isUndefined(dateDropdowns)) {
                        return;
                    }

                    if ($element.closest('.field').css('display') == 'none') {
                        $element.val('');
                        return;
                    }
                }

                if (Array.isArray(window.apoSelectedData[optionId])) {
                    window.apoSelectedData[optionId].push(valueId);
                } else {
                    window.apoSelectedData[optionId] = [];
                    window.apoSelectedData[optionId].push(valueId);
                }
            });
        });

        options.filter('input[type="radio"], input[type="checkbox"]').each(function (index, element) {
            var $element = $(element),
                optionId = $.catalog.priceUtils.findOptionId($element),
                optionConfig = config.optionConfig && config.optionConfig[optionId],
                valueId = $element.val();

            if (!$element.is(':checked')) {
                return;
            }

            if (_.isUndefined(valueId) || !valueId) {
                return;
            }

            if (Array.isArray(window.apoSelectedData[optionId])) {
                window.apoSelectedData[optionId].push(valueId);
            } else {
                window.apoSelectedData[optionId] = [];
                window.apoSelectedData[optionId].push(valueId);
            }
        });
    }
});
