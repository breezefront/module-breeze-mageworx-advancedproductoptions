$.widget('mageworxOptionFeatures', {
    component: 'optionFeatures',

    options: {
        absolutePriceOptionTemplate: '<%= data.label %>' +
            '<% if (data.finalPrice.value) { %>' +
            ' <%- data.finalPrice.formatted %>' +
            '<% } %>'
    },

    /**
     * Triggers one time at first run (from base.js)
     * @param optionConfig
     * @param productConfig
     * @param base
     * @param self
     */
    firstRun: function firstRun(optionConfig, productConfig, base, self) {
        const $hintIcon = $('#mageworx_shareable_hint_icon');

        //shareable link
        $hintIcon.length && $hintIcon.qtip({
            content: {
                text: this.options.shareable_link_hint_text
            },
            style: {
                classes: 'qtip-light'
            },
            position: {
                target: false
            }
        });

        $('#mageworx_shareable_link').on('click', function () {
            try {
                self.copyTextToClipboard(self.getShareableLink(base));
                $('.mageworx-shareable-link-container').hide();
                $('.mageworx-shareable-link-success-container').show();

                setTimeout(function () {
                    $('.mageworx-shareable-link-container').show();
                    $('.mageworx-shareable-link-success-container').hide();
                }, 2000);
            } catch (error) {
                console.log('Something goes wrong. Unable to copy');
            }
        });

        setTimeout(function () {

            // Qty input
            $('.mageworx-option-qty').each(function () {

                $(this).on('change', function () {

                    var optionInput = $("[data-selector='" + $(this).attr('data-parent-selector') + "']");
                    optionInput.trigger('change');
                });
            });
        }, 500);

        // Option\Value Description & tooltip
        var extendedOptionsConfig = typeof base.options.extendedOptionsConfig != 'undefined' ?
            base.options.extendedOptionsConfig : {};

        for (var option_id in optionConfig) {
            if (!optionConfig.hasOwnProperty(option_id)) {
                continue;
            }

            var description = extendedOptionsConfig[option_id]['description'],
                $option = base.getOptionHtmlById(option_id);
            if (1 > $option.length) {
                console.log('Empty option container for option with id: ' + option_id);
                continue;
            }

            if (this.options.option_description_enabled && !_.isEmpty(extendedOptionsConfig[option_id]['description'])) {
                if (this.options.option_description_mode == this.options.option_description_modes.tooltip) {
                    var $element = $option.find('label span')
                        .first();
                    if ($element.length == 0) {
                        $element = $option.find('fieldset legend span')
                            .first();
                    }
                    $element.css('border-bottom', '1px dotted black');
                    $element.qtip({
                        content: {
                            text: description
                        },
                        style: {
                            classes: 'qtip-light'
                        },
                        position: {
                            target: false
                        }
                    });
                } else if (this.options.option_description_mode == this.options.option_description_modes.text) {
                    var $label = $option.find('label');
                    if ($label.length > 0) {
                        $label
                            .first()
                            .after($('<p class="option-description-text">' + description + '</p>'));
                    } else {
                        $label = $option.find('span');
                        $label
                            .first()
                            .parent()
                            .after($('<p class="option-description-text">' + description + '</p>'));
                    }
                } else {
                    console.log('Unknown option mode');
                }
            }

            this._addValueDescription($option, optionConfig, extendedOptionsConfig, this.options.value_description_enabled);
        }
    },

    /**
     * Triggers each time when option is updated\changed (from the base.js)
     * @param option
     * @param optionConfig
     * @param productConfig
     * @param base
     */
    update: function update(option, optionConfig, productConfig, base) {
        var $option = $(option),
            $optionQtyInput = $("[data-parent-selector='" + $option.attr('data-selector') + "']"),
            optionQty = 1,
            values = $option.val(),
            optionId = base.getOptionId($option);

        if ($optionQtyInput.length) {
            if (($option.is(':checked') || $('option:selected', $option).val())) {
                if ($optionQtyInput.val() == 0) {
                    $optionQtyInput.val(1);
                }
                $optionQtyInput.attr('disabled', false);
                if ($option.attr('type') == 'radio' && !$option.hasClass('required')) {
                    if ($option.context.id == "options_" + optionId) {
                        $optionQtyInput.val(0);
                        $optionQtyInput.attr('disabled', true);
                    }
                }
            } else if (!$option.is(':checked') && !$('option:selected', $option).val()) {
                if ($optionQtyInput.attr('type') != 'hidden' && $option.attr('type') != 'radio') {
                    $optionQtyInput.val(0);
                    $optionQtyInput.attr('disabled', true);
                }
            }

            if (parseFloat($optionQtyInput.val())) {
                optionQty = parseFloat($optionQtyInput.val());
            }

            if (values) {
                if (!Array.isArray(values)) {
                    values = [values];
                }

                $(values).each(function (i, e) {
                    optionConfig[optionId][e]['qty'] = optionQty;
                });
            }
        }
    },

    /**
     * Triggers each time after the all updates when option was changed (from the base.js)
     * @param base
     * @param productConfig
     */
    applyChanges: function (base, productConfig) {
        this.base = base;

        var isAbsolutePriceUsed = true;
        if (_.isUndefined(productConfig.absolute_price) || productConfig.absolute_price == "0") {
            isAbsolutePriceUsed = false;
        }

        if (productConfig.type_id == 'configurable' && !isAbsolutePriceUsed) {


            var form = this.base.getFormElement(),
                config = this.base.options,
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
                        if ($element.closest('.field').css('display') == 'none') {
                            $element.val('');
                            return;
                        }
                    }
                });
            });

            options.filter('input[type="radio"], input[type="checkbox"]').each(function (index, element) {
                var $element = $(element),
                    optionId = $.catalog.priceUtils.findOptionId($element),
                    valueId = $element.val();

                if (!$element.is(':checked')) {
                    return;
                }

                if (typeof valueId == 'undefined' || !valueId) {
                    return;
                }

                if ($element.closest('.field').css('display') == 'none') {
                    $element.val('');
                    return;
                }
            });

            options.filter('input[type="text"], textarea, input[type="file"]').each(function (index, element) {
                var $element = $(element),
                    optionId = $.catalog.priceUtils.findOptionId($element),
                    value = $element.val();

                if (typeof value == 'undefined' || !value) {
                    if ($('#delete-options_' + optionId + '_file').length < 1) {
                        return;
                    }
                }

                if ($element.closest('.field').css('display') == 'none') {
                    $element.val('');
                    return;
                }
            });
            return;
        }

        if (_.isUndefined(productConfig.isUsedDynamicOptions)) {
            productConfig.isUsedDynamicOptions = false;
        }

        this.initProductPrice(productConfig);
        this.calculateSelectedOptionsPrice();
        this.applyProductPriceDisplayMode();

        if (!isAbsolutePriceUsed ||
            (isAbsolutePriceUsed && this.optionBasePrice <= 0) ||
            productConfig.isUsedDynamicOptions
        ) {
            this.productDefaultRegularPriceExclTax += parseFloat(this.optionOldPricePerItemExclTax);
            this.productDefaultFinalPriceExclTax += parseFloat(this.optionBasePricePerItem);
            this.productDefaultRegularPriceInclTax += parseFloat(this.optionOldPricePerItemInclTax);
            this.productDefaultFinalPriceInclTax += parseFloat(this.optionFinalPricePerItem);

            this.productPerItemRegularPriceExclTax += parseFloat(this.optionOldPricePerItemExclTax);
            this.productPerItemFinalPriceExclTax += parseFloat(this.optionBasePricePerItem);
            this.productPerItemRegularPriceInclTax += parseFloat(this.optionOldPricePerItemInclTax);
            this.productPerItemFinalPriceInclTax += parseFloat(this.optionFinalPricePerItem);

            this.productTotalRegularPriceExclTax += parseFloat(this.optionOldPriceExclTax);
            this.productTotalFinalPriceExclTax += parseFloat(this.optionBasePrice);
            this.productTotalRegularPriceInclTax += parseFloat(this.optionOldPriceInclTax);
            this.productTotalFinalPriceInclTax += parseFloat(this.optionFinalPrice);
        } else {
            this.productDefaultRegularPriceExclTax = parseFloat(this.optionOldPricePerItemExclTax);
            this.productDefaultFinalPriceExclTax = parseFloat(this.optionBasePricePerItem);
            this.productDefaultRegularPriceInclTax = parseFloat(this.optionOldPricePerItemInclTax);
            this.productDefaultFinalPriceInclTax = parseFloat(this.optionFinalPricePerItem);

            this.productPerItemRegularPriceExclTax = parseFloat(this.optionOldPricePerItemExclTax);
            this.productPerItemFinalPriceExclTax = parseFloat(this.optionBasePricePerItem);
            this.productPerItemRegularPriceInclTax = parseFloat(this.optionOldPricePerItemInclTax);
            this.productPerItemFinalPriceInclTax = parseFloat(this.optionFinalPricePerItem);

            this.productTotalRegularPriceExclTax = parseFloat(this.optionOldPriceExclTax);
            this.productTotalFinalPriceExclTax = parseFloat(this.optionBasePrice);
            this.productTotalRegularPriceInclTax = parseFloat(this.optionOldPriceInclTax);
            this.productTotalFinalPriceInclTax = parseFloat(this.optionFinalPrice);
        }

        // Set product prices according to price's display mode on the product view page
        // 1 - without tax
        // 2 - with tax
        // 3 - both (with and without tax)
        if (base.getPriceDisplayMode() == 1) {
            if (this.options.product_price_display_mode === 'per_item') {
                base.setProductRegularPrice(this.productPerItemRegularPriceExclTax);
                base.setProductFinalPrice(this.productPerItemFinalPriceExclTax);
            } else if (this.options.product_price_display_mode === 'final_price') {
                base.setProductRegularPrice(this.productTotalRegularPriceExclTax);
                base.setProductFinalPrice(this.productTotalFinalPriceExclTax);
            } else if (this.options.product_price_display_mode === 'disabled') {
                base.setProductRegularPrice(this.productDefaultRegularPriceExclTax);
                base.setProductFinalPrice(this.productDefaultFinalPriceExclTax);
            }
            if (this.options.additional_product_price_display_mode === 'per_item') {
                base.setAdditionalProductRegularPrice(this.productPerItemRegularPriceExclTax);
                base.setAdditionalProductFinalPrice(this.productPerItemFinalPriceExclTax);
            } else if (this.options.additional_product_price_display_mode === 'final_price') {
                base.setAdditionalProductRegularPrice(this.productTotalRegularPriceExclTax);
                base.setAdditionalProductFinalPrice(this.productTotalFinalPriceExclTax);
            } else if (this.options.additional_product_price_display_mode === 'disabled') {
                base.setAdditionalProductRegularPrice(this.productDefaultRegularPriceExclTax);
                base.setAdditionalProductFinalPrice(this.productDefaultFinalPriceExclTax);
            }
        } else {
            if (this.options.product_price_display_mode === 'per_item') {
                base.setProductRegularPrice(this.productPerItemRegularPriceInclTax);
                base.setProductFinalPrice(this.productPerItemFinalPriceInclTax);
            } else if (this.options.product_price_display_mode === 'final_price') {
                base.setProductRegularPrice(this.productTotalRegularPriceInclTax);
                base.setProductFinalPrice(this.productTotalFinalPriceInclTax);
            } else if (this.options.product_price_display_mode === 'disabled') {
                base.setProductRegularPrice(this.productDefaultRegularPriceInclTax);
                base.setProductFinalPrice(this.productDefaultFinalPriceInclTax);
            }
            if (this.options.additional_product_price_display_mode === 'per_item') {
                base.setAdditionalProductRegularPrice(this.productPerItemRegularPriceInclTax);
                base.setAdditionalProductFinalPrice(this.productPerItemFinalPriceInclTax);
            } else if (this.options.additional_product_price_display_mode === 'final_price') {
                base.setAdditionalProductRegularPrice(this.productTotalRegularPriceInclTax);
                base.setAdditionalProductFinalPrice(this.productTotalFinalPriceInclTax);
            } else {
                base.setAdditionalProductRegularPrice(this.productDefaultRegularPriceInclTax);
                base.setAdditionalProductFinalPrice(this.productDefaultFinalPriceInclTax);
            }
        }
        if (this.options.product_price_display_mode === 'per_item') {
            base.setProductPriceExclTax(this.productPerItemFinalPriceExclTax);
        } else if (this.options.product_price_display_mode === 'final_price') {
            base.setProductPriceExclTax(this.productTotalFinalPriceExclTax);
        } else if (this.options.product_price_display_mode === 'disabled') {
            base.setProductPriceExclTax(this.productDefaultFinalPriceExclTax);
        }
        if (this.options.additional_product_price_display_mode === 'per_item') {
            base.setAdditionalProductPriceExclTax(this.productPerItemFinalPriceExclTax);
        } else if (this.options.additional_product_price_display_mode === 'final_price') {
            base.setAdditionalProductPriceExclTax(this.productTotalFinalPriceExclTax);
        } else {
            base.setAdditionalProductPriceExclTax(this.productDefaultFinalPriceExclTax);
        }
    },

    /**
     * Get summary price from all selected options
     */
    calculateSelectedOptionsPrice: function () {
        var self = this,
            form = this.base.getFormElement(),
            config = this.base.options,
            options = $(config.optionsSelector, form),
            processedDatetimeOptions = [];

        this.optionFinalPrice = 0;
        this.optionBasePrice = 0;
        this.optionOldPriceInclTax = 0;
        this.optionOldPriceExclTax = 0;

        this.optionFinalPricePerItem = 0;
        this.optionBasePricePerItem = 0;
        this.optionOldPricePerItemInclTax = 0;
        this.optionOldPricePerItemExclTax = 0;

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
                    if (_.isUndefined(dateDropdowns)) {
                        return;
                    }

                    if ($element.closest('.field').css('display') == 'none') {
                        $element.val('');
                        return;
                    }

                    var optionConfigCurrent = self.base.getDateDropdownConfig(optionConfig, dateDropdowns);
                    if (_.isUndefined(optionConfigCurrent.prices) ||
                        $.inArray(optionId, processedDatetimeOptions) != -1) {
                        return;
                    }
                    processedDatetimeOptions.push(optionId);
                } else {
                    var optionConfigCurrent = optionConfig[valueId];
                }

                self.processOptionQtyInput(optionId, $element, optionConfigCurrent);

                self.collectOptionPriceAndQty(optionConfigCurrent, optionId, valueId);
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

            if (typeof valueId == 'undefined' || !valueId) {
                return;
            }

            var optionConfigCurrent = optionConfig[valueId];

            self.processOptionQtyInput(optionId, $element, optionConfigCurrent);

            self.collectOptionPriceAndQty(optionConfigCurrent, optionId, valueId);
        });

        options.filter('input[type="text"], textarea, input[type="file"]').each(function (index, element) {
            var $element = $(element),
                optionId = $.catalog.priceUtils.findOptionId($element),
                optionConfig = config.optionConfig && config.optionConfig[optionId],
                value = $element.val();

            if (typeof value == 'undefined' || !value) {
                if ($('#delete-options_' + optionId + '_file').length < 1) {
                    return;
                }
            }

            if ($element.closest('.field').css('display') == 'none') {
                $element.val('');
                return;
            }

            var isOneTime = self.base.isOneTimeOption(optionId),
                productQty = 1;
            if (!isOneTime) {
                productQty = $(config.productQtySelector).val();
            }

            var isPercentOptionAndProductTierPrice = false;
            var actualTierPriceExclTax = self.getProductActualTierPrice();
            if (actualTierPriceExclTax !== null
                && !_.isUndefined(config.extendedOptionsConfig[optionId].price)
                && !_.isUndefined(config.extendedOptionsConfig[optionId].price_type)
                && config.extendedOptionsConfig[optionId].price_type === 'percent'
            ) {
                isPercentOptionAndProductTierPrice = true;
                var recalculatedPercentPriceExclTax =
                    config.extendedOptionsConfig[optionId].price * actualTierPriceExclTax / 100;
                var recalculatedPercentPriceInclTax =
                    config.extendedOptionsConfig[optionId].price * self.getProductActualTierPrice(true) / 100;
            }

            var basePrice = optionConfig.prices.basePrice.amount;
            var finalPrice = optionConfig.prices.finalPrice.amount;
            if (isPercentOptionAndProductTierPrice) {
                basePrice = recalculatedPercentPriceExclTax;
                finalPrice = recalculatedPercentPriceInclTax;
            }

            self.optionFinalPrice += parseFloat(finalPrice) * productQty;
            self.optionOldPriceInclTax += parseFloat(optionConfig.prices.oldPrice.amount_incl_tax) * productQty;
            self.optionBasePrice += parseFloat(basePrice) * productQty;
            self.optionOldPriceExclTax += parseFloat(optionConfig.prices.oldPrice.amount_excl_tax) * productQty;

            self.optionFinalPricePerItem += parseFloat(finalPrice);
            self.optionOldPricePerItemInclTax += parseFloat(optionConfig.prices.oldPrice.amount_incl_tax);
            self.optionBasePricePerItem += parseFloat(basePrice);
            self.optionOldPricePerItemExclTax += parseFloat(optionConfig.prices.oldPrice.amount_excl_tax);
        });
    },

    /**
     * Do necessary operations with option's qty input
     *
     * @param optionId
     * @param $element
     * @param optionConfigCurrent
     */
    processOptionQtyInput: function currentOptionQtyInput(optionId, $element, optionConfigCurrent) {
        var $optionQtyInput = $("[data-parent-selector='" + $element.attr('data-selector') + "']"),
            optionQty = 1;

        if ($optionQtyInput.length < 1) {
            return;
        }

        if (($element.is(':checked') || $('option:selected', $element).val())) {
            if ($optionQtyInput.val() === 0) {
                $optionQtyInput.val(1);
            }
            $optionQtyInput.attr('disabled', false);
        } else if (!$element.is(':checked') && !$('option:selected', $element).val()) {
            if ($optionQtyInput.attr('type') !== 'hidden' && $option.attr('type') !== 'radio') {
                $optionQtyInput.val(0);
                $optionQtyInput.attr('disabled', true);
            }
        }

        if (parseFloat($optionQtyInput.val())) {
            optionQty = parseFloat($optionQtyInput.val());
        }

        optionConfigCurrent['qty'] = optionQty;
    },

    /**
     * Collect Option's Price
     *
     * @param {array} optionConfigCurrent
     * @param {number} optionId
     * @param {number} valueId
     * @private
     */
    collectOptionPriceAndQty: function calculateOptionsPrice(optionConfigCurrent, optionId, valueId) {
        this.actualPriceInclTax = 0;
        this.actualPriceExclTax = 0;

        var config = this.base.options,
            isOneTime = this.base.isOneTimeOption(optionId),
            productQty = $(config.productQtySelector).val(),
            qty = !_.isUndefined(optionConfigCurrent['qty']) ? optionConfigCurrent['qty'] : 1;
        this.getActualPrice(optionId, valueId, qty);
        if (productQty == 0) {
            productQty = 1;
        }

        var oldPriceAmountInclTax = parseFloat(optionConfigCurrent.prices.oldPrice.amount_incl_tax),
            oldPriceAmountExclTax = parseFloat(optionConfigCurrent.prices.oldPrice.amount_excl_tax),
            finalPriceAmount = parseFloat(optionConfigCurrent.prices.finalPrice.amount),
            basePriceAmount = parseFloat(optionConfigCurrent.prices.basePrice.amount),
            actualFinalPrice = this.actualPriceInclTax ? this.actualPriceInclTax : finalPriceAmount,
            actualBasePrice = this.actualPriceExclTax ? this.actualPriceExclTax : basePriceAmount,
            actualFinalPricePerItem = this.actualPriceInclTax ? this.actualPriceInclTax : finalPriceAmount,
            actualBasePricePerItem = this.actualPriceExclTax ? this.actualPriceExclTax : basePriceAmount,
            oldPriceInclTax = !isNaN(oldPriceAmountInclTax) ? oldPriceAmountInclTax : this.actualPriceInclTax,
            oldPriceExclTax = !isNaN(oldPriceAmountExclTax) ? oldPriceAmountExclTax : this.actualPriceExclTax,
            oldPricePerItemInclTax = oldPriceInclTax,
            oldPricePerItemExclTax = oldPriceExclTax;

        if (!isOneTime
            && (this.options.product_price_display_mode === 'final_price'
                || this.options.additional_product_price_display_mode === 'final_price'
            )
        ) {
            actualFinalPrice *= productQty;
            actualBasePrice *= productQty;
            oldPriceInclTax *= productQty;
            oldPriceExclTax *= productQty;
        }

        this.optionFinalPricePerItem += actualFinalPricePerItem * qty;
        this.optionBasePricePerItem += actualBasePricePerItem * qty;
        this.optionOldPricePerItemInclTax += oldPricePerItemInclTax * qty;
        this.optionOldPricePerItemExclTax += oldPricePerItemExclTax * qty;

        this.optionFinalPrice += actualFinalPrice * qty;
        this.optionBasePrice += actualBasePrice * qty;
        this.optionOldPriceInclTax += oldPriceInclTax * qty;
        this.optionOldPriceExclTax += oldPriceExclTax * qty;
    },

    /**
     * Get actual price of option considering special/tier prices
     *
     * @param {number} optionId
     * @param {number} valueId
     * @param {number} qty
     * @returns {void}
     */
    getActualPrice: function (optionId, valueId, qty) {
        var config = this.base.options,
            specialPrice = null,
            tierPrices = null,
            price = null,
            totalQty = 0,
            indexQty = 0,
            suitableTierPrice = null,
            suitableTierPriceQty = null,
            isOneTime = this.base.isOneTimeOption(optionId),
            productQty = $(config.productQtySelector).val(),
            isPercentOptionAndProductTierPrice = false;
        if (_.isUndefined(config.extendedOptionsConfig[optionId].values)) {
            return;
        }

        if (isOneTime) {
            totalQty = parseFloat(qty);
        } else {
            totalQty = parseFloat(productQty) * parseFloat(qty);
        }

        if (!_.isUndefined(config.optionConfig[optionId][valueId].prices.basePrice.amount)) {
            specialPrice = config.optionConfig[optionId][valueId].prices.basePrice.amount;
            var actualTierPriceExclTax = this.getProductActualTierPrice();
            if (actualTierPriceExclTax !== null
                && !_.isUndefined(config.extendedOptionsConfig[optionId].values[valueId].price)
                && !_.isUndefined(config.extendedOptionsConfig[optionId].values[valueId].price_type)
                && config.extendedOptionsConfig[optionId].values[valueId].price_type === 'percent'
                && specialPrice > config.extendedOptionsConfig[optionId].values[valueId].price * actualTierPriceExclTax / 100
            ) {
                isPercentOptionAndProductTierPrice = true;
                var recalculatedPercentPriceExclTax =
                    config.extendedOptionsConfig[optionId].values[valueId].price * actualTierPriceExclTax / 100;
                var recalculatedPercentPriceInclTax =
                    config.extendedOptionsConfig[optionId].values[valueId].price * this.getProductActualTierPrice(true) / 100;
            }
        }

        if (!_.isUndefined(config.extendedOptionsConfig[optionId].values[valueId].tier_price)) {
            tierPrices = $.parseJSON(config.extendedOptionsConfig[optionId].values[valueId].tier_price);
            if (_.isUndefined(tierPrices[totalQty])) {
                $.each(tierPrices, function (index, tierPrice) {
                    indexQty = parseFloat(index);
                    if (suitableTierPriceQty < indexQty && totalQty >= indexQty) {
                        suitableTierPrice = tierPrice;
                        suitableTierPriceQty = indexQty;
                    }
                });
            } else {
                suitableTierPrice = tierPrices[totalQty];
                suitableTierPriceQty = totalQty;
            }
        }

        if (suitableTierPrice && (suitableTierPrice.price < specialPrice || specialPrice === null)) {
            this.actualPriceExclTax = suitableTierPrice.price;
            this.actualPriceInclTax = suitableTierPrice.price_incl_tax;
        } else if (isPercentOptionAndProductTierPrice) {
            this.actualPriceExclTax = recalculatedPercentPriceExclTax;
            this.actualPriceInclTax = recalculatedPercentPriceInclTax;
        } else {
            this.actualPriceExclTax = specialPrice;
            this.actualPriceInclTax = config.optionConfig[optionId][valueId].prices.finalPrice.amount;
        }
    },

    /**
     * Initialize Product Price
     *
     * @param productConfig
     * @private
     */
    initProductPrice: function (productConfig) {
        this.productDefaultRegularPriceExclTax = productConfig.regular_price_excl_tax;
        this.productDefaultRegularPriceInclTax = productConfig.regular_price_incl_tax;
        this.productDefaultFinalPriceExclTax = productConfig.final_price_excl_tax;
        this.productDefaultFinalPriceInclTax = productConfig.final_price_incl_tax;

        this.productPerItemRegularPriceExclTax = productConfig.regular_price_excl_tax;
        this.productPerItemRegularPriceInclTax = productConfig.regular_price_incl_tax;
        this.productPerItemFinalPriceExclTax = productConfig.final_price_excl_tax;
        this.productPerItemFinalPriceInclTax = productConfig.final_price_incl_tax;

        this.productTotalRegularPriceExclTax = productConfig.regular_price_excl_tax;
        this.productTotalRegularPriceInclTax = productConfig.regular_price_incl_tax;
        this.productTotalFinalPriceExclTax = productConfig.final_price_excl_tax;
        this.productTotalFinalPriceInclTax = productConfig.final_price_incl_tax;
    },

    /**
     * Apply Product Price Display Mode
     *
     * @private
     */
    applyProductPriceDisplayMode: function () {
        var productPriceDisplayMode = this.options.product_price_display_mode,
            additionalProductPriceDisplayMode = this.options.additional_product_price_display_mode,
            productQty = parseFloat($(this.base.options.productQtySelector).val()),
            actualTierPrice = null;

        if (productPriceDisplayMode === 'per_item'
            || additionalProductPriceDisplayMode === 'per_item'
            || productPriceDisplayMode === 'final_price'
            || additionalProductPriceDisplayMode === 'final_price'
        ) {
            actualTierPrice = this.getProductActualTierPrice();
            if (productPriceDisplayMode === 'per_item'
                || additionalProductPriceDisplayMode === 'per_item'
            ) {
                if (actualTierPrice !== null) {
                    this.productPerItemFinalPriceExclTax = actualTierPrice;
                    this.productPerItemFinalPriceInclTax = this.getProductActualTierPrice(true);
                }
            }
            if (productPriceDisplayMode === 'final_price'
                || additionalProductPriceDisplayMode === 'final_price'
            ) {
                if (actualTierPrice !== null) {
                    this.productTotalFinalPriceExclTax = actualTierPrice * productQty;
                    this.productTotalFinalPriceInclTax = this.getProductActualTierPrice(true) * productQty;
                } else {
                    this.productTotalFinalPriceExclTax = this.productDefaultFinalPriceExclTax * productQty;
                    this.productTotalFinalPriceInclTax = this.productDefaultFinalPriceInclTax * productQty;
                }
                this.productTotalRegularPriceExclTax = this.productDefaultRegularPriceExclTax * productQty;
                this.productTotalRegularPriceInclTax = this.productDefaultRegularPriceInclTax * productQty;
            }
        }
    },

    /**
     * Get product's actual price considering its qty
     *
     * @param {boolean} includeTax
     * @returns {number}
     */
    getProductActualTierPrice: function (includeTax) {
        var config = this.base.options,
            productConfig = config.productConfig,
            price = null,
            productQty = $(config.productQtySelector).val(),
            key = includeTax ? 'price_incl_tax' : 'price_excl_tax';

        if (_.isUndefined(productConfig.extended_tier_prices) || productConfig.extended_tier_prices.length < 1) {
            return price;
        }

        var tierPrices = productConfig.extended_tier_prices;
        tierPrices.sort(function (a, b) {
            return a['qty'] - b['qty'];
        });

        _.each(tierPrices, function (tier, index) {
            if (parseFloat(tier['qty']) > parseFloat(productQty)) {
                return;
            }

            if (price === null || parseFloat(tier[key]) < parseFloat(price)) {
                price = tier[key];
            }
        });

        return price;
    },

    /**
     *
     * @param $option
     * @param optionConfig
     * @param extendedOptionsConfig
     * @param valueDescriptionEnabled
     * @private
     */
    _addValueDescription: function _addValueDescription($option, optionConfig, extendedOptionsConfig, valueDescriptionEnabled) {
        var self = this,
            $options = $option.find('.product-custom-option');

        $options.filter('select').each(function (index, element) {
            var $element = $(element),
                optionId = $.catalog.priceUtils.findOptionId($element),
                value = extendedOptionsConfig[optionId]['values'];

            if ($element.attr('multiple') && !$element.hasClass('mageworx-swatch')) {
                return;
            }

            if (typeof value == 'undefined' || _.isEmpty(value)) {
                return;
            }

            if ($element.hasClass('mageworx-swatch')) {
                var $swatches = $element.parent().find('.mageworx-swatch-option');

                $swatches.each(function (swatchKey, swatchValue) {
                    var valueId = $(swatchValue).attr('data-option-type-id'),
                        tooltipImage = self.getTooltipImageHtml(value[valueId]),
                        title = '<div class="title">' + value[valueId]['title'] + '</div>',
                        stockMessage = '';

                    if (!_.isEmpty(optionConfig[optionId][valueId]['stockMessage'])) {
                        stockMessage = '<div class="info">'
                            + optionConfig[optionId][valueId]['stockMessage']
                            + '</div>';
                    }

                    if (valueDescriptionEnabled) {
                        if (!_.isUndefined(value[valueId]) &&
                            (!_.isEmpty(value[valueId]['description']) ||
                                !_.isEmpty(value[valueId]['images_data']['tooltip_image']))
                        ) {
                            var description = '';
                            if (!_.isEmpty(value[valueId]['description'])) {
                                description = value[valueId]['description'];
                            }
                            self.prepareTooltipDescription($(swatchValue), tooltipImage, title, stockMessage, description);
                        }
                    } else {
                        if (!_.isUndefined(value[valueId]) &&
                            !_.isEmpty(value[valueId]['images_data']['tooltip_image'])
                        ) {
                            self.prepareTooltipDescription($(swatchValue), tooltipImage, title, stockMessage);
                        }
                    }
                });
            } else {
                var $image = $('<img>', {
                    src: self.options.question_image,
                    alt: 'tooltip',
                    "class": 'option-select-tooltip-' + optionId,
                    width: '16px',
                    height: '16px',
                    style: 'display: none'
                });

                $element.parent().prepend($image);
                $element.on('change', function (e) {
                    var valueId = $element.val(),
                        tooltipImage = self.getTooltipImageHtml(value[valueId]);

                    if (valueDescriptionEnabled) {
                        if (!_.isUndefined(value[valueId]) &&
                            (!_.isEmpty(value[valueId]['description']) ||
                                !_.isEmpty(value[valueId]['images_data']['tooltip_image']))
                        ) {
                            self.prepareTooltipDescription($image, tooltipImage, '', '', value[valueId]['description']);
                            $image.show();
                        } else {
                            $image.hide();
                        }
                    } else {
                        if (!_.isUndefined(value[valueId]) &&
                            !_.isEmpty(value[valueId]['images_data']['tooltip_image'])
                        ) {
                            self.prepareTooltipDescription($image, tooltipImage);
                            $image.show();
                        } else {
                            $image.hide();
                        }
                    }
                });
            }

            if ($element.val()) {
                $element.trigger('change');
            }
        });

        $options.filter('input[type="radio"], input[type="checkbox"]').each(function (index, element) {
            var $element = $(element),
                optionId = $.catalog.priceUtils.findOptionId($element),
                optionConfig = extendedOptionsConfig[optionId],
                value = extendedOptionsConfig[optionId]['values'];

            if (typeof value == 'undefined' || !value) {
                return;
            }

            var valueId = $element.val(),
                tooltipImage = self.getTooltipImageHtml(value[valueId]),
                $image = self.getTooltipImageForOptionValue(valueId);

            if (valueDescriptionEnabled) {
                if (!_.isUndefined(value[valueId]) &&
                    (!_.isEmpty(value[valueId]['description']) ||
                        !_.isEmpty(value[valueId]['images_data']['tooltip_image']))
                ) {
                    var description = value[valueId]['description'];
                    $element.parent().append($image);
                    self.prepareTooltipDescription($image, tooltipImage, '', '', description);
                }
            } else {
                if (!_.isUndefined(value[valueId]) &&
                    !_.isEmpty(value[valueId]['images_data']['tooltip_image'])
                ) {
                    $element.parent().append($image);
                    self.prepareTooltipDescription($image, tooltipImage);
                }
            }
        });
    },

    /**
     *
     * @param $element
     * @param tooltipImage
     * @param title
     * @param stockMessage
     * @param description
     */
    prepareTooltipDescription: function prepareTooltipDescription(
        $element,
        tooltipImage = '',
        title = '',
        stockMessage = '',
        description = '',
    ) {
        $element.qtip({
            content: {
                text: tooltipImage + title + stockMessage + description
            },
            style: {
                classes: 'qtip-light'
            },
            position: {
                target: false
            }
        });
    },

    /**
     * Create image with "?" mark
     * @param valueId
     * @returns {*|jQuery|HTMLElement}
     */
    getTooltipImageForOptionValue: function getTooltipImageForOptionValue(valueId) {
        return $('<img>', {
            src: this.options.question_image,
            alt: 'tooltip',
            "class": 'option-value-tooltip-' + valueId,
            width: '16px',
            height: '16px'
        });
    },

    /**
     * Get image html, if it exists, for tooltip
     * @param value
     * @returns {string}
     */
    getTooltipImageHtml: function getTooltipImageHtml(value) {
        if (!_.isUndefined(value)
            && !_.isUndefined(value['images_data']['tooltip_image'])
            && !_.isEmpty(value['images_data']['tooltip_image'])
        ) {
            return '<div class="image" style="width:auto; height:auto"><img src="' +
                value['images_data']['tooltip_image'] +
                '" /></div>';
        }
        return '';
    },

    /**
     * Copy text to clipboard
     *
     * @param text
     * @returns {void}
     */
    copyTextToClipboard: function copyTextToClipboard(text) {
        var textArea = document.createElement("textarea");

        // Place in top-left corner of screen regardless of scroll position.
        textArea.style.position = 'fixed';
        textArea.style.top = 0;
        textArea.style.left = 0;

        // Ensure it has a small width and height. Setting to 1px / 1em
        // doesn't work as this gives a negative w/h on some browsers.
        textArea.style.width = '2em';
        textArea.style.height = '2em';

        // We don't need padding, reducing the size if it does flash render.
        textArea.style.padding = 0;

        // Clean up any borders.
        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';

        // Avoid flash of white box if rendered for any reason.
        textArea.style.background = 'transparent';

        textArea.value = text;

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        document.execCommand('copy');

        document.body.removeChild(textArea);
    },

    /**
     * Get shareable link
     *
     * @param base
     * @returns {string}
     */
    getShareableLink: function getShareableLink(base) {
        var shareableLink = window.location.origin + window.location.pathname;
        var selectedOptionsString = this.getSelectedOptionsString(base);
        if (selectedOptionsString) {
            shareableLink += '?config=';
            shareableLink += selectedOptionsString;
        }
        shareableLink += window.location.hash;

        return shareableLink;
    },

    /**
     * Get selected options string
     *
     * @param base
     * @returns {string}
     */
    getSelectedOptionsString: function getSelectedOptionsString(base) {
        var selectedOptionsString = '';
        var self = this;

        base.collectSelectedData();
        var selectedData = base.getSelectedData();
        var selectedOptionsArray = [];

        $.each(selectedData, function (optionId, values) {
            selectedOptionsArray.push(optionId + '-' + values.join('-'));
        });

        return selectedOptionsArray.join(',');
    }
});
